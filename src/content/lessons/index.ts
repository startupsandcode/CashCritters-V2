import { moneyBasicsLessons } from "./money-basics"
import { savingHabitsLessons } from "./saving-habits"
import { smartSpendingLessons } from "./smart-spending"

export interface QuizQuestion {
  question: string
  options: string[]     // exactly 4 choices
  correctIndex: number  // 0-based index into options
  explanation: string   // shown after answering
}

export interface Lesson {
  id: string            // URL slug, e.g. "what-is-money"
  title: string
  content: string[]     // paragraphs
  quiz: QuizQuestion[]  // exactly 5 questions
}

export interface Track {
  id: string            // URL slug, e.g. "money-basics"
  title: string
  description: string
  lessons: Lesson[]
}

export const TRACKS: Track[] = [
  {
    id: "money-basics",
    title: "Money Basics",
    description: "Learn what money is and how it works",
    lessons: moneyBasicsLessons,
  },
  {
    id: "saving-habits",
    title: "Saving Habits",
    description: "Develop healthy saving routines",
    lessons: savingHabitsLessons,
  },
  {
    id: "smart-spending",
    title: "Smart Spending",
    description: "Needs vs. wants and making good choices",
    lessons: smartSpendingLessons,
  },
]

export function getTrack(trackId: string): Track | undefined {
  return TRACKS.find((t) => t.id === trackId)
}

export function getLesson(trackId: string, lessonId: string): Lesson | undefined {
  return getTrack(trackId)?.lessons.find((l) => l.id === lessonId)
}

export function getNextLesson(trackId: string, lessonId: string): Lesson | undefined {
  const track = getTrack(trackId)
  if (!track) return undefined
  const index = track.lessons.findIndex((l) => l.id === lessonId)
  if (index === -1) return undefined
  return track.lessons[index + 1]
}

// A track is unlocked if it's first, or if every lesson in the previous track is completed.
export function isTrackUnlocked(trackId: string, completed: Set<string>): boolean {
  const index = TRACKS.findIndex((t) => t.id === trackId)
  if (index === -1) return false
  if (index === 0) return true
  const prev = TRACKS[index - 1]
  return prev.lessons.every((l) => completed.has(`${prev.id}:${l.id}`))
}

// A lesson is unlocked if it's first in the track, or if the previous lesson is completed.
export function isLessonUnlocked(
  trackId: string,
  lessonId: string,
  completed: Set<string>
): boolean {
  if (!isTrackUnlocked(trackId, completed)) return false
  const track = getTrack(trackId)
  if (!track) return false
  const index = track.lessons.findIndex((l) => l.id === lessonId)
  if (index === -1) return false
  if (index === 0) return true
  const prev = track.lessons[index - 1]
  return completed.has(`${trackId}:${prev.id}`)
}
