import Link from "next/link";
import { LotusMark } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center pt-24 text-center">
      <LotusMark className="h-14 w-14 text-sand-dark" />
      <h1 className="mt-6 font-display text-5xl text-forest-900">Lost in the fields</h1>
      <p className="mt-3 max-w-sm text-sm text-bark/60">This page seems to have wandered off with the herd. Let's take you back home.</p>
      <Link href="/" className="btn-primary mt-8">Back to home</Link>
    </div>
  );
}
