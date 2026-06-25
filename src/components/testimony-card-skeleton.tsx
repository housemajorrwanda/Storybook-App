import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui/skeleton';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = { featured?: boolean };

export function TestimonyCardSkeleton({ featured = false }: Props) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card }]}>
      {/* Image placeholder */}
      <Skeleton height={featured ? 220 : 180} borderRadius={0} />

      {/* Content */}
      <View style={styles.content}>
        {/* Badge + date row */}
        <View style={styles.row}>
          <Skeleton width={64} height={22} borderRadius={20} />
          <Skeleton width={72} height={14} borderRadius={6} />
        </View>

        {/* Title */}
        <Skeleton width="85%" height={18} borderRadius={6} />
        {featured && <Skeleton width="60%" height={18} borderRadius={6} />}

        {/* Excerpt */}
        <Skeleton width="100%" height={14} borderRadius={6} />
        <Skeleton width="75%" height={14} borderRadius={6} />

        {/* Footer */}
        <View style={styles.row}>
          <Skeleton width={20} height={20} borderRadius={10} />
          <Skeleton width={80} height={13} borderRadius={6} />
          <View style={styles.rowRight}>
            <Skeleton width={56} height={13} borderRadius={6} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: Spacing.three,
  },
  content: { padding: Spacing.three, gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  rowRight: { marginLeft: 'auto' },
});
