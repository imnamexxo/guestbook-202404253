import { test } from "node:test";
import assert from "node:assert/strict";
import { formatCreatedAt } from "./entry-rules.ts";

test("작성 시각은 Asia/Seoul 기준 YYYY-MM-DD HH:mm으로 표시한다", () => {
  assert.equal(formatCreatedAt(new Date("2026-09-30T05:05:00Z")), "2026-09-30 14:05");
});

test("KST 기준으로 날짜가 넘어가는 시각도 올바르게 표시한다", () => {
  assert.equal(formatCreatedAt(new Date("2026-12-31T15:00:00Z")), "2027-01-01 00:00");
});

test("자정은 24:00이 아니라 00:00으로 표시한다", () => {
  assert.equal(formatCreatedAt(new Date("2026-09-29T15:00:00Z")), "2026-09-30 00:00");
});
