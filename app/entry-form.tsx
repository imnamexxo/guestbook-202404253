"use client";

import { useActionState, useEffect, useRef } from "react";
import { createEntry, type ActionState } from "./actions";
import { LIMITS } from "@/lib/entry-limits";

const initialState: ActionState = { ok: false };

export const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
export const buttonClass =
  "rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";

export function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} className="mt-1 text-sm text-red-600 dark:text-red-400">
      {error}
    </p>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={`text-sm ${state.ok ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
    >
      {state.message}
    </p>
  );
}

export function EntryForm() {
  const [state, action, pending] = useActionState(createEntry, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // 성공하면 폼을 비운다. 실패하면 서버가 돌려준 값으로 입력칸이 다시 채워진다.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  const errors = state.fieldErrors ?? {};

  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <h2 className="text-lg font-semibold">글 남기기</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="new-name" className="mb-1 block text-sm font-medium">
            이름
          </label>
          <input
            id="new-name"
            name="name"
            required
            maxLength={LIMITS.name.max}
            defaultValue={state.values?.name}
            key={`name-${state.values?.name ?? ""}`}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "new-name-error" : undefined}
            className={inputClass}
          />
          <FieldError id="new-name-error" error={errors.name} />
        </div>
        <div>
          <label htmlFor="new-password" className="mb-1 block text-sm font-medium">
            비밀번호 <span className="font-normal text-zinc-500">(수정·삭제에 사용, 4~20자)</span>
          </label>
          <input
            id="new-password"
            name="password"
            type="password"
            required
            minLength={LIMITS.password.min}
            maxLength={LIMITS.password.max}
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "new-password-error" : undefined}
            className={inputClass}
          />
          <FieldError id="new-password-error" error={errors.password} />
        </div>
      </div>
      <div>
        <label htmlFor="new-message" className="mb-1 block text-sm font-medium">
          메시지
        </label>
        <textarea
          id="new-message"
          name="message"
          required
          rows={3}
          maxLength={LIMITS.message.max}
          defaultValue={state.values?.message}
          key={`message-${state.values?.message ?? ""}`}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "new-message-error" : undefined}
          className={inputClass}
        />
        <FieldError id="new-message-error" error={errors.message} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <FormMessage state={state} />
        <button type="submit" disabled={pending} className={`${buttonClass} ml-auto`}>
          {pending ? "등록 중…" : "등록"}
        </button>
      </div>
    </form>
  );
}
