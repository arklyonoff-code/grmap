import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { Colors } from '../constants/colors';
import { ZoneWithStatus } from '@grmap/shared/types';

interface Props {
  zone: ZoneWithStatus;
  isSelected: boolean;
  onPress: () => void;
}

function getStatusColor(level: ZoneWithStatus['congestionLevel']) {
  if (level === 'green') return Colors.congestion.green;
  if (level === 'yellow') return Colors.congestion.yellow;
  if (level === 'red') return Colors.congestion.red;
  return Colors.congestion.unknown;
}

function waitLine(waitLevel: NonNullable<ZoneWithStatus['latestReport']>['waitLevel']) {
  if (waitLevel === 'none') return '바로';
  if (waitLevel === 'under10') return '10분↓';
  if (waitLevel === 'under30') return '30분↓';
  return '1시간↑';
}

export function ZoneMarker({ zone, isSelected, onPress }: Props) {
  return (
    <Marker
      coordinate={{ latitude: zone.lat, longitude: zone.lng }}
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View
        style={[
          styles.marker,
          {
            backgroundColor: getStatusColor(zone.congestionLevel),
            borderWidth: isSelected ? 4 : 0,
          },
        ]}
      >
        <Text style={styles.label}>{zone.shortName}</Text>
        {zone.latestReport ? (
          <Text style={styles.waitHint}>{waitLine(zone.latestReport.waitLevel)}</Text>
        ) : null}
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  marker: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: Colors.text.inverse,
    fontSize: 15,
    fontWeight: '700',
  },
  waitHint: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    marginTop: 1,
    fontWeight: '500',
  },
});
