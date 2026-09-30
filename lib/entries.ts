// 글 저장소: Neon Postgres 접근은 모두 이 모듈을 거친다. 서버에서만 import한다.
import { neon } from "@neondatabase/serverless";

/** 브라우저로 보내도 되는 글의 공개 필드. 비밀번호 해시·salt는 포함하지 않는다. */
export type PublicEntry = {
  id: string;
  name: string;
  message: string;
  createdAt: Date;
};

function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL 환경변수가 설정되지 않았습니다.");
  return neon(url);
}

/** 글 목록: 최신 작성순(작성 시각이 같으면 나중에 만든 글이 먼저). */
export async function listEntries(): Promise<PublicEntry[]> {
  const rows = await db()`
    SELECT id, name, message, created_at
    FROM entries
    ORDER BY created_at DESC, id DESC
  `;
  return rows.map((row) => ({
    id: String(row.id),
    name: row.name,
    message: row.message,
    createdAt: new Date(row.created_at),
  }));
}
