export default function Home() {
  return (
    <main className="web-screen">
      <section className="map-shell">
        <header className="top-overlay">
          <div className="top-pill">GRmap</div>
        </header>

        <div className="map-area" aria-label="가락시장 지도 영역">
          <div className="marker marker-red">채소1</div>
          <div className="marker marker-green">과일</div>
          <div className="marker marker-yellow">수산</div>
          <div className="placeholder-copy">
            지도와 마커는 모바일 앱과 같은 정보 구조를 따릅니다.
          </div>
        </div>

        <div className="bottom-overlay">
          <button className="primary-cta">대기시간 공유하기</button>
        </div>
      </section>
    </main>
  );
}
