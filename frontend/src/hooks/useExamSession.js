// hooks/useExamSession.js
// ─────────────────────────────────────────────────────────────────────────────
// IZMJENE vs. prethodne verzije:
//
//  ✅ FIX P2-1: useShallow za store selektore
//     Umjesto `const store = useExamStore()` (cijeli store subscription),
//     koristimo useShallow koji re-renderira samo kada se relevantni dijelovi
//     store-a promijene. Timer ticki (useTimer lokalni state) NE uzrokuju
//     re-render examStore subscription.
//
//  ✅ FIX P2-2: Debounced draft save (750ms)
//     handleAnswer sada poziva debounced verziju saveDraft umjesto instant.
//     Brzo klikanje kroz opcije (A→B→C) neće kreirati 3 draft write-a,
//     već samo 1 nakon 750ms od zadnjeg klika.
//     Direktni pozivi (pauza, submit) i dalje koriste instant save.
//
//  ✅ NOVO P1-2: useTabVisibility integriran
//     Prati izlaske iz taba tijekom aktivnog ispita.
//     tabDataRef je dostupan submitExam() pozivu za uključivanje u lastResult.
//
//  ✅ NOVO P2-3: useImagePreload integriran
//     Preloada imageUrl za iduća 3 pitanja u pozadini.
//
//  ✅ Public API identičan prethodnoj verziji — ExamTaking.jsx ne treba izmjene.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useExamStore } from "@/store/examStore";
import { useTimer } from "@/hooks/useTimer";
import { useKeyPress } from "@/hooks/useKeyPress";
import { useBeforeUnload } from "@/hooks/useBeforeUnload";
import { useTabVisibility } from "@/hooks/useTabVisibility";
import { useImagePreload } from "@/hooks/useImagePreload";
import { draftStorage } from "@/utils/storage";
import { toast } from "@/store/toastStore";
import { useExamInit } from "@/hooks/useExamInit";
import { useExamSubmit } from "@/hooks/useExamSubmit";

// ── Debounce helper (ne importa se useDebounce hook jer nam treba callback,
//    ne value debounce) ────────────────────────────────────────────────────────
function debounce(fn, ms) {
  let id;
  const debounced = (...args) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...args), ms);
  };
  debounced.flush = (...args) => {
    clearTimeout(id);
    fn(...args);
  };
  debounced.cancel = () => clearTimeout(id);
  return debounced;
}

export function useExamSession(examId) {
  // ── FIX P2-1: Atomični selektori s useShallow ─────────────────────────────
  //
  // PRIJE: `const store = useExamStore()` — pretplaćen na SVE promjene store-a.
  //         Svaki setAnswer(), toggleFlag(), goToQuestion() → re-render cijelog
  //         useExamSession + svih konsumera (ExamTaking, QuestionDisplay, itd.).
  //
  // SADA: useShallow kompilira plitku usporedbu — re-render samo kad se
  //       neka od selektiranih vrijednosti zaista promijeni.
  //
  const {
    examId: storeExamId,
    questions,
    answers,
    flagged,
    passages,
    currentIndex,
    isPaused,
    attemptId,
    examMeta,
    submittedAt,
    setAnswer,
    toggleFlag,
    goToQuestion,
    submitExam: storeSubmitExam,
  } = useExamStore(
    useShallow((s) => ({
      examId: s.examId,
      questions: s.questions,
      answers: s.answers,
      flagged: s.flagged,
      passages: s.passages,
      currentIndex: s.currentIndex,
      isPaused: s.isPaused,
      attemptId: s.attemptId,
      examMeta: s.examMeta,
      submittedAt: s.submittedAt,
      setAnswer: s.setAnswer,
      toggleFlag: s.toggleFlag,
      goToQuestion: s.goToQuestion,
      submitExam: s.submitExam,
    })),
  );

  // ── Tab visibility tracking (P1-2) ────────────────────────────────────────
  //
  // Aktivno samo dok ispit traje (questions postoje i nije submittan).
  // tabDataRef.current = { switchCount, totalHiddenMs }
  // Koristi se u useExamSubmit → submitExam(rpcResult, tabData)
  //
  const isExamActive = questions.length > 0 && !submittedAt;
  const tabDataRef = useTabVisibility({ enabled: isExamActive });

  // ── Elapsed clock (anchor-based, ne interval-based) ───────────────────────
  const elapsedClockRef = useRef({
    syncedElapsed: 0,
    localTickStartedAt: null,
  });

  const durationSeconds = useMemo(
    () => (examMeta?.duration_minutes ? examMeta.duration_minutes * 60 : null),
    [examMeta],
  );

  const getElapsed = useCallback(() => {
    if (!durationSeconds) return 0;
    const { syncedElapsed, localTickStartedAt } = elapsedClockRef.current;
    const localElapsed = localTickStartedAt
      ? Math.floor((Date.now() - localTickStartedAt) / 1000)
      : 0;
    return Math.min(durationSeconds, syncedElapsed + localElapsed);
  }, [durationSeconds]);

  // Definirano kao callback da ga timer može koristiti odmah pri init-u
  // eslint-disable-next-line prefer-const
  let timer;

  const applyServerElapsed = useCallback(
    (elapsedSeconds, { running = true } = {}) => {
      if (!durationSeconds) return;
      const normalized = Math.min(
        durationSeconds,
        Math.max(0, Number(elapsedSeconds) || 0),
      );
      elapsedClockRef.current = {
        syncedElapsed: normalized,
        localTickStartedAt: running ? Date.now() : null,
      };
      const remaining = Math.max(0, durationSeconds - normalized);
      // eslint-disable-next-line no-use-before-define
      timerRef.current?.resync(remaining, { running });
    },
    [durationSeconds],
  );

  const timerRef = useRef(null);
  const handleSubmitRef = useRef(null);

  // ── Timer ─────────────────────────────────────────────────────────────────
  timer = useTimer(durationSeconds, {
    onExpire: () => handleSubmitRef.current?.(),
    onWarning: () => toast.warning("Ostaje manje od 10 minuta!"),
  });

  useEffect(() => {
    timerRef.current = timer;
  });

  useEffect(() => {
    if (!durationSeconds) return;
    if (timer.running && !elapsedClockRef.current.localTickStartedAt) {
      elapsedClockRef.current = {
        ...elapsedClockRef.current,
        localTickStartedAt: Date.now(),
      };
    } else if (!timer.running && elapsedClockRef.current.localTickStartedAt) {
      elapsedClockRef.current = {
        syncedElapsed: getElapsed(),
        localTickStartedAt: null,
      };
    }
  }, [durationSeconds, timer.running, getElapsed]);

  // ── FIX P2-2: Debounced saveDraft (750ms) ────────────────────────────────
  //
  // PROBLEM: Prethodni handleAnswer pozivao je saveDraft() sinhrono na svaki
  //          klik. Korisnik koji brzo pregledava opcije (A→B→C→D) generira
  //          4 localStorage write-a u istoj sekundi.
  //
  // RJEŠENJE: debounce na 750ms za normalne odgovore.
  //           Direktni pozivi (pauza, auto-save interval, submit) i dalje
  //           koriste `debouncedSaveDraft.flush()` za instant zapis.
  //
  const saveDraftImmediate = useCallback(
    (nextAnswers) => {
      const currentAttemptId =
        attemptId ?? draftStorage.load(examId)?.attemptId ?? null;
      draftStorage.save(examId, nextAnswers, currentAttemptId);
    },
    [examId, attemptId],
  );

  // Kreiraj debounced verziju — stabilna ref da se ne rekreira na svakom renderu
  const debouncedSaveDraftRef = useRef(null);
  if (!debouncedSaveDraftRef.current) {
    debouncedSaveDraftRef.current = debounce((answers) => {
      // Čita attemptId direktno iz store-a (ne iz closure-a) da izbjegne stale
      const aid =
        useExamStore.getState().attemptId ??
        draftStorage.load(examId)?.attemptId ??
        null;
      draftStorage.save(examId, answers, aid);
    }, 750);
  }

  // Wrapper koji eksponira i flush
  const saveDraft = useCallback(
    (nextAnswers, { immediate = false } = {}) => {
      if (immediate) {
        debouncedSaveDraftRef.current.flush(nextAnswers);
        saveDraftImmediate(nextAnswers);
      } else {
        debouncedSaveDraftRef.current(nextAnswers);
      }
    },
    [saveDraftImmediate],
  );

  // ── Sub-hookovi ───────────────────────────────────────────────────────────
  const init = useExamInit(examId, { applyServerElapsed });

  const submit = useExamSubmit(examId, {
    attemptIdRef: init.attemptIdRef,
    attemptCreationPromiseRef: init.attemptCreationPromiseRef,
    timer,
    getElapsed,
    applyServerElapsed,
    durationSeconds,
    saveDraft,
    tabDataRef, // ← proslijeđen da submit može uključiti tabData u lastResult
  });

  useEffect(() => {
    handleSubmitRef.current = submit.handleSubmitRef.current;
  });

  // ── Auto-save svakih 30s (immediate) ─────────────────────────────────────
  useEffect(() => {
    if (!examId || Object.keys(answers).length === 0) return;
    const id = setInterval(
      () => saveDraft(answers, { immediate: true }),
      30_000,
    );
    return () => clearInterval(id);
  }, [examId, answers, saveDraft]);

  // ── Cleanup debounce na unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      debouncedSaveDraftRef.current?.cancel();
    };
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────
  const totalVisible = useMemo(
    () => questions.filter((q) => q.questionType !== "fill_blank_mc").length,
    [questions],
  );

  const answeredCount = useMemo(
    () => Object.keys(answers).filter((k) => answers[k] != null).length,
    [answers],
  );

  // ── Navigacija ────────────────────────────────────────────────────────────
  const [direction, setDirection] = useState(1);

  const handleGoTo = useCallback(
    (idx) => {
      if (idx < 0 || idx >= totalVisible) return;
      setDirection(idx > currentIndex ? 1 : -1);
      goToQuestion(idx);
    },
    [currentIndex, goToQuestion, totalVisible],
  );

  // ── Odgovor + zastavica ───────────────────────────────────────────────────
  const handleAnswer = useCallback(
    (letter) => {
      if (isPaused) return;
      const current = questions[currentIndex];
      if (!current) return;
      setAnswer(current.id, letter);
      // Debounced draft save (P2-2)
      saveDraft(useExamStore.getState().answers);
    },
    [isPaused, questions, currentIndex, setAnswer, saveDraft],
  );

  const handleToggleFlag = useCallback(() => {
    const current = questions[currentIndex];
    if (!current) return;
    toggleFlag(current.id);
  }, [questions, currentIndex, toggleFlag]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useKeyPress(
    {
      ArrowRight: () =>
        !isPaused &&
        currentIndex < totalVisible - 1 &&
        handleGoTo(currentIndex + 1),
      ArrowLeft: () =>
        !isPaused && currentIndex > 0 && handleGoTo(currentIndex - 1),
      a: () => handleAnswer("a"),
      b: () => handleAnswer("b"),
      c: () => handleAnswer("c"),
      d: () => handleAnswer("d"),
      f: handleToggleFlag,
      p: submit.handlePause,
      "?": () =>
        toast.info("Prečaci: ←→ navigacija · A–D odabir · F označi · P pauza"),
    },
    { ignoreFormElements: true },
  );

  useBeforeUnload(questions.length > 0 && !submittedAt);

  // ── FIX P2-3: Image preloading ────────────────────────────────────────────
  // Preloada imageUrl za iduća 3 pitanja u pozadini.
  // Nema vidljivog efekta na UI — čisto performance improvement.
  useImagePreload(questions, currentIndex, { ahead: 3 });

  // ── Computed current question ─────────────────────────────────────────────
  const current = questions[currentIndex] ?? null;
  const currentPassage = current?.passageId
    ? (passages[current.passageId] ?? null)
    : null;
  const isCurrentFlagged = current ? flagged.has(current.id) : false;

  // ── Public API ────────────────────────────────────────────────────────────
  // Identičan prethodnoj verziji — ExamTaking.jsx ne treba izmjene.
  return {
    questions,
    answers,
    flagged,
    passages,
    current,
    currentPassage,
    currentIndex,
    totalVisible,
    answeredCount,
    isCurrentFlagged,
    direction,
    isPaused,
    examMeta,

    isLoading: init.isLoading,
    isInitialized: init.isInitialized,
    fetchError: init.fetchError,

    isSubmitting: submit.isSubmitting,
    showSubmitModal: submit.showSubmitModal,
    setShowSubmitModal: submit.setShowSubmitModal,

    showDraftModal: init.showDraftModal,
    confirmRestoreDraft: init.confirmRestoreDraft,
    discardDraft: init.discardDraft,

    handleAnswer,
    handleToggleFlag,
    handleGoTo,
    handleSubmit: submit.handleSubmit,
    handlePause: submit.handlePause,
    handleResume: submit.handleResume,
    timer,

    // Tab tracking data (za debug / future backend integration)
    tabDataRef,
  };
}
