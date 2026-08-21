import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
  BookOpen,
  Trophy,
  SlidersHorizontal,
  ArrowLeft,
  ShieldCheck,
  Award,
  AlertTriangle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { SecureWatermark } from "@/components/exam-dumps/SecureWatermark";
import { ALL_EXAM_DUMPS_DATA, REDIS_DEVELOPER_EXAM, ExamQuestion, ExamDumpData } from "@/data/redis-cert-questions";
import { getStoredUser } from "@/lib/yatris-api";

export default function ExamPracticeViewer() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const user = getStoredUser();

  // Resolve exam data or fallback to Redis exam
  const examData: ExamDumpData = useMemo(() => {
    if (slug && ALL_EXAM_DUMPS_DATA[slug.toLowerCase()]) {
      return ALL_EXAM_DUMPS_DATA[slug.toLowerCase()];
    }
    return REDIS_DEVELOPER_EXAM;
  }, [slug]);

  // Mode: "study" (instant answer & explanations) | "exam" (timed mock test)
  const [mode, setMode] = useState<"study" | "exam">("study");
  const [selectedDomain, setSelectedDomain] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Current active question index (in the filtered question list)
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // User responses: questionId -> array of selected option letters ['A', 'C']
  const [userAnswers, setUserAnswers] = useState<Record<string, string[]>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [flaggedForReview, setFlaggedForReview] = useState<Set<string>>(new Set());

  // Filter state for reviewing mistakes only
  const [reviewMistakesOnly, setReviewMistakesOnly] = useState<boolean>(false);

  // Exam timer (seconds remaining)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(examData.timeLimitMinutes * 60);
  const [isExamSubmitted, setIsExamSubmitted] = useState<boolean>(false);
  const [showScoreModal, setShowScoreModal] = useState<boolean>(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(false);

  // Reset exam state when switching modes or exams
  const resetExam = () => {
    setUserAnswers({});
    setRevealedAnswers({});
    setFlaggedForReview(new Set());
    setSecondsRemaining(examData.timeLimitMinutes * 60);
    setIsExamSubmitted(false);
    setShowScoreModal(false);
    setCurrentIndex(0);
    setReviewMistakesOnly(false);
  };

  // Timer countdown in exam mode
  useEffect(() => {
    if (mode !== "exam" || isExamSubmitted) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [mode, isExamSubmitted]);

  // Filter questions by domain, search query, or mistake review
  const filteredQuestions = useMemo(() => {
    let list = examData.questions;

    if (selectedDomain !== "All") {
      list = list.filter((q) => q.domain === selectedDomain);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          (item.codeSnippet && item.codeSnippet.toLowerCase().includes(q)) ||
          item.options.some((opt) => opt.text.toLowerCase().includes(q))
      );
    }

    if (reviewMistakesOnly && isExamSubmitted) {
      list = list.filter((q) => {
        const userAns = (userAnswers[q.id] || []).sort().join(",");
        const correctAns = [...q.correctAnswers].sort().join(",");
        return userAns !== correctAns;
      });
    }

    return list;
  }, [examData, selectedDomain, searchQuery, reviewMistakesOnly, isExamSubmitted, userAnswers]);

  // Keep index within bounds
  useEffect(() => {
    if (currentIndex >= filteredQuestions.length) {
      setCurrentIndex(0);
    }
  }, [filteredQuestions.length, currentIndex]);

  const currentQuestion: ExamQuestion | undefined = filteredQuestions[currentIndex];

  // Handle option selection
  const handleSelectOption = (letter: string) => {
    if (!currentQuestion) return;

    setUserAnswers((prev) => {
      const currentSelected = prev[currentQuestion.id] || [];
      if (currentQuestion.chooseCount === 1) {
        return { ...prev, [currentQuestion.id]: [letter] };
      } else {
        // Multi-select
        if (currentSelected.includes(letter)) {
          return { ...prev, [currentQuestion.id]: currentSelected.filter((l) => l !== letter) };
        } else {
          if (currentSelected.length >= currentQuestion.chooseCount) {
            // Replace oldest if exceeded
            return { ...prev, [currentQuestion.id]: [...currentSelected.slice(1), letter] };
          }
          return { ...prev, [currentQuestion.id]: [...currentSelected, letter] };
        }
      }
    });
  };

  const toggleBookmark = (qId: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const toggleFlagForReview = (qId: string) => {
    setFlaggedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const handleSubmitExam = () => {
    setIsExamSubmitted(true);
    setShowScoreModal(true);
  };

  // Calculate score & domain stats
  const scoreResults = useMemo(() => {
    let correctCount = 0;
    const domainStats: Record<string, { total: number; correct: number }> = {};

    examData.domains.forEach((d) => {
      domainStats[d] = { total: 0, correct: 0 };
    });

    examData.questions.forEach((q) => {
      if (!domainStats[q.domain]) {
        domainStats[q.domain] = { total: 0, correct: 0 };
      }
      domainStats[q.domain].total += 1;

      const userAns = (userAnswers[q.id] || []).sort().join(",");
      const correctAns = [...q.correctAnswers].sort().join(",");
      if (userAns === correctAns && userAns !== "") {
        correctCount += 1;
        domainStats[q.domain].correct += 1;
      }
    });

    const percent = Math.round((correctCount / examData.totalQuestions) * 100);
    const passed = percent >= examData.passingScorePercent;

    return {
      correctCount,
      totalCount: examData.totalQuestions,
      percent,
      passed,
      domainStats,
    };
  }, [examData, userAnswers]);

  // Format timer
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(userAnswers).filter(
    (k) => userAnswers[k] && userAnswers[k].length > 0
  ).length;

  return (
    <div className="min-h-screen bg-background text-foreground select-none pb-24">
      <SEO
        title={`${examData.title} Practice Questions | Yatri Cloud`}
        description={`Interactive exam practice simulator for ${examData.title}.`}
      />

      {/* Forensic DRM Watermark */}
      <SecureWatermark buyerEmail={user?.email} />

      <Navbar />

      <main className="pt-24 px-4 max-w-7xl mx-auto">
        {/* Top Header & Mode Switcher Bar */}
        <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-border/80">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              asChild
              className="h-10 w-10 rounded-xl"
            >
              <Link to="/examdumps">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider text-primary border-primary/30">
                  {examData.provider}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  {examData.examCode}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full font-medium">
                  <ShieldCheck className="h-3 w-3" /> Verified Dumps
                </span>
              </div>
              <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight mt-1">
                {examData.title}
              </h1>
            </div>
          </div>

          {/* Mode Switcher & Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap">
            <div className="inline-flex rounded-xl bg-muted p-1 border border-border">
              <button
                type="button"
                onClick={() => { setMode("study"); resetExam(); }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === "study"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Study Mode
              </button>
              <button
                type="button"
                onClick={() => { setMode("exam"); resetExam(); }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === "exam"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                Mock Exam
              </button>
            </div>

            {mode === "exam" && !isExamSubmitted && (
              <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800 text-sm font-mono font-bold">
                <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
                {formatTime(secondsRemaining)}
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => setIsPaletteOpen(!isPaletteOpen)}
              className="rounded-xl text-xs gap-1.5 font-semibold h-9"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Palette ({answeredCount}/{examData.totalQuestions})
            </Button>
          </div>
        </div>

        {/* Study Mode Filter Bar */}
        {mode === "study" && (
          <div className="mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 md:pb-0 scrollbar-none">
              <Button
                variant={selectedDomain === "All" ? "default" : "outline"}
                size="sm"
                onClick={() => { setSelectedDomain("All"); setCurrentIndex(0); }}
                className="rounded-full text-xs font-semibold shrink-0"
              >
                All Domains ({examData.totalQuestions})
              </Button>
              {examData.domains.map((d) => (
                <Button
                  key={d}
                  variant={selectedDomain === d ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setSelectedDomain(d); setCurrentIndex(0); }}
                  className="rounded-full text-xs font-semibold shrink-0"
                >
                  {d}
                </Button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentIndex(0); }}
                placeholder="Search questions…"
                className="h-9 pl-9 text-xs rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Main Grid: Question Canvas & Palette */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Question View Column */}
          <div className="lg:col-span-8 space-y-6">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-24 border border-border rounded-2xl bg-card p-8">
                <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold">No questions found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Try changing your domain filter or search query.
                </p>
                <Button
                  onClick={() => { setSelectedDomain("All"); setSearchQuery(""); setReviewMistakesOnly(false); }}
                  className="mt-4 rounded-xl shadow-inset-btn"
                >
                  Reset Filters
                </Button>
              </div>
            ) : currentQuestion ? (
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border border-border/80 bg-card p-6 md:p-8 shadow-xs relative"
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-primary px-2.5 py-1 rounded-md bg-primary/10">
                        Q{currentQuestion.questionNumber} of {examData.totalQuestions}
                      </span>
                      <Badge variant="outline" className="text-xs font-normal">
                        {currentQuestion.domain}
                      </Badge>
                      {currentQuestion.chooseCount > 1 && (
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                          Choose {currentQuestion.chooseCount} answers
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleBookmark(currentQuestion.id)}
                      className={`h-8 w-8 rounded-lg ${
                        bookmarkedIds.has(currentQuestion.id) ? "text-amber-500 fill-amber-500" : "text-muted-foreground"
                      }`}
                      aria-label="Bookmark question"
                    >
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Question Title */}
                <h2 className="text-lg md:text-xl font-bold leading-relaxed text-foreground mb-4">
                  {currentQuestion.title}
                </h2>

                {/* Code Block if present */}
                {currentQuestion.codeSnippet && (
                  <div className="my-4 rounded-xl border border-border/70 bg-[#0d1117] text-slate-100 p-4 font-mono text-xs overflow-x-auto leading-relaxed shadow-inset">
                    <pre>
                      <code>{currentQuestion.codeSnippet}</code>
                    </pre>
                  </div>
                )}

                {currentQuestion.leadInText && (
                  <p className="text-sm text-foreground/90 font-medium my-3">
                    {currentQuestion.leadInText}
                  </p>
                )}

                {/* Options List */}
                <div className="space-y-3 mt-6">
                  {currentQuestion.options.map((opt) => {
                    const isSelected = (userAnswers[currentQuestion.id] || []).includes(opt.letter);
                    const isCorrect = currentQuestion.correctAnswers.includes(opt.letter);
                    const isRevealed =
                      mode === "study"
                        ? !!revealedAnswers[currentQuestion.id]
                        : isExamSubmitted;

                    let cardStyle = "border-border/80 hover:border-primary/50 bg-background";
                    if (isSelected) {
                      cardStyle = "border-primary bg-primary/5 ring-1 ring-primary";
                    }

                    if (isRevealed) {
                      if (isCorrect) {
                        cardStyle = "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-500";
                      } else if (isSelected && !isCorrect) {
                        cardStyle = "border-rose-500 bg-rose-50/70 dark:bg-rose-950/30 text-rose-950 dark:text-rose-200 ring-1 ring-rose-500";
                      }
                    }

                    return (
                      <div
                        key={opt.letter}
                        onClick={() => {
                          if (!isExamSubmitted) handleSelectOption(opt.letter);
                        }}
                        className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${cardStyle}`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "border border-border bg-muted/60 text-muted-foreground"
                          }`}
                        >
                          {opt.letter}
                        </span>
                        <div className="flex-1 text-sm leading-relaxed pt-0.5">
                          {opt.text}
                        </div>
                        {isRevealed && isCorrect && (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                        )}
                        {isRevealed && isSelected && !isCorrect && (
                          <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Study Mode: Reveal Answer Toggle */}
                {mode === "study" && (
                  <div className="mt-6 pt-5 border-t border-border/80 flex flex-col gap-3">
                    <Button
                      variant={revealedAnswers[currentQuestion.id] ? "outline" : "default"}
                      onClick={() => {
                        setRevealedAnswers((prev) => ({
                          ...prev,
                          [currentQuestion.id]: !prev[currentQuestion.id],
                        }));
                      }}
                      className="w-full sm:w-auto font-semibold rounded-xl"
                    >
                      {revealedAnswers[currentQuestion.id]
                        ? "Hide Answer & Explanation"
                        : "Show Correct Answer"}
                    </Button>

                    <AnimatePresence>
                      {revealedAnswers[currentQuestion.id] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-4 text-xs space-y-2 mt-2"
                        >
                          <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4" />
                            Correct Answer: {currentQuestion.correctAnswers.join(", ")}
                          </div>
                          <p className="text-muted-foreground leading-relaxed">
                            {currentQuestion.explanation}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Exam Mode Feedback after Submission */}
                {mode === "exam" && isExamSubmitted && (
                  <div className="mt-6 pt-5 border-t border-border/80">
                    <div className="rounded-xl bg-muted/60 border border-border p-4 text-xs space-y-2">
                      <div className="font-bold text-foreground flex items-center gap-1.5">
                        Correct Answer:{" "}
                        <span className="text-emerald-600 font-extrabold">
                          {currentQuestion.correctAnswers.join(", ")}
                        </span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : null}

            {/* Bottom Navigation Controls */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <Button
                variant="outline"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="rounded-xl font-semibold gap-1.5 min-h-[44px]"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>

              {mode === "exam" && !isExamSubmitted && currentQuestion && (
                <Button
                  variant="outline"
                  onClick={() => toggleFlagForReview(currentQuestion.id)}
                  className={`rounded-xl text-xs font-semibold gap-1.5 ${
                    flaggedForReview.has(currentQuestion.id)
                      ? "border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-950/30"
                      : ""
                  }`}
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  {flaggedForReview.has(currentQuestion.id) ? "Flagged" : "Flag for Review"}
                </Button>
              )}

              {currentIndex < filteredQuestions.length - 1 ? (
                <Button
                  onClick={() =>
                    setCurrentIndex((prev) => Math.min(filteredQuestions.length - 1, prev + 1))
                  }
                  className="rounded-xl font-semibold bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600 gap-1.5 min-h-[44px]"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              ) : mode === "exam" && !isExamSubmitted ? (
                <Button
                  onClick={handleSubmitExam}
                  className="rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md gap-1.5 min-h-[44px]"
                >
                  Submit Exam
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setCurrentIndex(0)}
                  className="rounded-xl font-semibold gap-1.5"
                >
                  Back to Q1
                </Button>
              )}
            </div>
          </div>

          {/* Question Navigator Sidebar (Palette) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs sticky top-28">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-base">Question Palette</h3>
                <span className="text-xs text-muted-foreground font-mono">
                  {answeredCount}/{examData.totalQuestions} Answered
                </span>
              </div>

              {/* Status Legend */}
              <div className="grid grid-cols-3 gap-2 text-[11px] mb-4 pb-4 border-b border-border text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Answered
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" /> Left
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Flagged
                </div>
              </div>

              {/* Grid of question buttons */}
              <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2 max-h-[340px] overflow-y-auto pr-1">
                {examData.questions.map((q, idx) => {
                  const isAnswered = userAnswers[q.id] && userAnswers[q.id].length > 0;
                  const isFlagged = flaggedForReview.has(q.id);
                  const isCurrent = currentQuestion && currentQuestion.id === q.id;

                  let btnStyle = "border-border bg-muted/40 text-foreground hover:bg-muted";
                  if (isAnswered) {
                    btnStyle = "bg-primary text-primary-foreground font-bold border-primary";
                  }
                  if (isFlagged) {
                    btnStyle = "bg-amber-500 text-white font-bold border-amber-600";
                  }
                  if (isCurrent) {
                    btnStyle += " ring-2 ring-foreground ring-offset-1";
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        setSelectedDomain("All");
                        setSearchQuery("");
                        setReviewMistakesOnly(false);
                        const matchIdx = examData.questions.findIndex((item) => item.id === q.id);
                        if (matchIdx !== -1) setCurrentIndex(matchIdx);
                      }}
                      className={`h-9 w-full rounded-lg text-xs font-medium border transition-all flex items-center justify-center ${btnStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Action in Exam Mode */}
              {mode === "exam" && !isExamSubmitted && (
                <div className="mt-6 pt-4 border-t border-border">
                  <Button
                    onClick={handleSubmitExam}
                    className="w-full rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md min-h-[44px]"
                  >
                    Submit Exam ({answeredCount}/{examData.totalQuestions})
                  </Button>
                </div>
              )}

              {/* Result Summary in Exam Mode when Submitted */}
              {mode === "exam" && isExamSubmitted && (
                <div className="mt-6 pt-4 border-t border-border space-y-3">
                  <div className="text-center p-3 rounded-xl bg-muted/60">
                    <div className="text-2xl font-bold font-display">
                      {scoreResults.percent}%
                    </div>
                    <div className="text-xs font-semibold mt-0.5">
                      {scoreResults.passed ? (
                        <span className="text-emerald-600">Passed (≥{examData.passingScorePercent}%)</span>
                      ) : (
                        <span className="text-rose-600">Failed (&lt;{examData.passingScorePercent}%)</span>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setReviewMistakesOnly(!reviewMistakesOnly);
                      setCurrentIndex(0);
                    }}
                    className="w-full text-xs font-semibold rounded-xl"
                  >
                    {reviewMistakesOnly ? "Show All Questions" : "Review Incorrect Answers"}
                  </Button>

                  <Button
                    onClick={resetExam}
                    className="w-full text-xs font-semibold rounded-xl bg-primary text-primary-foreground shadow-inset-btn"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Retake Mock Exam
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Score Modal on Exam Submission */}
      <Dialog open={showScoreModal} onOpenChange={setShowScoreModal}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {scoreResults.passed ? (
                <Trophy className="h-7 w-7 text-emerald-600" />
              ) : (
                <Award className="h-7 w-7 text-amber-600" />
              )}
            </div>
            <DialogTitle className="text-center text-2xl font-bold font-display">
              {scoreResults.passed ? "Congratulations! You Passed!" : "Exam Completed"}
            </DialogTitle>
            <DialogDescription className="text-center text-sm">
              You scored{" "}
              <strong className="text-foreground">
                {scoreResults.correctCount} / {scoreResults.totalCount} ({scoreResults.percent}%)
              </strong>
              . Passing requirement is {examData.passingScorePercent}%.
            </DialogDescription>
          </DialogHeader>

          {/* Domain Breakdown */}
          <div className="space-y-2.5 my-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Performance by Domain
            </h4>
            {Object.entries(scoreResults.domainStats).map(([dom, stats]) => {
              const domPercent = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
              return (
                <div key={dom} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="truncate pr-2">{dom}</span>
                    <span className="font-mono font-bold">
                      {stats.correct}/{stats.total} ({domPercent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        domPercent >= examData.passingScorePercent ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${domPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowScoreModal(false);
                setReviewMistakesOnly(true);
                setCurrentIndex(0);
              }}
              className="w-full rounded-xl"
            >
              Review Mistakes
            </Button>
            <Button
              onClick={() => setShowScoreModal(false)}
              className="w-full rounded-xl bg-primary text-primary-foreground shadow-inset-btn"
            >
              Review All Answers
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
