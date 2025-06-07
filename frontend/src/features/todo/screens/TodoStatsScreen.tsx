import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../app/navigation/RootNavigator';
import { Action, LearningPage, styles } from '../../learning/LearningUi';
import { useGetTodoStatsQuery } from '../services/todoApi';

export function TodoStatsScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'TodoStats'>) {
  const stats = useGetTodoStatsQuery();
  const max = Math.max(1, ...(stats.data?.completions.map((day) => day.count) ?? []));
  return (
    <LearningPage title="Task activity" onBack={navigation.goBack}>
      {stats.isFetching && <Text style={styles.text}>Loading activity…</Text>}
      {stats.isError && <Action label="Retry activity" onPress={stats.refetch} />}
      {stats.data && (
        <>
          <View style={styles.panel}>
            <Text style={styles.heading}>{stats.data.totalCompleted} tasks completed</Text>
            <Text style={styles.text}>Completions by date (UTC)</Text>
            {stats.data.completions.length === 0 && <Text style={styles.text}>No completions yet.</Text>}
            {stats.data.completions.map((day) => (
              <View key={day.date} accessible accessibilityLabel={`${day.date}, ${day.count} completed`}>
                <Text style={styles.text}>{day.date} · {day.count}</Text>
                <View style={{ backgroundColor: '#392c4a', height: 6, borderRadius: 3 }}>
                  <View style={{ width: `${100 * day.count / max}%`, height: 6, backgroundColor: '#d7bbff', borderRadius: 3 }} />
                </View>
              </View>
            ))}
          </View>
          <View style={styles.panel}>
            <Text style={styles.heading}>Deadline dates (UTC)</Text>
            {stats.data.deadlines.length === 0 && <Text style={styles.text}>No deadlines set.</Text>}
            {stats.data.deadlines.map((date) => <Text key={date} style={styles.text}>{date}</Text>)}
          </View>
        </>
      )}
    </LearningPage>
  );
}
