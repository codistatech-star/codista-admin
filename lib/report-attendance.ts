export type AttendanceBatchStat = {
  batchId: string;
  name: string;
  present: number;
  /** Possible days = calendar days in the report month. */
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
  /** Possible day-marks = daysInMonth × mapped batches in scope. */
  sessionsHeld: number;
  pct: number | null;
  lastPresent: number;
  lastSessionsHeld: number;
  lastPct: number | null;
  /** positive = improved, negative = declined */
  trend: number | null;
};

export type AttendanceReport = {
  members: AttendanceMemberStat[];
  overallPct: number | null;
  below70: number;
  /** Count of AttendanceSession rows this month (not day denominator). */
  sessionsHeld: number;
  totalPresentMarks: number;
  totalPossibleMarks: number;
};

type SessionInput = {
  id: string;
  date: Date;
  batchId: string;
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
  daysInMonth: number;
  lastDaysInMonth: number;
}): AttendanceReport {
  const batchFilter = input.batchFilter || null;
  const daysInMonth = Math.max(0, input.daysInMonth);
  const lastDaysInMonth = Math.max(0, input.lastDaysInMonth);

  const sessionsInScope = batchFilter
    ? input.sessionsThisMonth.filter((s) => s.batchId === batchFilter)
    : input.sessionsThisMonth;

  const members = input.members
    .map((m) => {
      const memberBatches = m.batches.filter((b) =>
        batchFilter ? b.batchId === batchFilter : true,
      );
      if (!memberBatches.length) return null;

      const memberBatchIds = new Set(memberBatches.map((b) => b.batchId));

      const byBatch: AttendanceBatchStat[] = memberBatches
        .map((b) => {
          const batchSessions = input.sessionsThisMonth.filter((s) => s.batchId === b.batchId);
          const present = countPresent(batchSessions, m.id);
          return {
            batchId: b.batchId,
            name: b.batch.name,
            present,
            sessionsHeld: daysInMonth,
            pct: pct(present, daysInMonth),
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
      const sessionsHeld = daysInMonth * byBatch.length;
      const lastSessionsHeld = lastDaysInMonth * byBatch.length;
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
    overallPct,
    below70,
    sessionsHeld: sessionsInScope.length,
    totalPresentMarks,
    totalPossibleMarks,
  };
}
