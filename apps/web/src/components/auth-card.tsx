import { LotusMark } from "./logo";

export function AuthCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="container-page flex min-h-screen items-center justify-center py-28">
      <div className="card-organic w-full max-w-md p-9">
        <LotusMark className="mx-auto h-12 w-12 text-forest-800" />
        <h1 className="mt-4 text-center font-display text-3xl font-medium text-forest-900">{title}</h1>
        {sub && <p className="mt-2 text-center text-sm text-bark/60">{sub}</p>}
        <div className="mt-7">{children}</div>
      </div>
    </div>
  );
}
