# 04: 코드 리뷰 반영, 최종 배포, 실제 Vercel URL 검증

**What to build:** `/code-review`에서 나온 필수 문제를 고친 최종본을 Public GitHub 저장소에 푸시하고 Vercel Production에 배포한다. 실제 배포 URL에서 작성·조회·정렬·수정·삭제와 비밀번호 불일치 거부를 모두 다시 검증하고, 제출물 두 개(GitHub URL, Vercel URL)를 확정한다.

**Blocked by:** 01, 02, 03

**Status:** ready-for-agent

**포함 요구사항:** R10, R11, R12, 그리고 배포본에서 R1~R9를 다시 검증

## 작업 범위
1. 커밋 전 점검
   - `npm test`, `npm run lint`, `npm run build`를 돌린다.
   - `.env*`가 커밋 대상에 없는지 확인한다.
   - SDD 문서(`GLOSSARY.md`, `.scratch/guestbook/`, `docs/agents/`)가 커밋 대상에 포함됐는지 확인한다.
2. `/code-review`를 실행한다. 명세 위반, 보안(비밀번호 노출, SQL 매개변수화), 데이터 보존 관련 필수 문제를 수정한 뒤 1을 다시 돌린다.
3. 커밋하고 `origin/main`에 푸시한 뒤, Vercel Production 배포가 성공(Ready)했는지 확인한다.
4. 실제 Vercel URL에서 인수 검증을 한다. 새로 만든 `[검증]` 글만 쓰고, 끝나면 앱의 삭제 기능으로 지운다.

## 완료 기준
- [x] `/code-review` 필수 문제가 모두 수정됐거나, 수정하지 않은 이유가 기록돼 있다.
- [ ] R10: GitHub 저장소, Vercel 프로젝트, Neon 프로젝트 이름이 모두 `guestbook-202404253`이다. Vercel과 Neon은 사용자가 대시보드에서 확인한다.
- [ ] R11: 로그인하지 않은 상태에서 저장소가 열리고 소스와 SDD 문서가 보인다. `.env*`는 커밋되지 않았다.
- [ ] R12: Vercel Production에 `DATABASE_URL`이 등록돼 있고, 최신 커밋이 배포됐다.
- [ ] 배포 URL: `[검증]` 글을 작성하면 새로고침 후에도 조회된다.
- [ ] 배포 URL: `[검증]` 글 3개가 최신순으로 정렬된다.
- [ ] 배포 URL: 작성 시각이 KST `YYYY-MM-DD HH:mm`으로 표시된다.
- [ ] 배포 URL: 올바른 비밀번호로 수정하면 메시지만 바뀌고 작성 시각과 위치는 유지된다.
- [ ] 배포 URL: 틀린 비밀번호로 수정하면 거부되고 안내가 나오며, 새로고침 후에도 데이터가 그대로다.
- [ ] 배포 URL: 올바른 비밀번호로 삭제하면 성공한다.
- [ ] 배포 URL: 틀린 비밀번호로 삭제하면 거부되고 안내가 나오며, 새로고침 후에도 데이터가 그대로다.
- [ ] 배포 URL: 입력 검증 오류가 표시되고, 개발자 정보가 보인다.
- [ ] 배포 URL: 페이지 응답에 비밀번호·해시·salt가 없다.
- [ ] 검증에 쓴 `[검증]` 글을 모두 지웠다. 기존 글은 한 건도 바뀌지 않았다.
- [ ] 제출물 두 개(GitHub 저장소 URL, Vercel 배포 URL)가 기록돼 있다.

## 검증 방법
- 배포 URL에서 브라우저로 확인하고, 필요하면 `curl`로 응답을 확인한다.
- Vercel과 Neon 대시보드처럼 에이전트가 볼 수 없는 항목은 사용자 확인 결과를 근거로 적는다. 확인하지 못했으면 **미수행**으로 남긴다.
- 수행하지 않은 검증은 통과로 기록하지 않는다.

## 코드 리뷰 결과 (`/code-review`, 기준점 3360135...HEAD, 스킬 파일 제외)

두 기준(Standards, Spec)을 서로 다른 에이전트가 따로 리뷰했다. 두 리뷰 모두 **필수 수정(MUST-FIX)은 없음**.

### Standards
- 문서화된 규칙을 직접 위반한 곳은 없다. `connection()`, `revalidatePath`, `useActionState`, 타입을 export하는 `'use server'` 파일 사용이 설치된 Next 16.3.7 문서와 맞는다. edge 런타임을 선언하지 않았다(Node.js). SQL은 전부 매개변수화했다. 해시·salt는 공개 타입에 없다. entry-rules는 지울 수 있는 TS 문법만 쓴다.
- 판단 항목(미반영):
  - `server-only` import 가드가 없다. 문서상 선택 사항이다.
  - `@types/node ^20`이 `engines 24.x`와 다르다.
  - UI 라벨 "이름/비밀번호"와 용어집 "작성자 이름/글 비밀번호"가 다르다.
  - `editEntry`/`removeEntry`라는 이름이 용어집과 조금 다르다.
- 코드 스멜(판단 항목, 미반영): 폼 값을 문자열로 바꾸는 코드와 칸 오류를 만드는 코드가 중복된다. hash와 salt가 늘 함께 다닌다(Data Clumps). `entry-form.tsx`가 공용 UI도 export한다. `EntryView`와 `PublicEntry`의 모양이 겹친다.
- 위험 항목:
  1. 수정 폼 textarea가 React 19의 폼 자동 reset 뒤에도 입력값을 유지하는지는 브라우저에서 확인해야 한다(배포본 검증 항목).
  2. 비밀번호 확인과 쓰기 사이에 트랜잭션이 없다. 글 비밀번호는 바뀌지 않으므로 영향이 없어 미반영.
  3. **db-init이 주석을 지우기 전에 `;`로 나눈다 → 수정함.**
  4. `EditForm` effect의 의존성이 매 렌더 바뀐다. 성공하면 언마운트되므로 문제없어 미반영.

### Spec
- R1~R9의 코드 경로가 명세대로 구현되어 있다. 서버 비밀번호 검증, 불일치 시 DB 미변경과 정확한 안내 문구, 정렬, 메시지만 UPDATE, 개발자 정보, 비밀번호 비노출, 요청마다 렌더링을 확인했다.
- NICE-TO-HAVE:
  - **R9: `db/schema.sql` 주석에 "DROP / TRUNCATE / DELETE" 글자가 있어, 완료 기준을 grep으로 확인하면 실패한다 → 수정함.**
  - R6: 없는 글 응답 때 `revalidatePath`를 부르지 않아 그 탭의 목록이 새로고침 전까지 남는다. **미반영.** 목록을 갱신하면 그 글 항목과 함께 R6이 요구하는 안내 문구도 사라지기 때문이다.
  - 명세 밖 동작(무해): 글 수 표시, 성공 문구, 일반 서버 오류 문구, db-init의 행 수 로그.
- 티켓 03에서 미수행한 브라우저 항목(취소, 성공 시 닫힘, 두 탭)은 배포본에서 확인해야 한다.

### 반영한 수정 (필수 기능 영향 없음, 명세 기준 충족용)
| 수정 | 검증 | 결과 |
|---|---|---|
| `db/schema.sql` 주석 문구 변경(금지 단어 제거) | `grep -ciE 'drop\|truncate\|delete' db/schema.sql` | 통과: 0건 |
| `scripts/db-init.mjs`: 주석 제거 → `;` 분리 순서로 변경 | `npm run db:init` 2회 | 통과: "이미 있음 · 글 수 1 → 1"이 두 번 나옴(사용자가 만든 기존 글 1건 보존, 건드리지 않음) |
| 회귀 확인 | `npm test`, `tsc --noEmit`, `npm run lint`, `npm run build` | 통과: 13 pass, 오류 없음, `/` 동적(ƒ) |

## 검증 기록
| 항목 | 결과(통과/실패/미수행) | 근거 |
|---|---|---|
| `/code-review` 반영 후 로컬 회귀 | 통과 | 위 표 참고(로컬 Node v25.8.0) |
| 실제 브라우저 UI 조작 | 미수행 | 배포 URL을 받은 뒤 진행 |
| 배포 URL 기능 검증(R1~R7) | 미수행 | 배포 URL을 받은 뒤 진행 |
| R10 이름 통일(Vercel·Neon) | 미수행 | 사용자 대시보드 확인 필요 |
| R11 GitHub Public·`.env*` 미커밋 | 통과 | 인증 없이 `git ls-remote` 성공, 추적 파일에 `.env*` 없음 |
| R12 Vercel `DATABASE_URL`·최신 커밋 배포 | 미수행 | 배포 URL과 배포 상태 확인 필요 |

## 제출물
- GitHub: https://github.com/imnamexxo/guestbook-202404253
- Vercel: (배포 후 기록)
