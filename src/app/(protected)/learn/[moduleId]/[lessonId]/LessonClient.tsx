"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { completeLesson } from "@/actions/learn"
import type { Lesson } from "@/content/lessons"

const PASSING_SCORE = 4

interface LessonClientProps {
  lesson: Lesson
  moduleId: string
  nextLessonId: string | null
  isAlreadyCompleted: boolean
}

export function LessonClient({
  lesson,
  moduleId,
  nextLessonId,
  isAlreadyCompleted,
}: LessonClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [answers, setAnswers] = useState<(number | null)[]>(
    lesson.quiz.map(() => null)
  )
  const [revealed, setRevealed] = useState<boolean[]>(
    lesson.quiz.map(() => false)
  )
  const [resetKey, setResetKey] = useState(0)

  const allAnswered = answers.every((a) => a !== null)
  const score = answers.filter(
    (a, i) => a === lesson.quiz[i].correctIndex
  ).length
  const passed = allAnswered && score >= PASSING_SCORE

  function selectAnswer(questionIndex: number, optionIndex: number) {
    if (answers[questionIndex] !== null) return
    setAnswers((prev) => {
      const next = [...prev]
      next[questionIndex] = optionIndex
      return next
    })
    setRevealed((prev) => {
      const next = [...prev]
      next[questionIndex] = true
      return next
    })
  }

  function handleTryAgain() {
    setAnswers(lesson.quiz.map(() => null))
    setRevealed(lesson.quiz.map(() => false))
    setResetKey((k) => k + 1)
  }

  function handleComplete() {
    startTransition(async () => {
      await completeLesson(moduleId, lesson.id, score)
      if (nextLessonId) {
        router.push(`/learn/${moduleId}/${nextLessonId}`)
      } else {
        router.push(`/learn/${moduleId}`)
      }
    })
  }

  return (
    <div>
      {/* Lesson content */}
      <div className="mb-10 space-y-4">
        {lesson.content.map((paragraph, i) => (
          <p key={i} className="text-base leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Quiz */}
      <div className="border-t pt-8">
        <h2 className="text-xl font-semibold mb-6">Quiz</h2>
        <div className="flex flex-col gap-8" key={resetKey}>
          {lesson.quiz.map((question, qi) => (
            <div key={qi}>
              <p className="font-medium mb-3">
                {qi + 1}. {question.question}
              </p>
              <div className="flex flex-col gap-2">
                {question.options.map((option, oi) => {
                  const isSelected = answers[qi] === oi
                  const isCorrect = oi === question.correctIndex
                  const showFeedback = revealed[qi]

                  let cls =
                    "border rounded-lg px-4 py-3 text-left transition-colors w-full text-sm "
                  if (!showFeedback) {
                    cls += "hover:bg-muted cursor-pointer"
                  } else if (isCorrect) {
                    cls += "border-green-500 bg-green-50 text-green-800"
                  } else if (isSelected) {
                    cls += "border-red-500 bg-red-50 text-red-800"
                  } else {
                    cls += "opacity-40"
                  }

                  return (
                    <button
                      key={oi}
                      className={cls}
                      onClick={() => selectAnswer(qi, oi)}
                      disabled={showFeedback}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
              {revealed[qi] && (
                <div
                  className={`mt-3 flex items-start gap-2 text-sm ${
                    answers[qi] === question.correctIndex
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {answers[qi] === question.correctIndex ? (
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  <span>{question.explanation}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Result bar */}
        {allAnswered && (
          <div className="mt-8 rounded-lg border bg-muted/50 p-4">
            <p className="font-semibold mb-3">
              Score: {score} / {lesson.quiz.length}
              {passed ? " — Great work! 🎉" : ` — Need ${PASSING_SCORE} to pass`}
            </p>
            {passed ? (
              <Button onClick={handleComplete} disabled={isPending}>
                {isPending
                  ? "Saving..."
                  : nextLessonId
                  ? "Next Lesson →"
                  : "Complete Module →"}
              </Button>
            ) : (
              <Button variant="outline" onClick={handleTryAgain}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        )}

        {/* Already-completed navigation (review mode) */}
        {isAlreadyCompleted && !allAnswered && (
          <div className="mt-6 flex gap-3">
            {nextLessonId && (
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/learn/${moduleId}/${nextLessonId}`)
                }
              >
                Next Lesson →
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => router.push(`/learn/${moduleId}`)}
            >
              Back to Module
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
