import { useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useAuth } from "@clerk/react";
import { CheckCircle2, Loader2, MailCheck, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useAcceptInvite } from "@/hooks/use-organizations";
import { errorMessage } from "@/hooks/use-account";
import { usePageMeta } from "@/lib/meta";

export default function InvitePage() {
  usePageMeta("Accept invitation", "Join an organization on AGENTNEX.");
  const search = useSearch();
  const token = useMemo(() => new URLSearchParams(search).get("token") ?? "", [search]);
  const valid = /^[A-Za-z0-9_-]{43}$/.test(token);
  const { isLoaded, isSignedIn } = useAuth();
  const accept = useAcceptInvite();
  const [, setLocation] = useLocation();
  const [error, setError] = useState("");
  const returnTo = `/invite?token=${encodeURIComponent(token)}`;

  const go = () => {
    setError("");
    accept.mutate({ data: { token } }, {
      onSuccess: (r) => setLocation(`/organizations/${r.organizationId}`, { replace: true }),
      onError: (e) => setError(errorMessage(e)),
    });
  };

  let body;
  if (!valid) {
    body = (<><ShieldAlert className="h-8 w-8 text-destructive" aria-hidden /><h1 className="mt-4 text-xl font-semibold">Invitation link is invalid</h1><p className="mt-2 text-sm text-muted-foreground">The link is incomplete or malformed. Ask the person who invited you for a new link.</p></>);
  } else if (!isLoaded) {
    body = <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading" />;
  } else if (!isSignedIn) {
    body = (
      <>
        <MailCheck className="h-8 w-8 text-cyan" aria-hidden />
        <h1 className="mt-4 text-xl font-semibold">You have an organization invitation</h1>
        <p className="mt-2 text-sm text-muted-foreground">Log in or create an account with the invited email address, then accept here.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href={`/sign-in?returnTo=${encodeURIComponent(returnTo)}`} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground" data-testid="link-invite-sign-in">Log in</Link>
          <Link href={`/sign-up?returnTo=${encodeURIComponent(returnTo)}`} className="rounded-full border border-border px-5 py-2 text-sm font-semibold" data-testid="link-invite-sign-up">Create account</Link>
        </div>
      </>
    );
  } else {
    body = (
      <>
        {accept.isSuccess ? <CheckCircle2 className="h-8 w-8 text-cyan" aria-hidden /> : <MailCheck className="h-8 w-8 text-cyan" aria-hidden />}
        <h1 className="mt-4 text-xl font-semibold">Join organization</h1>
        <p className="mt-2 text-sm text-muted-foreground">Accepting adds you with the role chosen by the inviter. The invitation must match your signed-in email.</p>
        {error && <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert" data-testid="text-invite-accept-error">{error}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={go} disabled={accept.isPending || accept.isSuccess} data-testid="button-accept-invite">{accept.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}Accept invitation</Button>
          <Link href="/dashboard" className="inline-flex items-center rounded-md border border-border px-4 text-sm font-medium" data-testid="link-invite-decline">Not now</Link>
        </div>
      </>
    );
  }

  return (
    <div className="noise flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4">
      <div className="grid-bg pointer-events-none fixed inset-0" aria-hidden />
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <div className="surface flex flex-col items-center rounded-2xl p-8 text-center" data-testid="panel-invite">{body}</div>
      </div>
    </div>
  );
}
