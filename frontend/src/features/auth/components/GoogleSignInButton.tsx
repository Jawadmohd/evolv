import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

type Props = {
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function GoogleSignInButton({ loading, disabled, onPress }: Props) {
  return (
    <Pressable
      style={[styles.button, (loading || disabled) && styles.disabled]}
      onPress={onPress}
      disabled={loading || disabled}
    >
      {loading ? (
        <ActivityIndicator color="#fafafa" />
      ) : (
        <>
          <Ionicons name="logo-google" size={18} color="#fafafa" />
          <Text style={styles.text}>Continue with Google</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#27272a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3f3f46',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: '#fafafa',
    fontSize: 16,
    fontWeight: '700',
  },
});
