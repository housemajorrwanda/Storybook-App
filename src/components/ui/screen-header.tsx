import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Action = { icon: string; onPress: () => void; label?: string };

type Props = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: Action;
  border?: boolean;
};

export function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  border = true,
}: Props) {
  const theme = useTheme();
  const router = useRouter();

  function handleBack() {
    if (onBack) onBack();
    else router.back();
  }

  return (
    <ThemedView
      style={[
        styles.header,
        border && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
      ]}>
      {/* Left */}
      <View style={styles.side}>
        {showBack && (
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
            hitSlop={8}>
            <SymbolView name="chevron.left" size={18} tintColor={theme.foreground} />
          </Pressable>
        )}
      </View>

      {/* Center */}
      <View style={styles.center}>
        <ThemedText style={styles.title} numberOfLines={1}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText themeColor="textSecondary" style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>

      {/* Right */}
      <View style={styles.side}>
        {rightAction && (
          <Pressable
            onPress={rightAction.onPress}
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
            hitSlop={8}>
            <SymbolView name={rightAction.icon as any} size={18} tintColor={theme.foreground} />
          </Pressable>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    gap: Spacing.two,
  },
  side: { width: 40, alignItems: 'center' },
  center: { flex: 1, alignItems: 'center', gap: 2 },
  title: { fontSize: 16, fontWeight: '600' },
  subtitle: { fontSize: 12 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
