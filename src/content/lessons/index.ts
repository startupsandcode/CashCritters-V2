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

export interface Module {
  id: string            // URL slug, e.g. "money-basics"
  title: string
  description: string
  lessons: Lesson[]
}

export const MODULES: Module[] = [
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

export function getModule(moduleId: string): Module | undefined {
  return MODULES.find((m) => m.id === moduleId)
}

export function getLesson(moduleId: string, lessonId: string): Lesson | undefined {
  return getModule(moduleId)?.lessons.find((l) => l.id === lessonId)
}

export function getNextLesson(moduleId: string, lessonId: string): Lesson | undefined {
  const module = getModule(moduleId)
  if (!module) return undefined
  const index = module.lessons.findIndex((l) => l.id === lessonId)
  return module.lessons[index + 1]
}

// A lesson is unlocked if it's first in the module, or if the previous lesson is completed.
export function isLessonUnlocked(
  moduleId: string,
  lessonId: string,
  completed: Set<string>
): boolean {
  const module = getModule(moduleId)
  if (!module) return false
  const index = module.lessons.findIndex((l) => l.id === lessonId)
  if (index === 0) return true
  const prev = module.lessons[index - 1]
  return completed.has(`${moduleId}:${prev.id}`)
}
