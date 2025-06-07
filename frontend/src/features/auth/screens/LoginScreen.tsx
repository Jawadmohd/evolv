import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import type { RootStackParamList } from '../../../app/navigation/RootNavigator';
import { parseApiError } from '../../../shared/errors/parseApiError';
import { completeAuthSession } from '../authSession';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn';
import { useLoginMutation } from '../services/authApi';

const loginSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;
type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [login, { isLoading }] = useLoginMutation();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    loading: googleLoading,
    error: googleError,
    signInWithGoogle,
  } = useGoogleSignIn();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      setServerError(null);
      const response = await login(values).unwrap();
      const sessionReady = await completeAuthSession(response);
      if (!sessionReady) {
        setServerError('Signed in, but failed to load your account.');
      }
    } catch (error) {
      setServerError(parseApiError(error, 'Unable to sign in. Check your credentials.'));
    }
  });

  const displayError = serverError ?? googleError;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Evolv</Text>
        <Text style={styles.title}>Build the scalable version</Text>
        <Text style={styles.subtitle}>
          Auth is the first finished module in the new architecture.
        </Text>
      </View>

      <View style={styles.card}>
        <FormField
          label="Email"
          error={errors.email?.message}
          control={control}
          name="email"
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <FormField
          label="Password"
          error={errors.password?.message}
          control={control}
          name="password"
          placeholder="Enter password"
          secureTextEntry
        />

        {displayError ? <Text style={styles.errorText}>{displayError}</Text> : null}

        <Pressable
          style={styles.primaryButton}
          onPress={onSubmit}
          disabled={isLoading || googleLoading}
        >
          <Ionicons name="log-in-outline" color="#18181b" size={18} />
          <Text style={styles.primaryButtonText}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
        </View>

        <GoogleSignInButton
          loading={googleLoading}
          disabled={isLoading}
          onPress={signInWithGoogle}
        />

        <Pressable onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>Need an account? Create one</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

type FieldProps = {
  label: string;
  error?: string;
  placeholder: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
  control: ReturnType<typeof useForm<LoginForm>>['control'];
  name: keyof LoginForm;
};

function FormField({
  label,
  error,
  placeholder,
  secureTextEntry,
  autoCapitalize,
  keyboardType,
  control,
  name,
}: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[styles.input, error ? styles.inputError : undefined]}
            placeholder={placeholder}
            placeholderTextColor="#71717a"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            secureTextEntry={secureTextEntry}
            autoCapitalize={autoCapitalize}
            keyboardType={keyboardType}
          />
        )}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 24,
  },
  eyebrow: {
    color: '#a78bfa',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: '#fafafa',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#a1a1aa',
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#18181b',
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    color: '#e4e4e7',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#27272a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3f3f46',
    color: '#fafafa',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: '#a78bfa',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  primaryButtonText: {
    color: '#18181b',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#3f3f46',
  },
  dividerText: {
    color: '#71717a',
    fontSize: 13,
    fontWeight: '600',
  },
  linkText: {
    color: '#c4b5fd',
    textAlign: 'center',
    fontWeight: '600',
  },
});
