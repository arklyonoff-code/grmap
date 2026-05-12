import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import {
  MAX_SPEED_MS,
  clampSpeed,
  collidesAt,
  intersectsAabb,
  vehicleAabbAt,
} from '../forkliftController';

test('clampSpeed respects forward and reverse limits', () => {
  assert.equal(clampSpeed(MAX_SPEED_MS + 1), MAX_SPEED_MS);
  assert.equal(clampSpeed(-MAX_SPEED_MS - 1), -MAX_SPEED_MS);
  assert.equal(clampSpeed(1.2), 1.2);
});

test('vehicle AABB intersects blocking volume', () => {
  const pos = new THREE.Vector3(0, 0, -4);
  const box = vehicleAabbAt(pos);
  const blocker = {
    min: { x: -0.5, y: 0, z: -4.5 },
    max: { x: 0.5, y: 2, z: -3.5 },
  };
  assert.equal(intersectsAabb(box, blocker), true);
});

test('collidesAt detects pallet-like obstacle', () => {
  const pos = new THREE.Vector3(-2.25, 0, -4);
  const colliders = [
    {
      min: { x: -3, y: 0, z: -4.75 },
      max: { x: -1.5, y: 1.8, z: -3.25 },
    },
  ];
  assert.equal(collidesAt(pos, colliders), true);
});
