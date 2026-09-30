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

/** 새 글을 저장한다. 비밀번호는 해시와 salt로만 받는다. */
export async function insertEntry(entry: {
  name: string;
  message: string;
  passwordHash: string;
  passwordSalt: string;
}): Promise<void> {
  await db()`
    INSERT INTO entries (name, message, password_hash, password_salt)
    VALUES (${entry.name}, ${entry.message}, ${entry.passwordHash}, ${entry.passwordSalt})
  `;
}

/** 비밀번호 확인용으로 글의 해시와 salt를 읽는다. 결과는 서버 밖으로 내보내지 않는다. */
export async function getEntryCredentials(
  id: string,
): Promise<{ passwordHash: string; passwordSalt: string } | null> {
  const rows = await db()`
    SELECT password_hash, password_salt FROM entries WHERE id = ${id}
  `;
  if (rows.length === 0) return null;
  return { passwordHash: rows[0].password_hash, passwordSalt: rows[0].password_salt };
}

/** 메시지만 바꾼다. 작성자 이름과 작성 시각은 건드리지 않는다. 바뀐 글이 없으면 false. */
export async function updateMessage(id: string, message: string): Promise<boolean> {
  const rows = await db()`
    UPDATE entries SET message = ${message} WHERE id = ${id} RETURNING id
  `;
  return rows.length > 0;
}

/** 글을 삭제한다. 지운 글이 없으면(이미 삭제됨) false. */
export async function deleteEntry(id: string): Promise<boolean> {
  const rows = await db()`
    DELETE FROM entries WHERE id = ${id} RETURNING id
  `;
  return rows.length > 0;
}
