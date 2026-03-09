// hooks/useExamInit.js — v7
// ─────────────────────────────────────────────────────────────────────────────
// SVIH 5 BUGOVA RIJEŠENO:
//
//  BUG #1 RIJEŠEN — Timer sync race condition (korjenski problem):
//    STARI KOD: applyServerElapsed() primao kao callback, ali u tom trenutku
//    durationSeconds=null → callback izlazio odmah. Sync guard spriječio
//    ponovni pokušaj čak kad bi examMeta stigao. Timer NIKADA ne bi krenuo.
//
//    NOVO RJEŠENJE: Nema callback parametra. Hook sam izračuna elapsed i spremi
//    u timerSyncRef. useExamSession pročita ref čim durationSeconds postane
//    dostupan. Nema race conditiona, nema stalnih closura.
//
//  BUG #2 RIJEŠEN — getElapsed() vraćala OBJEKT umjesto broja:
//    STARO: const elapsed = await attemptApi.getElapsed(attemptId)
//           → elapsed = { elapsed_seconds: X, status: 'in_progress' }
//           → applyServerElapsed({ elapsed_seconds: X }) → NaN → timer = 0
//    NOVO:  attemptApi.getStatus() + data.elapsed_seconds (broj)
//
//  BUG #3 RIJEŠEN — pauseExam() nikada nije pozvat za pauziran attempt:
//    Sada: existingAttempt.status === 'paused' → pauseExam() odmah
//
//  BUG #4 RIJEŠEN — Odgovori pauziranog attempta nisu obnovljeni:
//    Sada: dohvati attemptApi.getAnswers() i restoreDraft() ako nema lokalnog
//
//  BUG #5 RIJEŠEN — isSubmitting ostao true zauvijek na grešci:
//    → Riješeno u useExamSubmit.js (finally blok)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useExamStore } from "@/store/examStore";
import { useExamWithQuestions } from "@/hooks/useExam";
import { draftStorage } from "@/utils/storage";
import { toast } from "@/store/toastStore";
import { attemptApi } from "@/api/attemptApi";

export function useExamInit(examId) {
  const {
    storeExamId,
    storeQuestions,
    attemptId,
    startExam,
    restoreDraft,
    setAttemptId,
    setExamMeta,
    pauseExam,
  } = useExamStore(
    useShallow((s) => ({
      storeExamId: s.examId,
      storeQuestions: s.questions,
      attemptId: s.attemptId,
      startExam: s.startExam,
      restoreDraft: s.restoreDraft,
      setAttemptId: s.setAttemptId,
      setExamMeta: s.setExamMeta,
      pauseExam: s.pauseExam,
    })),
  );

  // ── Refs ──────────────────────────────────────────────────────────────────
  const attemptCreationPromiseRef = useRef(null);
  const attemptIdRef = useRef(null);
  const initDoneRef = useRef(null); // examId za koji je init završen

  useEffect(() => {
    attemptIdRef.current = attemptId;
  }, [attemptId]);

  // ── KLJUČNO: Timer sync ref ───────────────────────────────────────────────
  // useExamSession čita ovaj ref čim durationSeconds postane dostupan.
  // Shape: { elapsedSeconds: number, isServerPaused: boolean, ready: boolean }
  const timerSyncRef = useRef({
    elapsedSeconds: 0,
    isServerPaused: false,
    ready: false,
  });

  // ── Draft modal ───────────────────────────────────────────────────────────
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(null);

  // ── TanStack Query ────────────────────────────────────────────────────────
  const {
    data: examData,
    isLoading,
    error: fetchError,
  } = useExamWithQuestions(examId);

  const alreadyLoaded = storeExamId === examId && storeQuestions.length > 0;
  const [isInitialized, setIsInitialized] = useState(alreadyLoaded);

  // ── Korak 1: Inicijaliziraj Store s pitanjima ─────────────────────────────
  useEffect(() => {
    if (!examData) return;
    if (initDoneRef.current === examId) {
      if (!isInitialized) setIsInitialized(true);
      return;
    }

    // Ispit već u storeu (back navigation)
    if (storeExamId === examId && storeQuestions.length > 0) {
      initDoneRef.current = examId;
      if (!isInitialized) setIsInitialized(true);
      return;
    }

    const questions = Array.isArray(examData.questions)
      ? examData.questions
      : [];
    const passages =
      examData.passages && typeof examData.passages === "object"
        ? examData.passages
        : {};

    startExam(examId, questions, passages);
    setExamMeta(examData.exam ?? null);
    initDoneRef.current = examId;
    setIsInitialized(true);

    // ── Korak 2: Pronađi / kreiraj attempt ─────────────────────────────────
    const draft = draftStorage.load(examId);

    if (draft?.attemptId) {
      // Draft postoji s attemptId — recycle staru sesiju
      setAttemptId(draft.attemptId);
      attemptCreationPromiseRef.current = "done";

      if (draft.answers && Object.keys(draft.answers).length > 0) {
        setPendingDraft(draft);
        setShowDraftModal(true);
      }
      // Timer sync će se pokrenuti u zasebnom useEffect ispod
    } else {
      // Nema drafta — provjeri DB i kreiraj novi ili pronađi postojeći
      const promise = attemptApi
        .checkActive(examId)
        .then(async (existing) => {
          if (existing) {
            setAttemptId(existing.id);
            draftStorage.save(examId, {}, existing.id);

            if (existing.status === "paused") {
              // BUG #3 FIX: Odmah pauziraj UI
              pauseExam();

              // BUG #4 FIX: Dohvati odgovore iz DB
              try {
                const dbAnswers = await attemptApi.getAnswers(existing.id);
                if (dbAnswers && Object.keys(dbAnswers).length > 0) {
                  restoreDraft(dbAnswers);
                  draftStorage.save(examId, dbAnswers, existing.id);
                  toast.success(
                    `Nastavljaš od ${Object.keys(dbAnswers).length} prethodni odgovora.`,
                  );
                } else {
                  toast.info("Pronađen pauziran ispit.");
                }
              } catch {
                toast.info("Pronađen pauziran ispit. Nastavljamo.");
              }
            }
            return existing;
          }

          // Nema aktivnog → kreiraj novi
          const created = await attemptApi.create(examId);
          if (created?.id) {
            setAttemptId(created.id);
            draftStorage.save(examId, {}, created.id);
          }
          return created;
        })
        .catch((err) => {
          console.error("[useExamInit] attempt setup:", err);
          return null;
        });

      attemptCreationPromiseRef.current = promise;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examData, examId]);

  // ── Korak 3: Sinkroniziraj timer s poslužiteljem ──────────────────────────
  // Pokreće se kad attemptId postane dostupan (nakon store.setAttemptId).
  // BUG #1 + #2 FIX: Nema callback-a. Rezultat se sprema u timerSyncRef.
  //                  useExamSession čeka na timerSyncRef.ready === true.
  const timerSyncedForRef = useRef(null);

  useEffect(() => {
    if (!attemptId) return;
    if (timerSyncedForRef.current === attemptId) return;

    let cancelled = false;

    (async () => {
      try {
        // BUG #2 FIX: getStatus() vraća pravi objekt s elapsed_seconds (broj!)
        const data = await attemptApi.getStatus(attemptId);
        if (cancelled) return;

        const isServerPaused = data?.status === "paused";
        let elapsedSeconds;

        if (isServerPaused && data?.elapsed_seconds != null) {
          // Pauziran: elapsed je točno zapisan u DB
          elapsedSeconds = data.elapsed_seconds;
        } else if (data?.started_at) {
          // In-progress: računaj iz started_at - total_paused_seconds
          const startMs = new Date(data.started_at).getTime();
          const pausedMs = (data.total_paused_seconds ?? 0) * 1000;
          elapsedSeconds = Math.max(
            0,
            Math.floor((Date.now() - startMs - pausedMs) / 1000),
          );
        } else {
          elapsedSeconds = Number(data?.elapsed_seconds) || 0;
        }

        // BUG #1 FIX: Spremi u ref, ne pozivaj callback
        timerSyncRef.current = { elapsedSeconds, isServerPaused, ready: true };
        timerSyncedForRef.current = attemptId;
      } catch (err) {
        console.warn("[useExamInit] timer sync failed:", err);
        // Fallback: timer kreće od 0, nije katastrofa
        timerSyncRef.current = {
          elapsedSeconds: 0,
          isServerPaused: false,
          ready: true,
        };
        timerSyncedForRef.current = attemptId;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  // ── Draft callbacks ────────────────────────────────────────────────────────
  const confirmRestoreDraft = useCallback(() => {
    if (pendingDraft?.answers) {
      restoreDraft(pendingDraft.answers);
      toast.success("Prethodni odgovori su obnovljeni.");
    }
    setShowDraftModal(false);
    setPendingDraft(null);
  }, [pendingDraft, restoreDraft]);

  const discardDraft = useCallback(() => {
    draftStorage.clear(examId);
    setShowDraftModal(false);
    setPendingDraft(null);
  }, [examId]);

  return {
    isLoading,
    isInitialized,
    fetchError,
    examData,
    attemptIdRef,
    attemptCreationPromiseRef,
    timerSyncRef, // ← useExamSession koristi ovo za timer sync
    showDraftModal,
    confirmRestoreDraft,
    discardDraft,
  };
}
