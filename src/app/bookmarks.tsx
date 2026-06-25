import { useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/ui/empty-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { TestimonyCard } from "@/components/testimony-card";
import { TestimonyCardSkeleton } from "@/components/testimony-card-skeleton";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { testimonyService } from "@/services/testimony.service";
import type { Testimony } from "@/types/testimony";

export default function BookmarksScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [bookmarks, setBookmarks] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const data = await testimonyService.getBookmarks();
      setBookmarks(data);
    } catch {
      /* keep empty */
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Bookmarks" showBack />

      {loading ? (
        <View style={[styles.list]}>
          {[0, 1, 2].map((i) => (
            <TestimonyCardSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={(t) => String(t.id)}
          renderItem={({ item }) => <TestimonyCard testimony={item} />}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + Spacing.six },
          ]}
          ListEmptyComponent={
            <EmptyState
              icon="bookmark"
              title="No bookmarks yet"
              description="Bookmark testimonies from the detail screen to save them here."
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={theme.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: Spacing.three },
});
