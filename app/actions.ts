"use server";

import { revalidatePath } from "next/cache";
import { deleteEntry, getEntryCredentials, insertEntry, updateMessage } from "@/lib/entries";
import {
  hashPassword,
  parseEntryId,
  validateMessage,
  validateNewEntry,
  validatePassword,
  verifyPassword,
  type FieldErrors,
} from "@/lib/entry-rules";

/** 폼에 돌려주는 결과. 실패하면 입력값을 되돌려주되 비밀번호는 절대 포함하지 않는다. */
export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: FieldErrors;
  values?: { name?: string; message?: string };
};

const NOT_FOUND = "이미 삭제되었거나 존재하지 않는 글입니다.";
const WRONG_PASSWORD = "비밀번호가 일치하지 않습니다. 글은 변경되지 않았습니다.";
const SERVER_ERROR = "일시적인 오류로 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";

export async function createEntry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = {
    name: formData.get("name"),
    message: formData.get("message"),
    password: formData.get("password"),
  };
  const values = {
    name: typeof raw.name === "string" ? raw.name : "",
    message: typeof raw.message === "string" ? raw.message : "",
  };

  const checked = validateNewEntry(raw);
  if (!checked.ok) {
    return { ok: false, message: "입력값을 확인해 주세요.", fieldErrors: checked.errors, values };
  }

  try {
    const { hash, salt } = await hashPassword(checked.value.password);
    await insertEntry({
      name: checked.value.name,
      message: checked.value.message,
      passwordHash: hash,
      passwordSalt: salt,
    });
  } catch (error) {
    console.error("createEntry failed", error);
    return { ok: false, message: SERVER_ERROR, values };
  }

  revalidatePath("/");
  return { ok: true, message: "글이 등록되었습니다." };
}

/**
 * 글 비밀번호를 확인한다. 글이 없거나 비밀번호가 틀리면 돌려줄 실패 상태를,
 * 일치하면 null을 돌려준다. 이 단계에서는 DB에 아무것도 쓰지 않는다.
 */
async function checkEntryPassword(
  id: string,
  password: string,
  values: ActionState["values"],
): Promise<ActionState | null> {
  const credentials = await getEntryCredentials(id);
  if (!credentials) return { ok: false, message: NOT_FOUND, values };
  const matches = await verifyPassword(password, credentials.passwordHash, credentials.passwordSalt);
  if (!matches) return { ok: false, message: WRONG_PASSWORD, values };
  return null;
}

export async function editEntry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const rawMessage = formData.get("message");
  const values = { message: typeof rawMessage === "string" ? rawMessage : "" };

  const id = parseEntryId(formData.get("id"));
  if (!id) return { ok: false, message: NOT_FOUND, values };

  const message = validateMessage(rawMessage);
  const password = validatePassword(formData.get("password"));
  if (!message.ok || !password.ok) {
    const fieldErrors: FieldErrors = {};
    if (!message.ok) fieldErrors.message = message.error;
    if (!password.ok) fieldErrors.password = password.error;
    return { ok: false, message: "입력값을 확인해 주세요. 글은 변경되지 않았습니다.", fieldErrors, values };
  }

  try {
    const rejected = await checkEntryPassword(id, password.value, values);
    if (rejected) return rejected;
    if (!(await updateMessage(id, message.value))) return { ok: false, message: NOT_FOUND, values };
  } catch (error) {
    console.error("editEntry failed", error);
    return { ok: false, message: SERVER_ERROR, values };
  }

  revalidatePath("/");
  return { ok: true, message: "메시지가 수정되었습니다." };
}

export async function removeEntry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = parseEntryId(formData.get("id"));
  if (!id) return { ok: false, message: NOT_FOUND };

  const password = validatePassword(formData.get("password"));
  if (!password.ok) {
    return { ok: false, message: "입력값을 확인해 주세요. 글은 삭제되지 않았습니다.", fieldErrors: { password: password.error } };
  }

  try {
    const rejected = await checkEntryPassword(id, password.value, undefined);
    if (rejected) return rejected;
    if (!(await deleteEntry(id))) return { ok: false, message: NOT_FOUND };
  } catch (error) {
    console.error("removeEntry failed", error);
    return { ok: false, message: SERVER_ERROR };
  }

  revalidatePath("/");
  return { ok: true, message: "글이 삭제되었습니다." };
}
