export default function Home() {
  return (
    <main className="min-h-screen bg-[#F5F4F0] px-6 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight text-[#111111]">가락맵 MVP</h1>
        <div className="h-[60vh] w-full rounded-2xl border border-[#EDEDED] bg-white p-5">
          <div className="h-full w-full rounded-xl border border-dashed border-[#DDDDDD] bg-[#FAFAFA] flex items-center justify-center text-[#999999]">
            지도 영역 (Placeholder)
          </div>
        </div>
        <div className="grid gap-2 text-[#555555]">
          <p>하역 위치</p>
          <p>대기 시간</p>
          <p>진입 경로</p>
        </div>
      </div>
    </main>
  );
}
