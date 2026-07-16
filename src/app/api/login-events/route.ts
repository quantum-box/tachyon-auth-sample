import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

type LoginEventRow = {
  id: number;
  event_type: string;
  user_sub: string | null;
  created_at: string;
};

// Minimal D1 surface used by this route, so the sample does not
// need a dependency on @cloudflare/workers-types.
type D1Like = {
  prepare(query: string): {
    bind(...values: unknown[]): {
      run(): Promise<unknown>;
      all<T>(): Promise<{ results: T[] }>;
    };
    all<T>(): Promise<{ results: T[] }>;
  };
};

function db(): D1Like | undefined {
  return (getRequestContext().env as { DB?: D1Like }).DB;
}

export async function GET() {
  const database = db();
  if (!database) {
    return NextResponse.json(
      { error: "d1_binding_missing" },
      { status: 503 }
    );
  }
  const { results } = await database
    .prepare(
      "SELECT id, event_type, user_sub, created_at FROM login_events ORDER BY created_at DESC LIMIT 20"
    )
    .all<LoginEventRow>();
  return NextResponse.json({ events: results });
}

export async function POST(request: NextRequest) {
  const database = db();
  if (!database) {
    return NextResponse.json(
      { error: "d1_binding_missing" },
      { status: 503 }
    );
  }
  const body = (await request.json().catch(() => ({}))) as {
    event_type?: string;
    user_sub?: string;
  };
  const eventType = body.event_type ?? "ping";
  await database
    .prepare(
      "INSERT INTO login_events (event_type, user_sub) VALUES (?1, ?2)"
    )
    .bind(eventType, body.user_sub ?? null)
    .run();
  return NextResponse.json({ ok: true }, { status: 201 });
}
