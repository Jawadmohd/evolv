import { api } from '../../../shared/services/api';

export type Todo = {
  id: string;
  username: string;
  title: string;
  period: string;
  tags: string[];
  deadline: string | null;
  completed: boolean;
  completedAt: string | null;
};

export type TodoRequest = {
  title: string;
  period: string;
  tags?: string[];
  deadline?: string | null;
  completed?: boolean;
};

export type TodoListParams = {
  username?: string;
  completed?: boolean;
  tag?: string;
};

export type TodoStats = {
  totalCompleted: number;
  completions: { date: string; count: number }[];
  deadlines: string[];
};

export const todoApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTodoStats: builder.query<TodoStats, void>({
      query: () => '/todos/stats',
      providesTags: [{ type: 'Todo', id: 'STATS' }],
    }),
    getTodos: builder.query<Todo[], TodoListParams | void>({
      query: (params) => ({
        url: '/todos',
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Todo' as const, id })),
              { type: 'Todo', id: 'LIST' },
            ]
          : [{ type: 'Todo', id: 'LIST' }],
    }),
    getTodo: builder.query<Todo, string>({
      query: (id) => `/todos/${id}`,
      providesTags: (_, __, id) => [{ type: 'Todo', id }],
    }),
    createTodo: builder.mutation<Todo, TodoRequest>({
      query: (body) => ({
        url: '/todos',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Todo', id: 'LIST' }, { type: 'Todo', id: 'STATS' }],
    }),
    updateTodo: builder.mutation<Todo, { id: string; body: TodoRequest }>({
      query: ({ id, body }) => ({
        url: `/todos/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Todo', id },
        { type: 'Todo', id: 'LIST' },
        { type: 'Todo', id: 'STATS' },
      ],
    }),
    deleteTodo: builder.mutation<void, string>({
      query: (id) => ({
        url: `/todos/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_, __, id) => [
        { type: 'Todo', id },
        { type: 'Todo', id: 'LIST' },
        { type: 'Todo', id: 'STATS' },
      ],
    }),
  }),
});

export const {
  useGetTodoStatsQuery,
  useGetTodosQuery,
  useGetTodoQuery,
  useCreateTodoMutation,
  useUpdateTodoMutation,
  useDeleteTodoMutation,
} = todoApi;
