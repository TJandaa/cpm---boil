<script lang="ts">
  import { Task, CPMResult, ProjectCPMResults } from '$lib/types/project';

  export let tasks: Task[] = [];
  export let cpmResults: ProjectCPMResults | null = null;
  export let showAll: boolean = true; // Whether to show all tasks or only critical path tasks

  // Sort tasks by earliest start time by default
  export let sortBy: 'name' | 'es' | 'ls' | 'slack' | 'critical' = 'es';
  export let sortDirection: 'asc' | 'desc' = 'asc';

  // Get task name from ID
  function getTaskName(taskId: string): string {
    const task = tasks.find(t => t.id === taskId);
    return task ? task.name : taskId;
  }

  // Filter tasks based on showAll and criticalPath
  $: filteredTasks = showAll 
    ? tasks 
    : (cpmResults?.criticalPath.map(id => tasks.find(t => t.id === id)).filter(Boolean) as Task[]);

  // Sort tasks based on sortBy and sortDirection
  $: sortedTasks = [...filteredTasks].sort((a, b) => {
    const aResult = cpmResults?.taskResults[a.id];
    const bResult = cpmResults?.taskResults[b.id];
    
    if (!aResult || !bResult) return 0;
    
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'es':
        comparison = aResult.earliestStart - bResult.earliestStart;
        break;
      case 'ls':
        comparison = aResult.latestStart - bResult.latestStart;
        break;
      case 'slack':
        comparison = aResult.slack - bResult.slack;
        break;
      case 'critical':
        comparison = (aResult.isCritical ? 0 : 1) - (bResult.isCritical ? 0 : 1);
        break;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Change sort column
  function changeSort(column: typeof sortBy) {
    if (sortBy === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortBy = column;
      sortDirection = 'asc';
    }
  }
</script>

<div class="cpm-table-container">
  {#if !cpmResults}
    <div class="no-results">
      <p>No CPM calculation results available. Calculate CPM to see results.</p>
    </div>
  {:else if filteredTasks.length === 0}
    <div class="no-results">
      <p>No tasks match the current filter criteria.</p>
    </div>
  {:else}
    <div class="table-controls">
      <div class="table-title">
        <h3>CPM Calculation Results</h3>
        {#if cpmResults.projectDuration}
          <span class="project-duration">
            Project Duration: <strong>{cpmResults.projectDuration} days</strong>
          </span>
        {/if}
      </div>
      
      <div class="filter-toggle">
        <label>
          <input 
            type="checkbox" 
            bind:checked={showAll}
          />
          Show all tasks
        </label>
      </div>
    </div>
    
    <div class="table-responsive">
      <table class="cpm-table">
        <thead>
          <tr>
            <th on:click={() => changeSort('name')} class:active={sortBy === 'name'}>
              Task Name
              {#if sortBy === 'name'}
                <span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              {/if}
            </th>
            <th>Duration</th>
            <th on:click={() => changeSort('es')} class:active={sortBy === 'es'}>
              ES
              {#if sortBy === 'es'}
                <span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              {/if}
            </th>
            <th>EF</th>
            <th on:click={() => changeSort('ls')} class:active={sortBy === 'ls'}>
              LS
              {#if sortBy === 'ls'}
                <span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              {/if}
            </th>
            <th>LF</th>
            <th on:click={() => changeSort('slack')} class:active={sortBy === 'slack'}>
              Slack
              {#if sortBy === 'slack'}
                <span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              {/if}
            </th>
            <th on:click={() => changeSort('critical')} class:active={sortBy === 'critical'}>
              Critical
              {#if sortBy === 'critical'}
                <span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              {/if}
            </th>
          </tr>
        </thead>
        <tbody>
          {#each sortedTasks as task (task.id)}
            {#if cpmResults.taskResults[task.id]}
              {@const result = cpmResults.taskResults[task.id]}
              <tr class:critical-path={result.isCritical}>
                <td class="task-name">{task.name}</td>
                <td class="number">{task.duration}</td>
                <td class="number">{result.earliestStart}</td>
                <td class="number">{result.earliestFinish}</td>
                <td class="number">{result.latestStart}</td>
                <td class="number">{result.latestFinish}</td>
                <td class="number slack-column">{result.slack}</td>
                <td class="critical-column">
                  {#if result.isCritical}
                    <span class="critical-marker">Yes</span>
                  {:else}
                    No
                  {/if}
                </td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    </div>
    
    <div class="table-legend">
      <div class="legend-item">
        <div class="critical-path-sample"></div>
        <span>Critical Path</span>
      </div>
      <div class="legend-item">
        <span><strong>ES</strong>: Earliest Start</span>
        <span><strong>EF</strong>: Earliest Finish</span>
        <span><strong>LS</strong>: Latest Start</span>
        <span><strong>LF</strong>: Latest Finish</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .cpm-table-container {
    margin-bottom: 2rem;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
  }
  
  .table-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .table-title {
    display: flex;
    flex-direction: column;
  }
  
  h3 {
    margin: 0 0 0.5rem 0;
    color: #333;
  }
  
  .project-duration {
    font-size: 0.9rem;
    color: #555;
  }
  
  .filter-toggle {
    display: flex;
    align-items: center;
  }
  
  .filter-toggle label {
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;
  }
  
  .filter-toggle input {
    margin-right: 0.5rem;
  }
  
  .table-responsive {
    overflow-x: auto;
  }
  
  .cpm-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
  }
  
  .cpm-table th,
  .cpm-table td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e9ecef;
  }
  
  .cpm-table th {
    font-weight: 600;
    background-color: #f8f9fa;
    position: relative;
  }
  
  .cpm-table th.active {
    background-color: #e9ecef;
  }
  
  .cpm-table th[on:click] {
    cursor: pointer;
  }
  
  .cpm-table th[on:click]:hover {
    background-color: #e9ecef;
  }
  
  .sort-indicator {
    position: absolute;
    right: 0.5rem;
  }
  
  .cpm-table .number {
    text-align: right;
  }
  
  .task-name {
    font-weight: 500;
  }
  
  .critical-path {
    background-color: #fff3cd;
  }
  
  .slack-column {
    font-weight: 500;
  }
  
  .critical-column {
    text-align: center;
  }
  
  .critical-marker {
    background-color: #dc3545;
    color: white;
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  
  .no-results {
    text-align: center;
    padding: 2rem;
    color: #666;
    background-color: #f9f9f9;
    border-radius: 6px;
  }
  
  .table-legend {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1rem;
    border-top: 1px solid #e9ecef;
    font-size: 0.85rem;
    color: #555;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .critical-path-sample {
    width: 1rem;
    height: 1rem;
    background-color: #fff3cd;
    border: 1px solid #ffeeba;
  }
  
  @media (max-width: 768px) {
    .table-controls {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
    
    .table-legend {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }
</style>