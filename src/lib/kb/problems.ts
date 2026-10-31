// What #4471 holds, problem by problem, counted the way the desk counts: causes.ts files every
// report under its tenant's cause. The desk's own one-day-move list (desk-notes.json) is a third
// problem; those reports stay filed under their cause and are counted again in their own row.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day-move' | 'unplaced';

export const PROBLEMS: Record<Problem, { title: string; issue: number | null }> = {
  parser: { title: 'Shared parser reads day-first dates month first', issue: 1 },
  hint: { title: 'booking-v3 form hint asks for MM/DD/YYYY', issue: 2 },
  'one-day-move': { title: 'Invites move by one day', issue: 3 },
  unplaced: { title: 'No tenant on file', issue: null },
};

export type ProblemGroup = {
  problem: Problem;
  reports: number;
  tenants: number;
  firstSeen: string;
  lastSeen: string;
  // Intake tags that disagree with the problem the report belongs to.
  mistagged: number;
  // For the one-day row: where the desk files these reports.
  filedUnder: Problem[];
};

function group(problem: Problem, rs: Report[], filedUnder: Problem[] = []): ProblemGroup {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    reports: rs.length,
    tenants: new Set(rs.map((r) => r.tenant)).size,
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
    mistagged: rs.filter((r) => r.meta.intakeTag !== problem).length,
    filedUnder,
  };
}

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { exported: number; unique: number; groups: ProblemGroup[] } {
  const merged = uniqueById(all).filter((r) => r.mergedInto === ticket);
  const by = new Map<Problem, Report[]>();
  for (const r of merged) {
    const p: Problem = causeOf(r, tenantOf(r)) ?? 'unplaced';
    by.set(p, [...(by.get(p) ?? []), r]);
  }
  const groups = [...by.entries()].map(([p, rs]) => group(p, rs)).sort((a, b) => b.reports - a.reports);

  const moved = merged.filter((r) => oneDayMove.includes(r.id));
  if (moved.length) {
    const filedUnder = [...new Set(moved.map((r): Problem => causeOf(r, tenantOf(r)) ?? 'unplaced'))];
    groups.push(group('one-day-move', moved, filedUnder));
  }
  return { exported: all.filter((r) => r.mergedInto === ticket).length, unique: merged.length, groups };
}
