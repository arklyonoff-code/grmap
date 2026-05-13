'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ForkliftFloorId } from '@grmap/shared/constants/forkliftAnchors';
import { ZoneDetailSheet } from '@/components/Map/ZoneDetailSheet';
import { getCurrentWeather, type WeatherInfo } from '@/services/weather';
import { FORKLIFT_CONGESTION_HEX } from './congestionColors';
import { GarakScene } from './GarakScene';
import { useForkliftMockZones } from './useForkliftMockZones';

export function GarakMap3D() {
  const zones = useForkliftMockZones();
  const [floor, setFloor] = useState<ForkliftFloorId>('ground');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherInfo>({
    status: 'unknown',
    description: '',
    isDangerous: false,
  });

  useEffect(() => {
    let cancelled = false;
    void getCurrentWeather().then((w) => {
      if (!cancelled) setWeather(w);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedZone = zones.find((z) => z.id === selectedZoneId) ?? null;

  const handleZoneSelect = useCallback((zoneId: string) => {
    setSelectedZoneId((prev) => (prev === zoneId ? null : zoneId));
  }, []);

  return (
    <div className="forklift-page">
      <div className="forklift-floorbar" role="tablist" aria-label="층 선택">
        <button
          type="button"
          role="tab"
          aria-selected={floor === 'ground'}
          className={`forklift-floorbtn ${floor === 'ground' ? 'forklift-floorbtn--active' : ''}`}
          onClick={() => setFloor('ground')}
        >
          지상 1층
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={floor === 'b1'}
          className={`forklift-floorbtn ${floor === 'b1' ? 'forklift-floorbtn--active' : ''}`}
          onClick={() => setFloor('b1')}
        >
          지하 1층
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={floor === 'b2'}
          className={`forklift-floorbtn ${floor === 'b2' ? 'forklift-floorbtn--active' : ''}`}
          onClick={() => setFloor('b2')}
        >
          지하 2층
        </button>
      </div>

      <div className="forklift-canvas-wrap">
        <GarakScene
          floor={floor}
          zones={zones}
          selectedZoneId={selectedZoneId}
          isWeatherDangerous={weather.isDangerous}
          onZoneSelect={handleZoneSelect}
        />
      </div>

      {selectedZone ? (
        <div className="forklift-hoverpanel">
          <p className="forklift-hoverpanel__title">{selectedZone.name}</p>
          <p className="forklift-hoverpanel__meta">
            혼잡도:{' '}
            <span className={`forklift-cong forklift-cong--${selectedZone.congestionLevel}`}>
              {selectedZone.congestionLevel}
            </span>
          </p>
        </div>
      ) : null}

      <aside className="forklift-legend" aria-label="범례">
        <p className="forklift-legend__title">혼잡도</p>
        <ul className="forklift-legend__list">
          <li className="forklift-legend__item">
            <span className="forklift-legend__swatch forklift-cong--green" /> 원활
          </li>
          <li className="forklift-legend__item">
            <span className="forklift-legend__swatch forklift-cong--yellow" /> 보통
          </li>
          <li className="forklift-legend__item">
            <span className="forklift-legend__swatch forklift-cong--red" /> 혼잡
          </li>
          <li className="forklift-legend__item">
            <span className="forklift-legend__swatch forklift-cong--unknown" /> 정보 없음
          </li>
        </ul>
        <p className="forklift-legend__hint">구역 박스 위 구체 색 = 실시간 혼잡도 (MOCK_FEED)</p>
      </aside>

      {selectedZone ? (
        <div className="forklift-sheet-wrap">
          <ZoneDetailSheet zone={selectedZone} onClose={() => setSelectedZoneId(null)} />
        </div>
      ) : null}
    </div>
  );
}
