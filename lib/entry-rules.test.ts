import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatCreatedAt,
  validateNewEntry,
  validateMessage,
  validatePassword,
  hashPassword,
  verifyPassword,
  parseEntryId,
} from "./entry-rules.ts";

test("작성 시각은 Asia/Seoul 기준 YYYY-MM-DD HH:mm으로 표시한다", () => {
  assert.equal(formatCreatedAt(new Date("2026-09-30T05:05:00Z")), "2026-09-30 14:05");
});

test("KST 기준으로 날짜가 넘어가는 시각도 올바르게 표시한다", () => {
  assert.equal(formatCreatedAt(new Date("2026-12-31T15:00:00Z")), "2027-01-01 00:00");
});

test("자정은 24:00이 아니라 00:00으로 표시한다", () => {
  assert.equal(formatCreatedAt(new Date("2026-09-29T15:00:00Z")), "2026-09-30 00:00");
});

// ---- 입력 검증 ----

const valid = { name: "소영", message: "안녕하세요", password: "1234" };
const chars = (n: number) => "가".repeat(n);

test("정상 입력은 통과하고 이름·메시지는 앞뒤 공백을 제거한다", () => {
  const r = validateNewEntry({ name: "  소영 ", message: "\n 안녕 \n", password: " 12 34 " });
  assert.deepEqual(r, { ok: true, value: { name: "소영", message: "안녕", password: " 12 34 " } });
});

test("이름은 trim 후 1~20자", () => {
  for (const [name, ok] of [["", false], ["   ", false], [chars(1), true], [chars(20), true], [chars(21), false], [`  ${chars(20)}  `, true]] as const) {
    const r = validateNewEntry({ ...valid, name });
    assert.equal(r.ok, ok, `이름 ${JSON.stringify(name)}`);
    if (!r.ok) assert.ok(r.errors.name);
  }
});

test("메시지는 trim 후 1~500자", () => {
  for (const [message, ok] of [["", false], [" \n\t ", false], [chars(1), true], [chars(500), true], [chars(501), false]] as const) {
    assert.equal(validateNewEntry({ ...valid, message }).ok, ok, `메시지 길이 ${message.length}`);
    assert.equal(validateMessage(message).ok, ok);
  }
});

test("비밀번호는 trim하지 않고 4~20자, 공백만은 거부", () => {
  for (const [password, ok] of [["123", false], ["1234", true], ["a".repeat(20), true], ["a".repeat(21), false], ["    ", false], [" ab ", true]] as const) {
    assert.equal(validatePassword(password).ok, ok, `비밀번호 ${JSON.stringify(password)}`);
    assert.equal(validateNewEntry({ ...valid, password }).ok, ok);
  }
  assert.deepEqual(validatePassword(" ab "), { ok: true, value: " ab " });
});

test("여러 칸이 틀리면 칸별 오류를 모두 돌려준다", () => {
  const r = validateNewEntry({ name: "", message: "", password: "1" });
  assert.equal(r.ok, false);
  if (!r.ok) assert.deepEqual(Object.keys(r.errors).sort(), ["message", "name", "password"]);
});

test("문자열이 아닌 값(누락된 폼 필드)은 빈 값으로 보고 거부한다", () => {
  assert.equal(validateNewEntry({ name: null, message: undefined, password: 1234 }).ok, false);
});

// ---- 글 비밀번호 ----
test("같은 비밀번호라도 salt가 달라 해시가 다르다", async () => {
  const a = await hashPassword("1234");
  const b = await hashPassword("1234");
  assert.notEqual(a.salt, b.salt);
  assert.notEqual(a.hash, b.hash);
  assert.ok(!a.hash.includes("1234"));
});

test("올바른 비밀번호는 true, 틀린 비밀번호는 false", async () => {
  const { hash, salt } = await hashPassword(" ab 12");
  assert.equal(await verifyPassword(" ab 12", hash, salt), true);
  assert.equal(await verifyPassword("ab 12", hash, salt), false);
  assert.equal(await verifyPassword("wrong", hash, salt), false);
});

test("손상된 해시 값에는 예외 없이 false", async () => {
  const { salt } = await hashPassword("1234");
  assert.equal(await verifyPassword("1234", "abcd", salt), false);
});

// ---- 글 id ----
test("글 id는 양의 정수 문자열만 받는다", () => {
  assert.equal(parseEntryId("42"), "42");
  for (const bad of ["", "0", "-1", "1.5", "abc", "1 OR 1=1", "99999999999999999999", null, 3]) {
    assert.equal(parseEntryId(bad), null, `id ${JSON.stringify(bad)}`);
  }
});
