// hooks/useExamInit.js
import { useState, useEffect, useRef, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useExamStore } from "@/store/examStore";
import { useExamWithQuestions } from "@/hooks/useExam";
import { draftStorage } from "@/utils/storage";
import { toast } from "@/store/toastStore";
import { attemptApi } from "@/api/attemptApi";

const SYNC_TIMEOUT_MS = 5000;

let cachedSkewMs = null;

async function getServerTimeSkewMs() {
  if (cachedSkewMs !== null) return cachedSkewMs;

  const clientBefore = Date.now();
  const serverNowMs = await attemptApi.getServerTime(); // može vratiti null
  const clientAfter = Date.now();

  if (serverNowMs == null) {
    cachedSkewMs = 0;
    return 0;
  }

  const rttHalf = Math.round((clientAfter - clientBefore) / 2);
  const adjustedServerMs = serverNowMs - rttHalf;
  const skew = adjustedServerMs - clientBefore;

  cachedSkewMs = Math.abs(skew) > 5000 ? skew : 0;

  if (Math.abs(cachedSkewMs) > 0) {
    console.info(
      `[useExamInit] Clock skew detektiran: ${cachedSkewMs > 0 ? "+" : ""}${(cachedSkewMs / 1000).toFixed(1)}s ` +
        `(klijent je ${cachedSkewMs > 0 ? "iza" : "ispred"} servera).`,
    );
  }

  return cachedSkewMs;
}

function calcElapsedFromStatus(data, skewMs = 0) {
  if (!data?.started_at) return Number(data?.elapsed_seconds) || 0;
  const startMs = new Date(data.started_at).getTime();
  const pausedMs = (data.total_paused_seconds ?? 0) * 1000;
  const clientNow = Date.now() + skewMs;
  return Math.max(0, Math.floor((clientNow - startMs - pausedMs) / 1000));
}

function isAttemptOverdue(statusData, maxDurationSeconds, skewMs = 0) {
  if (!maxDurationSeconds || maxDurationSeconds <= 0) return false;
  return calcElapsedFromStatus(statusData, skewMs) >= maxDurationSeconds;
}

export function useExamInit(examId) {
  const {
    storeExamId,
    storeQuestions,
    storeSubmittedAt,
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
      storeSubmittedAt: s.submittedAt,
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

  const isActiveInStore =
    storeExamId === examId && storeQuestions.length > 0 && !storeSubmittedAt;

  const [isInitialized, setIsInitialized] = useState(isActiveInStore);

  const abandonAttemptSilently = useCallback(async (oldAttemptId) => {
    if (!oldAttemptId) return;
    try {
      const newStatus = await attemptApi.abandon(oldAttemptId);
      console.info(
        `[useExamInit] Attempt ${oldAttemptId} abandoniran (novi status: ${newStatus ?? "unknown"}).`,
      );
    } catch (err) {
      console.warn(
        `[useExamInit] abandonAttemptSilently pao za ${oldAttemptId}:`,
        err?.message,
      );
    }
  }, []);

  const resolveAttemptId = useCallback(
    async (candidateId, hasDraftAnswers, maxDurationSeconds = 0) => {
      const skewMs = await getServerTimeSkewMs();

      if (candidateId) {
        try {
          const statusData = await attemptApi.getStatus(candidateId);
          const status = statusData?.status;

          if (status === "in_progress") {
            if (isAttemptOverdue(statusData, maxDurationSeconds, skewMs)) {
              const elapsed = calcElapsedFromStatus(statusData, skewMs);
              console.info(
                `[useExamInit] Kandidat ${candidateId} je overdue ` +
                  `(${elapsed}s >= ${maxDurationSeconds}s). Abandoniranje...`,
              );
              abandonAttemptSilently(candidateId);
              draftStorage.clear(examId);
            } else {
              setAttemptId(candidateId);
              return { id: candidateId, alreadyRestored: false };
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
            return { id: candidateId, alreadyRestored: true };
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
          isAttemptOverdue(existing, maxDurationSeconds, skewMs)
        ) {
          console.info(
            `[useExamInit] checkActive attempt ${existing.id} je overdue, abandoniranje + kreiranje novog.`,
          );
          abandonAttemptSilently(existing.id);
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
            return { id: existing.id, alreadyRestored: true };
          }

          return { id: existing.id, alreadyRestored: false };
        }
      }

      const created = await attemptApi.create(examId);
      if (created?.id) {
        setAttemptId(created.id);
        draftStorage.save(examId, {}, created.id);
        return { id: created.id, alreadyRestored: false };
      }

      return { id: null, alreadyRestored: false };
    },
    [examId, setAttemptId, pauseExam, restoreDraft, abandonAttemptSilently],
  );

  useEffect(() => {
    if (!examData) return;

    if (initDoneRef.current === examId && isActiveInStore) {
      if (!isInitialized) setIsInitialized(true);
      return;
    }

    if (isActiveInStore && initDoneRef.current !== examId) {
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
      .then((result) => {
        const resolvedId =
          result && typeof result === "object" ? result.id : result;
        const alreadyRestored =
          result && typeof result === "object"
            ? (result.alreadyRestored ?? false)
            : false;

        if (
          resolvedId &&
          hasDraftAnswers &&
          draft?.answers &&
          !alreadyRestored
        ) {
          if (resolvedId === candidateId) {
            setPendingDraft(draft);
            setShowDraftModal(true);
          }
        }
      })
      .catch((err) => {
        console.error("[useExamInit] resolveAttemptId pao:", err);
      })
      .finally(() => {
        if (attemptCreationPromiseRef.current === promise) {
          attemptCreationPromiseRef.current = "done";
        }
      });

    attemptCreationPromiseRef.current = promise;
  }, [examData, examId, isActiveInStore]); // eslint-disable-line react-hooks/exhaustive-deps

  const timerSyncedForRef = useRef(null);

  useEffect(() => {
    if (!attemptId) return;
    if (timerSyncedForRef.current === attemptId) return;

    let cancelled = false;

    (async () => {
      try {
        const [statusData, skewMs] = await Promise.all([
          attemptApi.getStatus(attemptId),
          getServerTimeSkewMs(),
        ]);

        if (cancelled) return;

        const isServerPaused = statusData?.status === "paused";
        let elapsedSeconds = calcElapsedFromStatus(statusData, skewMs);

        const maxDuration =
          (examDataRef.current?.exam?.duration_minutes ?? 0) * 60;
        if (maxDuration > 0 && elapsedSeconds >= maxDuration) {
          console.info(
            `[useExamInit] Timer sync: elapsed=${elapsedSeconds}s >= duration=${maxDuration}s, clamp na 0`,
          );
          elapsedSeconds = 0;
        }

        timerSyncRef.current = { elapsedSeconds, isServerPaused, ready: true };
        timerSyncedForRef.current = attemptId;
      } catch (err) {
        console.warn("[useExamInit] Timer sync getStatus pao:", err.message);
        timerSyncRef.current = {
          elapsedSeconds: 0,
          isServerPaused: false,
          ready: true,
        };
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  const confirmRestoreDraft = useCallback(() => {
    if (pendingDraft?.answers) {
      restoreDraft(pendingDraft.answers);
      toast.success("Prethodni odgovori su vraćeni.");
    }
    setShowDraftModal(false);
    setPendingDraft(null);
  }, [pendingDraft, restoreDraft]);

  const discardDraft = useCallback(() => {
    draftStorage.clear(examId);
    setShowDraftModal(false);
    setPendingDraft(null);
    toast.info("Počinješ ispočetka.");
  }, [examId]);

  return {
    isLoading,
    isInitialized,
    fetchError,
    showDraftModal,
    confirmRestoreDraft,
    discardDraft,
    attemptIdRef,
    attemptCreationPromiseRef,
    timerSyncRef,
  };
}
