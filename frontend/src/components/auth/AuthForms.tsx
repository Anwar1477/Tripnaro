"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, MailCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { errorMessage } from "@/lib/api";
import { authService } from "@/services";
import { toast } from "@/store/toast";
import { Button } from "../common/Button";
import { Alert } from "../common/Feedback";
import { Input } from "../common/FormControls";

const password = z.string().min(8, "At least 8 characters").regex(/[A-Za-z]/, "Include a letter").regex(/\d/, "Include a number");

/** Only allow same-site relative redirects after sign-in. */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/my-account";
}

function PasswordInput(props: React.ComponentProps<typeof Input>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className="pr-11" />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute top-[2.15rem] right-2 grid size-8 place-items-center rounded text-ink-500 hover:text-ink-800">
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

const loginSchema = z.object({ email: z.string().trim().email("Enter a valid email"), password: z.string().min(1, "Enter your password") });

export function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const { user, setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (user) router.replace(user.role === "admin" && next === "/my-account" ? "/admin" : next);
  }, [user, next, router]);

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit(async (v) => {
        setError(null);
        try {
          const { data } = await authService.login(v);
          setUser(data.user);
          toast.success(`Welcome back, ${data.user.name.split(" ")[0]}!`);
        } catch (err) {
          setError(errorMessage(err));
        }
      })}
    >
      {error && <Alert tone="error">{error}</Alert>}
      <Input label="Email" type="email" autoComplete="email" required error={errors.email?.message} {...register("email")} />
      <PasswordInput label="Password" autoComplete="current-password" required error={errors.password?.message} {...register("password")} />
      <div className="text-right text-sm"><Link href="/forgot-password" className="font-semibold text-brand-700 hover:underline">Forgot password?</Link></div>
      <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>Sign in</Button>
      <p className="text-center text-sm text-ink-600">New to Tripnaro? <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-700 hover:underline">Create an account</Link></p>
    </form>
  );
}

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name").max(80),
    email: z.string().trim().email("Enter a valid email"),
    phone: z.string().trim().regex(/^(\+?[0-9\s-]{8,16})?$/, "Enter a valid phone number").optional(),
    password,
    confirm: z.string(),
    terms: z.literal(true, { error: "Please accept the terms" }),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match" });

export function RegisterForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const { user, setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof registerSchema>>({ resolver: zodResolver(registerSchema) });

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit(async ({ name, email, phone, password: pw }) => {
        setError(null);
        try {
          const { data } = await authService.register({ name, email, phone: phone || undefined, password: pw });
          setUser(data.user);
          toast.success("Account created. Welcome to Tripnaro!");
        } catch (err) {
          setError(errorMessage(err));
        }
      })}
    >
      {error && <Alert tone="error">{error}</Alert>}
      <Input label="Full name" autoComplete="name" required error={errors.name?.message} {...register("name")} />
      <Input label="Email" type="email" autoComplete="email" required error={errors.email?.message} {...register("email")} />
      <Input label="Mobile (optional)" type="tel" autoComplete="tel" placeholder="+8801XXXXXXXXX" error={errors.phone?.message} {...register("phone")} />
      <PasswordInput label="Password" autoComplete="new-password" required hint="8+ characters with a letter and a number" error={errors.password?.message} {...register("password")} />
      <PasswordInput label="Confirm password" autoComplete="new-password" required error={errors.confirm?.message} {...register("confirm")} />
      <label className="flex items-start gap-2 text-sm text-ink-700">
        <input type="checkbox" className="mt-0.5 size-4 accent-brand-600" {...register("terms")} />
        <span>I agree to the <Link href="/info/terms" className="font-semibold text-brand-700 underline">terms</Link> and <Link href="/info/privacy" className="font-semibold text-brand-700 underline">privacy policy</Link>.</span>
      </label>
      {errors.terms && <p className="text-[13px] text-coral-600" role="alert">{errors.terms.message}</p>}
      <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>Create account</Button>
      <p className="text-center text-sm text-ink-600">Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-700 hover:underline">Sign in</Link></p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [devUrl, setDevUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ email: string }>({ resolver: zodResolver(z.object({ email: z.string().trim().email("Enter a valid email") })) });

  if (sent)
    return (
      <div className="space-y-4">
        <Alert tone="success" title="Check your inbox">If an account exists for that email, we&apos;ve sent a link to reset your password. It expires in 30 minutes.</Alert>
        {devUrl && (
          <Alert tone="warning" title="Development mode">
            Email is printed to the server console (no SMTP configured). Reset link: <a href={devUrl} className="font-semibold break-all underline">{devUrl}</a>
          </Alert>
        )}
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700"><MailCheck className="size-4" />Back to sign in</Link>
      </div>
    );

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit(async ({ email }) => {
        setError(null);
        try {
          const { data } = await authService.forgotPassword(email);
          setDevUrl(data?.devResetUrl ?? null);
          setSent(true);
        } catch (err) {
          setError(errorMessage(err));
        }
      })}
    >
      {error && <Alert tone="error">{error}</Alert>}
      <Input label="Email" type="email" autoComplete="email" required error={errors.email?.message} {...register("email")} />
      <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>Send reset link</Button>
      <p className="text-center text-sm"><Link href="/login" className="font-semibold text-brand-700 hover:underline">Back to sign in</Link></p>
    </form>
  );
}

const resetSchema = z.object({ password, confirm: z.string() }).refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match" });

export function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const router = useRouter();
  const { setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) });

  if (!token) return <Alert tone="error" title="Invalid link">This reset link is missing its token. <Link href="/forgot-password" className="underline">Request a new one</Link>.</Alert>;

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit(async ({ password: pw }) => {
        setError(null);
        try {
          const { data } = await authService.resetPassword(token, pw);
          setUser(data.user);
          toast.success("Password updated. You're signed in.");
          router.replace("/my-account");
        } catch (err) {
          setError(errorMessage(err));
        }
      })}
    >
      {error && <Alert tone="error">{error}</Alert>}
      <PasswordInput label="New password" autoComplete="new-password" required hint="8+ characters with a letter and a number" error={errors.password?.message} {...register("password")} />
      <PasswordInput label="Confirm new password" autoComplete="new-password" required error={errors.confirm?.message} {...register("confirm")} />
      <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>Update password</Button>
    </form>
  );
}
