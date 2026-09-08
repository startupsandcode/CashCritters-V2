import { TRACKS, getLesson, isLessonUnlocked, type Lesson } from "../content/lessons"

import { PASSING_SCORE } from "./quiz"

export function scoreLessonAnswers(trackId: string, lessonId: string, answers: unknown): number {
  const lesson = getLesson(trackId, lessonId)
  if (!lesson || !Array.isArray(answers) || answers.length !== lesson.quiz.length ||
    answers.some((answer, i) => !Number.isInteger(answer) || answer < 0 || answer >= lesson.quiz[i].options.length)) {
    throw new Error("Please answer every question in a valid lesson")
  }
  const score = answers.filter((answer, i) => answer === lesson.quiz[i].correctIndex).length
  if (score < PASSING_SCORE) throw new Error(`You need ${PASSING_SCORE} correct answers to complete this lesson`)
  return score
}

export function getLearningSummary(completed: Set<string>) {
  let completedCount = 0
  let totalCount = 0
  let nextLesson: { trackId: string; lesson: Lesson } | null = null
  const completedTrackIds: string[] = []
  for (const track of TRACKS) {
    let trackCount = 0
    for (const lesson of track.lessons) {
      totalCount++
      if (completed.has(`${track.id}:${lesson.id}`)) {
        completedCount++
        trackCount++
      } else if (!nextLesson && isLessonUnlocked(track.id, lesson.id, completed)) {
        nextLesson = { trackId: track.id, lesson }
      }
    }
    if (trackCount === track.lessons.length) completedTrackIds.push(track.id)
  }
  return { completedCount, totalCount, percent: totalCount ? Math.round(completedCount / totalCount * 100) : 0, nextLesson, completedTrackIds }
}
