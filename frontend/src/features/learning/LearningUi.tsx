import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export function LearningPage({ title, onBack, children }: {
  title: string; onBack: () => void; children: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" style={styles.back} onPress={onBack}>
            <Ionicons name="arrow-back" size={23} color="#f8f1ff" />
          </Pressable>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Action({ label, onPress, disabled, selected }: {
  label: string; onPress: () => void; disabled?: boolean; selected?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.action, selected && styles.selected, disabled && styles.disabled]}
    >
      <Text style={[styles.actionText, selected && styles.selectedText]}>{label}</Text>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#100d19' },
  content: { padding: 20, paddingBottom: 40, gap: 16, alignSelf: 'center', width: '100%', maxWidth: 720 },
  header: { gap: 14, flexDirection: 'row', alignItems: 'center' },
  title: { color: '#f8f1ff', fontSize: 30, fontWeight: '800', flexShrink: 1 },
  back: { padding: 10, borderRadius: 16, backgroundColor: '#2b233a' },
  panel: { backgroundColor: '#20182f', padding: 16, borderRadius: 18, gap: 10 },
  heading: { color: '#f8f1ff', fontSize: 18, fontWeight: '700' },
  text: { color: '#c9bed7', fontSize: 15, lineHeight: 22 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  action: { backgroundColor: '#38294e', borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14 },
  actionText: { color: '#f8f1ff', fontSize: 15, fontWeight: '600' },
  selected: { backgroundColor: '#d7bbff' },
  selectedText: { color: '#231535' },
  disabled: { opacity: 0.45 },
  input: { backgroundColor: '#2b233a', color: '#fff', padding: 12, borderRadius: 12, fontSize: 16 },
  error: { color: '#ffacb9', fontSize: 15 },
});
