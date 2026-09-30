"use server";

import { revalidatePath } from "next/cache";
import { insertEntry } from "@/lib/entries";
import { hashPassword, validateNewEntry, type FieldErrors } from "@/lib/entry-rules";

/** 폼에 돌려주는 결과. 실패하면 입력값을 되돌려주되 비밀번호는 절대 포함하지 않는다. */
export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: FieldErrors;
  values?: { name?: string; message?: string };
};

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
