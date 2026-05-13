import { DoubleSide } from 'three';

type Props = {
  visible: boolean;
};

export function Ground({ visible }: Props) {
  if (!visible) return null;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[520, 520]} />
      <meshStandardMaterial color="#243046" roughness={0.92} metalness={0.04} side={DoubleSide} />
    </mesh>
  );
}
