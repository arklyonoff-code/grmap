import { cookies } from "next/headers";

export async function POST() {
  const store = await cookies();
  store.set("__session", "1", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
  });
  return Response.json({ ok: true });
}

export async function DELETE() {
  const store = await cookies();
  store.delete("__session");
  return Response.json({ ok: true });
}
