export type AttendanceBatchStat = {
  batchId: string;
  name: string;
  present: number;
  sessionsHeld: number;
  pct: number | null;
};

export type AttendanceMemberStat = {
  memberId: string;
  name: string;
  code: string;
  /** Batch names (for search / legacy); prefer `byBatch` for display. */
  batches: string[];
  byBatch: AttendanceBatchStat[];
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

function countPresent(sessions: SessionInput[], memberId: string) {
  return sessions.reduce((n, s) => {
    const entry = s.entries.find((e) => e.memberId === memberId);
    return n + (entry?.isPresent ? 1 : 0);
  }, 0);
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
      const memberBatches = m.batches.filter((b) =>
        batchFilter ? b.batchId === batchFilter : true,
      );
      if (!memberBatches.length) return null;

      const memberBatchIds = new Set(memberBatches.map((b) => b.batchId));

      const byBatch: AttendanceBatchStat[] = memberBatches
        .map((b) => {
          const held = input.sessionsThisMonth.filter((s) => s.batchId === b.batchId);
          const present = countPresent(held, m.id);
          return {
            batchId: b.batchId,
            name: b.batch.name,
            present,
            sessionsHeld: held.length,
            pct: pct(present, held.length),
          };
        })
        .sort((a, b) => {
          const ap = a.pct ?? -1;
          const bp = b.pct ?? -1;
          if (ap !== bp) return ap - bp;
          return a.name.localeCompare(b.name);
        });

      const heldThis = input.sessionsThisMonth.filter((s) => memberBatchIds.has(s.batchId));
      const heldLast = input.sessionsLastMonth.filter((s) => memberBatchIds.has(s.batchId));

      const present = countPresent(heldThis, m.id);
      const lastPresent = countPresent(heldLast, m.id);
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
        batches: byBatch.map((b) => b.name),
        byBatch,
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
