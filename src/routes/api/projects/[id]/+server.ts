import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { 
  getProject, 
  updateProject, 
  deleteProject, 
  handleDbError 
} from '$lib/utils/db';
import { calculateCPM } from '$lib/utils/cpm';
import type { Project } from '$lib/types/project';

// GET /api/projects/:id - Get a specific project
export const GET: RequestHandler = async ({ params }) => {
  try {
    const projectId = params.id;
    const project = await getProject(projectId);
    
    // Calculate CPM if there are tasks
    if (project.tasks.length > 0) {
      const cpmResult = calculateCPM(project.tasks, project.id);
      return json({
        ...project,
        cpmResults: cpmResult
      });
    }
    
    return json(project);
  } catch (error) {
    const { error: errorMessage, status } = handleDbError(error);
    return json({ error: errorMessage }, { status });
  }
};

// PUT /api/projects/:id - Update a project
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const projectId = params.id;
    const projectData = await request.json() as Project;
    
    // Validate required fields
    if (!projectData.name) {
      return json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }
    
    const updatedProject = await updateProject(projectId, projectData);
    return json(updatedProject);
  } catch (error) {
    const { error: errorMessage, status } = handleDbError(error);
    return json({ error: errorMessage }, { status });
  }
};

// DELETE /api/projects/:id - Delete a project
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const projectId = params.id;
    const result = await deleteProject(projectId);
    return json(result);
  } catch (error) {
    const { error: errorMessage, status } = handleDbError(error);
    return json({ error: errorMessage }, { status });
  }
};