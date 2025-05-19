<script lang="ts">
  import { onMount } from 'svelte';
  import { Task, ProjectCPMResults } from '$lib/types/project';
  import CPMGraph from '$lib/components/CPMGraph.svelte';

  // Test data with simple tasks
  const testTasks: Task[] = [
    {
      id: 'A',
      name: 'Task A',
      description: 'Start task',
      duration: 5,
      dependencies: []
    },
    {
      id: 'B',
      name: 'Task B',
      description: 'Second task',
      duration: 3,
      dependencies: ['A']
    },
    {
      id: 'C',
      name: 'Task C',
      description: 'Third task',
      duration: 7,
      dependencies: ['A']
    },
    {
      id: 'D',
      name: 'Task D',
      description: 'Final task',
      duration: 2,
      dependencies: ['B', 'C']
    }
  ];

  const testCpmResults: ProjectCPMResults = {
    projectId: 'test-1',
    projectDuration: 14,
    criticalPath: ['A', 'C', 'D'],
    taskResults: {
      'A': {
        taskId: 'A',
        earliestStart: 0,
        earliestFinish: 5,
        latestStart: 0,
        latestFinish: 5,
        slack: 0,
        isCritical: true
      },
      'B': {
        taskId: 'B',
        earliestStart: 5,
        earliestFinish: 8,
        latestStart: 9,
        latestFinish: 12,
        slack: 4,
        isCritical: false
      },
      'C': {
        taskId: 'C',
        earliestStart: 5,
        earliestFinish: 12,
        latestStart: 5,
        latestFinish: 12,
        slack: 0,
        isCritical: true
      },
      'D': {
        taskId: 'D',
        earliestStart: 12,
        earliestFinish: 14,
        latestStart: 12,
        latestFinish: 14,
        slack: 0,
        isCritical: true
      }
    }
  };

  let showGraph = false;
  let d3Loaded = false;

  onMount(() => {
    console.log('Test page mounted');
    // Test if D3 can be loaded
    import('d3').then(d3 => {
      console.log('D3 loaded successfully', d3);
      d3Loaded = true;
    }).catch(error => {
      console.error('Failed to load D3', error);
    });
  });
</script>

<div class="test-container">
  <h1>CPM Graph Test Page</h1>
  
  <div class="controls">
    <button on:click={() => showGraph = !showGraph}>
      {showGraph ? 'Hide' : 'Show'} Graph
    </button>
    <span class={d3Loaded ? 'success' : 'error'}>
      D3 Status: {d3Loaded ? 'Loaded' : 'Not Loaded'}
    </span>
  </div>

  <div class="test-data">
    <h2>Test Data</h2>
    <pre>{JSON.stringify(testTasks, null, 2)}</pre>
    <pre>{JSON.stringify(testCpmResults, null, 2)}</pre>
  </div>

  {#if showGraph}
    <div class="graph-wrapper">
      <h2>CPM Graph Component</h2>
      <CPMGraph tasks={testTasks} cpmResults={testCpmResults} />
    </div>
  {/if}
</div>

<style>
  .test-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .controls {
    margin: 1rem 0;
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  button {
    padding: 0.5rem 1rem;
    background-color: #3b5998;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  button:hover {
    background-color: #324b81;
  }

  .success {
    color: green;
  }

  .error {
    color: red;
  }

  .test-data {
    margin: 2rem 0;
    padding: 1rem;
    background-color: #f5f5f5;
    border-radius: 8px;
  }

  pre {
    white-space: pre-wrap;
    word-break: break-word;
  }

  .graph-wrapper {
    margin-top: 2rem;
    border: 2px solid #ccc;
    padding: 1rem;
    border-radius: 8px;
  }
</style>