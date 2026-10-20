import type { Question, QuestionType, SubjectId } from "./types";

export function q(
  id: string,
  subject: SubjectId,
  topic: string,
  difficulty: 1 | 2 | 3,
  type: QuestionType,
  prompt: string,
  answer: string,
  explanation: string,
  options?: readonly string[],
  accept?: readonly string[],
  figure?: string,
  figureAlt?: string,
): Question {
  return {
    id,
    subject,
    topic,
    difficulty,
    type,
    prompt,
    answer,
    explanation,
    ...(options ? { options } : {}),
    ...(accept ? { accept } : {}),
    ...(figure ? { figure } : {}),
    ...(figureAlt ? { figureAlt } : {}),
  };
}

export function mcq(
  id: string,
  subject: SubjectId,
  topic: string,
  difficulty: 1 | 2 | 3,
  prompt: string,
  options: readonly string[],
  answer: string,
  explanation: string,
  figure?: string,
  figureAlt?: string,
): Question {
  return q(
    id,
    subject,
    topic,
    difficulty,
    "mcq",
    prompt,
    answer,
    explanation,
    options,
    undefined,
    figure,
    figureAlt,
  );
}

export function tf(
  id: string,
  subject: SubjectId,
  topic: string,
  difficulty: 1 | 2 | 3,
  prompt: string,
  answer: "True" | "False",
  explanation: string,
  figure?: string,
  figureAlt?: string,
): Question {
  return q(
    id,
    subject,
    topic,
    difficulty,
    "tf",
    prompt,
    answer,
    explanation,
    ["True", "False"],
    undefined,
    figure,
    figureAlt,
  );
}

export function typed(
  id: string,
  subject: SubjectId,
  topic: string,
  difficulty: 1 | 2 | 3,
  prompt: string,
  answer: string,
  explanation: string,
  accept?: readonly string[],
  figure?: string,
  figureAlt?: string,
): Question {
  return q(
    id,
    subject,
    topic,
    difficulty,
    "type",
    prompt,
    answer,
    explanation,
    undefined,
    accept,
    figure,
    figureAlt,
  );
}
