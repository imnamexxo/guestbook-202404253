"use client";

import { useActionState, useEffect, useState } from "react";
import { editEntry, removeEntry, type ActionState } from "./actions";
import { buttonClass, FieldError, FormMessage, inputClass } from "./entry-form";
import { LIMITS } from "@/lib/entry-limits";

export type EntryView = {
  id: string;
  name: string;
  message: string;
  createdAtIso: string;
  createdAtText: string;
};

type Mode = "view" | "edit" | "delete";

const initialState: ActionState = { ok: false };
const secondaryButtonClass =
  "rounded-md border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";

export function EntryItem({ entry }: { entry: EntryView }) {
  const [mode, setMode] = useState<Mode>("view");
  const close = () => setMode("view");

  return (
    <li className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-semibold break-all">{entry.name}</span>
        <time dateTime={entry.createdAtIso} className="shrink-0 text-sm text-zinc-500">
          {entry.createdAtText}
        </time>
      </div>
      <p className="mt-2 whitespace-pre-wrap break-words">{entry.message}</p>

      {mode === "view" && (
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" className={secondaryButtonClass} onClick={() => setMode("edit")}>
            수정
          </button>
          <button type="button" className={secondaryButtonClass} onClick={() => setMode("delete")}>
            삭제
          </button>
        </div>
      )}
      {mode === "edit" && <EditForm entry={entry} onDone={close} />}
      {mode === "delete" && <DeleteForm entry={entry} onDone={close} />}
    </li>
  );
}

function PasswordField({ id, error }: { id: string; error?: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        비밀번호
      </label>
      <input
        id={id}
        name="password"
        type="password"
        required
        minLength={LIMITS.password.min}
        maxLength={LIMITS.password.max}
        autoComplete="current-password"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputClass}
      />
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}

function EditForm({ entry, onDone }: { entry: EntryView; onDone: () => void }) {
  const [state, action, pending] = useActionState(editEntry, initialState);
  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  const errors = state.fieldErrors ?? {};
  const messageId = `edit-message-${entry.id}`;

  return (
    <form action={action} className="mt-3 space-y-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
      <input type="hidden" name="id" value={entry.id} />
      <div>
        <label htmlFor={messageId} className="mb-1 block text-sm font-medium">
          메시지 수정
        </label>
        <textarea
          id={messageId}
          name="message"
          required
          rows={3}
          maxLength={LIMITS.message.max}
          defaultValue={state.values?.message ?? entry.message}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? `${messageId}-error` : undefined}
          className={inputClass}
        />
        <FieldError id={`${messageId}-error`} error={errors.message} />
      </div>
      <PasswordField id={`edit-password-${entry.id}`} error={errors.password} />
      <FormMessage state={state} />
      <div className="flex justify-end gap-2">
        <button type="button" className={secondaryButtonClass} onClick={onDone}>
          취소
        </button>
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "저장 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}

function DeleteForm({ entry, onDone }: { entry: EntryView; onDone: () => void }) {
  const [state, action, pending] = useActionState(removeEntry, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="mt-3 space-y-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
      <input type="hidden" name="id" value={entry.id} />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        글을 쓸 때 정한 비밀번호를 입력하면 이 글이 삭제됩니다.
      </p>
      <PasswordField id={`delete-password-${entry.id}`} error={errors.password} />
      <FormMessage state={state} />
      <div className="flex justify-end gap-2">
        <button type="button" className={secondaryButtonClass} onClick={onDone}>
          취소
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
        >
          {pending ? "삭제 중…" : "삭제"}
        </button>
      </div>
    </form>
  );
}
