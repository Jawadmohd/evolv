import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import type { RootStackParamList } from '../../../app/navigation/RootNavigator';
import { parseApiError } from '../../../shared/errors/parseApiError';
import { completeAuthSession } from '../authSession';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn';
import { useRegisterMutation } from '../services/authApi';

const registerSchema = z
  .object({
    email: z.email('Enter a valid email'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username is too long'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type RegisterForm = z.infer<typeof registerSchema>;
type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const [register, { isLoading }] = useRegisterMutation();
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
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async ({ confirmPassword: _confirmPassword, ...values }) => {
    try {
      setServerError(null);
      const response = await register(values).unwrap();
      const sessionReady = await completeAuthSession(response);
      if (!sessionReady) {
        setServerError('Account created, but failed to load your profile.');
      }
    } catch (error) {
      setServerError(parseApiError(error, 'Unable to create account. Please try again.'));
    }
  });

  const displayError = serverError ?? googleError;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>New Evolv</Text>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>
          This shell is ready for auth, tasks, challenges, and AI modules.
        </Text>
      </View>

      <View style={styles.card}>
        <FormField control={control} name="email" label="Email" placeholder="you@example.com" error={errors.email?.message} />
        <FormField control={control} name="username" label="Username" placeholder="jawad" error={errors.username?.message} />
        <FormField control={control} name="password" label="Password" placeholder="Choose password" error={errors.password?.message} secureTextEntry />
        <FormField control={control} name="confirmPassword" label="Confirm password" placeholder="Repeat password" error={errors.confirmPassword?.message} secureTextEntry />

        {displayError ? <Text style={styles.errorText}>{displayError}</Text> : null}

        <Pressable
          style={styles.primaryButton}
          onPress={onSubmit}
          disabled={isLoading || googleLoading}
        >
          <Text style={styles.primaryButtonText}>
            {isLoading ? 'Creating account...' : 'Create account'}
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

        <Pressable onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Already have an account? Sign in</Text>
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
  control: ReturnType<typeof useForm<RegisterForm>>['control'];
  name: keyof RegisterForm;
};

function FormField({ label, error, placeholder, secureTextEntry, control, name }: FieldProps) {
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
            autoCapitalize="none"
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
    color: '#34d399',
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
    backgroundColor: '#34d399',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#022c22',
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
    color: '#6ee7b7',
    textAlign: 'center',
    fontWeight: '600',
  },
});
