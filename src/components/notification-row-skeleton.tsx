import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui/skeleton';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function NotificationRowSkeleton() {
  const theme = useTheme();

  return (
    <View style={[styles.row, { backgroundColor: theme.card }]}>
      {/* Icon */}
      <Skeleton width={40} height={40} borderRadius={12} />

      {/* Body */}
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Skeleton width="55%" height={14} borderRadius={6} />
          <Skeleton width={40} height={12} borderRadius={6} />
        </View>
        <Skeleton width="80%" height={13} borderRadius={6} />
        <Skeleton width={48} height={11} borderRadius={6} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  body: { flex: 1, gap: 6 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
