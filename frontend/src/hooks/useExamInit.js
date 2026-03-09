// hooks/useExamInit.js
// ─────────────────────────────────────────────────────────────────────────────
// ISPRAVCI v5 — KRITIČNI BUGOVI POPRAVLJENI:
//
//  ✅ FIX KRITIČNI #1: syncElapsed — dvostruki API poziv i krivi tip podatka
//     PRIJE:
//       const isAttemptPaused = (await attemptApi.getElapsed(..)) === null;
//       // BUG: getElapsed vraća objekt { elapsed_seconds, status }, nikad null
//       // → isAttemptPaused uvijek false
//       const elapsed = await attemptApi.getElapsed(..);
//       // BUG: Dvostruki API poziv!
//       applyServerElapsed(elapsed ?? 0, ..);
//       // BUG: elapsed je objekt, Number(objekt) = NaN, NaN || 0 = 0
//       // → timer se uvijek resetira na puno trajanje pri refreshu!
//
//     SADA:
//       Jedan API poziv. Ispravno čitanje .elapsed_seconds i .status.
//       Za in_progress attempt (elapsed_seconds = NULL), računamo elapsed
//       iz started_at − total_paused_seconds da timer nastavi točno.
//
//  ✅ FIX KRITIČNI #2: Pauziran attempt iz DB ne postavlja isPaused u store
//     PRIJE: Kada checkActive() vrati status='paused', kod NE poziva pauseExam().
//            Timer bi počeo teći čak i za pauziran ispit!
//     SADA:  pauseExam() se poziva → UI prikazuje pause overlay, timer stoji.
//
//  ✅ FIX: Učitavanje odgovora za pauziran attempt bez lokalnog drafta
//     NOVO: Kada nema lokalnog drafta ali postoji pauziran attempt u DB,
//           poziva attemptApi.getAnswers() i obnavlja odgovore iz baze.
//           Rješava scenario: korisnik nastavlja ispit na drugom uređaju.
//
//  ✅ FIX: useShallow selektor uključuje pauseExam akciju.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useExamStore } from "@/store/examStore";
import { useExamWithQuestions } from "@/hooks/useExam";
import { draftStorage } from "@/utils/storage";
import { toast } from "@/store/toastStore";
import { attemptApi } from "@/api/attemptApi";

/**
 * @param {string} examId
 * @param {{ applyServerElapsed: (elapsed: number, opts?: object) => void }} opts
 */
export function useExamInit(examId, { applyServerElapsed }) {
  // ── Store selektori (uključuje pauseExam za FIX #2) ───────────────────────
  const {
    storeExamId,
    storeQuestions,
    attemptId,
    isPaused,
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
      isPaused: s.isPaused,
      startExam: s.startExam,
      restoreDraft: s.restoreDraft,
      setAttemptId: s.setAttemptId,
      setExamMeta: s.setExamMeta,
      pauseExam: s.pauseExam,
    })),
  );

  // ── Promise tracking (race condition fix: brzi submit) ────────────────────
  const attemptCreationPromiseRef = useRef(null);

  // Ref za attemptId — dostupan u async callback-ovima bez stale closure
  const attemptIdRef = useRef(null);
  useEffect(() => {
    attemptIdRef.current = attemptId;
  }, [attemptId]);

  // ── Draft modal state ────────────────────────────────────────────────────
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(null);

  // ── Dohvat ispita iz baze ────────────────────────────────────────────────
  const {
    data: examData,
    isLoading,
    error: fetchError,
  } = useExamWithQuestions(examId);

  const alreadyLoaded = storeExamId === examId && storeQuestions.length > 0;
  const [isInitialized, setIsInitialized] = useState(alreadyLoaded);

  // Guard protiv ponovljene inicijalizacije za isti examId
  const initializedForExamRef = useRef(alreadyLoaded ? examId : null);

  useEffect(() => {
    if (initializedForExamRef.current === examId && !isInitialized) {
      setIsInitialized(true);
    }
  }, [examId, isInitialized]);

  // ── Inicijalizacija (jednom po examId + examData) ────────────────────────
  useEffect(() => {
    if (!examData) return;
    if (examData.exam?.id && examData.exam.id !== examId) return;

    if (initializedForExamRef.current === examId) {
      if (!isInitialized) setIsInitialized(true);
      return;
    }

    // Ispit je već učitan u store (npr. korisnik se vratio navigacijom)
    if (storeExamId === examId && storeQuestions.length > 0) {
      initializedForExamRef.current = examId;
      if (!isInitialized) setIsInitialized(true);
      return;
    }

    const draft = draftStorage.load(examId);

    const safeQuestions = Array.isArray(examData.questions)
      ? examData.questions
      : [];
    const safePassages =
      examData.passages && typeof examData.passages === "object"
        ? examData.passages
        : {};

    startExam(examId, safeQuestions, safePassages);
    setExamMeta(examData.exam ?? null);
    initializedForExamRef.current = examId;
    if (!isInitialized) setIsInitialized(true);

    if (draft?.attemptId) {
      // ── Scenarij B/C: Draft ima attemptId → obnovi, ne kreiraj novi ──────
      setAttemptId(draft.attemptId);
      attemptCreationPromiseRef.current = "done";

      if (draft?.answers && Object.keys(draft.answers).length > 0) {
        setPendingDraft(draft);
        setShowDraftModal(true);
      }
    } else {
      // ── Scenarij A: Nema drafta → provjeri DB za aktivni attempt ──────────
      const creationPromise = attemptApi
        .checkActive(examId)
        .then(async (existingAttempt) => {
          if (existingAttempt) {
            // Postoji aktivan attempt → recycle
            setAttemptId(existingAttempt.id);

            // ── FIX #2: Postavi isPaused u store ako je attempt pauziran ──────
            if (existingAttempt.status === "paused") {
              pauseExam();
              toast.info(
                "Pronađen pauziran ispit. Nastavljamo od zadnjeg spremanja.",
              );

              // ── FIX: Učitaj odgovore iz DB ako nema lokalnog drafta ────────
              // Scenario: korisnik nastavlja ispit na drugom uređaju ili
              //           LocalStorage je obrisan.
              const existingDraft = draftStorage.load(examId);
              const hasDraftAnswers =
                existingDraft?.answers &&
                Object.keys(existingDraft.answers).length > 0;

              if (!hasDraftAnswers) {
                try {
                  const dbAnswers = await attemptApi.getAnswers(
                    existingAttempt.id,
                  );
                  if (dbAnswers && Object.keys(dbAnswers).length > 0) {
                    restoreDraft(dbAnswers);
                    draftStorage.save(examId, dbAnswers, existingAttempt.id);
                    toast.success(
                      `Obnovljeno ${Object.keys(dbAnswers).length} odgovora.`,
                    );
                  }
                } catch (err) {
                  console.warn("[useExamInit] failed to load DB answers:", err);
                }
              } else {
                // Imamo lokalni draft — pitaj korisnika želi li ga obnoviti
                setPendingDraft(existingDraft);
                setShowDraftModal(true);
              }
            } else {
              // in_progress attempt — obnovi lokalni draft ako postoji
              const existingDraft = draftStorage.load(examId);
              if (
                existingDraft?.answers &&
                Object.keys(existingDraft.answers).length > 0
              ) {
                setPendingDraft(existingDraft);
                setShowDraftModal(true);
              }
            }

            draftStorage.save(
              examId,
              draftStorage.load(examId)?.answers ?? {},
              existingAttempt.id,
            );
            return existingAttempt;
          }

          // Nema aktivnog → kreiraj novi (normalan flow)
          return attemptApi.create(examId).then((newAttempt) => {
            if (newAttempt?.id) {
              setAttemptId(newAttempt.id);
              draftStorage.save(examId, draft?.answers ?? {}, newAttempt.id);
            }
            return newAttempt;
          });
        })
        .catch((err) => {
          console.error("[useExamInit] attempt creation failed:", err);
        });

      attemptCreationPromiseRef.current = creationPromise;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examData, examId]);

  // ── Server elapsed sync ───────────────────────────────────────────────────
  //
  // FIX KRITIČNI #1: Jedan API poziv, ispravno čitanje podataka.
  //
  // LOGIKA:
  //   • paused attempt → elapsed_seconds je snimljeno pri pauzi → koristimo ga
  //   • in_progress attempt koji nikad nije bio pauziran → elapsed_seconds = NULL
  //     → računamo: Date.now() - started_at - total_paused_seconds
  //   • in_progress attempt koji je bio pauziran → elapsed_seconds = zadnji elapsed
  //     → to je zastarjela vrijednost; bolje je računati iz started_at
  //
  const syncedAttemptId = useRef(null);

  useEffect(() => {
    if (!attemptId || !examData) return;
    if (syncedAttemptId.current === attemptId) return;

    let cancelled = false;

    const syncElapsed = async () => {
      try {
        // Jedan API poziv s kompletnim podacima
        const data = await attemptApi.getElapsed(attemptId);
        if (cancelled) return;

        const isServerPaused = data?.status === "paused";
        let serverElapsed;

        if (isServerPaused && data?.elapsed_seconds != null) {
          // Pauziran attempt — elapsed je točno snimljeno pri pauzi
          serverElapsed = data.elapsed_seconds;
        } else if (data?.started_at) {
          // In_progress (ili elapsed nije snimljeno) → izračunaj iz started_at
          // Oduzimamo ukupno pauzirano vrijeme da dobijemo stvarno aktivno vrijeme
          const startMs = new Date(data.started_at).getTime();
          const totalPausedMs = (data.total_paused_seconds ?? 0) * 1000;
          serverElapsed = Math.floor(
            (Date.now() - startMs - totalPausedMs) / 1000,
          );
          // Osiguravamo da elapsed nije negativan (clock skew)
          serverElapsed = Math.max(0, serverElapsed);
        } else {
          // Fallback: elapsed_seconds iz DB ili 0
          serverElapsed = data?.elapsed_seconds ?? 0;
        }

        applyServerElapsed(serverElapsed, {
          running: !isServerPaused,
        });

        syncedAttemptId.current = attemptId;
      } catch (err) {
        console.warn("[useExamInit:syncElapsed]", err);
        // Fallback: start timer from 0 — bolje od broken experience
        applyServerElapsed(0, { running: !isPaused });
      }
    };

    syncElapsed();
    return () => {
      cancelled = true;
    };
    // isPaused je namjerno izuzet: ne smijemo re-triggerati sync
    // kada korisnik pauzira/nastavlja — to upravlja useExamSubmit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, examData, applyServerElapsed]);

  // ── Draft callbacks ──────────────────────────────────────────────────────
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
    attemptCreationPromiseRef,
    attemptIdRef,
    showDraftModal,
    pendingDraft,
    confirmRestoreDraft,
    discardDraft,
  };
}
