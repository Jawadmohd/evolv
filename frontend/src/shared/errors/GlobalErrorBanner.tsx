import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearError } from './errorSlice';

const AUTO_DISMISS_MS = 4500;

export function GlobalErrorBanner() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const current = useAppSelector((state) => state.error.current);

  useEffect(() => {
    if (!current) {
      return;
    }

    const timer = setTimeout(() => {
      dispatch(clearError());
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
  }, [current, dispatch]);

  if (!current) {
    return null;
  }

  return (
    <View style={[styles.wrapper, { top: insets.top + 8 }]} pointerEvents="box-none">
      <View style={styles.banner}>
        <Ionicons name="alert-circle" size={20} color="#fecaca" />
        <Text style={styles.message} numberOfLines={3}>
          {current.message}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss error"
          onPress={() => dispatch(clearError())}
          hitSlop={8}
        >
          <Ionicons name="close" size={18} color="#fecaca" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#7f1d1d',
    borderColor: '#991b1b',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  message: {
    flex: 1,
    color: '#fecaca',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
});
