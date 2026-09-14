"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--admin-surface)] px-4">
      <form onSubmit={onSubmit} className="admin-card w-full max-w-md space-y-4">
        <div className="flex items-center gap-3">
          <Image
            src="/logo/logo.jpg"
            alt="CODISTA"
            width={56}
            height={56}
            className="h-14 w-14 rounded-md object-contain"
            priority
          />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Admin login</h1>
            <p className="text-sm text-[var(--admin-muted)]">Codista Academy management</p>
          </div>
        </div>
        <label className="admin-label">
          Email
          <input className="admin-input mt-1" name="email" type="email" required autoComplete="username" />
        </label>
        <label className="admin-label">
          Password
          <input
            className="admin-input mt-1"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="text-sm text-[var(--admin-red)]">{error}</p> : null}
        <button className="btn-primary w-full" type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
