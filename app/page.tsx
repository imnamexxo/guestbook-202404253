import { connection } from "next/server";
import { listEntries } from "@/lib/entries";
import { formatCreatedAt } from "@/lib/entry-rules";
import { EntryForm } from "./entry-form";
import { EntryItem } from "./entry-item";

const DEVELOPER = { name: "유소영", studentId: "202404253" };

export default async function Home() {
  // 요청마다 DB의 최신 글 목록을 읽도록 프리렌더링을 멈춘다.
  await connection();
  const entries = await listEntries();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <header className="mb-8 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <h1 className="text-3xl font-bold">방명록</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          개발자 <span className="font-medium">{DEVELOPER.name}</span> · 학번{" "}
          <span className="font-medium">{DEVELOPER.studentId}</span>
        </p>
      </header>

      <section className="mb-10">
        <EntryForm />
      </section>

      <section aria-labelledby="entry-list-heading">
        <h2 id="entry-list-heading" className="mb-4 text-lg font-semibold">
          글 목록 <span className="text-sm font-normal text-zinc-500">({entries.length})</span>
        </h2>
        {entries.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-zinc-500 dark:border-zinc-700">
            아직 작성된 글이 없습니다. 첫 글을 남겨 주세요.
          </p>
        ) : (
          <ul className="space-y-4">
            {entries.map((entry) => (
              <EntryItem
                key={entry.id}
                entry={{
                  id: entry.id,
                  name: entry.name,
                  message: entry.message,
                  createdAtIso: entry.createdAt.toISOString(),
                  createdAtText: formatCreatedAt(entry.createdAt),
                }}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
