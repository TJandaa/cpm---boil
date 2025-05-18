<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  
  // Project type with minimal fields needed for listing
  interface ProjectListItem {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export let loading = true;
  let projects: ProjectListItem[] = [];
  let error: string | null = null;
  let deleteConfirmId: string | null = null;
  
  const dispatch = createEventDispatcher<{
    load: { projectId: string };
    delete: { projectId: string };
    create: void;
    refresh: void;
  }>();
  
  onMount(async () => {
    await fetchProjects();
  });
  
  async function fetchProjects() {
    loading = true;
    error = null;
    
    try {
      const response = await fetch('/api/projects');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch projects');
      }
      
      projects = await response.json();
      
      // Sort projects by updated date (newest first)
      projects.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      
    } catch (err) {
      console.error('Error fetching projects:', err);
      error = err instanceof Error ? err.message : 'Unknown error fetching projects';
    } finally {
      loading = false;
    }
  }
  
  function handleLoadProject(projectId: string) {
    dispatch('load', { projectId });
  }
  
  function confirmDelete(projectId: string) {
    deleteConfirmId = projectId;
  }
  
  function cancelDelete() {
    deleteConfirmId = null;
  }
  
  async function handleDeleteProject(projectId: string) {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete project');
      }
      
      // Remove project from list
      projects = projects.filter(p => p.id !== projectId);
      
      // Clear confirmation
      deleteConfirmId = null;
      
      // Notify parent
      dispatch('delete', { projectId });
      
    } catch (err) {
      console.error('Error deleting project:', err);
      error = err instanceof Error ? err.message : 'Unknown error deleting project';
    }
  }
  
  function handleRefresh() {
    fetchProjects();
    dispatch('refresh');
  }
  
  function handleCreateProject() {
    dispatch('create');
  }
  
  // Format date for display
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
  
  // Get relative time (e.g., "2 days ago")
  function getRelativeTime(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }
</script>

<div class="project-list-container">
  <div class="list-header">
    <h2>Saved Projects</h2>
    <div class="header-actions">
      <button class="btn-refresh" on:click={handleRefresh} title="Refresh list">
        ↻
      </button>
      <button class="btn-primary" on:click={handleCreateProject}>
        New Project
      </button>
    </div>
  </div>
  
  {#if loading}
    <div class="loading-state" transition:fade>
      <p>Loading projects...</p>
      <div class="loading-spinner"></div>
    </div>
  {:else if error}
    <div class="error-state" transition:fade>
      <p>Error: {error}</p>
      <button class="btn-secondary" on:click={handleRefresh}>Try Again</button>
    </div>
  {:else if projects.length === 0}
    <div class="empty-state" transition:fade>
      <p>No saved projects found.</p>
      <p>Create a new project to get started.</p>
      <button class="btn-primary" on:click={handleCreateProject}>
        Create Project
      </button>
    </div>
  {:else}
    <ul class="project-list">
      {#each projects as project (project.id)}
        <li class="project-item" transition:slide|local={{ duration: 300 }}>
          <div class="project-details" on:click={() => handleLoadProject(project.id)}>
            <h3 class="project-name">{project.name}</h3>
            <p class="project-description">{project.description || 'No description'}</p>
            <div class="project-dates">
              <span class="date-label">Last updated:</span>
              <span class="date-value" title={formatDate(project.updatedAt)}>
                {getRelativeTime(project.updatedAt)}
              </span>
              <span class="date-separator">•</span>
              <span class="date-label">Created:</span>
              <span class="date-value" title={formatDate(project.createdAt)}>
                {formatDate(project.createdAt)}
              </span>
            </div>
          </div>
          
          <div class="project-actions">
            <button 
              class="btn-load"
              on:click={() => handleLoadProject(project.id)}
              title="Load this project"
            >
              Load
            </button>
            
            {#if deleteConfirmId === project.id}
              <div class="delete-confirm" transition:slide|local={{ duration: 200 }}>
                <span>Delete?</span>
                <button 
                  class="btn-confirm"
                  on:click={() => handleDeleteProject(project.id)}
                >
                  Yes
                </button>
                <button 
                  class="btn-cancel"
                  on:click={cancelDelete}
                >
                  No
                </button>
              </div>
            {:else}
              <button 
                class="btn-delete"
                on:click={() => confirmDelete(project.id)}
                title="Delete this project"
              >
                Delete
              </button>
            {/if}
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .project-list-container {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  h2 {
    margin: 0;
    color: #333;
  }
  
  .header-actions {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }
  
  .btn-refresh {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f8f9fa;
    color: #6c757d;
    border: 1px solid #dee2e6;
    font-size: 1.25rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-refresh:hover {
    background-color: #e9ecef;
    transform: rotate(180deg);
  }
  
  .btn-primary, .btn-secondary, .btn-load, .btn-delete, .btn-confirm, .btn-cancel {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    border: none;
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
  
  .btn-load {
    background-color: #28a745;
    color: white;
  }
  
  .btn-load:hover {
    background-color: #218838;
  }
  
  .btn-delete {
    background-color: #dc3545;
    color: white;
  }
  
  .btn-delete:hover {
    background-color: #c82333;
  }
  
  .loading-state, .error-state, .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
    color: #6c757d;
  }
  
  .loading-spinner {
    width: 2.5rem;
    height: 2.5rem;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #3b5998;
    border-radius: 50%;
    margin-top: 1rem;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .project-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .project-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem;
    border-bottom: 1px solid #e9ecef;
    transition: background-color 0.2s;
  }
  
  .project-item:last-child {
    border-bottom: none;
  }
  
  .project-item:hover {
    background-color: #f8f9fa;
  }
  
  .project-details {
    flex: 1;
    cursor: pointer;
    padding-right: 1rem;
  }
  
  .project-name {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    color: #3b5998;
  }
  
  .project-description {
    margin: 0 0 0.75rem 0;
    color: #6c757d;
    font-size: 0.9rem;
  }
  
  .project-dates {
    font-size: 0.8rem;
    color: #6c757d;
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  
  .date-label {
    color: #adb5bd;
  }
  
  .date-separator {
    margin: 0 0.5rem;
  }
  
  .project-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .delete-confirm {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }
  
  .btn-confirm, .btn-cancel {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }
  
  .btn-confirm {
    background-color: #dc3545;
    color: white;
  }
  
  .btn-cancel {
    background-color: #6c757d;
    color: white;
  }
  
  @media (max-width: 768px) {
    .project-item {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .project-actions {
      width: 100%;
      margin-top: 1rem;
      justify-content: flex-end;
    }
    
    .project-details {
      width: 100%;
      padding-right: 0;
    }
  }
</style>