// 글 입력 길이 제한. 서버 검증과 클라이언트 폼(maxLength)이 함께 쓴다.
export const LIMITS = {
  name: { min: 1, max: 20 },
  message: { min: 1, max: 500 },
  password: { min: 4, max: 20 },
} as const;
