import { queryOptions } from '@tanstack/react-query';
import { listQuestions, getQuestion, listAnswers } from './service';
import type { ListQuestionsQuery } from './types';

/** Query keys: prefixed with the feature id; scoped lists include `scope` (SDD-01 §5.1). */
export const questionsKeys = {
  all: ['questions'] as const,
  questions: (params?: ListQuestionsQuery) =>
    [...questionsKeys.all, 'questions', params?.scope ?? 'all', params ?? {}] as const,
  question: (id: string) => [...questionsKeys.all, 'question', id] as const,
  answers: (id: string) => [...questionsKeys.all, 'answers', id] as const
};

export const questionsQueryOptions = (params?: ListQuestionsQuery) =>
  queryOptions({ queryKey: questionsKeys.questions(params), queryFn: () => listQuestions(params) });

export const questionQueryOptions = (id: string) =>
  queryOptions({ queryKey: questionsKeys.question(id), queryFn: () => getQuestion(id) });

export const answersQueryOptions = (id: string) =>
  queryOptions({ queryKey: questionsKeys.answers(id), queryFn: () => listAnswers(id) });
