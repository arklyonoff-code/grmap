import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import WebView from 'react-native-webview';
import type { ForkliftFloorId } from '@grmap/shared/constants/forkliftAnchors';
import type { ZoneWithStatus } from '@grmap/shared/types';
import { buildForkliftMapDocument } from './forkliftMap3d/document';

type Props = {
  zones: ZoneWithStatus[];
  onZoneTap: (zoneId: string) => void;
};

type ForkliftMapConfigPayload = {
  reportsByZoneId: Record<string, ZoneWithStatus['latestReport']>;
};

export function ForkliftMapWebView({ zones, onZoneTap }: Props) {
  const ref = useRef<WebView>(null);
  const html = useMemo(() => buildForkliftMapDocument(), []);
  const [floor, setFloor] = useState<ForkliftFloorId>('ground');

  const config = useMemo<ForkliftMapConfigPayload>(() => {
    const reportsByZoneId: Record<string, ZoneWithStatus['latestReport']> = {};
    zones.forEach((z) => {
      reportsByZoneId[z.id] = z.latestReport;
    });
    return { reportsByZoneId };
  }, [zones]);

  const pushConfig = useCallback(() => {
    const js = `(function(){try{var cfg=${JSON.stringify(config)};if(window.__forkliftMapApplyConfig){window.__forkliftMapApplyConfig(cfg);}else{window.__pendingForkliftMapConfig=cfg;}}catch(e){}})();true;`;
    ref.current?.injectJavaScript(js);
  }, [config]);

  const pushFloor = useCallback((next: ForkliftFloorId) => {
    const escaped = JSON.stringify(next);
    const js = `(function(){try{if(window.__forkliftMapSetFloor){window.__forkliftMapSetFloor(${escaped});}}catch(e){}})();true;`;
    ref.current?.injectJavaScript(js);
  }, []);

  useEffect(() => {
    pushConfig();
  }, [pushConfig]);

  useEffect(() => {
    pushFloor(floor);
  }, [floor, pushFloor]);

  return (
    <View style={styles.wrap}>
      <WebView
        ref={ref}
        style={styles.web}
        containerStyle={styles.webContainer}
        source={{ html, baseUrl: 'https://cdnjs.cloudflare.com/' }}
        originWhitelist={['*']}
        onLoadEnd={() => {
          pushConfig();
          setTimeout(pushConfig, 80);
          setTimeout(pushConfig, 400);
          pushFloor(floor);
        }}
        onMessage={(ev) => {
          try {
            const msg = JSON.parse(ev.nativeEvent.data) as { type?: string; zoneId?: string };
            if (msg.type === 'forkliftZoneTap' && msg.zoneId) onZoneTap(msg.zoneId);
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

      <View style={styles.floorBar} pointerEvents="box-none">
        <Pressable
          style={[styles.floorBtn, floor === 'ground' ? styles.floorBtnActive : null]}
          onPress={() => setFloor('ground')}
        >
          <Text style={[styles.floorBtnText, floor === 'ground' ? styles.floorBtnTextActive : null]}>지상</Text>
        </Pressable>
        <Pressable
          style={[styles.floorBtn, floor === 'b1' ? styles.floorBtnActive : null]}
          onPress={() => setFloor('b1')}
        >
          <Text style={[styles.floorBtnText, floor === 'b1' ? styles.floorBtnTextActive : null]}>지하1</Text>
        </Pressable>
        <Pressable
          style={[styles.floorBtn, floor === 'b2' ? styles.floorBtnActive : null]}
          onPress={() => setFloor('b2')}
        >
          <Text style={[styles.floorBtnText, floor === 'b2' ? styles.floorBtnTextActive : null]}>지하2</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a2e',
    zIndex: 0,
  },
  webContainer: { flex: 1, width: '100%', height: '100%', backgroundColor: '#1a1a2e' },
  web: { flex: 1, width: '100%', height: '100%', backgroundColor: '#1a1a2e', opacity: 0.999 },
  floorBar: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    zIndex: 2,
  },
  floorBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(20,20,20,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  floorBtnActive: {
    backgroundColor: '#ffffff',
    borderColor: '#dfe6e9',
  },
  floorBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f5f6fa',
  },
  floorBtnTextActive: {
    color: '#111111',
  },
});
