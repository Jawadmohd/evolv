import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from '../../features/auth/screens/LoginScreen';
import { RegisterScreen } from '../../features/auth/screens/RegisterScreen';
import { ChallengesScreen } from '../../features/challenge/screens/ChallengesScreen';
import { HomeScreen } from '../../features/home/screens/HomeScreen';
import { TodosScreen } from '../../features/todo/screens/TodosScreen';
import { ProfileScreen } from '../../features/user/screens/ProfileScreen';
import { useAppSelector } from '../../shared/store/hooks';

import { ChatScreen } from '../../features/learning/ChatScreen';
import { LearnScreen } from '../../features/learning/LearnScreen';
import { ChallengeFeedScreen } from '../../features/challenge/screens/ChallengeFeedScreen';
import { TodoStatsScreen } from '../../features/todo/screens/TodoStatsScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Todos: undefined;
  Challenges: undefined;
  Profile: undefined;
  Learn: undefined;
  Chat: undefined;
  Feed: undefined;
  TodoStats: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, isHydrated } = useAppSelector((state) => state.auth);

  if (!isHydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Todos" component={TodosScreen} />
          <Stack.Screen name="Challenges" component={ChallengesScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Learn" component={LearnScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Feed" component={ChallengeFeedScreen} />
          <Stack.Screen name="TodoStats" component={TodoStatsScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09090b',
  },
});
