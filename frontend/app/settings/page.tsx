"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sun, Moon, Monitor, Camera, Trash2, Save, User as UserIcon, Lock, ShieldAlert, LogOut,
} from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { Avatar } from "@/components/Avatar";
import { usePrefs } from "@/components/PrefsProvider";
import { useAuth } from "../providers";
import { api, ApiError } from "@/lib/api";

const THEMES = [
  { v: "light", label: "Light", icon: Sun },
  { v: "dark", label: "Dark", icon: Moon },
  { v: "system", label: "System", icon: Monitor },
] as const;

function Section({ icon: Icon, title, desc, children }: any) {
  return (
    <section className="card">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-paper-warm text-brand-500"><Icon className="h-5 w-5" /></span>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          {desc && <p className="text-sm text-ink-muted">{desc}</p>}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

async function fileToAvatar(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  return new Promise<string>((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const size = 256;
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const ctx = c.getContext("2d")!;
      const s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      res(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = rej;
    img.src = dataUrl;
  });
}

function SettingsInner() {
  const { theme, setTheme, avatar, setAvatar } = usePrefs();
  const { user, refresh, logout } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [pw, setPw] = useState({ current_password: "", new_password: "" });
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setAvatar(await fileToAvatar(file));
    e.target.value = "";
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusy("profile"); setProfileMsg(null);
    try {
      await api.patch("/api/auth/me", profile);
      await refresh();
      setProfileMsg("Profile saved.");
    } catch (err) {
      setProfileMsg(err instanceof ApiError ? err.message : "Failed to save.");
    } finally { setBusy(null); }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy("pw"); setPwMsg(null);
    try {
      await api.post("/api/auth/change-password", pw);
      setPwMsg({ ok: true, text: "Password updated." });
      setPw({ current_password: "", new_password: "" });
    } catch (err) {
      setPwMsg({ ok: false, text: err instanceof ApiError ? err.message : "Failed." });
    } finally { setBusy(null); }
  }

  async function deleteAccount() {
    setBusy("delete");
    try {
      await api.del("/api/auth/account");
      setAvatar(null);
      await logout().catch(() => {});
      router.push("/");
    } finally { setBusy(null); }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="animate-fade-up">
        <span className="eyebrow">Settings</span>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Your account</h1>
      </header>

      {/* Appearance */}
      <Section icon={Sun} title="Appearance" desc="Choose how NutriFit looks.">
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => {
            const active = theme === t.v;
            return (
              <button key={t.v} onClick={() => setTheme(t.v)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition ${
                  active ? "border-brand-500 bg-brand-500/12 text-brand-500" : "border-ink/10 text-ink-muted hover:border-ink/20"}`}>
                <t.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Profile */}
      <Section icon={UserIcon} title="Profile" desc="Your display image and details.">
        <div className="flex items-center gap-4">
          <Avatar src={avatar} name={user?.name} size={72} />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => fileRef.current?.click()} className="btn-ghost px-4 py-2 text-sm">
              <Camera className="h-4 w-4" /> Upload image
            </button>
            {avatar && (
              <button onClick={() => setAvatar(null)} className="btn-ghost px-4 py-2 text-sm">
                <Trash2 className="h-4 w-4" /> Remove
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
          </div>
        </div>

        <form onSubmit={saveProfile} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label className="label">Full name</label>
              <input className="input" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="field">
              <label className="label">Phone</label>
              <input className="input" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
            </div>
          </div>
          <div className="field">
            <label className="label">Email</label>
            <input className="input opacity-60" value={user?.email || ""} disabled />
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-primary px-5 py-2.5" disabled={busy === "profile"}>
              <Save className="h-4 w-4" /> {busy === "profile" ? "Saving…" : "Save changes"}
            </button>
            {profileMsg && <span className="text-sm text-ink-muted">{profileMsg}</span>}
          </div>
        </form>
      </Section>

      {/* Security */}
      <Section icon={Lock} title="Security" desc="Change your password.">
        <form onSubmit={changePassword} className="space-y-4">
          <div className="field">
            <label className="label">Current password</label>
            <input type="password" className="input" value={pw.current_password}
              onChange={(e) => setPw((p) => ({ ...p, current_password: e.target.value }))} required />
          </div>
          <div className="field">
            <label className="label">New password</label>
            <input type="password" className="input" minLength={8} value={pw.new_password}
              onChange={(e) => setPw((p) => ({ ...p, new_password: e.target.value }))} required />
            <p className="text-xs text-ink-faint">At least 8 characters.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-primary px-5 py-2.5" disabled={busy === "pw"}>
              {busy === "pw" ? "Updating…" : "Update password"}
            </button>
            {pwMsg && <span className={`text-sm ${pwMsg.ok ? "text-brand-600" : "text-rose-600"}`}>{pwMsg.text}</span>}
          </div>
        </form>
      </Section>

      {/* Sign out */}
      <button onClick={async () => { await logout(); router.push("/"); }}
        className="btn-ghost w-full justify-center py-3">
        <LogOut className="h-4 w-4" /> Log out
      </button>

      {/* Danger zone */}
      <Section icon={ShieldAlert} title="Danger zone" desc="Permanently delete your account and all data.">
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)}
            className="btn w-full justify-center border border-rose-500/30 bg-rose-500/10 py-3 text-rose-700 hover:bg-rose-100">
            <Trash2 className="h-4 w-4" /> Delete my account
          </button>
        ) : (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
            <p className="text-sm font-medium text-rose-400">This can't be undone. Delete your account and all logs?</p>
            <div className="mt-3 flex gap-2">
              <button onClick={deleteAccount} disabled={busy === "delete"}
                className="btn bg-rose-600 px-4 py-2 text-white hover:bg-rose-700">
                {busy === "delete" ? "Deleting…" : "Yes, delete"}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="btn-ghost px-4 py-2">Cancel</button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

export default function SettingsPage() {
  return <RequireAuth><SettingsInner /></RequireAuth>;
}
