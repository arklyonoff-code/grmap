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
            borderWidth: isSelected ? 3 : 0,
          },
        ]}
      >
        <Text style={styles.label}>{zone.shortName}</Text>
      </View>
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
