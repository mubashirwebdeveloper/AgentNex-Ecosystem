import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser } from "@clerk/react";
import { Loader2, Save, MapPin, Clock, Languages, BadgeCheck } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ErrorState } from "@/components/app/states";
import { SearchSelect } from "@/components/app/search-select";
import { AccountTypePicker, LanguageSelect, LANGUAGE_NOTE } from "@/components/app/profile-fields";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe, useSaveProfile, errorMessage } from "@/hooks/use-account";
import { useToast } from "@/hooks/use-toast";
import { ACCOUNT_TYPES, COUNTRIES, LANGUAGES, TIMEZONES } from "@/lib/nav";
import { usePageMeta } from "@/lib/meta";

const schema = z.object({
  displayName: z.string().trim().min(1, "Display name is required").max(80, "Keep it under 80 characters"),
  accountType: z.enum(["individual", "business", "developer"]),
  country: z.string().min(1, "Country is required").max(80),
  timezone: z.string().min(1, "Timezone is required").max(80),
  language: z.enum(["en", "es", "fr", "de", "ar", "ur", "zh"]),
  description: z.string().max(1000, "Keep it under 1000 characters"),
});
type Values = z.infer<typeof schema>;

export default function ProfilePage() {
  usePageMeta("My profile", "View and edit your AGENTNEX profile.");
  const me = useMe();
  const save = useSaveProfile();
  const { toast } = useToast();
  const { user } = useUser();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { displayName: "", accountType: "individual", country: "", timezone: "", language: "en", description: "" } });
  const initFor = useRef<string | null>(null);

  useEffect(() => {
    if (me.data && initFor.current !== me.data.id) {
      initFor.current = me.data.id;
      const p = me.data;
      form.reset({ displayName: p.displayName, accountType: p.accountType, country: p.country, timezone: p.timezone, language: p.language, description: p.description });
    }
  }, [me.data, form]);

  const onSubmit = (v: Values) => {
    save.mutate(
      { data: { ...v, displayName: v.displayName.trim(), description: v.description.trim() } },
      {
        onSuccess: (p) => {
          form.reset({ displayName: p.displayName, accountType: p.accountType, country: p.country, timezone: p.timezone, language: p.language, description: p.description });
          toast({ title: "Profile saved", description: "Your changes are stored on your account." });
        },
        onError: (err) => toast({ title: "Profile not saved", description: errorMessage(err), variant: "destructive" }),
      },
    );
  };

  if (me.isLoading) return <div data-testid="status-profile-loading"><Skeleton className="h-9 w-48" /><Skeleton className="mt-6 h-40 rounded-2xl" /><Skeleton className="mt-5 h-96 rounded-2xl" /></div>;
  if (me.isError || !me.data) return <ErrorState title="Your profile did not load" onRetry={() => me.refetch()} />;
  const p = me.data;
  const initials = (p.displayName || "A").split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
  const dirty = form.formState.isDirty;

  return (
    <div>
      <PageHeader crumbs={[{ label: "Overview", href: "/dashboard" }, { label: "My profile" }]} title="My profile" description="This information is private to your account in Phase 1." />

      <section className="surface relative mb-5 overflow-hidden rounded-2xl">
        <div className="h-24 bg-gradient-to-r from-primary/40 via-cyan/25 to-ember/25" aria-hidden />
        <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:px-6">
          <span className="-mt-10 inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-card bg-gradient-to-br from-primary to-cyan font-display text-2xl font-bold text-primary-foreground">{initials}</span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-semibold" data-testid="text-profile-name">{p.displayName || "Unnamed member"}</h2>
            <p className="text-sm text-muted-foreground">{ACCOUNT_TYPES.find((a) => a.value === p.accountType)?.label} · {user?.primaryEmailAddress?.emailAddress}</p>
          </div>
          <ul className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {p.country && <li className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1"><MapPin className="h-3 w-3" aria-hidden />{p.country}</li>}
            {p.timezone && <li className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1"><Clock className="h-3 w-3" aria-hidden />{p.timezone.replace(/_/g, " ")}</li>}
            <li className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1"><Languages className="h-3 w-3" aria-hidden />{LANGUAGES.find((l) => l.value === p.language)?.label}</li>
            <li className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1"><BadgeCheck className="h-3 w-3" aria-hidden />Unverified · verification comes later</li>
          </ul>
        </div>
      </section>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="surface space-y-6 rounded-2xl p-5 sm:p-6" noValidate>
          <div className="grid gap-5 md:grid-cols-2">
            <FormField control={form.control} name="displayName" render={({ field }) => (
              <FormItem className="md:col-span-2"><FormLabel>Display name</FormLabel><FormControl><Input {...field} maxLength={80} className="h-11 rounded-xl bg-background/60" data-testid="input-display-name" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="accountType" render={({ field }) => (
              <FormItem className="md:col-span-2"><FormLabel>Account type</FormLabel><AccountTypePicker value={field.value} onChange={field.onChange} /><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="country" render={({ field }) => (
              <FormItem><FormLabel>Country</FormLabel><SearchSelect value={field.value} onChange={field.onChange} options={COUNTRIES} placeholder="Select country" searchLabel="Search countries" testId="select-country" invalid={!!form.formState.errors.country} /><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="timezone" render={({ field }) => (
              <FormItem><FormLabel>Timezone</FormLabel><SearchSelect value={field.value} onChange={field.onChange} options={TIMEZONES} placeholder="Select timezone" searchLabel="Search timezones" testId="select-timezone" invalid={!!form.formState.errors.timezone} /><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="language" render={({ field }) => (
              <FormItem className="md:col-span-2"><FormLabel>Preferred language</FormLabel><LanguageSelect value={field.value} onChange={field.onChange} /><FormDescription>{LANGUAGE_NOTE}</FormDescription><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem className="md:col-span-2"><FormLabel>Professional description</FormLabel><FormControl><Textarea {...field} rows={5} maxLength={1000} className="rounded-xl bg-background/60" data-testid="input-description" /></FormControl><FormDescription>{field.value.length}/1000 characters</FormDescription><FormMessage /></FormItem>
            )} />
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-end">
            {dirty && <span className="text-xs text-ember sm:mr-auto" role="status">You have unsaved changes</span>}
            <button type="button" disabled={!dirty || save.isPending} onClick={() => form.reset()} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold disabled:opacity-50" data-testid="button-reset-profile">Discard</button>
            <button type="submit" disabled={!dirty || save.isPending} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50" data-testid="button-save-profile">
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}Save changes
            </button>
          </div>
        </form>
      </Form>
    </div>
  );
}
