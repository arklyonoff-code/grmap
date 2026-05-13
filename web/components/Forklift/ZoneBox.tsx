import type { ThreeEvent } from '@react-three/fiber';
import type { ForkliftZoneLayout } from '@grmap/shared/utils/forkliftMapLayout';
import type { ZoneWithStatus } from '@grmap/shared/types';
import type { ForkliftFloorId } from '@grmap/shared/constants/forkliftAnchors';
import { FORKLIFT_CONGESTION_HEX } from './congestionColors';

type Props = {
  layout: ForkliftZoneLayout;
  zone: ZoneWithStatus;
  floor: ForkliftFloorId;
  selected: boolean;
  onSelect: (zoneId: string) => void;
};

export function ZoneBox({ layout, zone, floor, selected, onSelect }: Props) {
  const sphereColor = FORKLIFT_CONGESTION_HEX[zone.congestionLevel];

  const y = layout.halfHeight;

  if (floor !== 'ground') return null;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(zone.id);
  };

  return (
    <group position={[layout.x, y, layout.z]}>
      <mesh
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <boxGeometry args={[layout.halfWidth * 2, layout.halfHeight * 2, layout.halfDepth * 2]} />
        <meshStandardMaterial
          color={layout.colorHex}
          emissive={selected ? '#ffffff' : '#000000'}
          emissiveIntensity={selected ? 0.22 : 0}
          roughness={0.55}
          metalness={0.12}
        />
      </mesh>
      <mesh position={[0, layout.halfHeight + 2.5, 0]} castShadow>
        <sphereGeometry args={[2.5, 24, 24]} />
        <meshStandardMaterial color={sphereColor} emissive={sphereColor} emissiveIntensity={0.35} roughness={0.4} />
      </mesh>
    </group>
  );
}
