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
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/><style>html,body{margin:0;touch-action:manipulation;overflow:hidden;background:#252830;}canvas{display:block;width:100%;height:100%;}</style></head><body><script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script><script>${HYPER_MAP_SCENE_SCRIPT}
if (window.THREE && window.__hyperMapInit) window.__hyperMapInit();
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
        source={{ html }}
        originWhitelist={['*']}
        onLoadEnd={pushZones}
        onMessage={(ev) => {
          try {
            const msg = JSON.parse(ev.nativeEvent.data) as { type?: string; zoneId?: string };
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
        androidLayerType="hardware"
        allowsInlineMediaPlayback
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#252830' },
  web: { flex: 1, backgroundColor: 'transparent' },
});
