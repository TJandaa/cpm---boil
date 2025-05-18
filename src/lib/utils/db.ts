import { PrismaClient } from '@prisma/client';
import type { Project, Task } from '$lib/types/project';

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * Database functions for Project CRUD operations
 */

// Get all projects
export async function getAllProjects() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    return projects;
  } catch (error) {
    console.error('Error getting all projects:', error);
    throw new Error('Failed to get projects');
  }
}

// Get project with tasks
export async function getProject(projectId: string) {
  try {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId
      },
      include: {
        tasks: {
          include: {
            dependencies: {
              include: {
                predecessor: true
              }
            }
          }
        }
      }
    });
    
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    // Transform data to match our application's data model
    const transformedTasks: Task[] = project.tasks.map(dbTask => {
      return {
        id: dbTask.id,
        name: dbTask.name,
        description: dbTask.description || undefined,
        duration: dbTask.duration,
        dependencies: dbTask.dependencies.map(dep => dep.predecessorId)
      };
    });
    
    const transformedProject: Project = {
      id: project.id,
      name: project.name,
      description: project.description || undefined,
      startDate: project.startDate || undefined,
      tasks: transformedTasks,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };
    
    return transformedProject;
  } catch (error) {
    console.error(`Error getting project ${projectId}:`, error);
    throw error;
  }
}

// Create new project
export async function createProject(project: Project) {
  try {
    // Start a transaction to ensure all operations succeed or fail together
    return await prisma.$transaction(async (tx) => {
      // Create the project
      const newProject = await tx.project.create({
        data: {
          name: project.name,
          description: project.description,
          startDate: project.startDate
        }
      });
      
      // Create tasks
      if (project.tasks && project.tasks.length > 0) {
        // First create all tasks without dependencies
        await Promise.all(project.tasks.map(task => {
          return tx.task.create({
            data: {
              id: task.id, // Use the provided ID to maintain relations
              name: task.name,
              description: task.description,
              duration: task.duration,
              projectId: newProject.id
            }
          });
        }));
        
        // Then create dependencies
        const dependencyPromises = project.tasks
          .filter(task => task.dependencies && task.dependencies.length > 0)
          .flatMap(task => {
            return task.dependencies.map(depId => {
              return tx.taskDependency.create({
                data: {
                  dependentId: task.id,
                  predecessorId: depId
                }
              });
            });
          });
        
        if (dependencyPromises.length > 0) {
          await Promise.all(dependencyPromises);
        }
      }
      
      return {
        ...newProject,
        tasks: project.tasks || []
      };
    });
  } catch (error) {
    console.error('Error creating project:', error);
    throw new Error('Failed to create project');
  }
}

// Update project
export async function updateProject(projectId: string, project: Project) {
  try {
    // Validate project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId }
    });
    
    if (!existingProject) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    return await prisma.$transaction(async (tx) => {
      // Update project details
      await tx.project.update({
        where: { id: projectId },
        data: {
          name: project.name,
          description: project.description,
          startDate: project.startDate
        }
      });
      
      // Get existing tasks for this project
      const existingTasks = await tx.task.findMany({
        where: { projectId },
        include: { dependencies: true }
      });
      
      // Delete all existing tasks and dependencies
      // This is simpler than tracking changes for a small to medium sized project
      // For larger projects, a more granular approach would be better
      await tx.taskDependency.deleteMany({
        where: {
          OR: [
            { dependentId: { in: existingTasks.map(t => t.id) } },
            { predecessorId: { in: existingTasks.map(t => t.id) } }
          ]
        }
      });
      
      await tx.task.deleteMany({
        where: { projectId }
      });
      
      // Create new tasks and dependencies
      if (project.tasks && project.tasks.length > 0) {
        // First create all tasks without dependencies
        await Promise.all(project.tasks.map(task => {
          return tx.task.create({
            data: {
              id: task.id,
              name: task.name,
              description: task.description,
              duration: task.duration,
              projectId
            }
          });
        }));
        
        // Then create dependencies
        const dependencyPromises = project.tasks
          .filter(task => task.dependencies && task.dependencies.length > 0)
          .flatMap(task => {
            return task.dependencies.map(depId => {
              return tx.taskDependency.create({
                data: {
                  dependentId: task.id,
                  predecessorId: depId
                }
              });
            });
          });
        
        if (dependencyPromises.length > 0) {
          await Promise.all(dependencyPromises);
        }
      }
      
      // Return the updated project
      return await getProject(projectId);
    });
  } catch (error) {
    console.error(`Error updating project ${projectId}:`, error);
    throw error;
  }
}

// Delete project
export async function deleteProject(projectId: string) {
  try {
    // Validate project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId }
    });
    
    if (!existingProject) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    // Delete project (tasks and dependencies will cascade)
    await prisma.project.delete({
      where: { id: projectId }
    });
    
    return { success: true, message: `Project ${projectId} deleted successfully` };
  } catch (error) {
    console.error(`Error deleting project ${projectId}:`, error);
    throw error;
  }
}

/**
 * Helper function to handle database errors
 */
export function handleDbError(error: any): { error: string, status: number } {
  console.error('Database error:', error);
  
  // Determine appropriate error message and status code
  if (error.code === 'P2025') {
    // Prisma record not found error
    return {
      error: 'Resource not found',
      status: 404
    };
  } else if (error.code?.startsWith('P2')) {
    // Other Prisma validation errors
    return {
      error: 'Invalid request data',
      status: 400
    };
  } else if (error instanceof Error) {
    return {
      error: error.message,
      status: 500
    };
  } else {
    return {
      error: 'Unknown database error',
      status: 500
    };
  }
}