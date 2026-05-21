import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans">
      <main className="max-w-3xl w-full px-8 py-24">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
          Reflection Pool
        </h1>
        <p className="mt-3 text-lg text-zinc-600">
          Build embeddable reflection prompts and quizzes for any topic. Pick a
          theme, get a snippet, paste it into your site.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/admin"
            className="inline-flex h-11 items-center rounded-lg bg-zinc-900 px-5 text-white font-medium hover:bg-zinc-800"
          >
            Open admin
          </Link>
        </div>
      </main>
    </div>
  );
}
