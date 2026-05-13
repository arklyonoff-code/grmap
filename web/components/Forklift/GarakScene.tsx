'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useMemo } from 'react';
import { buildForkliftZoneLayouts } from '@grmap/shared/utils/forkliftMapLayout';
import { resolveForkliftAnchors } from '@grmap/shared/constants/forkliftAnchors';
import type { ZoneWithStatus } from '@grmap/shared/types';
import type { ForkliftFloorId } from '@grmap/shared/constants/forkliftAnchors';
import { Ground } from './Ground';
import { Ramp } from './Ramp';
import { ZoneBox } from './ZoneBox';

type Props = {
  floor: ForkliftFloorId;
  zones: ZoneWithStatus[];
  selectedZoneId: string | null;
  isWeatherDangerous: boolean;
  onZoneSelect: (zoneId: string) => void;
};

function SceneContent({
  floor,
  zones,
  selectedZoneId,
  isWeatherDangerous,
  onZoneSelect,
}: Props) {
  const layouts = useMemo(() => buildForkliftZoneLayouts(), []);
  const layoutById = useMemo(() => new Map(layouts.map((l) => [l.id, l])), [layouts]);
  const anchors = useMemo(() => resolveForkliftAnchors(), []);

  return (
    <>
      <color attach="background" args={['#1a1a2e']} />
      <ambientLight intensity={0.45} />
      <directionalLight castShadow position={[50, 80, 50]} intensity={0.85} />
      <Ground visible={floor === 'ground'} />
      {zones.map((zone) => {
        const layout = layoutById.get(zone.id);
        if (!layout) return null;
        return (
          <ZoneBox
            key={zone.id}
            layout={layout}
            zone={zone}
            floor={floor}
            selected={zone.id === selectedZoneId}
            onSelect={onZoneSelect}
          />
        );
      })}
      {anchors.map((anchor) => (
        <Ramp key={`${anchor.id}-${floor}`} anchor={anchor} floor={floor} isWeatherDangerous={isWeatherDangerous} />
      ))}
      <OrbitControls
        minDistance={30}
        maxDistance={250}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  );
}

export function GarakScene(props: Props) {
  return (
    <Canvas
      className="forklift-canvas"
      shadows
      gl={{ antialias: true }}
      camera={{ position: [0, 80, 120], fov: 50, near: 0.5, far: 800 }}
    >
      <Suspense fallback={null}>
        <SceneContent {...props} />
      </Suspense>
    </Canvas>
  );
}
