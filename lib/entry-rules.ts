// 글 규칙: DB에 접근하지 않는 순수 함수 모음. `node --test`로 직접 실행되므로
// 타입 제거만으로 동작하는 TS 문법만 사용한다(enum·namespace 등 금지).
// node:crypto를 쓰므로 서버에서만 import한다. 클라이언트는 entry-limits를 쓴다.

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { LIMITS } from "./entry-limits.ts";

const createdAtFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** 작성 시각을 Asia/Seoul 기준 `YYYY-MM-DD HH:mm`으로 표시한다. */
export function formatCreatedAt(date: Date): string {
  const parts: Record<string, string> = {};
  for (const { type, value } of createdAtFormatter.formatToParts(date)) {
    parts[type] = value;
  }
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

// ---- 입력 검증 ----

export type EntryField = "name" | "message" | "password";
export type FieldErrors = Partial<Record<EntryField, string>>;
export type Checked<T> = { ok: true; value: T } | { ok: false; error: string };

export const ERRORS = {
  name: `이름은 ${LIMITS.name.min}~${LIMITS.name.max}자로 입력해 주세요.`,
  message: `메시지는 ${LIMITS.message.min}~${LIMITS.message.max}자로 입력해 주세요.`,
  password: `비밀번호는 ${LIMITS.password.min}~${LIMITS.password.max}자로 입력해 주세요.`,
  passwordBlank: "비밀번호는 공백만으로 만들 수 없습니다.",
} as const;

/** 폼 값이 문자열이 아니면(누락 등) 빈 문자열로 본다. */
function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** DB의 VARCHAR와 같은 기준(코드 포인트)으로 글자 수를 센다. */
function length(value: string): number {
  return Array.from(value).length;
}

function within(value: string, range: { min: number; max: number }): boolean {
  const n = length(value);
  return n >= range.min && n <= range.max;
}

function checkName(raw: unknown): Checked<string> {
  const value = text(raw).trim();
  return within(value, LIMITS.name) ? { ok: true, value } : { ok: false, error: ERRORS.name };
}

/** 메시지: 앞뒤 공백을 제거한 뒤 1~500자. */
export function validateMessage(raw: unknown): Checked<string> {
  const value = text(raw).trim();
  return within(value, LIMITS.message) ? { ok: true, value } : { ok: false, error: ERRORS.message };
}

/** 글 비밀번호: 입력값 그대로(trim 하지 않음) 4~20자, 공백만으로 된 값은 거부. */
export function validatePassword(raw: unknown): Checked<string> {
  const value = text(raw);
  if (!within(value, LIMITS.password)) return { ok: false, error: ERRORS.password };
  if (value.trim() === "") return { ok: false, error: ERRORS.passwordBlank };
  return { ok: true, value };
}

export type NewEntryInput = { name: string; message: string; password: string };

/** 새 글 입력 전체를 검증하고, 틀린 칸마다 오류를 돌려준다. */
export function validateNewEntry(raw: {
  name: unknown;
  message: unknown;
  password: unknown;
}): { ok: true; value: NewEntryInput } | { ok: false; errors: FieldErrors } {
  const name = checkName(raw.name);
  const message = validateMessage(raw.message);
  const password = validatePassword(raw.password);
  if (name.ok && message.ok && password.ok) {
    return { ok: true, value: { name: name.value, message: message.value, password: password.value } };
  }
  const errors: FieldErrors = {};
  if (!name.ok) errors.name = name.error;
  if (!message.ok) errors.message = message.error;
  if (!password.ok) errors.password = password.error;
  return { ok: false, errors };
}

// ---- 글 비밀번호 ----

const KEY_LENGTH = 64;

function scryptAsync(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

/** 글마다 무작위 salt를 만들어 scrypt 해시를 만든다. 평문은 저장하지 않는다. */
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = randomBytes(16).toString("hex");
  const key = await scryptAsync(password, salt);
  return { hash: key.toString("hex"), salt };
}

/** 입력한 비밀번호가 저장된 해시와 같은지 상수 시간으로 비교한다. */
export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const expected = Buffer.from(hash, "hex");
  const actual = await scryptAsync(password, salt);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// ---- 글 id ----

const MAX_ENTRY_ID = BigInt("9223372036854775807"); // BIGSERIAL 상한

/** 폼으로 받은 글 id가 양의 정수(BIGINT 범위)면 문자열로, 아니면 null을 돌려준다. */
export function parseEntryId(raw: unknown): string | null {
  if (typeof raw !== "string" || !/^[1-9][0-9]{0,18}$/.test(raw)) return null;
  return BigInt(raw) <= MAX_ENTRY_ID ? raw : null;
}
