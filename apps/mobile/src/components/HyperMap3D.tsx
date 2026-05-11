import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';
import type { ZoneWithStatus } from '@grmap/shared/types';
import { assignHyperMapSlots } from './hyperMap3d/layout';
import { HYPER_MAP_SCENE_SCRIPT } from './hyperMap3d/sceneScript';

type Props = {
  zones: ZoneWithStatus[];
  selectedZoneId: string | null;
  onZoneTap: (zoneId: string) => void;
};

function buildHyperMapDocument(): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"/><style>html,body{margin:0;padding:0;width:100%;height:100%;min-height:100%;min-width:100%;touch-action:manipulation;overflow:hidden;background:#252830;position:fixed;inset:0;}canvas{display:block;width:100%!important;height:100%!important;}</style></head><body><script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script><script>${HYPER_MAP_SCENE_SCRIPT}
(function(){
  if (typeof THREE === 'undefined') return;
  var tries = 0;
  function boot(){
    var w = window.innerWidth || document.documentElement.clientWidth || 0;
    var h = window.innerHeight || document.documentElement.clientHeight || 0;
    if ((w < 40 || h < 40) && tries++ < 150) { requestAnimationFrame(boot); return; }
    if (window.__hyperMapBooted) return;
    window.__hyperMapBooted = true;
    try {
      if (window.__hyperMapInit) window.__hyperMapInit();
    } catch (e) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'hyperMapError', message: String(e && e.message || e) }));
      }
    }
  }
  requestAnimationFrame(boot);
})();
</script></body></html>`;
}

type ZonePayload = {
  id: string;
  shortName: string;
  name: string;
  type: ZoneWithStatus['type'];
  congestionLevel: ZoneWithStatus['congestionLevel'];
  mapX: number;
  mapZ: number;
};

export function HyperMap3D({ zones, selectedZoneId, onZoneTap }: Props) {
  const ref = useRef<WebView>(null);
  const html = useMemo(() => buildHyperMapDocument(), []);

  const payload = useMemo(() => {
    const slots = assignHyperMapSlots(zones);
    const z: ZonePayload[] = slots.map((s) => ({
      id: s.id,
      shortName: s.shortName,
      name: s.name,
      type: s.type,
      congestionLevel: s.congestionLevel,
      mapX: s.mapX,
      mapZ: s.mapZ,
    }));
    return { zones: z, selectedId: selectedZoneId };
  }, [zones, selectedZoneId]);

  const pushZones = useCallback(() => {
    const js = `(function(){try{if(window.__hyperMapSetZones){window.__hyperMapSetZones(${JSON.stringify(payload)});}}catch(e){}})();true;`;
    ref.current?.injectJavaScript(js);
  }, [payload]);

  useEffect(() => {
    pushZones();
  }, [pushZones]);

  return (
    <View style={styles.wrap}>
      <WebView
        ref={ref}
        style={styles.web}
        containerStyle={styles.webContainer}
        source={{ html, baseUrl: 'https://cdnjs.cloudflare.com/' }}
        originWhitelist={['*']}
        onLoadEnd={() => {
          pushZones();
          setTimeout(pushZones, 80);
          setTimeout(pushZones, 400);
        }}
        onMessage={(ev) => {
          try {
            const msg = JSON.parse(ev.nativeEvent.data) as { type?: string; zoneId?: string; message?: string };
            if (msg.type === 'zoneTap' && msg.zoneId) onZoneTap(msg.zoneId);
          } catch {
            /* ignore */
          }
        }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        scrollEnabled={false}
        bounces={false}
        setSupportMultipleWindows={false}
        nestedScrollEnabled={false}
        overScrollMode="never"
        allowsInlineMediaPlayback
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#252830',
    zIndex: 0,
  },
  webContainer: { flex: 1, width: '100%', height: '100%', backgroundColor: '#252830' },
  web: { flex: 1, width: '100%', height: '100%', backgroundColor: '#252830', opacity: 0.999 },
});
