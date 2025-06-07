import { api } from '../../shared/services/api';

export type QuizPrompt = { text: string; options: string[] };
export type QuizResult = {
  score: number;
  feedback: { correctOption: number; explanation: string }[];
};

export const learningApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getInterests: builder.query<string[], void>({
      query: () => '/learning/interests',
      providesTags: ['Learning'],
    }),
    saveInterests: builder.mutation<string[], string[]>({
      query: (topics) => ({ url: '/learning/interests', method: 'PUT', body: { topics } }),
      invalidatesTags: (_, error) => error ? [] : ['Learning'],
    }),
    getVideos: builder.query<{ id: string; title: string; channel: string; topic: string }[], void>({
      query: () => '/learning/videos',
      providesTags: ['Learning'],
    }),
    getProfessions: builder.query<string[], void>({
      query: () => '/learning/quizzes',
    }),
    getQuiz: builder.query<QuizPrompt[], string>({
      query: (profession) => `/learning/quizzes/${encodeURIComponent(profession)}`,
    }),
    submitQuiz: builder.mutation<QuizResult, { profession: string; answers: number[] }>({
      query: ({ profession, answers }) => ({
        url: `/learning/quizzes/${encodeURIComponent(profession)}/attempts`,
        method: 'POST',
        body: { answers },
      }),
      invalidatesTags: (_, error, { profession }) => error ? [] : [{ type: 'QuizRank', id: profession }],
    }),
    getLeaderboard: builder.query<{ username: string; score: number }[], string>({
      query: (profession) => `/learning/quizzes/${encodeURIComponent(profession)}/leaderboard`,
      providesTags: (_, __, profession) => [{ type: 'QuizRank', id: profession }],
    }),
    getQuotes: builder.query<string[], void>({
      query: () => '/learning/quotes',
    }),
  }),
});

export const {
  useGetInterestsQuery, useSaveInterestsMutation, useGetVideosQuery, useGetProfessionsQuery,
  useGetQuizQuery, useSubmitQuizMutation, useGetLeaderboardQuery, useGetQuotesQuery,
} = learningApi;
