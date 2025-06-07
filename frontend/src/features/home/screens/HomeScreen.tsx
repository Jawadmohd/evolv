import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../../app/navigation/RootNavigator';
import { useAppSelector } from '../../../shared/store/hooks';
import { resetAuthState } from '../../auth/authSession';
import { useLogoutMutation } from '../../auth/services/authApi';
import { useGetChallengesQuery } from '../../challenge/services/challengeApi';
import { useGetTodosQuery } from '../../todo/services/todoApi';
import { useGetQuotesQuery } from '../../learning/learningApi';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const [logout, { isLoading }] = useLogoutMutation();
  const { refreshToken, user } = useAppSelector((state) => state.auth);
  const { data: todos, isError: todosFailed } = useGetTodosQuery();
  const { data: challenges, isError: challengesFailed } = useGetChallengesQuery();

  const { data: quotes } = useGetQuotesQuery();
  const quote = quotes?.length ? quotes[Math.floor(Date.now() / 86400000) % quotes.length] : undefined;

  const openTodos = todos?.filter((todo) => !todo.completed).length;
  const openChallenges = challenges?.filter((challenge) => !challenge.completed).length;

  const signOut = async () => {
    try {
      if (refreshToken) {
        await logout({ refreshToken }).unwrap();
      }
    } finally {
      await resetAuthState();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Text style={styles.brand}>evolv</Text>
          <Pressable accessibilityRole="button" style={styles.button} onPress={signOut} disabled={isLoading}>
            <Text style={styles.buttonText}>{isLoading ? 'Signing out…' : 'Sign out'}</Text>
          </Pressable>
        </View>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="sunny-outline" size={26} color="#171129" />
          </View>
          <Text style={styles.title}>Hello, {user?.username ?? 'there'}</Text>
          <View style={styles.statsRow}>
            <StatCard label="Open tasks" value={openTodos?.toString() ?? '—'} />
            <StatCard label="Active challenges" value={openChallenges?.toString() ?? '—'} />
          </View>
          {(todosFailed || challengesFailed) && (
            <Text style={styles.subtitle}>Some activity counts couldn’t be loaded.</Text>
          )}
        </View>

        {quote && <Text style={styles.subtitle}>{quote}</Text>}

        <View style={styles.actions}>
          <NavButton icon="book-outline" label="Learn" onPress={() => navigation.navigate('Learn')} />
          <NavButton icon="chatbubble-ellipses-outline" label="Study assistant" onPress={() => navigation.navigate('Chat')} />
          <NavButton icon="people-outline" label="Challenge feed" onPress={() => navigation.navigate('Feed')} />
          <NavButton icon="stats-chart-outline" label="Task activity" onPress={() => navigation.navigate('TodoStats')} />
          <NavButton
            icon="checkbox-outline"
            label="Tasks"
            onPress={() => navigation.navigate('Todos')}
          />
          <NavButton
            icon="flag-outline"
            label="Challenges"
            onPress={() => navigation.navigate('Challenges')}
          />
          <NavButton
            icon="person-outline"
            label="Profile"
            onPress={() => navigation.navigate('Profile')}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function NavButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" style={styles.navButton} onPress={onPress}>
      <Ionicons name={icon} size={22} color="#a78bfa" />
      <Text style={styles.navButtonText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#71717a" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#100d19',
  },
  content: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 32,
    gap: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: '#f6f1ff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1.1,
  },
  card: {
    backgroundColor: '#25183c',
    padding: 24,
    borderRadius: 24,
    gap: 16,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d7bbff',
  },
  title: {
    color: '#fafafa',
    fontSize: 34,
    letterSpacing: -0.8,
    fontWeight: '700',
  },
  subtitle: {
    color: '#a1a1aa',
    fontSize: 15,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#34244f',
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  statValue: {
    color: '#fafafa',
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    color: '#a1a1aa',
    fontSize: 13,
  },
  actions: {
    gap: 10,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1c1729',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  navButtonText: {
    flex: 1,
    color: '#fafafa',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#251d34',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#f6f1ff',
    fontWeight: '600',
    fontSize: 14,
  },
});
