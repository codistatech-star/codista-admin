"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      type="button"
      className="btn-secondary px-3 py-1.5 text-xs"
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
    >
      Logout
    </button>
  );
}
