import { setUser } from '../../auth/store/authSlice';
import { api } from '../../../shared/services/api';

export type User = {
  id: string;
  email: string;
  firstname: string | null;
  lastname: string | null;
  username: string;
  profession: string | null;
  dob: string | null;
  role: string;
  createdAt: string;
};

export type UserCreateRequest = {
  email: string;
  username: string;
  password: string;
  firstname?: string;
  lastname?: string;
  profession?: string;
  dob?: string;
};

export type UserUpdateRequest = {
  firstname?: string;
  lastname?: string;
  profession?: string;
  dob?: string;
  password?: string;
};

export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => '/users',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'User' as const, id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),
    getUser: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_, __, id) => [{ type: 'User', id }],
    }),
    createUser: builder.mutation<User, UserCreateRequest>({
      query: (body) => ({
        url: '/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),
    updateUser: builder.mutation<User, { id: string; body: UserUpdateRequest }>({
      query: ({ id, body }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
        'Auth',
      ],
    }),
    updateAccount: builder.mutation<User, { currentPassword?: string; username?: string; password?: string }>({
      query: (body) => ({ url: '/users/me/account', method: 'PUT', body }),
      invalidatesTags: (_, error) => error ? [] : ['User', 'Todo', 'Challenge', 'QuizRank'],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setUser(data));
        } catch {
          // The API error banner reports the failure.
        }
      },
    }),
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_, __, id) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useUpdateAccountMutation,
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = userApi;
