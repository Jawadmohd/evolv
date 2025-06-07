import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../../app/navigation/RootNavigator';
import {
  Todo,
  useCreateTodoMutation,
  useDeleteTodoMutation,
  useGetTodosQuery,
  useUpdateTodoMutation,
} from '../services/todoApi';

type Props = NativeStackScreenProps<RootStackParamList, 'Todos'>;

export function TodosScreen({ navigation }: Props) {
  const { data: todos = [], isLoading, isFetching, refetch } = useGetTodosQuery();
  const [createTodo, { isLoading: isCreating }] = useCreateTodoMutation();
  const [updateTodo, { isLoading: isUpdating }] = useUpdateTodoMutation();
  const [deleteTodo] = useDeleteTodoMutation();

  const [editing, setEditing] = useState<Todo | null>(null);
  const [title, setTitle] = useState('');
  const [period, setPeriod] = useState('daily');
  const [tags, setTags] = useState('');
  const [deadline, setDeadline] = useState('');
  const [filter, setFilter] = useState<'All' | 'Open' | 'Completed'>('All');
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setEditing(null);
    setTitle('');
    setPeriod('daily');
    setTags('');
    setDeadline('');
    setError(null);
  };

  const edit = (todo: Todo) => {
    setEditing(todo);
    setTitle(todo.title);
    setPeriod(todo.period);
    setTags(todo.tags.join(', '));
    setDeadline(todo.deadline?.slice(0, 10) ?? '');
    setError(null);
  };

  const save = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    const day = deadline.trim();
    const timestamp = day ? new Date(`${day}T23:59:59.000Z`) : null;
    if (timestamp && (!/^\d{4}-\d{2}-\d{2}$/.test(day) ||
      Number.isNaN(timestamp.getTime()) || timestamp.toISOString().slice(0, 10) !== day)) {
      setError('Enter a real deadline in YYYY-MM-DD format.');
      return;
    }
    try {
      setError(null);
      const body = {
        title: title.trim(),
        period: period.trim() || 'daily',
        deadline: day === editing?.deadline?.slice(0, 10)
          ? editing.deadline
          : timestamp?.toISOString() ?? null,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      };
      if (editing) {
        await updateTodo({ id: editing.id, body }).unwrap();
      } else {
        await createTodo(body).unwrap();
      }
      resetForm();
    } catch {
      // API failures are shown by the global error banner
    }
  };

  const toggleComplete = async (todo: Todo) => {
    await updateTodo({
      id: todo.id,
      body: {
        title: todo.title,
        period: todo.period,
        tags: todo.tags,
        deadline: todo.deadline,
        completed: !todo.completed,
      },
    });
  };

  const onDelete = async (id: string) => {
    try {
      await deleteTodo(id).unwrap();
      if (editing?.id === id) resetForm();
    } catch {
      // API failures are shown by the global error banner.
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fafafa" />
        </Pressable>
        <Text style={styles.title}>Todos</Text>
        <Pressable onPress={() => refetch()}>
          <Ionicons name="refresh" size={20} color="#a1a1aa" />
        </Pressable>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>{editing ? 'Edit task' : 'New task'}</Text>
        <TextInput
          style={styles.input}
          placeholder="Title"
          placeholderTextColor="#a99eb8"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Period (daily, weekly...)"
          placeholderTextColor="#a99eb8"
          value={period}
          onChangeText={setPeriod}
        />
        <TextInput
          style={styles.input}
          placeholder="Tags (comma separated)"
          placeholderTextColor="#a99eb8"
          value={tags}
          onChangeText={setTags}
        />
        <TextInput
          style={styles.input}
          accessibilityLabel="Deadline"
          placeholder="Deadline (YYYY-MM-DD, optional)"
          placeholderTextColor="#a99eb8"
          value={deadline}
          onChangeText={setDeadline}
          maxLength={10}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={styles.primaryButton} onPress={save} disabled={isCreating || isUpdating}>
          <Text style={styles.primaryButtonText}>
            {isCreating || isUpdating ? 'Saving…' : editing ? 'Save changes' : 'Create task'}
          </Text>
        </Pressable>
        {editing && (
          <Pressable accessibilityRole="button" onPress={resetForm}>
            <Text style={styles.itemMeta}>Cancel edit</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.filters}>
        {(['All', 'Open', 'Completed'] as const).map((option) => (
          <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: filter === option }}
            onPress={() => setFilter(option)}>
            <Text style={[styles.itemMeta, filter === option && styles.filterActive]}>{option}</Text>
          </Pressable>
        ))}
      </View>
      {isLoading ? (
        <ActivityIndicator color="#d7bbff" style={styles.loader} />
      ) : (
        <FlatList
          data={filter === 'All' ? todos : todos.filter((todo) => todo.completed === (filter === 'Completed'))}
          keyExtractor={(item) => item.id}
          refreshing={isFetching}
          onRefresh={refetch}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.empty}>No todos yet.</Text>}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <Pressable style={styles.itemMain} onPress={() => toggleComplete(item)}>
                <Ionicons
                  name={item.completed ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={item.completed ? '#d7bbff' : '#a99eb8'}
                />
                <View style={styles.itemTextWrap}>
                  <Text style={[styles.itemTitle, item.completed && styles.completed]}>
                    {item.title}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {item.period}{item.deadline ? ` · Due ${item.deadline.slice(0, 10)}` : ''}
                    {item.tags.length > 0 ? ` · ${item.tags.join(', ')}` : ''}
                  </Text>
                </View>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Edit task" hitSlop={8} onPress={() => edit(item)}>
                <Ionicons name="pencil-outline" size={20} color="#d7bbff" />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Delete task" hitSlop={8} onPress={() => onDelete(item.id)}>
                <Ionicons name="trash-outline" size={20} color="#f87171" />
              </Pressable>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#100d19',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2b233a',
  },
  title: {
    color: '#fafafa',
    fontSize: 20,
    fontWeight: '700',
  },
  formCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#1c1729',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  formTitle: {
    color: '#fafafa',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#2b233a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fafafa',
    fontSize: 15,
  },
  error: {
    color: '#f87171',
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: '#d7bbff',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#1c1729',
    fontWeight: '700',
    fontSize: 15,
  },
  filters: { flexDirection: 'row', gap: 18, marginHorizontal: 22, marginBottom: 12 },
  filterActive: { color: '#d7bbff', fontWeight: '700' },
  loader: {
    marginTop: 24,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 10,
  },
  empty: {
    color: '#a99eb8',
    textAlign: 'center',
    marginTop: 24,
  },
  itemCard: {
    backgroundColor: '#1c1729',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemTextWrap: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    color: '#fafafa',
    fontSize: 16,
    fontWeight: '600',
  },
  completed: {
    textDecorationLine: 'line-through',
    color: '#a99eb8',
  },
  itemMeta: {
    color: '#a1a1aa',
    fontSize: 13,
  },
});
