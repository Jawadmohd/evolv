import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../../app/navigation/RootNavigator';
import { useAppSelector } from '../../../shared/store/hooks';
import { useGetUserQuery, useUpdateAccountMutation, useUpdateUserMutation } from '../services/userApi';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const authUser = useAppSelector((state) => state.auth.user);
  const { data: user, isLoading } = useGetUserQuery(authUser?.id ?? '', {
    skip: !authUser?.id,
  });
  const [updateUser, { isLoading: isSaving }] = useUpdateUserMutation();

  const [updateAccount, { isLoading: savingAccount }] = useUpdateAccountMutation();
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [accountMessage, setAccountMessage] = useState('');

  async function saveAccount() {
    setAccountMessage('');
    try {
      await updateAccount({
        username: newUsername.trim() || undefined,
        currentPassword: currentPassword || undefined,
        password: newPassword || undefined,
      }).unwrap();
      setNewUsername('');
      setCurrentPassword('');
      setNewPassword('');
      setAccountMessage('Account settings updated');
    } catch {
      // The API error banner reports the failure.
    }
  }

  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [profession, setProfession] = useState('');
  const [dob, setDob] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFirstname(user.firstname ?? '');
      setLastname(user.lastname ?? '');
      setProfession(user.profession ?? '');
      setDob(user.dob ?? '');
    }
  }, [user]);

  const onSave = async () => {
    if (!authUser?.id) {
      return;
    }

    try {
      setMessage(null);
      await updateUser({
        id: authUser.id,
        body: {
          firstname: firstname.trim() || undefined,
          lastname: lastname.trim() || undefined,
          profession: profession.trim() || undefined,
          dob: dob.trim() || undefined,
        },
      }).unwrap();
      setMessage('Profile updated');
    } catch {
      // API failures are shown by the global error banner
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fafafa" />
        </Pressable>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <ActivityIndicator color="#a78bfa" style={styles.loader} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.readOnly}>{user?.email ?? authUser?.email}</Text>

            <Text style={styles.label}>Username</Text>
            <Text style={styles.readOnly}>{user?.username ?? authUser?.username}</Text>

            <Text style={styles.label}>First name</Text>
            <TextInput
              style={styles.input}
              value={firstname}
              onChangeText={setFirstname}
              placeholderTextColor="#71717a"
            />

            <Text style={styles.label}>Last name</Text>
            <TextInput
              style={styles.input}
              value={lastname}
              onChangeText={setLastname}
              placeholderTextColor="#71717a"
            />

            <Text style={styles.label}>Profession</Text>
            <TextInput
              style={styles.input}
              value={profession}
              onChangeText={setProfession}
              placeholderTextColor="#71717a"
            />

            <Text style={styles.label}>Date of birth</Text>
            <TextInput
              style={styles.input}
              value={dob}
              onChangeText={setDob}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#71717a"
            />

            {message ? <Text style={styles.message}>{message}</Text> : null}

            <Pressable style={styles.primaryButton} onPress={onSave} disabled={isSaving}>
              <Text style={styles.primaryButtonText}>
                {isSaving ? 'Saving...' : 'Save profile'}
              </Text>
            </Pressable>
          </View>
          <View style={styles.card}>
            <Text style={styles.title}>Account settings</Text>
            <Text style={styles.label}>New username</Text>
            <TextInput accessibilityLabel="New username" style={styles.input} value={newUsername}
              autoCapitalize="none" autoCorrect={false} maxLength={50} onChangeText={setNewUsername} />
            <Text style={styles.label}>Current password (password accounts)</Text>
            <TextInput accessibilityLabel="Current password" style={styles.input} value={currentPassword}
              secureTextEntry onChangeText={setCurrentPassword} />
            <Text style={styles.label}>New password (optional)</Text>
            <TextInput accessibilityLabel="New password" style={styles.input} value={newPassword}
              secureTextEntry maxLength={72} onChangeText={setNewPassword} />
            {accountMessage !== '' && <Text style={styles.message}>{accountMessage}</Text>}
            <Pressable style={styles.primaryButton} onPress={saveAccount}
              disabled={savingAccount || (!newUsername.trim() && !newPassword)}>
              <Text style={styles.primaryButtonText}>{savingAccount ? 'Saving…' : 'Update account'}</Text>
            </Pressable>
          </View>
        </ScrollView>
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
    backgroundColor: '#27272a',
  },
  headerSpacer: {
    width: 36,
  },
  title: {
    color: '#fafafa',
    fontSize: 20,
    fontWeight: '700',
  },
  loader: {
    marginTop: 24,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: '#20182f',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  label: {
    color: '#a1a1aa',
    fontSize: 13,
    marginTop: 4,
  },
  readOnly: {
    color: '#fafafa',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#27272a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fafafa',
    fontSize: 15,
  },
  message: {
    color: '#86efac',
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: '#a78bfa',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#18181b',
    fontWeight: '700',
    fontSize: 15,
  },
});
