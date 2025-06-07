import { api } from '../../../shared/services/api';

export type ChallengeProgressEntry = {
  date: string;
  report: string;
};

export type Challenge = {
  id: string;
  username: string;
  challenge: string;
  duration: string;
  applause: number;
  completed: boolean;
  createdAt: string;
  applaudedBy: string[];
  proofImageUrls: string[];
  progressEntries: ChallengeProgressEntry[];
  published: boolean;
  hasApplauded: boolean;
};

export type ChallengeRequest = {
  challenge: string;
  duration: string;
  completed?: boolean;
  applaudedBy?: string[];
  proofImageUrls?: string[];
  progressEntries?: ChallengeProgressEntry[];
  published?: boolean;
  appendProgressEntry?: ChallengeProgressEntry;
};

export type ChallengeListParams = {
  username?: string;
  completed?: boolean;
};

export type FeedItem = Pick<Challenge,
  'id' | 'username' | 'challenge' | 'duration' | 'createdAt' | 'completed' | 'applause' | 'hasApplauded'
>;

export const challengeApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getChallengeFeed: builder.query<{ items: FeedItem[]; hasNext: boolean }, number>({
      query: (page) => ({ url: '/challenges/feed', params: { page } }),
      providesTags: [{ type: 'Challenge', id: 'FEED' }],
    }),
    setApplause: builder.mutation<FeedItem, { id: string; applauded: boolean }>({
      query: ({ id, applauded }) => ({ url: `/challenges/${id}/applause`, method: 'PUT', body: { applauded } }),
      invalidatesTags: (_, error, { id }) => error ? [] : [
        { type: 'Challenge', id }, { type: 'Challenge', id: 'FEED' },
      ],
    }),
    addProof: builder.mutation<Challenge, { id: string; imageUrl: string }>({
      query: ({ id, imageUrl }) => ({ url: `/challenges/${id}/proof`, method: 'POST', body: { imageUrl } }),
      invalidatesTags: (_, error, { id }) => error ? [] : [{ type: 'Challenge', id }],
    }),
    getChallenges: builder.query<Challenge[], ChallengeListParams | void>({
      query: (params) => ({
        url: '/challenges',
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Challenge' as const, id })),
              { type: 'Challenge', id: 'LIST' },
            ]
          : [{ type: 'Challenge', id: 'LIST' }],
    }),
    getChallenge: builder.query<Challenge, string>({
      query: (id) => `/challenges/${id}`,
      providesTags: (_, __, id) => [{ type: 'Challenge', id }],
    }),
    createChallenge: builder.mutation<Challenge, ChallengeRequest>({
      query: (body) => ({
        url: '/challenges',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Challenge', id: 'LIST' }, { type: 'Challenge', id: 'FEED' }],
    }),
    updateChallenge: builder.mutation<
      Challenge,
      { id: string; body: ChallengeRequest }
    >({
      query: ({ id, body }) => ({
        url: `/challenges/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Challenge', id },
        { type: 'Challenge', id: 'LIST' },
        { type: 'Challenge', id: 'FEED' },
      ],
    }),
    deleteChallenge: builder.mutation<void, string>({
      query: (id) => ({
        url: `/challenges/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_, __, id) => [
        { type: 'Challenge', id },
        { type: 'Challenge', id: 'LIST' },
        { type: 'Challenge', id: 'FEED' },
      ],
    }),
  }),
});

export const {
  useGetChallengeFeedQuery, useSetApplauseMutation, useAddProofMutation,
  useGetChallengesQuery,
  useGetChallengeQuery,
  useCreateChallengeMutation,
  useUpdateChallengeMutation,
  useDeleteChallengeMutation,
} = challengeApi;
