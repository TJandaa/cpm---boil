<script lang="ts">
  import type { CPMResult } from '$lib/types/project';
  
  export let results: CPMResult[] = [];
</script>

{#if results.length > 0}
  <div class="cpm-table">
    <h3>CPM Analysis Results</h3>
    <table>
      <thead>
        <tr>
          <th>Task</th>
          <th>Earliest Start</th>
          <th>Earliest Finish</th>
          <th>Latest Start</th>
          <th>Latest Finish</th>
          <th>Slack</th>
          <th>Critical?</th>
        </tr>
      </thead>
      <tbody>
        {#each results as result}
          <tr class={result.isCritical ? 'critical' : ''}>
            <td>{result.taskId}</td>
            <td>{result.earliestStart}</td>
            <td>{result.earliestFinish}</td>
            <td>{result.latestStart}</td>
            <td>{result.latestFinish}</td>
            <td>{result.slack}</td>
            <td>{result.isCritical ? 'Yes' : 'No'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else}
  <p>No CPM results available. Add tasks and calculate CPM first.</p>
{/if}

<style>
  .cpm-table {
    margin: 1rem 0;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
  th {
    background-color: #f2f2f2;
  }
  tr.critical {
    background-color: #ffeeee;
  }
</style>
