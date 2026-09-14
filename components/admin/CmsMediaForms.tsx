"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import {
  AdminModal,
  AdminSelect,
  AdminCheckbox,
  SubmitButton,
  ConfirmDeleteButton,
} from "@/components/admin/ui";
import { SquareImageUpload } from "@/components/admin/SquareImageUpload";
import {
  upsertAchievement,
  upsertGalleryImage,
  upsertVideo,
  upsertLeadershipPerson,
  deleteAchievement,
  deleteGalleryImage,
  deleteVideo,
  deleteLeadershipPerson,
} from "@/app/(admin)/admin/cms-actions";

export function CmsAddAchievementModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const year = new Date().getFullYear();

  return (
    <AdminModal
      title="Add achievement"
      trigger="Add achievement"
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
      className="!w-[32rem]"
    >
      <form
        className="space-y-3"
        action={(fd) => {
          setError(null);
          startTransition(async () => {
            try {
              await upsertAchievement(fd);
              setOpen(false);
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to save");
            }
          });
        }}
      >
        <SquareImageUpload folder="achievements" name="photoUrl" label="Photo (optional)" />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="admin-label">
            Student
            <input className="admin-input mt-1" name="studentName" required />
          </label>
          <label className="admin-label">
            Result
            <input className="admin-input mt-1" name="result" required />
          </label>
          <label className="admin-label">
            Event
            <input className="admin-input mt-1" name="event" required />
          </label>
          <label className="admin-label">
            Level
            <input className="admin-input mt-1" name="level" placeholder="National / State…" required />
          </label>
          <label className="admin-label">
            Year
            <input className="admin-input mt-1" value={year} disabled readOnly />
          </label>
          <label className="admin-label">
            Venue
            <input className="admin-input mt-1" name="venue" />
          </label>
        </div>
        <label className="admin-label">
          Summary
          <textarea className="admin-input mt-1" name="summary" rows={2} />
        </label>
        <AdminCheckbox name="featured" label="Featured on home" />
        {error ? <p className="text-sm text-[var(--admin-red)]">{error}</p> : null}
        <SubmitButton className="w-full" disabled={pending}>
          {pending ? "Saving…" : "Save achievement"}
        </SubmitButton>
      </form>
    </AdminModal>
  );
}

export function CmsAddGalleryModal({
  disabled,
  remaining,
}: {
  disabled?: boolean;
  remaining: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (disabled) {
    return (
      <button type="button" className="btn-primary opacity-50" disabled>
        Limit reached ({remaining} left)
      </button>
    );
  }

  return (
    <AdminModal
      title="Add gallery image"
      trigger="Add image"
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
      className="!w-[32rem]"
    >
      <form
        className="space-y-3"
        action={(fd) => {
          setError(null);
          startTransition(async () => {
            try {
              await upsertGalleryImage(fd);
              setOpen(false);
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to save");
            }
          });
        }}
      >
        <SquareImageUpload folder="gallery" name="src" label="Image" required />
        <label className="admin-label">
          Alt text
          <input className="admin-input mt-1" name="alt" required />
        </label>
        <label className="admin-label">
          Category
          <AdminSelect
            className="mt-1"
            name="category"
            options={[
              { value: "TRAINING", label: "Training" },
              { value: "EVENTS", label: "Events" },
              { value: "MEDALS", label: "Medals" },
            ]}
          />
        </label>
        <AdminCheckbox name="featured" label="Featured" />
        {error ? <p className="text-sm text-[var(--admin-red)]">{error}</p> : null}
        <SubmitButton className="w-full" disabled={pending}>
          {pending ? "Saving…" : "Save image"}
        </SubmitButton>
      </form>
    </AdminModal>
  );
}

export function CmsAddVideoModal({
  disabled,
  remaining,
}: {
  disabled?: boolean;
  remaining: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (disabled) {
    return (
      <button type="button" className="btn-primary opacity-50" disabled>
        Limit reached ({remaining} left)
      </button>
    );
  }

  return (
    <AdminModal
      title="Add video"
      trigger="Add video"
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
      className="!w-[32rem]"
    >
      <form
        className="space-y-3"
        action={(fd) => {
          setError(null);
          startTransition(async () => {
            try {
              await upsertVideo(fd);
              setOpen(false);
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to save");
            }
          });
        }}
      >
        <label className="admin-label">
          YouTube ID or URL
          <input className="admin-input mt-1" name="youtubeId" placeholder="dQw4w9WgXcQ" required />
        </label>
        <label className="admin-label">
          Title
          <input className="admin-input mt-1" name="title" required />
        </label>
        <label className="admin-label">
          Summary
          <input className="admin-input mt-1" name="summary" />
        </label>
        {error ? <p className="text-sm text-[var(--admin-red)]">{error}</p> : null}
        <SubmitButton className="w-full" disabled={pending}>
          {pending ? "Saving…" : "Save video"}
        </SubmitButton>
      </form>
    </AdminModal>
  );
}

export function CmsAddLeadershipModal({
  disabled,
  remaining,
  nextSortOrder = 1,
}: {
  disabled?: boolean;
  remaining: number;
  nextSortOrder?: number;
}) {
  if (disabled) {
    return (
      <button type="button" className="btn-primary opacity-50" disabled>
        Limit reached ({remaining} left)
      </button>
    );
  }

  return (
    <CmsLeadershipFormModal
      trigger="Add person"
      title="Add leadership"
      defaultSortOrder={nextSortOrder}
    />
  );
}

export function CmsEditLeadershipModal({
  person,
}: {
  person: {
    id: string;
    name: string;
    position: string;
    photoUrl: string | null;
    sortOrder: number;
  };
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="admin-icon-btn"
        title="Edit"
        aria-label={`Edit ${person.name}`}
        onClick={() => setOpen(true)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <CmsLeadershipFormModal
        title={`Edit — ${person.name}`}
        open={open}
        onOpenChange={setOpen}
        person={person}
      />
    </>
  );
}

function CmsLeadershipFormModal({
  title,
  trigger,
  open: controlledOpen,
  onOpenChange,
  person,
  defaultSortOrder = 1,
}: {
  title: string;
  trigger?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  person?: {
    id: string;
    name: string;
    position: string;
    photoUrl: string | null;
    sortOrder: number;
  };
  defaultSortOrder?: number;
}) {
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  function setOpen(next: boolean) {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
    if (!next) setError(null);
  }

  return (
    <AdminModal
      title={title}
      trigger={trigger}
      open={open}
      onOpenChange={setOpen}
      className="!w-[32rem]"
    >
      <form
        key={person?.id ?? "new"}
        className="space-y-3"
        action={(fd) => {
          setError(null);
          startTransition(async () => {
            try {
              await upsertLeadershipPerson(fd);
              setOpen(false);
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to save");
            }
          });
        }}
      >
        {person ? <input type="hidden" name="id" value={person.id} /> : null}
        <SquareImageUpload
          folder="leadership"
          name="photoUrl"
          label="Photo (optional)"
          existingUrl={person?.photoUrl}
        />
        <label className="admin-label">
          Name
          <input className="admin-input mt-1" name="name" defaultValue={person?.name} required />
        </label>
        <label className="admin-label">
          Position
          <input
            className="admin-input mt-1"
            name="position"
            defaultValue={person?.position}
            required
          />
        </label>
        <label className="admin-label">
          Sort order
          <input
            className="admin-input mt-1"
            name="sortOrder"
            type="number"
            min={0}
            step={1}
            defaultValue={person?.sortOrder ?? defaultSortOrder}
            required
          />
        </label>
        <p className="text-xs text-[var(--admin-muted)]">
          Lower numbers appear first on the website.
        </p>
        {error ? <p className="text-sm text-[var(--admin-red)]">{error}</p> : null}
        <SubmitButton className="w-full" disabled={pending}>
          {pending ? "Saving…" : person ? "Save changes" : "Save person"}
        </SubmitButton>
      </form>
    </AdminModal>
  );
}

export function CmsDeleteButton({
  id,
  action,
  confirmMessage,
  icon = false,
}: {
  id: string;
  action:
    | typeof deleteAchievement
    | typeof deleteGalleryImage
    | typeof deleteVideo
    | typeof deleteLeadershipPerson;
  confirmMessage: string;
  icon?: boolean;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      {icon ? (
        <button
          type="submit"
          className="admin-icon-btn is-danger"
          title="Delete"
          aria-label="Delete"
          onClick={(e) => {
            if (!window.confirm(confirmMessage)) e.preventDefault();
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : (
        <ConfirmDeleteButton confirmMessage={confirmMessage} />
      )}
    </form>
  );
}

export function CmsMediaCard({
  children,
  footer,
}: {
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <article className="overflow-hidden rounded-lg border border-[var(--admin-border)] bg-white">
      {children}
      <div className="flex items-start justify-between gap-1.5 p-2">{footer}</div>
    </article>
  );
}
