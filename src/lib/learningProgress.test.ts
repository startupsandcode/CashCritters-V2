import assert from "node:assert/strict"
import { test } from "node:test"
import { TRACKS, isLessonUnlocked } from "../content/lessons"
import { getLearningSummary, scoreLessonAnswers } from "./learningProgress"

test("direct lesson URLs cannot bypass a locked track", () => {
  assert.equal(isLessonUnlocked(TRACKS[1].id, TRACKS[1].lessons[0].id, new Set()), false)
})

test("new learners get the first lesson and no completed progress", () => {
  const summary = getLearningSummary(new Set())
  assert.equal(summary.completedCount, 0)
  assert.equal(summary.percent, 0)
  assert.equal(summary.nextLesson?.lesson.id, TRACKS[0].lessons[0].id)
})

test("finished tracks advance the next lesson and unlock achievements", () => {
  const completed = new Set(TRACKS[0].lessons.map(l => `${TRACKS[0].id}:${l.id}`))
  const summary = getLearningSummary(completed)
  assert.equal(summary.nextLesson?.trackId, TRACKS[1].id)
  assert.equal(summary.completedTrackIds.includes(TRACKS[0].id), true)
})

test("completed curriculum has no next lesson and ignores unknown records", () => {
  const completed = new Set(TRACKS.flatMap(t => t.lessons.map(l => `${t.id}:${l.id}`)))
  completed.add("fake:lesson")
  const summary = getLearningSummary(completed)
  assert.equal(summary.completedCount, summary.totalCount)
  assert.equal(summary.percent, 100)
  assert.equal(summary.nextLesson, null)
})

test("server scores actual quiz answers and rejects invalid or failing submissions", () => {
  const track = TRACKS[0]
  const lesson = track.lessons[0]
  const answers = lesson.quiz.map(q => q.correctIndex)
  assert.equal(scoreLessonAnswers(track.id, lesson.id, answers), lesson.quiz.length)
  assert.throws(() => scoreLessonAnswers("fake", lesson.id, answers))
  assert.throws(() => scoreLessonAnswers(track.id, lesson.id, []))
  assert.throws(() => scoreLessonAnswers(track.id, lesson.id, [99, ...answers.slice(1)]))
  assert.throws(() => scoreLessonAnswers(track.id, lesson.id, answers.map((a) => (a + 1) % 4)))
})
