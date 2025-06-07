import { useState } from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../app/navigation/RootNavigator';
import { Action, LearningPage, styles } from '../../learning/LearningUi';
import { useGetChallengeFeedQuery, useSetApplauseMutation } from '../services/challengeApi';

export function ChallengeFeedScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Feed'>) {
  const [page, setPage] = useState(0);
  const feed = useGetChallengeFeedQuery(page);
  const [applaud, { isLoading }] = useSetApplauseMutation();

  return (
    <LearningPage title="Challenge feed" onBack={navigation.goBack}>
      {feed.isFetching && <Text style={styles.text}>Loading challenges…</Text>}
      {feed.isError && <Action label="Retry feed" onPress={feed.refetch} />}
      {feed.currentData?.items.length === 0 && <Text style={styles.text}>No challenges on this page.</Text>}
      {feed.currentData?.items.map((item) => (
        <View key={item.id} style={styles.panel}>
          <Text style={styles.heading}>{item.challenge}</Text>
          <Text style={styles.text}>{item.username} · {item.duration} · {item.completed ? 'Completed' : 'In progress'}</Text>
          <Action label={`${item.hasApplauded ? 'Remove applause' : 'Applaud'} (${item.applause})`}
            selected={item.hasApplauded} disabled={isLoading || feed.isFetching}
            onPress={() => { void applaud({ id: item.id, applauded: !item.hasApplauded }); }} />
        </View>
      ))}
      <View style={styles.row}>
        <Action label="Previous page" disabled={page === 0 || feed.isFetching} onPress={() => setPage(page - 1)} />
        <Action label="Next page" disabled={!feed.currentData?.hasNext || feed.isFetching} onPress={() => setPage(page + 1)} />
      </View>
    </LearningPage>
  );
}
