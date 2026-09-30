-- 방명록 스키마. 기존 데이터를 보존하도록 생성만 하며, 여러 번 실행해도 안전하다.
-- DROP / TRUNCATE / DELETE 등 데이터를 지우는 문장은 넣지 않는다.
CREATE TABLE IF NOT EXISTS entries (
  id            BIGSERIAL    PRIMARY KEY,
  name          VARCHAR(20)  NOT NULL,
  message       VARCHAR(500) NOT NULL,
  password_hash TEXT         NOT NULL,
  password_salt TEXT         NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
