<script lang="ts">
  import { onMount } from 'svelte';
  import { v4 as uuidv4 } from 'uuid';
  import { Task } from '$lib/types/project';
  import { calculateCPM } from '$lib/utils/cpm';
  import TaskForm from '$lib/components/TaskForm.svelte';
  import TaskList from '$lib/components/TaskList.svelte';

  // Project state
  let projectId = uuidv4();
  let projectName = 'New Project';
  let tasks: Task[] = [];
  let taskToEdit: Task | null = null;
  let showCPMResults = false;
  let cpmResults = {};

  // When tasks change, recalculate CPM if results are shown
  $: if (showCPMResults && tasks.length > 0) {
    calculateCPMResults();
  }

  // Initialize with sample data on mount
  onMount(() => {
    // Optionally populate with sample data
    // loadSampleData();
  });

  // Calculate CPM results
  function calculateCPMResults() {
    try {
      const results = calculateCPM(tasks, projectId);
      cpmResults = results.taskResults;
      console.log('Project duration:', results.projectDuration);
      console.log('Critical path:', results.criticalPath);
    } catch (error) {
      console.error('Error calculating CPM:', error);
      alert('Failed to calculate CPM. Check for circular dependencies.');
    }
  }

  // Toggle CPM results display
  function toggleCPMResults() {
    showCPMResults = !showCPMResults;
    if (showCPMResults && tasks.length > 0) {
      calculateCPMResults();
    }
  }

  // Handle add task event
  function handleAddTask(event: CustomEvent<{ task: Task }>) {
    const { task } = event.detail;
    tasks = [...tasks, task];
  }

  // Handle update task event
  function handleUpdateTask(event: CustomEvent<{ task: Task }>) {
    const { task } = event.detail;
    tasks = tasks.map(t => (t.id === task.id ? task : t));
    taskToEdit = null;
  }

  // Handle cancel edit event
  function handleCancelEdit() {
    taskToEdit = null;
  }

  // Handle edit task event
  function handleEditTask(event: CustomEvent<{ taskId: string }>) {
    const { taskId } = event.detail;
    taskToEdit = tasks.find(task => task.id === taskId) || null;
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
  }

  // Load sample project data for demonstration
  function loadSampleData() {
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
        name: 'Deployment',
        description: 'Deploy the system to production',
        duration: 3,
        dependencies: ['task-4']
      }
    ];
    
    // Calculate CPM for the sample data
    if (showCPMResults) {
      calculateCPMResults();
    }
  }
</script>

<div class="project-page">
  <div class="project-header">
    <h1>{projectName}</h1>
    
    <div class="action-buttons">
      <button class="btn-secondary" on:click={loadSampleData}>
        Load Sample Data
      </button>
      <button class="btn-primary" on:click={toggleCPMResults}>
        {showCPMResults ? 'Hide CPM Results' : 'Show CPM Results'}
      </button>
    </div>
  </div>
  
  <div class="project-content">
    <section class="task-form-section">
      <TaskForm
        tasks={tasks}
        editTask={taskToEdit}
        on:add={handleAddTask}
        on:update={handleUpdateTask}
        on:cancel={handleCancelEdit}
      />
    </section>
    
    <section class="task-list-section">
      <h2>Tasks</h2>
      <TaskList
        tasks={tasks}
        cpmResults={cpmResults}
        showCPMResults={showCPMResults}
        on:edit={handleEditTask}
        on:delete={handleDeleteTask}
      />
    </section>
  </div>
</div>

<style>
  .project-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }
  
  .project-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  h1 {
    font-size: 2rem;
    margin: 0;
    color: #333;
  }
  
  h2 {
    font-size: 1.5rem;
    margin-top: 0;
    margin-bottom: 1rem;
    color: #333;
  }
  
  .action-buttons {
    display: flex;
    gap: 1rem;
  }
  
  .btn-primary, .btn-secondary {
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
  
  .project-content {
    display: grid;
    gap: 2rem;
  }
  
  .task-form-section, .task-list-section {
    width: 100%;
  }
  
  @media (min-width: 768px) {
    .project-content {
      grid-template-columns: 1fr;
    }
  }
</style>