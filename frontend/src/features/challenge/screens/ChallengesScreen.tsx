import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../../app/navigation/RootNavigator';
import {
  Challenge,
  useCreateChallengeMutation,
  useAddProofMutation,
  useDeleteChallengeMutation,
  useGetChallengesQuery,
  useUpdateChallengeMutation,
} from '../services/challengeApi';

type Props = NativeStackScreenProps<RootStackParamList, 'Challenges'>;

export function ChallengesScreen({ navigation }: Props) {
  const { data: challenges = [], isLoading, isFetching, refetch } = useGetChallengesQuery();
  const [createChallenge, { isLoading: isCreating }] = useCreateChallengeMutation();
  const [updateChallenge, { isLoading: isUpdating }] = useUpdateChallengeMutation();
  const [addProof, { isLoading: addingProof }] = useAddProofMutation();
  const [proofUrl, setProofUrl] = useState('');
  const [deleteChallenge] = useDeleteChallengeMutation();

  const list = useRef<FlatList<Challenge>>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = challenges.find((item) => item.id === editingId);
  const [challengeText, setChallengeText] = useState('');
  const [duration, setDuration] = useState('30 days');
  const [published, setPublished] = useState(false);
  const [report, setReport] = useState('');
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setPublished(false);
    setChallengeText('');
    setDuration('30 days');
    setReport('');
    setProofUrl('');
    setError(null);
  };

  const edit = (item: Challenge) => {
    setEditingId(item.id);
    list.current?.scrollToOffset({ offset: 0 });
    setChallengeText(item.challenge);
    setDuration(item.duration);
    setPublished(item.published);
    setReport('');
    setProofUrl('');
    setError(null);
  };

  const save = async () => {
    if (editingId && !editing) {
      setError('This challenge is no longer available.');
      return;
    }
    if (!challengeText.trim()) {
      setError('Challenge description is required');
      return;
    }

    try {
      setError(null);
      const now = new Date();
      const localDate = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
      ].join('-');
      const body = {
        challenge: challengeText.trim(),
        duration: duration.trim() || '30 days',
        published,
        appendProgressEntry: report.trim() ? { date: localDate, report: report.trim() } : undefined,
      };
      if (editing) {
        await updateChallenge({ id: editing.id, body }).unwrap();
      } else {
        await createChallenge(body).unwrap();
      }
      resetForm();
    } catch {
      // API failures are shown by the global error banner
    }
  };

  async function attachProof() {
    if (!editingId || !proofUrl.trim()) return;
    try {
      await addProof({ id: editingId, imageUrl: proofUrl.trim() }).unwrap();
      setProofUrl('');
    } catch {
      // The API error banner reports the failure.
    }
  }

  const toggleComplete = async (challenge: Challenge) => {
    await updateChallenge({
      id: challenge.id,
      body: {
        challenge: challenge.challenge,
        duration: challenge.duration,
        completed: !challenge.completed,
      },
    });
  };

  const onDelete = async (id: string) => {
    try {
      await deleteChallenge(id).unwrap();
      if (editingId === id) resetForm();
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
        <Text style={styles.title}>Challenges</Text>
        <Pressable onPress={() => refetch()}>
          <Ionicons name="refresh" size={20} color="#a1a1aa" />
        </Pressable>
      </View>


      {isLoading ? (
        <ActivityIndicator color="#d7bbff" style={styles.loader} />
      ) : (
        <FlatList
          ref={list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.formCard}>
                    <Text style={styles.formTitle}>{editingId ? 'Edit challenge' : 'Start a challenge'}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Challenge description"
                      placeholderTextColor="#a99eb8"
                      value={challengeText}
                      onChangeText={setChallengeText}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Duration"
                      placeholderTextColor="#a99eb8"
                      value={duration}
                      onChangeText={setDuration}
                    />
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder={editingId ? 'Add a progress note (optional)' : 'Initial progress note (optional)'}
                      maxLength={2000}
                      placeholderTextColor="#a99eb8"
                      value={report}
                      onChangeText={setReport}
                      multiline
                    />
                    <View style={styles.publishRow}>
                      <Text style={styles.itemMeta}>Share title and status to the challenge feed</Text>
                      <Switch accessibilityLabel="Share to the challenge feed" value={published} onValueChange={setPublished} />
                    </View>
                    {error ? <Text style={styles.error}>{error}</Text> : null}
                    <Pressable style={styles.primaryButton} onPress={save} disabled={isCreating || isUpdating}>
                      <Text style={styles.primaryButtonText}>
                        {isCreating || isUpdating ? 'Saving…' : editingId ? 'Save changes' : 'Create challenge'}
                      </Text>
                    </Pressable>
                    {editingId && (
                      <View style={styles.history}>
                        <TextInput style={styles.input} accessibilityLabel="Proof image URL"
                          placeholder="HTTPS proof image URL" placeholderTextColor="#a99eb8"
                          autoCapitalize="none" value={proofUrl} onChangeText={setProofUrl} maxLength={2048} />
                        <Pressable accessibilityRole="button" disabled={addingProof || !proofUrl.trim()} onPress={attachProof}>
                          <Text style={styles.itemMeta}>{addingProof ? 'Attaching…' : 'Attach proof link'}</Text>
                        </Pressable>
                      </View>
                    )}
                    {editingId && (
                      <Pressable accessibilityRole="button" onPress={resetForm}>
                        <Text style={styles.itemMeta}>Cancel edit</Text>
                      </Pressable>
                    )}
                  </View>
          }
          data={challenges}
          keyExtractor={(item) => item.id}
          refreshing={isFetching}
          onRefresh={refetch}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.empty}>No challenges yet.</Text>}
          renderItem={({ item }) => (
            <View style={styles.record}>
              <View style={styles.itemCard}>
                <Pressable style={styles.itemMain} onPress={() => toggleComplete(item)}>
                  <Ionicons
                    name={item.completed ? 'trophy' : 'flag-outline'}
                    size={22}
                    color={item.completed ? '#fbbf24' : '#a99eb8'}
                  />
                  <View style={styles.itemTextWrap}>
                    <Text style={[styles.itemTitle, item.completed && styles.completed]}>
                      {item.challenge}
                    </Text>
                    <Text style={styles.itemMeta}>
                      {item.duration} · {item.applause} applause ·{' '}
                      {item.progressEntries.length} updates · {streak(item)} day streak
                    </Text>
                  </View>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Edit challenge or add progress" hitSlop={8} onPress={() => edit(item)}>
                  <Ionicons name="pencil-outline" size={20} color="#d7bbff" />
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Delete challenge" hitSlop={8} onPress={() => onDelete(item.id)}>
                  <Ionicons name="trash-outline" size={20} color="#f87171" />
                </Pressable>
              </View>
              {item.proofImageUrls.filter((url) => url.startsWith('https://')).map((url, index) => (
                <Pressable key={url} style={styles.history} accessibilityRole="link"
                  onPress={() => Linking.openURL(url).catch(() => setError('Couldn’t open the proof link.'))}>
                  <Text style={styles.itemMeta}>Open proof {index + 1}</Text>
                </Pressable>
              ))}
              {item.progressEntries.length > 0 && (
                <View style={styles.history}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: expandedId === item.id }}
                    onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  >
                    <Text style={styles.itemMeta}>{expandedId === item.id ? 'Hide progress history' : 'Show progress history'}</Text>
                  </Pressable>
                  {expandedId === item.id && item.progressEntries.map((entry, index) => (
                    <Text key={`${entry.date}-${index}`} style={styles.itemTitle}>
                      {entry.date} · {entry.report}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function streak(challenge: Challenge) {
  const dates = new Set(challenge.progressEntries.map((entry) => entry.date));
  const day = new Date();
  let total = 0;
  while (dates.has([
    day.getFullYear(),
    String(day.getMonth() + 1).padStart(2, '0'),
    String(day.getDate()).padStart(2, '0'),
  ].join('-'))) {
    total++;
    day.setDate(day.getDate() - 1);
  }
  return total;
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
  textArea: {
    minHeight: 72,
    textAlignVertical: 'top',
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
  record: { backgroundColor: '#1c1729', borderRadius: 14 },
  publishRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' },
  history: { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  itemCard: {
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
