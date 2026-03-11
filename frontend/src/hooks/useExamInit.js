// hooks/useExamInit.js
import { useState, useEffect, useRef, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useExamStore } from "@/store/examStore";
import { useExamWithQuestions } from "@/hooks/useExam";
import { draftStorage } from "@/utils/storage";
import { toast } from "@/store/toastStore";
import { attemptApi } from "@/api/attemptApi";

const SYNC_TIMEOUT_MS = 5000;

function calcElapsedFromStatus(data) {
  if (!data?.started_at) return Number(data?.elapsed_seconds) || 0;
  const startMs = new Date(data.started_at).getTime();
  const pausedMs = (data.total_paused_seconds ?? 0) * 1000;
  return Math.max(0, Math.floor((Date.now() - startMs - pausedMs) / 1000));
}

function isAttemptOverdue(statusData, maxDurationSeconds) {
  if (!maxDurationSeconds || maxDurationSeconds <= 0) return false;
  return calcElapsedFromStatus(statusData) >= maxDurationSeconds;
}

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

  const attemptCreationPromiseRef = useRef(null);
  const attemptIdRef = useRef(null);
  const initDoneRef = useRef(null);

  useEffect(() => {
    attemptIdRef.current = attemptId;
  }, [attemptId]);

  const timerSyncRef = useRef({
    elapsedSeconds: 0,
    isServerPaused: false,
    ready: false,
  });

  const [showDraftModal, setShowDraftModal] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(null);

  const {
    data: examData,
    isLoading,
    error: fetchError,
  } = useExamWithQuestions(examId);

  const examDataRef = useRef(examData);
  useEffect(() => {
    examDataRef.current = examData;
  }, [examData]);

  const alreadyLoaded = storeExamId === examId && storeQuestions.length > 0;
  const [isInitialized, setIsInitialized] = useState(alreadyLoaded);

  const resolveAttemptId = useCallback(
    async (candidateId, hasDraftAnswers, maxDurationSeconds = 0) => {
      if (candidateId) {
        try {
          const statusData = await attemptApi.getStatus(candidateId);
          const status = statusData?.status;

          if (status === "in_progress") {
            if (isAttemptOverdue(statusData, maxDurationSeconds)) {
              const elapsed = calcElapsedFromStatus(statusData);
              console.info(
                `[useExamInit] Kandidat ${candidateId} je overdue ` +
                  `(${elapsed}s >= ${maxDurationSeconds}s). Kreiram novi attempt.`,
              );
              draftStorage.clear(examId);
            } else {
              setAttemptId(candidateId);
              return candidateId;
            }
          } else if (status === "paused") {
            setAttemptId(candidateId);
            pauseExam();
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
            return candidateId;
          } else {
            console.info(
              `[useExamInit] Kandidat ${candidateId} ima status="${status}", odbacujem.`,
            );
            draftStorage.clear(examId);
          }
        } catch (err) {
          console.warn(
            "[useExamInit] getStatus() za kandidata je pao:",
            err.message,
          );
          draftStorage.clear(examId);
        }
      }

      const existing = await attemptApi.checkActive(examId);
      if (existing) {
        if (
          existing.status === "in_progress" &&
          isAttemptOverdue(existing, maxDurationSeconds)
        ) {
          console.info(
            `[useExamInit] checkActive attempt ${existing.id} je overdue, kreiram novi.`,
          );
        } else {
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
      }

      const created = await attemptApi.create(examId);
      if (created?.id) {
        setAttemptId(created.id);
        draftStorage.save(examId, {}, created.id);
        return created.id;
      }

      return null;
    },
    [examId],
  );

  useEffect(() => {
    if (!examData) return;
    if (initDoneRef.current === examId) {
      if (!isInitialized) setIsInitialized(true);
      return;
    }

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

    const draft = draftStorage.load(examId);
    const candidateId = draft?.attemptId ?? null;
    const hasDraftAnswers =
      !!draft?.answers && Object.keys(draft.answers).length > 0;

    const maxDurationSeconds = (examData?.exam?.duration_minutes ?? 0) * 60;

    const promise = resolveAttemptId(
      candidateId,
      hasDraftAnswers,
      maxDurationSeconds,
    )
      .then((resolvedId) => {
        if (resolvedId && hasDraftAnswers && draft?.answers) {
          if (resolvedId === candidateId) {
            setPendingDraft(draft);
            setShowDraftModal(true);
          }
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

  const timerSyncedForRef = useRef(null);

  useEffect(() => {
    if (timerSyncRef.current.ready) return;

    const timeoutId = setTimeout(() => {
      if (!timerSyncRef.current.ready) {
        console.info("[useExamInit] Timer sync timeout — fallback elapsed=0");
        timerSyncRef.current = {
          elapsedSeconds: 0,
          isServerPaused: false,
          ready: true,
        };
      }
    }, SYNC_TIMEOUT_MS);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          elapsedSeconds = data.elapsed_seconds;
        } else if (data?.started_at) {
          elapsedSeconds = calcElapsedFromStatus(data);
        } else {
          elapsedSeconds = Number(data?.elapsed_seconds) || 0;
        }

        if (!isServerPaused) {
          const maxDuration =
            (examDataRef.current?.exam?.duration_minutes ?? 0) * 60;
          if (maxDuration > 0 && elapsedSeconds >= maxDuration) {
            console.warn(
              `[useExamInit] Safety clamp: elapsed ${elapsedSeconds}s >= ` +
                `duration ${maxDuration}s. Reset na 0.`,
            );
            elapsedSeconds = 0;
          }
        }

        timerSyncRef.current = { elapsedSeconds, isServerPaused, ready: true };
        timerSyncedForRef.current = attemptId;
      } catch (err) {
        if (cancelled) return;
        console.warn("[useExamInit] timer sync failed:", err);
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
    timerSyncRef,
    showDraftModal,
    confirmRestoreDraft,
    discardDraft,
  };
}
