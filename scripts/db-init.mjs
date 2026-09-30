// `npm run db:init`: db/schema.sql을 DATABASE_URL의 Neon DB에 적용한다.
// 스키마는 CREATE ... IF NOT EXISTS만 담고 있어 기존 글을 지우지 않는다.
import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL이 설정되지 않았습니다. .env.local을 확인하세요.");
  process.exit(1);
}

const sql = neon(url);
const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
const statements = schema
  .replace(/--.*$/gm, "")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

const [{ existed }] = await sql.query("SELECT to_regclass('public.entries') IS NOT NULL AS existed");
const before = existed ? (await sql.query("SELECT count(*)::int AS n FROM entries"))[0].n : 0;

for (const statement of statements) {
  await sql.query(statement);
}

const [{ n: after }] = await sql.query("SELECT count(*)::int AS n FROM entries");
console.log(`entries 테이블: ${existed ? "이미 있음" : "새로 생성"} · 글 수 ${before} → ${after}`);
