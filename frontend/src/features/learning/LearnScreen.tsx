import { useState } from 'react';
import { Image, Linking, Pressable, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../app/navigation/RootNavigator';
import { Action, LearningPage, styles } from './LearningUi';
import {
  QuizResult, useGetInterestsQuery, useSaveInterestsMutation, useGetVideosQuery,
  useGetProfessionsQuery, useGetQuizQuery, useGetLeaderboardQuery, useSubmitQuizMutation,
} from './learningApi';

export function LearnScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Learn'>) {
  const [section, setSection] = useState<'videos' | 'quizzes'>('videos');
  return (
    <LearningPage title="Learn" onBack={navigation.goBack}>
      <View style={styles.row}>
        <Action label="Videos" selected={section === 'videos'} onPress={() => setSection('videos')} />
        <Action label="Quizzes" selected={section === 'quizzes'} onPress={() => setSection('quizzes')} />
      </View>
      {section === 'videos' ? <Videos /> : <Quizzes />}
    </LearningPage>
  );
}

function Videos() {
  const interests = useGetInterestsQuery();
  const [save, { isLoading: saving }] = useSaveInterestsMutation();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState('');
  const videos = useGetVideosQuery(undefined, { skip: !interests.data?.length });

  async function saveTopics() {
    if (draft === null) return;
    const topics = draft.split(',').map((topic) => topic.trim()).filter(Boolean);
    if (topics.length > 5 || topics.some((topic) => topic.length > 80)) {
      setError('Enter up to five topics, each 80 characters or less.');
      return;
    }
    try {
      await save(topics).unwrap();
      setDraft(null);
      setError('');
    } catch {
      setError('Interests couldn’t be saved.');
    }
  }

  return (
    <>
      <View style={styles.panel}>
        <Text accessibilityRole="header" style={styles.heading}>Your interests</Text>
        <Text style={styles.text}>Enter up to five topics, separated by commas.</Text>
        <TextInput
          accessibilityLabel="Video interests"
          style={styles.input}
          value={draft ?? interests.data?.join(', ') ?? ''}
          onChangeText={setDraft}
          maxLength={410}
          editable={interests.isSuccess && !saving}
        />
        <Action label={saving ? 'Saving…' : 'Save interests'} selected disabled={draft === null || saving} onPress={saveTopics} />
        {error !== '' && <Text style={styles.error}>{error}</Text>}
        {interests.isError && <Action label="Retry loading interests" onPress={interests.refetch} />}
      </View>
      {videos.isFetching && <Text style={styles.text}>Loading recommendations…</Text>}
      {videos.isError && <Action label="Retry recommendations" onPress={videos.refetch} />}
      {videos.isSuccess && videos.data.length === 0 && <Text style={styles.text}>No videos found for these interests.</Text>}
      {videos.currentData?.map((video) => (
        <Pressable
          key={video.id}
          accessibilityRole="link"
          style={styles.panel}
          onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${video.id}`).catch(() => setError('Couldn’t open YouTube.'))}
        >
          <Image
            source={{ uri: `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg` }}
            style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 12 }}
          />
          <Text style={styles.heading}>{video.title}</Text>
          <Text style={styles.text}>{video.channel} · {video.topic}</Text>
        </Pressable>
      ))}
    </>
  );
}

function Quizzes() {
  const professions = useGetProfessionsQuery();
  const [profession, setProfession] = useState<string>();
  return (
    <>
      <Text style={styles.heading}>Choose a profession</Text>
      <View style={styles.row}>
        {professions.data?.map((item) => (
          <Action key={item} label={item} selected={profession === item} onPress={() => setProfession(item)} />
        ))}
      </View>
      {professions.isError && <Action label="Retry quizzes" onPress={professions.refetch} />}
      {profession && <Quiz key={profession} profession={profession} />}
    </>
  );
}

function Quiz({ profession }: { profession: string }) {
  const quiz = useGetQuizQuery(profession);
  const ranks = useGetLeaderboardQuery(profession);
  const [submit, { isLoading }] = useSubmitQuizMutation();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<QuizResult>();
  const questions = quiz.currentData ?? [];

  async function grade() {
    try {
      setResult(await submit({ profession, answers: questions.map((_, index) => answers[index]) }).unwrap());
    } catch {
      // The global API error banner reports the failure.
    }
  }

  return (
    <>
      {quiz.isFetching && <Text style={styles.text}>Loading questions…</Text>}
      {quiz.isError && <Action label="Retry questions" onPress={quiz.refetch} />}
      {questions.map((question, index) => (
        <View key={question.text} style={styles.panel}>
          <Text style={styles.heading}>{question.text}</Text>
          {question.options.map((option, choice) => (
            <Action key={option} label={option} selected={answers[index] === choice} disabled={isLoading || !!result}
              onPress={() => setAnswers((previous) => ({ ...previous, [index]: choice }))} />
          ))}
          {result && (
            <Text style={styles.text}>
              {question.options[result.feedback[index].correctOption]} · {result.feedback[index].explanation}
            </Text>
          )}
        </View>
      ))}
      {result ? (
        <View style={styles.panel}>
          <Text style={styles.heading}>Score {result.score}%</Text>
          <Action label="Try again" onPress={() => { setAnswers({}); setResult(undefined); }} />
        </View>
      ) : questions.length > 0 && (
        <Action label={isLoading ? 'Submitting…' : 'Submit answers'} onPress={grade} selected
          disabled={isLoading || Object.keys(answers).length !== questions.length} />
      )}
      <View style={styles.panel}>
        <Text style={styles.heading}>Leaderboard</Text>
        {ranks.isError && <Action label="Retry leaderboard" onPress={ranks.refetch} />}
        {ranks.isSuccess && ranks.data.length === 0 && <Text style={styles.text}>No scores yet.</Text>}
        {ranks.data?.map((rank, index) => (
          <Text key={rank.username} style={styles.text}>{index + 1}. {rank.username} · {rank.score}%</Text>
        ))}
      </View>
    </>
  );
}
