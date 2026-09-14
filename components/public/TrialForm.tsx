"use client";

import { FormEvent, useState } from "react";

export function TrialForm({
  programs,
  locations,
  whatsapp,
}: {
  programs: { name: string }[];
  locations: { name: string }[];
  whatsapp: string;
}) {
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const program = String(fd.get("program") || "").trim();
    const branch = String(fd.get("branch") || "").trim();
    const message = String(fd.get("message") || "").trim();

    await fetch("/api/trial", {
      method: "POST",
      body: fd,
    });

    const text = [
      "CODISTA Free Trial Request",
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Program: ${program || "Not specified"}`,
      `Branch: ${branch || "Not specified"}`,
      message ? `Message: ${message}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    setSent(true);
    form.reset();
  }

  return (
    <form id="trial-form" onSubmit={onSubmit} className="glass-card grid gap-4 p-6 md:p-8">
      <label className="block text-sm font-medium">
        Name
        <input required name="name" className="admin-input mt-1" type="text" autoComplete="name" />
      </label>
      <label className="block text-sm font-medium">
        Phone
        <input required name="phone" className="admin-input mt-1" type="tel" autoComplete="tel" />
      </label>
      <label className="block text-sm font-medium">
        Program
        <select name="program" className="admin-input mt-1">
          <option value="">Select a program</option>
          {programs.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        Preferred branch
        <select name="branch" className="admin-input mt-1">
          <option value="">Select branch</option>
          {locations.map((l) => (
            <option key={l.name} value={l.name}>
              {l.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        Message
        <textarea name="message" rows={4} className="admin-input mt-1" />
      </label>
      <button className="btn-primary" type="submit">
        Send via WhatsApp
      </button>
      {sent ? <p className="text-sm text-emerald-700">Opening WhatsApp…</p> : null}
    </form>
  );
}
