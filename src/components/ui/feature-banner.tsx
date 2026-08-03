import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { IconName } from './app-input';

type Props = {
  icon: IconName;
  title: string;
  description: string;
  onPress: () => void;
  /** Stagger, in ms, when several banners animate in together. */
  delay?: number;
};

/**
 * Tappable entry point to a top-level feature.
 *
 * Every colour comes from the theme, so the banner inverts correctly in light
 * mode instead of staying a dark slab. Surface, border and text are the same
 * tokens the cards use, which keeps the whole app on one visual system.
 */
export function FeatureBanner({ icon, title, description, onPress, delay = 0 }: Props) {
  const theme = useTheme();

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)}>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          onPress();
        }}
        style={({ pressed }) => [
          styles.banner,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}>
        <View style={[styles.icon, { backgroundColor: theme.backgroundElement }]}>
          <Feather name={icon} size={22} color={theme.foreground} />
        </View>

        <View style={styles.body}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.desc}>
            {description}
          </ThemedText>
        </View>

        <Feather name="chevron-right" size={18} color={theme.mutedForeground} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: '600' },
  desc: { fontSize: 12, lineHeight: 16 },
});
