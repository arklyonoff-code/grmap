import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { Marker } from 'react-native-maps';
import { Colors } from '../constants/colors';
import { ZoneWithStatus } from '@grmap/shared/types';

interface Props {
  zone: ZoneWithStatus;
  isSelected: boolean;
  onPress: () => void;
}

function getZoneShortName(name: string): string {
  return name.replace('동', '');
}

function getStatusColor(level: ZoneWithStatus['congestionLevel']) {
  if (level === 'green') return Colors.status.clear;
  if (level === 'yellow') return Colors.status.caution;
  if (level === 'red') return Colors.status.congested;
  return Colors.status.unknown;
}

export function ZoneMarker({ zone, isSelected, onPress }: Props) {
  const scale = useRef(new Animated.Value(isSelected ? 1.15 : 1)).current;

  useEffect(() => {
    Animated.timing(scale, {
      toValue: isSelected ? 1.15 : 1,
      duration: 150,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [isSelected, scale]);

  return (
    <Marker
      coordinate={{ latitude: zone.lat, longitude: zone.lng }}
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <Animated.View
        style={[
          styles.marker,
          {
            backgroundColor: getStatusColor(zone.congestionLevel),
            borderWidth: isSelected ? 3 : 0,
            opacity: isSelected ? 1 : 0.85,
            transform: [{ scale }],
          },
        ]}
      >
        <Text style={styles.label}>{getZoneShortName(zone.name)}</Text>
      </Animated.View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  marker: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderColor: Colors.text.inverse,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: Colors.text.inverse,
    fontSize: 13,
    fontWeight: '700',
  },
});
