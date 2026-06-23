import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, title, description, actionLabel, onAction }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: theme.secondary }]}>
          <SymbolView name={icon as any} size={32} tintColor={theme.mutedForeground} />
        </View>
      ) : null}

      <View style={styles.text}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        {description ? (
          <ThemedText themeColor="textSecondary" style={styles.desc}>
            {description}
          </ThemedText>
        ) : null}
      </View>

      {actionLabel && onAction ? (
        <AppButton
          label={actionLabel}
          onPress={onAction}
          variant="outline"
          size="sm"
          fullWidth={false}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.five,
    gap: Spacing.three,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { alignItems: 'center', gap: Spacing.one },
  title: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
  desc: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
