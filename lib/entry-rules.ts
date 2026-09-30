// 글 규칙: DB에 접근하지 않는 순수 함수 모음. `node --test`로 직접 실행되므로
// 타입 제거만으로 동작하는 TS 문법만 사용한다(enum·namespace 등 금지).

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
