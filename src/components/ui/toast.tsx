import Feather from '@expo/vector-icons/Feather';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ToastType = 'success' | 'error' | 'info';

type Toast = {
  id: number;
  type: ToastType;
  message: string;
};

type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

/** Access the toast API. Must be used under `<ToastProvider>`. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const DURATION = 3200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const insets = useSafeAreaInsets();

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastType, message: string) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, type, message }]);
      setTimeout(() => dismiss(id), DURATION);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (m: string) => push('success', m),
      error: (m: string) => push('error', m),
      info: (m: string) => push('info', m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

      <View style={[styles.host, { top: insets.top + Spacing.two }]} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const ICONS: Record<ToastType, keyof typeof Feather.glyphMap> = {
  success: 'check-circle',
  error: 'alert-circle',
  info: 'info',
};

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const theme = useTheme();

  // Colour lives in the icon only. The surface stays neutral so a toast never
  // becomes a slab of red — it reads as a notification, not an alarm.
  const accent: Record<ToastType, string> = {
    success: theme.brand,
    error: theme.destructive,
    info: theme.mutedForeground,
  };

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(18)}
      exiting={FadeOutUp.duration(180)}
      layout={LinearTransition.springify().damping(20)}
      style={[styles.card, { backgroundColor: theme.popover, borderColor: theme.border }]}>
      <Pressable onPress={onDismiss} style={styles.pressable}>
        <Feather name={ICONS[toast.type]} size={18} color={accent[toast.type]} />
        <ThemedText style={styles.message} numberOfLines={3}>
          {toast.message}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
    zIndex: 9999,
  },
  card: {
    // No width — the card hugs its message and centres itself, so a short
    // string stays a compact pill instead of a full-bleed banner.
    maxWidth: '100%',
    alignSelf: 'center',
    borderRadius: 999,
    borderWidth: 1,
    // A soft shadow separates the toast from content without a heavy scrim.
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three + 2,
    paddingVertical: Spacing.two + 2,
  },
  message: { flexShrink: 1, fontSize: 14, lineHeight: 19 },
});
