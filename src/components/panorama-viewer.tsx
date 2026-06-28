import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import type { VirtualTour } from '@/types/tour';

type Props = {
  tour: VirtualTour;
  /** Fired with the scene title whenever the visitor moves to a new room. */
  onSceneChange?: (title: string) => void;
};

/**
 * Builds a self-contained HTML document that renders a Pannellum 360° tour.
 * Pannellum is loaded from cdnjs; the tour config is injected as JSON. Scene
 * changes post a message back to React Native so the native overlay can show
 * the current room title.
 */
function buildHtml(tour: VirtualTour): string {
  const scenes: Record<string, unknown> = {};
  for (const scene of tour.scenes) {
    scenes[scene.id] = {
      type: 'equirectangular',
      panorama: scene.panorama,
      yaw: scene.initialYaw ?? 0,
      hotSpots: (scene.hotspots ?? []).map(h => ({
        pitch: h.pitch,
        yaw: h.yaw,
        type: 'scene',
        text: h.label,
        sceneId: h.targetSceneId,
      })),
    };
  }

  const config = {
    default: {
      firstScene: tour.firstSceneId,
      sceneFadeDuration: 1000,
      autoLoad: true,
      showControls: true,
      compass: false,
    },
    scenes,
  };

  const titlesById = Object.fromEntries(tour.scenes.map(s => [s.id, s.title]));

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/pannellum/2.5.6/pannellum.css" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/pannellum/2.5.6/pannellum.js"></script>
<style>
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
  #panorama { width: 100vw; height: 100vh; }
  .pnlm-load-box { display: none; }
</style>
</head>
<body>
<div id="panorama"></div>
<script>
  var TITLES = ${JSON.stringify(titlesById)};
  function post(payload) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    }
  }
  try {
    var viewer = pannellum.viewer('panorama', ${JSON.stringify(config)});
    viewer.on('load', function () {
      post({ type: 'ready' });
      post({ type: 'scene', title: TITLES[viewer.getScene()] || '' });
    });
    viewer.on('scenechange', function (id) {
      post({ type: 'scene', title: TITLES[id] || '' });
    });
    viewer.on('error', function (e) { post({ type: 'error', message: String(e) }); });
  } catch (e) {
    post({ type: 'error', message: String(e) });
  }
</script>
</body>
</html>`;
}

export function PanoramaViewer({ tour, onSceneChange }: Props) {
  const html = useMemo(() => buildHtml(tour), [tour]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const onSceneChangeRef = useRef(onSceneChange);
  onSceneChangeRef.current = onSceneChange;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        scrollEnabled={false}
        bounces={false}
        onMessage={event => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'ready') setLoading(false);
            if (data.type === 'scene') onSceneChangeRef.current?.(data.title);
            if (data.type === 'error') {
              setLoading(false);
              setFailed(true);
            }
          } catch {
            /* ignore malformed messages */
          }
        }}
        onError={() => {
          setLoading(false);
          setFailed(true);
        }}
      />

      {loading && !failed && (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator color="#fff" size="large" />
          <ThemedText style={styles.overlayText}>Loading 360° view…</ThemedText>
        </View>
      )}

      {failed && (
        <View style={styles.overlay}>
          <ThemedText style={styles.overlayText}>
            Couldn&apos;t load the panorama. Check your connection and try again.
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: '#000' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#000',
    paddingHorizontal: 32,
  },
  overlayText: { color: '#fff', fontSize: 14, textAlign: 'center' },
});
