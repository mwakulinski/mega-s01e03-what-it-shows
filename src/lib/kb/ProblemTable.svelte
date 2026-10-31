<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { PROBLEMS, splitTicket } from '#lib/kb/problems';

  let { ticket, repo }: { ticket: number; repo: string } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
</script>

<p class="sum">
  <strong>{split.unique}</strong> reports in #{ticket} ({split.exported - split.unique} duplicate rows in the export) ·
  <strong>{split.groups.length}</strong> problems
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>seen</th><th>intake tag wrong</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each split.groups as g (g.problem)}
      <tr>
        <td>{PROBLEMS[g.problem].title}</td>
        <td>{g.reports}</td>
        <td>{g.tenants}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>{g.mistagged}</td>
        <td>
          {#if PROBLEMS[g.problem].issue}
            <a href="{repo}/issues/{PROBLEMS[g.problem].issue}">#{PROBLEMS[g.problem].issue}</a>
          {:else}—{/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
</style>
