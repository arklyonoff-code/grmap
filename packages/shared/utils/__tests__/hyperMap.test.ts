import assert from 'node:assert/strict';
import test from 'node:test';
import { GARAK_MAP_CENTER, projectLatLngToHyperMap } from '../hyperMap';

test('center projects to origin', () => {
  const { mapX, mapZ } = projectLatLngToHyperMap(GARAK_MAP_CENTER.lat, GARAK_MAP_CENTER.lng);
  assert.equal(mapX, 0);
  assert.equal(mapZ, 0);
});

test('lng east increases mapX', () => {
  const { mapX } = projectLatLngToHyperMap(GARAK_MAP_CENTER.lat, GARAK_MAP_CENTER.lng + 0.001);
  assert.ok(mapX > 0);
});

test('lat north decreases mapZ', () => {
  const { mapZ } = projectLatLngToHyperMap(GARAK_MAP_CENTER.lat + 0.001, GARAK_MAP_CENTER.lng);
  assert.ok(mapZ < 0);
});
