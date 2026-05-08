import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 | GRmap",
  description: "GRmap 서비스 개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <main className="page-wrap" style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px 80px", lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>GRmap 개인정보처리방침</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>
        시행일: 배포일 기준 · 최종 수정: 배포 전 확인 필요
      </p>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>1. 처리 목적</h2>
        <p style={{ fontSize: 14, color: "#333" }}>
          GRmap(이하 &quot;서비스&quot;)는 가락시장 상·하차 및 현장 정보 공유를 위해 최소한의 정보를 처리합니다.
          별도 회원가입 없이 서비스를 제공합니다.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>2. 수집 항목</h2>
        <ul style={{ fontSize: 14, color: "#333", paddingLeft: 20 }}>
          <li>
            <strong>기기 식별자(익명)</strong>: 동일 기기에서의 기능 제공·남용 방지·통계 목적
          </li>
          <li>
            <strong>위치 정보</strong>: &quot;현장 체크인&quot; 등 사용자가 동의한 경우에 한해, 해당 기능 수행 시에만 일시적으로
            이용합니다.
          </li>
          <li>
            <strong>게시글·댓글 등 사용자가 입력한 콘텐츠</strong>: 커뮤니티·시세 제보·대기 정보 공유 기능 제공
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>3. 보관 및 파기</h2>
        <p style={{ fontSize: 14, color: "#333" }}>
          관련 데이터는 원칙적으로 <strong>서비스 종료 시까지</strong> 보관되며, 서비스 종료 또는 법령에 따른 보존 의무가
          없는 한 지체 없이 파기합니다. 서버에 저장된 게시글 등은 삭제 요청·운영 정책에 따라 별도 처리될 수 있습니다.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>4. 제3자 제공</h2>
        <p style={{ fontSize: 14, color: "#333" }}>
          서비스는 수집한 개인정보를 <strong>제3자에게 제공하지 않습니다.</strong> 다만, 사용자가 공개적으로 작성한
          게시글은 서비스 내 다른 이용자에게 노출될 수 있습니다.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>5. 이용자의 권리</h2>
        <p style={{ fontSize: 14, color: "#333" }}>
          게시글 삭제 등 서비스 내 제공 기능을 통해 일부 정보를 직접 정정·삭제할 수 있습니다. 그 밖의 요청은 아래 문의
          채널로 연락 주시면 관련 법령에 따라 성실히 대응하겠습니다.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>6. 문의</h2>
        <p style={{ fontSize: 14, color: "#333", marginBottom: 12 }}>
          개인정보 관련 문의·불만 처리를 위해 아래 이메일을 안내합니다.{" "}
          <strong>스토어 제출 전 실제 운영 이메일로 교체</strong>해 주세요.
        </p>
        <div
          style={{
            padding: "14px 16px",
            border: "1px dashed #ccc",
            borderRadius: 10,
            fontSize: 14,
            background: "#fafafa",
          }}
        >
          <label htmlFor="privacy-contact-email" style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
            문의 이메일 (교체용)
          </label>
          <input
            id="privacy-contact-email"
            type="email"
            placeholder="privacy@your-domain.com"
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: 14,
              border: "1px solid #eee",
              borderRadius: 8,
              boxSizing: "border-box",
            }}
          />
          <p style={{ fontSize: 12, color: "#888", marginTop: 10 }}>
            배포 전 페이지 소스에서 플레이스홀더를 실제 운영 이메일로 바꾸거나, 입력 칸에 표시할 주소를 정하면 됩니다.
          </p>
        </div>
      </section>

      <p style={{ fontSize: 12, color: "#aaa" }}>
        본 방침은 서비스 개선에 따라 변경될 수 있으며, 변경 시 앱 또는 웹을 통해 고지합니다.
      </p>
    </main>
  );
}
