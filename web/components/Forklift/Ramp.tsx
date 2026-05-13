import { useMemo } from 'react';
import type { ForkliftFloorId, ForkliftResolvedAnchor } from '@grmap/shared/constants/forkliftAnchors';

type Props = {
  anchor: ForkliftResolvedAnchor;
  floor: ForkliftFloorId;
  isWeatherDangerous: boolean;
};

function anchorWorldY(anchor: ForkliftResolvedAnchor, floor: ForkliftFloorId): number | null {
  if (!anchor.layers.includes(floor)) return null;
  if (floor === 'ground') return anchor.halfHeight;
  if (floor === 'b1') return -6 + anchor.halfHeight;
  return -12 + anchor.halfHeight;
}

export function Ramp({ anchor, floor, isWeatherDangerous }: Props) {
  const y = anchorWorldY(anchor, floor);
  const color = useMemo(() => {
    if (!anchor.isDanger) return anchor.colorHex;
    if (isWeatherDangerous) return '#d63031';
    return '#e17055';
  }, [anchor.colorHex, anchor.isDanger, isWeatherDangerous]);

  if (y === null) return null;

  return (
    <mesh
      position={[anchor.x, y, anchor.z]}
      rotation={[0, anchor.yawRad ?? 0, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[anchor.halfWidth * 2, anchor.halfHeight * 2, anchor.halfDepth * 2]} />
      <meshStandardMaterial color={color} roughness={0.75} metalness={0.08} />
    </mesh>
  );
}
