export type AttendanceMemberStat = {
  memberId: string;
  name: string;
  code: string;
  batches: string[];
  present: number;
  sessionsHeld: number;
  pct: number | null;
  lastPresent: number;
  lastSessionsHeld: number;
  lastPct: number | null;
  /** positive = improved, negative = declined */
  trend: number | null;
};

export type AttendanceSessionLog = {
  id: string;
  date: Date;
  batchName: string;
  present: number;
  marked: number;
  takenBy: string | null;
};

export type AttendanceReport = {
  members: AttendanceMemberStat[];
  sessions: AttendanceSessionLog[];
  overallPct: number | null;
  below70: number;
  sessionsHeld: number;
  totalPresentMarks: number;
  totalPossibleMarks: number;
};

type SessionInput = {
  id: string;
  date: Date;
  batchId: string;
  batch: { name: string };
  takenBy: { name: string } | null;
  entries: { memberId: string; isPresent: boolean }[];
};

type MemberInput = {
  id: string;
  name: string;
  code: string;
  batches: { batchId: string; batch: { name: string } }[];
};

function pct(present: number, held: number): number | null {
  if (!held) return null;
  return Math.round((present / held) * 100);
}

export function buildAttendanceReport(input: {
  members: MemberInput[];
  sessionsThisMonth: SessionInput[];
  sessionsLastMonth: SessionInput[];
  batchFilter?: string | null;
}): AttendanceReport {
  const batchFilter = input.batchFilter || null;

  const sessions = (batchFilter
    ? input.sessionsThisMonth.filter((s) => s.batchId === batchFilter)
    : input.sessionsThisMonth
  )
    .slice()
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const sessionLogs: AttendanceSessionLog[] = sessions.map((s) => ({
    id: s.id,
    date: s.date,
    batchName: s.batch.name,
    present: s.entries.filter((e) => e.isPresent).length,
    marked: s.entries.length,
    takenBy: s.takenBy?.name ?? null,
  }));

  const members = input.members
    .map((m) => {
      const memberBatchIds = m.batches.map((b) => b.batchId);
      if (batchFilter && !memberBatchIds.includes(batchFilter)) return null;

      const batchNames = m.batches
        .filter((b) => (batchFilter ? b.batchId === batchFilter : true))
        .map((b) => b.batch.name);

      const heldThis = input.sessionsThisMonth.filter((s) => {
        if (!memberBatchIds.includes(s.batchId)) return false;
        if (batchFilter && s.batchId !== batchFilter) return false;
        return true;
      });
      const heldLast = input.sessionsLastMonth.filter((s) => {
        if (!memberBatchIds.includes(s.batchId)) return false;
        if (batchFilter && s.batchId !== batchFilter) return false;
        return true;
      });

      const present = heldThis.reduce((n, s) => {
        const entry = s.entries.find((e) => e.memberId === m.id);
        return n + (entry?.isPresent ? 1 : 0);
      }, 0);

      const lastPresent = heldLast.reduce((n, s) => {
        const entry = s.entries.find((e) => e.memberId === m.id);
        return n + (entry?.isPresent ? 1 : 0);
      }, 0);

      const sessionsHeld = heldThis.length;
      const lastSessionsHeld = heldLast.length;
      const thisPct = pct(present, sessionsHeld);
      const lastPct = pct(lastPresent, lastSessionsHeld);
      const trend =
        thisPct != null && lastPct != null ? thisPct - lastPct : null;

      return {
        memberId: m.id,
        name: m.name,
        code: m.code,
        batches: batchNames,
        present,
        sessionsHeld,
        pct: thisPct,
        lastPresent,
        lastSessionsHeld,
        lastPct,
        trend,
      } satisfies AttendanceMemberStat;
    })
    .filter((m): m is AttendanceMemberStat => m != null)
    .sort((a, b) => {
      const ap = a.pct ?? -1;
      const bp = b.pct ?? -1;
      if (ap !== bp) return ap - bp;
      return a.name.localeCompare(b.name);
    });

  let totalPresentMarks = 0;
  let totalPossibleMarks = 0;
  for (const m of members) {
    totalPresentMarks += m.present;
    totalPossibleMarks += m.sessionsHeld;
  }

  const overallPct = pct(totalPresentMarks, totalPossibleMarks);
  const below70 = members.filter((m) => m.pct != null && m.pct < 70).length;

  return {
    members,
    sessions: sessionLogs,
    overallPct,
    below70,
    sessionsHeld: sessions.length,
    totalPresentMarks,
    totalPossibleMarks,
  };
}
