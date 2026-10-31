// What #4471 holds, problem by problem. causes.ts decides the cause from the tenant; the desk's
// own one-day-move list (desk-notes.json) is a third problem, not a parser report.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day-move' | 'unplaced';

export const PROBLEMS: Record<Problem, { title: string; issue: number | null }> = {
  parser: { title: 'Shared parser reads day-first dates month first', issue: 1 },
  hint: { title: 'booking-v3 form hint asks for MM/DD/YYYY', issue: 2 },
  'one-day-move': { title: 'Invites move by one day', issue: 3 },
  unplaced: { title: 'No tenant on file', issue: null },
};

export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem {
  if (oneDayMove.includes(r.id)) return 'one-day-move';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemGroup = {
  problem: Problem;
  reports: number;
  tenants: number;
  firstSeen: string;
  lastSeen: string;
  // Intake tags that disagree with the problem the report belongs to.
  mistagged: number;
};

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { exported: number; unique: number; groups: ProblemGroup[] } {
  const merged = uniqueById(all).filter((r) => r.mergedInto === ticket);
  const by = new Map<Problem, Report[]>();
  for (const r of merged) {
    const p = problemOf(r, tenantOf(r), oneDayMove);
    by.set(p, [...(by.get(p) ?? []), r]);
  }
  const groups = [...by.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs.length,
        tenants: new Set(rs.map((r) => r.tenant)).size,
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
        mistagged: rs.filter((r) => r.meta.intakeTag !== problem).length,
      };
    })
    .sort((a, b) => b.reports - a.reports);
  return { exported: all.filter((r) => r.mergedInto === ticket).length, unique: merged.length, groups };
}
