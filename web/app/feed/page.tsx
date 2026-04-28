import { FeedItem } from "@/components/Feed/FeedItem";
import { MOCK_FEED, MOCK_ZONES } from "@/constants/mock-data";

export default function FeedPage() {
  const reports = [...MOCK_FEED];

  return (
    <main className="feed-page">
      <div className="filter-row">
        <span className="filter-chip">전체</span>
        <span className="filter-chip">채소1동</span>
        <span className="filter-chip">채소2동</span>
        <span className="filter-chip">과일동</span>
        <span className="filter-chip">수산동</span>
        <span className="filter-chip">건어물동</span>
      </div>

      {reports.length ? (
        <div className="feed-list">
          {reports.map((report) => (
            <FeedItem key={report.id} report={report} zones={MOCK_ZONES} />
          ))}
        </div>
      ) : (
        <div className="feed-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          <p>아직 제보가 없어요</p>
        </div>
      )}
    </main>
  );
}
