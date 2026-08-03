import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import type { VirtualTour, VirtualTourHotspot } from '@/types/tour';

type Props = {
  tour: VirtualTour;
  /** Fired with the hotspot the visitor tapped. */
  onHotspotPress?: (hotspot: VirtualTourHotspot) => void;
};

/**
 * Renders a tour's 360° image with Pannellum inside a WebView.
 *
 * The API models a tour as one equirectangular image plus positioned hotspots,
 * so this is a single-scene viewer. Hotspot taps are posted back to React Native
 * rather than handled in the page, so the detail UI can be native.
 */
function buildHtml(tour: VirtualTour): string {
  const hotSpots = (tour.hotspots ?? [])
    .filter((h) => h.pitch !== null && h.yaw !== null)
    .map((h) => ({
      id: h.id,
      pitch: h.pitch,
      yaw: h.yaw,
      cssClass: 'hs',
      createTooltipFunc: null,
    }));

  const config = {
    type: 'equirectangular',
    panorama: tour.image360Url,
    autoLoad: true,
    showControls: false,
    compass: false,
  };

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
  .pnlm-load-box, .pnlm-about-msg { display: none !important; }
  /* Hotspots are sized for a fingertip, not a mouse pointer. */
  .hs {
    width: 30px; height: 30px; margin: -15px 0 0 -15px;
    border-radius: 50%; cursor: pointer;
    background: rgba(255,255,255,.94);
    border: 2px solid rgba(0,0,0,.4);
    box-shadow: 0 2px 12px rgba(0,0,0,.55);
    animation: pulse 2.4s ease-out infinite;
  }
  @keyframes pulse {
    0%   { box-shadow: 0 2px 12px rgba(0,0,0,.55), 0 0 0 0 rgba(255,255,255,.45); }
    70%  { box-shadow: 0 2px 12px rgba(0,0,0,.55), 0 0 0 14px rgba(255,255,255,0); }
    100% { box-shadow: 0 2px 12px rgba(0,0,0,.55), 0 0 0 0 rgba(255,255,255,0); }
  }
</style>
</head>
<body>
<div id="panorama"></div>
<script>
  function post(payload) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    }
  }

  var CONFIG = ${JSON.stringify(config)};
  var HOTSPOTS = ${JSON.stringify(hotSpots)};

  CONFIG.hotSpots = HOTSPOTS.map(function (h) {
    return {
      pitch: h.pitch,
      yaw: h.yaw,
      cssClass: 'hs',
      createTooltipFunc: function (div) { div.classList.add('hs'); },
      clickHandlerFunc: function () { post({ type: 'hotspot', id: h.id }); }
    };
  });

  try {
    var viewer = pannellum.viewer('panorama', CONFIG);
    viewer.on('load', function () { post({ type: 'ready' }); });
    viewer.on('error', function (e) { post({ type: 'error', message: String(e) }); });
  } catch (e) {
    post({ type: 'error', message: String(e) });
  }
</script>
</body>
</html>`;
}

export function PanoramaViewer({ tour, onHotspotPress }: Props) {
  const html = useMemo(() => buildHtml(tour), [tour]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  function handleMessage(raw: string) {
    try {
      const payload = JSON.parse(raw) as { type: string; id?: number };

      if (payload.type === 'ready') {
        setLoading(false);
        return;
      }
      if (payload.type === 'error') {
        setLoading(false);
        setFailed(true);
        return;
      }
      if (payload.type === 'hotspot' && payload.id != null) {
        const hotspot = tour.hotspots?.find((h) => h.id === payload.id);
        if (hotspot) onHotspotPress?.(hotspot);
      }
    } catch {
      // A malformed message isn't worth surfacing to the visitor.
    }
  }

  if (!tour.image360Url) {
    return (
      <View style={[styles.container, styles.center]}>
        <ThemedText style={styles.notice}>This tour has no 360° image yet.</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        onMessage={(e) => handleMessage(e.nativeEvent.data)}
        onError={() => {
          setLoading(false);
          setFailed(true);
        }}
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
      />

      {loading && !failed ? (
        <View style={[styles.overlay, styles.center]} pointerEvents="none">
          <ActivityIndicator color="#fff" />
          <ThemedText style={styles.notice}>Loading panorama…</ThemedText>
        </View>
      ) : null}

      {failed ? (
        <View style={[styles.overlay, styles.center]}>
          <ThemedText style={styles.notice}>
            Couldn&apos;t load this panorama. Check your connection and try again.
          </ThemedText>
        </View>
      ) : null}
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
    backgroundColor: '#000',
    gap: 12,
    padding: 24,
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  notice: { color: '#fff', fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
