<script lang="ts">
  import { onMount } from 'svelte';
  import { v4 as uuidv4 } from 'uuid';
  import { Task, ProjectCPMResults } from '$lib/types/project';
  import { calculateCPM } from '$lib/utils/cpm';
  import ProjectInfo from '$lib/components/ProjectInfo.svelte';
  import TaskForm from '$lib/components/TaskForm.svelte';
  import TaskList from '$lib/components/TaskList.svelte';
  import CPMTable from '$lib/components/CPMTable.svelte';
  import CPMGraph from '$lib/components/CPMGraph.svelte';

  // Project state
  let projectId = uuidv4();
  let projectName = 'New CPM Project';
  let tasks: Task[] = [];
  let taskToEdit: Task | null = null;
  let cpmResults: ProjectCPMResults | null = null;
  let showGraph = true;
  let activeTab: 'form' | 'table' | 'graph' = 'form';
  let graphComponent: CPMGraph;

  // Calculate CPM results
  function calculateCPMResults() {
    if (tasks.length === 0) {
      alert('Add at least one task before calculating CPM.');
      return;
    }
    
    try {
      cpmResults = calculateCPM(tasks, projectId);
      console.log('Project duration:', cpmResults.projectDuration);
      console.log('Critical path:', cpmResults.criticalPath);
      
      // Switch to results tab after calculation
      activeTab = 'table';
    } catch (error) {
      console.error('Error calculating CPM:', error);
      alert('Failed to calculate CPM. Check for circular dependencies.');
    }
  }

  // Reset project
  function resetProject() {
    if (tasks.length > 0) {
      if (!confirm('Are you sure you want to clear all tasks and start a new project?')) {
        return;
      }
    }
    
    projectId = uuidv4();
    projectName = 'New CPM Project';
    tasks = [];
    cpmResults = null;
    activeTab = 'form';
  }

  // Load sample data for demonstration
  function loadSampleData() {
    if (tasks.length > 0) {
      if (!confirm('This will replace your current tasks with sample data. Continue?')) {
        return;
      }
    }
    
    tasks = [
      {
        id: 'task-1',
        name: 'Project Planning',
        description: 'Define project scope and requirements',
        duration: 5,
        dependencies: []
      },
      {
        id: 'task-2',
        name: 'Design',
        description: 'Create system design documents',
        duration: 10,
        dependencies: ['task-1']
      },
      {
        id: 'task-3',
        name: 'Development',
        description: 'Implement the system',
        duration: 15,
        dependencies: ['task-2']
      },
      {
        id: 'task-4',
        name: 'Testing',
        description: 'Test the system',
        duration: 7,
        dependencies: ['task-3']
      },
      {
        id: 'task-5',
        name: 'Documentation',
        description: 'Create user and system documentation',
        duration: 8,
        dependencies: ['task-2']
      },
      {
        id: 'task-6',
        name: 'Deployment',
        description: 'Deploy the system to production',
        duration: 3,
        dependencies: ['task-4', 'task-5']
      },
      {
        id: 'task-7',
        name: 'Training',
        description: 'Train users on the new system',
        duration: 5,
        dependencies: ['task-6']
      }
    ];
    
    // Calculate CPM for the sample data
    calculateCPMResults();
  }

  // Handle add task event
  function handleAddTask(event: CustomEvent<{ task: Task }>) {
    const { task } = event.detail;
    tasks = [...tasks, task];
    cpmResults = null; // Reset CPM results when tasks change
  }

  // Handle update task event
  function handleUpdateTask(event: CustomEvent<{ task: Task }>) {
    const { task } = event.detail;
    tasks = tasks.map(t => (t.id === task.id ? task : t));
    taskToEdit = null;
    cpmResults = null; // Reset CPM results when tasks change
  }

  // Handle cancel edit event
  function handleCancelEdit() {
    taskToEdit = null;
  }

  // Handle edit task event
  function handleEditTask(event: CustomEvent<{ taskId: string }>) {
    const { taskId } = event.detail;
    taskToEdit = tasks.find(task => task.id === taskId) || null;
    activeTab = 'form';
  }

  // Handle delete task event
  function handleDeleteTask(event: CustomEvent<{ taskId: string }>) {
    const { taskId } = event.detail;
    tasks = tasks.filter(task => task.id !== taskId);
    
    // Update dependencies in other tasks
    tasks = tasks.map(task => ({
      ...task,
      dependencies: task.dependencies.filter(depId => depId !== taskId)
    }));
    
    cpmResults = null; // Reset CPM results when tasks change
  }

  // Handle project name change
  function handleProjectNameChange(event: CustomEvent<{ name: string }>) {
    projectName = event.detail.name;
  }

  // Toggle visibility of graph
  function toggleGraph() {
    showGraph = !showGraph;
  }

  // When the active tab changes to graph, reset zoom
  $: if (activeTab === 'graph' && graphComponent) {
    setTimeout(() => {
      graphComponent.resetZoom();
    }, 100);
  }
</script>

<svelte:head>
  <title>CPM Calculator - {projectName}</title>
</svelte:head>

<div class="app-container">
  <div class="project-actions">
    <div class="main-actions">
      <button class="btn-primary" on:click={calculateCPMResults}>
        Calculate CPM
      </button>
      <button class="btn-secondary" on:click={loadSampleData}>
        Load Sample Project
      </button>
      <button class="btn-danger" on:click={resetProject}>
        New Project
      </button>
    </div>
  </div>
  
  <ProjectInfo 
    projectName={projectName}
    tasks={tasks}
    cpmResults={cpmResults}
    on:nameChange={handleProjectNameChange}
  />
  
  <div class="content-tabs">
    <div class="tab-buttons">
      <button 
        class:active={activeTab === 'form'}
        on:click={() => activeTab = 'form'}
      >
        Tasks
      </button>
      <button 
        class:active={activeTab === 'table'}
        on:click={() => activeTab = 'table'}
        class:disabled={!cpmResults}
        disabled={!cpmResults}
      >
        CPM Results
      </button>
      <button 
        class:active={activeTab === 'graph'}
        on:click={() => activeTab = 'graph'}
        class:disabled={!cpmResults}
        disabled={!cpmResults}
      >
        Network Diagram
      </button>
    </div>
    
    <div class="tab-content">
      {#if activeTab === 'form'}
        <div class="task-management">
          <div class="task-form-container">
            <TaskForm
              tasks={tasks}
              editTask={taskToEdit}
              on:add={handleAddTask}
              on:update={handleUpdateTask}
              on:cancel={handleCancelEdit}
            />
          </div>
          
          <div class="task-list-container">
            <h2>Project Tasks</h2>
            <TaskList
              tasks={tasks}
              on:edit={handleEditTask}
              on:delete={handleDeleteTask}
            />
          </div>
        </div>
      {:else if activeTab === 'table' && cpmResults}
        <CPMTable 
          tasks={tasks}
          cpmResults={cpmResults}
        />
      {:else if activeTab === 'graph' && cpmResults}
        <CPMGraph 
          tasks={tasks}
          cpmResults={cpmResults}
          bind:this={graphComponent}
        />
      {/if}
    </div>
  </div>
</div>

<style>
  .app-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }
  
  .project-actions {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  .main-actions {
    display: flex;
    gap: 1rem;
  }
  
  .btn-primary, .btn-secondary, .btn-danger {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .btn-primary {
    background-color: #3b5998;
    color: white;
  }
  
  .btn-primary:hover {
    background-color: #324b81;
  }
  
  .btn-secondary {
    background-color: #f8f9fa;
    color: #333;
    border: 1px solid #ddd;
  }
  
  .btn-secondary:hover {
    background-color: #e9ecef;
  }
  
  .btn-danger {
    background-color: #dc3545;
    color: white;
  }
  
  .btn-danger:hover {
    background-color: #c82333;
  }
  
  .content-tabs {
    margin-bottom: 2rem;
  }
  
  .tab-buttons {
    display: flex;
    border-bottom: 2px solid #dee2e6;
    margin-bottom: 1.5rem;
  }
  
  .tab-buttons button {
    padding: 0.75rem 1.5rem;
    background-color: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    margin-right: 0.5rem;
    font-weight: 500;
    color: #6c757d;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: -2px;
  }
  
  .tab-buttons button:hover:not(.disabled) {
    color: #3b5998;
  }
  
  .tab-buttons button.active {
    color: #3b5998;
    border-bottom-color: #3b5998;
  }
  
  .tab-buttons button.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .tab-content {
    min-height: 300px;
  }
  
  .task-management {
    display: grid;
    gap: 2rem;
  }
  
  h2 {
    margin-top: 0;
    font-size: 1.5rem;
    color: #333;
  }
  
  @media (min-width: 992px) {
    .task-management {
      grid-template-columns: 5fr 7fr;
    }
  }
  
  @media (max-width: 768px) {
    .project-actions {
      flex-direction: column;
    }
    
    .main-actions {
      flex-wrap: wrap;
    }
  }
</style>