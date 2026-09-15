import { SafeImage } from "@/components/public/SafeImage";

export type PublicEventCard = {
  id: string;
  title: string;
  startsAt: Date | string;
  venue: string;
  description: string | null;
  imageUrl: string | null;
  registrationUrl: string | null;
};

export function formatEventDateTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EventCard({ event }: { event: PublicEventCard }) {
  return (
    <article className="glass-card-gold flex h-full flex-col overflow-hidden">
      <SafeImage src={event.imageUrl} alt={event.title} />
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold-deep">
          {formatEventDateTime(event.startsAt)}
        </p>
        <h3 className="mt-2 text-2xl">{event.title}</h3>
        <p className="mt-1 text-sm font-medium text-slate-600">{event.venue}</p>
        {event.description ? (
          <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{event.description}</p>
        ) : (
          <div className="flex-1" />
        )}
        {event.registrationUrl ? (
          <a
            className="btn-primary mt-5 self-start"
            href={event.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Register
          </a>
        ) : null}
      </div>
    </article>
  );
}
