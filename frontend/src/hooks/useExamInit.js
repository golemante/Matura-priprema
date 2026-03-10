// hooks/useExamInit.js — v8
// ─────────────────────────────────────────────────────────────────────────────
// ISPRAVCI u v8 (u odnosu na v7):
//
//  BUG A RIJEŠEN — Stale draft attemptId uzrokovao trenutni timer expiry:
//    PROBLEM: draft?.attemptId path je slijepo vjerovao lokalnom draftu.
//             Ako je attempt bio 'completed' ili 'abandoned':
//             getStatus() → elapsed_seconds ≈ fullDuration
//             onResumeTimer(fullDuration) → remaining = 0 → EXPIRE za 2s
//             handleSubmit() → finish_attempt(completedId) → RPC THROW
//             Korisnik zaglavio na exam stranici s error toastom.
//
//    FIX: Novu helper funkciju `resolveAttemptId` koja uvijek prolazi
//         kroz getStatus() provjeru. Ako draft.attemptId nije in_progress
//         ili paused → discard stale drafta → checkActive() → create().
//
//  BUG B RIJEŠEN — Beskonačan 100ms polling (za anon korisnike):
//    PROBLEM: useExamSession polling svakih 100ms ako attemptId ostane null.
//             Za neprijavljene korisnike (create vraća null) interval radi
//             cijelo trajanje ispita → ~54,000 nepotrebnih tikova na 90min ispitu.
//
//    FIX: SYNC_TIMEOUT_MS = 5000ms fallback. Ako getStatus() nije dobio
//         attemptId u roku, timerSyncRef se označi ready=true s elapsed=0.
//         Polling u useExamSession tako uvijek završi.
//
//  BUG C RIJEŠEN — pauseExam() nije pozvan u draft path kad je attempt pauziran:
//    PROBLEM: Kad draft?.attemptId postoji i attempt je 'paused' u DB,
//             pauseExam() se nikad nije pozivao → isPaused=false u storeu
//             dok je timer bio zaustavljen. Nema pause overlay-a.
//
//    FIX: resolveAttemptId sada detektira status='paused' i poziva pauseExam()
//         + dohvaća DB odgovore (isto kao u checkActive() paused path).
//
//  BUG D RIJEŠEN — Dvostruki resync za pauzirane attemptove (rasipanje):
//    PROBLEM: onResumeTimer() → resync(remaining, {running:true})
//             odmah zatim timerRef.resync(remaining, {running:false})
//             Dva sinkrona setState poziva za isti remaining.
//
//    FIX: Riješeno u useExamSession.js — onResumeTimer se ne poziva kad
//         syncData.isServerPaused===true. Samo jedan resync poziv.
//
//  NASLJEĐENI (v7) ispravci ovdje ostaju nepromijenjeni:
//    • BUG #1 — Timer sync race condition (timerSyncRef bez callback-a)
//    • BUG #2 — getStatus() vraća broj (ne objekt)
//    • BUG #3 — pauseExam() za checkActive() paused path
//    • BUG #4 — getAnswers() za restore pauziranih odgovora
//    • BUG #5 — isSubmitting finally blok (useExamSubmit.js)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useExamStore } from "@/store/examStore";
import { useExamWithQuestions } from "@/hooks/useExam";
import { draftStorage } from "@/utils/storage";
import { toast } from "@/store/toastStore";
import { attemptApi } from "@/api/attemptApi";

// Koliko ms čekamo na timer sync prije nego prijeđemo na fallback (elapsed=0).
// Sprječava beskonačan polling u useExamSession za anon korisnike.
const SYNC_TIMEOUT_MS = 5000;

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
  // Shape: { elapsedSeconds: number, isServerPaused: boolean, ready: boolean }
  // useExamSession čita ovaj ref čim durationSeconds postane dostupan.
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

  // ── BUG A FIX: resolveAttemptId ──────────────────────────────────────────
  // Centralna logika za pronalaženje/kreiranje validnog attempta.
  //
  // REDOSLIJED PROVJERA:
  //   1. Ako postoji kandidat (draft ili checkActive), provjeri status u DB.
  //   2. Ako je in_progress/paused → koristi ga.
  //   3. Ako je completed/abandoned → odbaci, nastavi na korak 4.
  //   4. checkActive() za svježi DB lookup (bez drafta koji je možda stale).
  //   5. Ako nema aktivnog → create().
  //
  // Ovo eliminira scenario gdje stale draft.attemptId uzrokuje:
  //   elapsed ≈ fullDuration → resync(~0) → timer odmah istječe → handleSubmit puca
  const resolveAttemptId = useCallback(
    async (candidateId, hasDraftAnswers) => {
      // ── Korak 1-3: Validacija kandidata ────────────────────────────────
      if (candidateId) {
        try {
          const statusData = await attemptApi.getStatus(candidateId);
          const status = statusData?.status;

          if (status === "in_progress" || status === "paused") {
            // Candidat je valjan — koristi ga
            setAttemptId(candidateId);

            if (status === "paused") {
              // BUG C FIX: Pauziraj UI odmah
              pauseExam();
              // Dohvati odgovore iz DB (isti pattern kao u checkActive path)
              try {
                const dbAnswers = await attemptApi.getAnswers(candidateId);
                if (dbAnswers && Object.keys(dbAnswers).length > 0) {
                  restoreDraft(dbAnswers);
                  draftStorage.save(examId, dbAnswers, candidateId);
                  toast.success(
                    `Nastavljaš od ${Object.keys(dbAnswers).length} prethodni odgovora.`,
                  );
                } else {
                  toast.info("Pronađen pauziran ispit.");
                }
              } catch {
                toast.info("Pronađen pauziran ispit. Nastavljamo.");
              }
            } else if (hasDraftAnswers) {
              // In progress + ima draft odgovore → pokaži modal
              // (setPendingDraft / setShowDraftModal se pozivaju VANI u efektu)
            }

            return candidateId;
          }
          // Status je completed/abandoned/neočekivan → odbaci, nastavi
          console.info(
            `[useExamInit] Draft attemptId ${candidateId} ima status="${status}", discarding stale draft.`,
          );
          draftStorage.clear(examId);
        } catch (err) {
          // getStatus() bacio grešku (attempt ne postoji, mrežna greška...)
          // Odbaci kandidata i nastavi na checkActive
          console.warn(
            "[useExamInit] getStatus() failed for candidate, falling back to checkActive:",
            err.message,
          );
          draftStorage.clear(examId);
        }
      }

      // ── Korak 4-5: Nema valjanog kandidata → checkActive → create ──────
      const existing = await attemptApi.checkActive(examId);
      if (existing) {
        setAttemptId(existing.id);
        draftStorage.save(examId, {}, existing.id);

        if (existing.status === "paused") {
          pauseExam();
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
        return existing.id;
      }

      // Nema ničega aktivnog → kreiraj novi
      const created = await attemptApi.create(examId);
      if (created?.id) {
        setAttemptId(created.id);
        draftStorage.save(examId, {}, created.id);
        return created.id;
      }

      // Anon korisnik ili greška → null, ispit se svejedno prikazuje
      return null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [examId],
  );

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
    const candidateId = draft?.attemptId ?? null;
    const hasDraftAnswers =
      !!draft?.answers && Object.keys(draft.answers).length > 0;

    // BUG A FIX: uvijek validiramo candidateId kroz resolveAttemptId
    // koji provjerava DB status prije nego vjeruje draftu
    const promise = resolveAttemptId(candidateId, hasDraftAnswers)
      .then((resolvedId) => {
        // Ako postoje draft odgovori I attempt je valjan in_progress → pokaži modal
        // (paused path je već handle-an unutar resolveAttemptId s toast-om)
        if (resolvedId && hasDraftAnswers && draft?.answers) {
          // Provjeri je li attempt in_progress (nije pauziran - paused je riješen gore)
          // Jednostavan heuristic: ako je resolvedId === candidateId, draft je valjan
          if (resolvedId === candidateId) {
            setPendingDraft(draft);
            setShowDraftModal(true);
          }
          // Ako je resolvedId !== candidateId, stale draft je odbačen, ne trebamo modal
        }
        return resolvedId;
      })
      .catch((err) => {
        console.error("[useExamInit] attempt setup:", err);
        return null;
      });

    attemptCreationPromiseRef.current = promise;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examData, examId]);

  // ── Korak 3: Sinkroniziraj timer s poslužiteljem ──────────────────────────
  // Pokreće se kad attemptId postane dostupan (nakon store.setAttemptId).
  //
  // BUG A FIX: Timer sync ovdje je sigurniji jer resolveAttemptId jamči da je
  //            attemptId uvijek in_progress ili paused (nikad completed).
  //            elapsed_seconds više ne može biti ≈ fullDuration.
  //
  // BUG B FIX: SYNC_TIMEOUT_MS fallback — ako attemptId ostane null
  //            (anon user), timerSyncRef se označi ready=true za elapsed=0
  //            u roku SYNC_TIMEOUT_MS. To zaustavlja beskonačni polling
  //            u useExamSession koji čeka na timerSyncRef.ready.
  const timerSyncedForRef = useRef(null);

  // BUG B FIX: Timeout fallback za anon korisnike
  useEffect(() => {
    if (timerSyncRef.current.ready) return; // Već sync-ano

    const timeoutId = setTimeout(() => {
      if (!timerSyncRef.current.ready) {
        console.info(
          "[useExamInit] Timer sync timeout — fallback to elapsed=0 (anon user or create failed)",
        );
        timerSyncRef.current = {
          elapsedSeconds: 0,
          isServerPaused: false,
          ready: true,
        };
      }
    }, SYNC_TIMEOUT_MS);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Jednom na mountu — timeout se resetira samo na unmount

  useEffect(() => {
    if (!attemptId) return;
    if (timerSyncedForRef.current === attemptId) return;

    let cancelled = false;

    (async () => {
      try {
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

        timerSyncRef.current = { elapsedSeconds, isServerPaused, ready: true };
        timerSyncedForRef.current = attemptId;
      } catch (err) {
        if (cancelled) return;
        console.warn("[useExamInit] timer sync failed:", err);
        // Fallback: timer kreće od 0
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
