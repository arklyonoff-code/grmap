'use client';

import dynamic from 'next/dynamic';

const GarakMap3D = dynamic(() => import('@/components/Forklift/GarakMap3D').then((m) => m.GarakMap3D), {
  ssr: false,
  loading: () => (
    <main className="forklift-loading">
      <p className="forklift-loading__text">3D 가락시장 로딩 중...</p>
    </main>
  ),
});

export default function ForkliftPage() {
  return (
    <main className="forklift-route">
      <GarakMap3D />
    </main>
  );
}
