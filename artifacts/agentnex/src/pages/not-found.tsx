import { Link } from "wouter";
import { Compass } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { usePageMeta } from "@/lib/meta";

export default function NotFound() {
  usePageMeta("Page not found", "This AGENTNEX page does not exist.");
  return (
    <div className="noise flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6 text-center">
      <Logo />
      <p className="mt-10 font-mono text-sm text-cyan">404</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">This node is not on the map.</h1>
      <p className="mt-3 max-w-md text-muted-foreground">The page you are looking for does not exist or has moved.</p>
      <Link href="/" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground" data-testid="link-404-home"><Compass className="h-4 w-4" aria-hidden />Return home</Link>
    </div>
  );
}
