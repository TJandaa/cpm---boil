import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { 
  getAllProjects, 
  createProject, 
  handleDbError 
} from '$lib/utils/db';
import type { Project } from '$lib/types/project';

// GET /api/projects - Get all projects
export const GET: RequestHandler = async () => {
  try {
    const projects = await getAllProjects();
    return json(projects);
  } catch (error) {
    const { error: errorMessage, status } = handleDbError(error);
    return json({ error: errorMessage }, { status });
  }
};

// POST /api/projects - Create a new project
export const POST: RequestHandler = async ({ request }) => {
  try {
    const projectData = await request.json() as Project;
    
    // Validate required fields
    if (!projectData.name) {
      return json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }
    
    const newProject = await createProject(projectData);
    return json(newProject, { status: 201 });
  } catch (error) {
    const { error: errorMessage, status } = handleDbError(error);
    return json({ error: errorMessage }, { status });
  }
};