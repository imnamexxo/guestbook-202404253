# 01: Neon 테이블 생성과 실제 연결, 최신순 글 목록, 개발자 정보 표시

**What to build:** 방문자가 페이지를 열면 개발자 정보(유소영 / 202404253)와 Neon DB에서 읽어 온 글 목록이 최신 작성순으로 보인다. 글이 없으면 빈 목록 안내가 나온다. 이 티켓이 끝나면 바로 Vercel에 조기 배포해서 DB 연결과 배포 경로를 먼저 검증한다.

**Blocked by:** None (can start immediately)

**Status:** done (조기 배포 확인만 남음)

**포함 요구사항:** R2(조회·표시), R3, R7, R8, R9, R12(조기 배포 확인)

## 작업 범위
- `entries` 테이블 스키마 파일을 만든다. 명세의 스키마를 쓰며, `CREATE TABLE IF NOT EXISTS`만 쓰고 DROP·TRUNCATE·DELETE는 넣지 않는다.
- `npm run db:init` 스크립트를 만든다. `.env.local`의 `DATABASE_URL`을 Node 내장 `--env-file`로 읽고, 추가 패키지는 쓰지 않는다.
- 글 저장소 모듈에 `listEntries()`를 만든다. 공개 필드만 조회하고 `ORDER BY created_at DESC, id DESC`로 정렬한다.
- 글 규칙 모듈에 `formatCreatedAt()`을 만든다(`Asia/Seoul`, `YYYY-MM-DD HH:mm`). `node:test` 테스트와 npm `test` 스크립트도 함께 만든다.
- 페이지를 만든다. 요청마다 동적 렌더링하고, 개발자 정보 헤더와 글 목록, 빈 목록 안내를 넣는다. 메시지는 줄바꿈을 보존한다.
- Node 버전을 고정한다. `package.json`의 `engines.node`를 `24.x`로 정해 Vercel도 Node 24를 쓰게 한다.
- 기본 템플릿의 문구와 이미지를 걷어낸다.
- 구현 전에 `node_modules/next/dist/docs/`에서 동적 렌더링·캐시·런타임 관련 문서를 확인한다.

## 완료 기준
- [x] `npm run db:init`이 성공하고, 두 번째 실행도 오류 없이 끝난다. 기존 행 수가 줄지 않는다.
- [x] 스키마 파일에 DROP / TRUNCATE / DELETE 문장이 없다.
- [x] 로컬 `npm run dev`에서 Neon의 글이 최신 작성순으로 보이고, 작성 시각이 `YYYY-MM-DD HH:mm`(KST)로 나온다. 글이 없으면 빈 목록 안내가 나온다.
- [x] 페이지 HTML과 RSC 응답에 `password_hash`와 `password_salt` 값이 없다.
- [x] 화면에 "유소영"과 "202404253"이 보인다.
- [x] `npm test`(작성 시각 포맷)와 `npm run build`가 성공한다.
- [ ] **조기 배포:** 커밋·푸시 후 사용자가 Vercel에서 저장소를 Import하고 Production `DATABASE_URL`을 등록한다. 배포 URL에서 개발자 정보와 목록(또는 빈 목록 안내)이 보인다.

## 검증 방법
- 목록과 정렬은 SQL 콘솔에서 확인한다. `[검증]`으로 시작하는 검증용 글만 시각을 달리해 넣고, 목록 순서를 본 뒤 그 검증용 글만 지운다. 기존 글은 읽기만 한다.
- 비밀번호 노출 여부는 `curl`로 받은 페이지 응답을 `grep`해서 확인한다.
- 수행하지 않은 검증은 아래 기록에 **미수행**으로 남기고, 통과로 쓰지 않는다.

## 검증 기록
| 항목 | 결과(통과/실패/미수행) | 근거 |
|---|---|---|
| db:init 1회차 | 통과 | `entries 테이블: 새로 생성 · 글 수 0 → 0` (Neon 실제 연결) |
| db:init 2회차(재실행 안전) | 통과 | `entries 테이블: 이미 있음 · 글 수 0 → 0` |
| 스키마에 DROP/TRUNCATE/DELETE 없음 | 통과 | `db/schema.sql`에는 `CREATE TABLE IF NOT EXISTS`만 있음 |
| 빈 목록 안내 | 통과 | `next start` 응답에 "아직 작성된 글이 없습니다. 첫 글을 남겨 주세요." |
| 최신순 정렬 | 통과 | SQL로 넣은 `[검증]A/B/C`(05:05/05:10/05:15Z)가 응답에 C → B → A 순서로 나옴 |
| KST `YYYY-MM-DD HH:mm` 표시 | 통과 | 05:05Z가 `2026-09-30 14:05`로 표시됨 |
| 메시지 줄바꿈 보존 | 통과 | 줄바꿈 메시지가 `whitespace-pre-wrap` 요소로 렌더링됨(HTML로 확인, 눈으로 보는 확인은 미수행) |
| 해시·salt 비노출 | 통과 | 표식 값 `secret-hash-marker`/`secret-salt-marker`가 페이지 응답(HTML+RSC)에 0건 |
| 개발자 정보 표시 | 통과 | 응답에 `개발자 유소영 · 학번 202404253` |
| `npm test` | 통과 | 3 tests, 3 pass (formatCreatedAt) |
| `tsc --noEmit`, `npm run lint`, `npm run build` | 통과 | 오류 없음, `/`는 동적 렌더링(ƒ) |
| 검증용 글 정리 | 통과 | `[검증]` 글 3건만 삭제하고 목록이 다시 빈 상태가 됨(검증 전 기존 글 0건) |
| 사용한 Node 버전 | 기록 | 로컬 v25.8.0. `engines.node: 24.x`는 Vercel 빌드에 적용되며, Node 24에서 실행하는 검증은 배포 때 확인 |
| 브라우저 화면 확인 | 미수행 | `curl`로 응답만 확인함 |
| 조기 배포(Vercel URL) | 미수행 | 사용자의 Vercel Import와 `DATABASE_URL` 등록이 필요 |
