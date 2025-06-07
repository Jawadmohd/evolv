import { useEffect, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { fetch } from 'expo/fetch';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../app/navigation/RootNavigator';
import { apiUrl } from '../../shared/config/apiUrl';
import { useAppSelector } from '../../shared/store/hooks';
import { Action, LearningPage, styles } from './LearningUi';

type Turn = { question: string; reply: string; error?: string };

export function ChatScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Chat'>) {
  const token = useAppSelector((state) => state.auth.accessToken);
  const active = useRef<AbortController | null>(null);
  const [draft, setDraft] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => () => active.current?.abort(), []);

  function updateLast(update: Partial<Turn>) {
    setTurns((previous) => previous.map((turn, index) =>
      index === previous.length - 1 ? { ...turn, ...update } : turn));
  }

  async function send() {
    const question = draft.trim();
    if (!question || active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setDraft('');
    setTurns((previous) => [...previous.slice(-19), { question, reply: '' }]);
    try {
      const response = await fetch(`${apiUrl}/learning/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: question }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        throw new Error(response.status === 401
          ? 'Your session expired. Return to the dashboard and try again.'
          : 'The assistant is unavailable. Try again in a moment.');
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let reply = '';
      let finished = false;

      const append = (line: string) => {
        if (!line.trim()) return;
        const part: { response?: string; done?: boolean; error?: string } = JSON.parse(line);
        if (part.error) throw new Error('The assistant couldn’t finish this reply.');
        reply += part.response ?? '';
        finished ||= part.done === true;
      };

      try {
        for (;;) {
          const { done, value } = await reader.read();
          buffer += decoder.decode(value, { stream: !done });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          lines.forEach(append);
          if (done) append(buffer);
          updateLast({ reply });
          if (done || finished) break;
        }
        if (!finished) throw new Error('The connection ended before the reply finished.');
      } finally {
        await reader.cancel().catch(() => undefined);
        reader.releaseLock();
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        updateLast({ error: error instanceof Error ? error.message : 'Couldn’t load a reply.' });
      }
    } finally {
      active.current = null;
      setBusy(false);
    }
  }

  function stop() {
    active.current?.abort();
    updateLast({ error: 'Reply stopped.' });
  }

  return (
    <LearningPage title="Study assistant" onBack={navigation.goBack}>
      {turns.map((turn, index) => (
        <View key={index} style={styles.panel}>
          <Text style={styles.heading}>{turn.question}</Text>
          {turn.reply !== '' && <Text selectable style={styles.text}>{turn.reply}</Text>}
          {turn.error && <Text style={styles.error}>{turn.error}</Text>}
        </View>
      ))}
      <View style={styles.panel}>
        <TextInput
          accessibilityLabel="Study question"
          placeholder="Ask a study question"
          placeholderTextColor="#b0a6bf"
          multiline
          maxLength={2000}
          value={draft}
          onChangeText={setDraft}
          style={styles.input}
        />
        {busy
          ? <Action label="Stop reply" onPress={stop} />
          : <Action label="Send" selected disabled={!draft.trim()} onPress={send} />}
      </View>
    </LearningPage>
  );
}
