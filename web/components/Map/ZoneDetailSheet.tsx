"use client";

import type { ZoneWithStatus } from "@grmap/shared/types";
import { buildZoneShareMessage } from "@grmap/shared/utils/share";

type Props = {
  zone: ZoneWithStatus;
  onClose: () => void;
};

export function ZoneDetailSheet({ zone, onClose }: Props) {
  const handleShare = async () => {
    const message = buildZoneShareMessage(zone);
    try {
      if (navigator.share) {
        await navigator.share({ text: message, title: "GRmap 현황" });
        return;
      }
      await navigator.clipboard.writeText(message);
      window.alert("클립보드에 복사됐습니다. 카톡에 붙여넣기 하세요.");
    } catch {
      // 사용자 취소 등
    }
  };

  return (
    <div className="zone-sheet" role="dialog" aria-label={`${zone.name} 상세`}>
      <div className="zone-sheet__header">
        <h2>{zone.name}</h2>
        <button type="button" className="zone-sheet__close" onClick={onClose}>
          닫기
        </button>
      </div>
      <p className="zone-sheet__desc">{zone.dockDescription}</p>
      {zone.entryNote ? <p className="zone-sheet__note">{zone.entryNote}</p> : null}
      <button type="button" className="zone-sheet__share" onClick={handleShare}>
        <span aria-hidden>📤</span>
        지금 상황 카톡으로 공유
      </button>
    </div>
  );
}
