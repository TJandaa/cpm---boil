<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { v4 as uuidv4 } from 'uuid';
  import { Task } from '$lib/types/project';
  import DependencySelector from './DependencySelector.svelte';

  export let tasks: Task[] = [];
  export let editTask: Task | null = null;

  // Form state
  let taskName = '';
  let taskDescription = '';
  let taskDuration = 1;
  let taskDependencies: string[] = [];
  let formErrors: Record<string, string> = {};

  // Mode can be 'add' or 'edit'
  $: mode = editTask ? 'edit' : 'add';
  $: formTitle = mode === 'add' ? 'Add New Task' : 'Edit Task';
  $: submitLabel = mode === 'add' ? 'Add Task' : 'Save Changes';

  // Set form values when editing a task
  $: if (editTask) {
    taskName = editTask.name;
    taskDescription = editTask.description || '';
    taskDuration = editTask.duration;
    taskDependencies = [...editTask.dependencies];
  }

  // Event dispatcher for form submission
  const dispatch = createEventDispatcher<{
    add: { task: Task };
    update: { task: Task };
    cancel: void;
  }>();

  // Reset form fields
  function resetForm() {
    taskName = '';
    taskDescription = '';
    taskDuration = 1;
    taskDependencies = [];
    formErrors = {};
  }

  // Validate form fields
  function validateForm(): boolean {
    formErrors = {};
    
    if (!taskName.trim()) {
      formErrors.name = 'Task name is required';
    }
    
    if (taskDuration <= 0) {
      formErrors.duration = 'Duration must be greater than 0';
    }
    
    return Object.keys(formErrors).length === 0;
  }

  // Handle form submission
  function handleSubmit() {
    if (!validateForm()) return;
    
    const task: Task = {
      id: editTask ? editTask.id : uuidv4(),
      name: taskName.trim(),
      description: taskDescription.trim() || undefined,
      duration: taskDuration,
      dependencies: taskDependencies,
    };
    
    if (mode === 'add') {
      dispatch('add', { task });
    } else {
      dispatch('update', { task });
    }
    
    resetForm();
  }

  // Handle cancel button
  function handleCancel() {
    resetForm();
    dispatch('cancel');
  }

  // Handle dependencies change
  function handleDependenciesChange(event: CustomEvent<{ dependencies: string[] }>) {
    taskDependencies = event.detail.dependencies;
  }
</script>

<div class="task-form">
  <h2>{formTitle}</h2>
  
  <form on:submit|preventDefault={handleSubmit}>
    <div class="form-group">
      <label for="taskName">Task Name *</label>
      <input
        type="text"
        id="taskName"
        bind:value={taskName}
        class:error={!!formErrors.name}
        placeholder="Enter task name"
      />
      {#if formErrors.name}
        <span class="error-message">{formErrors.name}</span>
      {/if}
    </div>
    
    <div class="form-group">
      <label for="taskDescription">Description</label>
      <textarea
        id="taskDescription"
        bind:value={taskDescription}
        placeholder="Enter task description"
        rows="3"
      ></textarea>
    </div>
    
    <div class="form-group">
      <label for="taskDuration">Duration (days) *</label>
      <input
        type="number"
        id="taskDuration"
        bind:value={taskDuration}
        min="1"
        class:error={!!formErrors.duration}
      />
      {#if formErrors.duration}
        <span class="error-message">{formErrors.duration}</span>
      {/if}
    </div>
    
    <div class="form-group">
      <DependencySelector
        tasks={tasks}
        selectedDependencies={taskDependencies}
        currentTaskId={editTask?.id || null}
        on:change={handleDependenciesChange}
      />
    </div>
    
    <div class="form-actions">
      <button type="submit" class="btn-primary">{submitLabel}</button>
      <button type="button" class="btn-secondary" on:click={handleCancel}>Cancel</button>
    </div>
  </form>
</div>

<style>
  .task-form {
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }
  
  h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    color: #333;
    font-size: 1.5rem;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
  
  input, textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }
  
  input:focus, textarea:focus {
    border-color: #3b5998;
    outline: none;
  }
  
  input.error, textarea.error {
    border-color: #dc3545;
  }
  
  .error-message {
    display: block;
    color: #dc3545;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }
  
  .form-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  
  button {
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
</style>