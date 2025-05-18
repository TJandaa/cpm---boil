import type { Activity, CPMResult, Project } from '$lib/types/cpm';

/**
 * Calculate the Critical Path Method for a project
 * @param project The project with activities
 * @returns CPM calculation results
 */
export function calculateCPM(project: Project): CPMResult {
  const activities = [...project.activities];
  
  // Make sure activities are ordered (topological sort)
  const orderedActivities = topologicalSort(activities);
  
  // Forward pass - calculate ES and EF
  forwardPass(orderedActivities);
  
  // Backward pass - calculate LS, LF and slack
  const projectDuration = backwardPass(orderedActivities);
  
  // Determine critical path
  const criticalPath = findCriticalPath(orderedActivities);
  
  return {
    criticalPath: criticalPath.map(activity => activity.id),
    projectDuration,
    activities: orderedActivities
  };
}

/**
 * Order activities so that predecessors come before successors (topological sort)
 */
function topologicalSort(activities: Activity[]): Activity[] {
  const visited = new Set<string>();
  const result: Activity[] = [];
  
  // Create a map for quick activity lookup
  const activityMap = new Map<string, Activity>();
  activities.forEach(activity => activityMap.set(activity.id, activity));
  
  // Helper function for depth-first search
  function visit(activityId: string) {
    if (visited.has(activityId)) return;
    
    visited.add(activityId);
    const activity = activityMap.get(activityId);
    
    if (!activity) return;
    
    // Visit all predecessors first
    activity.predecessors.forEach(predecessorId => {
      visit(predecessorId);
    });
    
    result.push(activity);
  }
  
  // Visit all activities
  activities.forEach(activity => {
    if (!visited.has(activity.id)) {
      visit(activity.id);
    }
  });
  
  return result;
}

/**
 * Forward pass - calculate Earliest Start (ES) and Earliest Finish (EF)
 */
function forwardPass(activities: Activity[]): void {
  // Reset values
  activities.forEach(activity => {
    activity.earliestStart = 0;
    activity.earliestFinish = 0;
  });
  
  // Create a map for quick activity lookup
  const activityMap = new Map<string, Activity>();
  activities.forEach(activity => activityMap.set(activity.id, activity));
  
  activities.forEach(activity => {
    // If activity has predecessors, ES is the maximum EF of all predecessors
    if (activity.predecessors.length > 0) {
      let maxEF = 0;
      activity.predecessors.forEach(predecessorId => {
        const predecessor = activityMap.get(predecessorId);
        if (predecessor && predecessor.earliestFinish > maxEF) {
          maxEF = predecessor.earliestFinish;
        }
      });
      activity.earliestStart = maxEF;
    } else {
      // If no predecessors, ES is 0
      activity.earliestStart = 0;
    }
    
    // EF = ES + Duration
    activity.earliestFinish = activity.earliestStart + activity.duration;
  });
}

/**
 * Backward pass - calculate Latest Start (LS), Latest Finish (LF) and slack
 * @returns Project duration
 */
function backwardPass(activities: Activity[]): number {
  // Find the maximum EF (project duration)
  const projectDuration = Math.max(...activities.map(a => a.earliestFinish));
  
  // Create a map for quick activity lookup
  const activityMap = new Map<string, Activity>();
  activities.forEach(activity => activityMap.set(activity.id, activity));
  
  // Initialize all activities' LF to project duration
  activities.forEach(activity => {
    activity.latestFinish = projectDuration;
    activity.latestStart = 0;
    activity.slack = 0;
    activity.isCritical = false;
  });
  
  // Find all activities that have no successors (end activities)
  const activitySuccessors = new Map<string, string[]>();
  activities.forEach(activity => {
    activitySuccessors.set(activity.id, []);
  });
  
  // Build the successor map
  activities.forEach(activity => {
    activity.predecessors.forEach(predecessorId => {
      const successors = activitySuccessors.get(predecessorId) || [];
      successors.push(activity.id);
      activitySuccessors.set(predecessorId, successors);
    });
  });
  
  // Process activities in reverse order
  for (let i = activities.length - 1; i >= 0; i--) {
    const activity = activities[i];
    const successors = activitySuccessors.get(activity.id) || [];
    
    if (successors.length === 0) {
      // End activities - LF is the project duration
      activity.latestFinish = projectDuration;
    } else {
      // LF is the minimum LS of all successors
      activity.latestFinish = Math.min(
        ...successors.map(successorId => {
          const successor = activityMap.get(successorId);
          return successor ? successor.latestStart : projectDuration;
        })
      );
    }
    
    // LS = LF - Duration
    activity.latestStart = activity.latestFinish - activity.duration;
    
    // Slack = LS - ES
    activity.slack = activity.latestStart - activity.earliestStart;
    
    // Critical activities have zero slack
    activity.isCritical = activity.slack === 0;
  }
  
  return projectDuration;
}

/**
 * Find the critical path (activities with zero slack)
 */
function findCriticalPath(activities: Activity[]): Activity[] {
  return activities.filter(activity => activity.isCritical);
}

/**
 * Find all paths through the project network
 */
export function findAllPaths(project: Project): Activity[][] {
  const activityMap = new Map<string, Activity>();
  project.activities.forEach(activity => activityMap.set(activity.id, activity));
  
  // Find activities with no predecessors (start activities)
  const startActivities = project.activities.filter(
    activity => activity.predecessors.length === 0
  );
  
  // Find activities with no successors (end activities)
  const activitySuccessors = new Map<string, string[]>();
  project.activities.forEach(activity => {
    activitySuccessors.set(activity.id, []);
  });
  
  // Build the successor map
  project.activities.forEach(activity => {
    activity.predecessors.forEach(predecessorId => {
      const successors = activitySuccessors.get(predecessorId) || [];
      successors.push(activity.id);
      activitySuccessors.set(predecessorId, successors);
    });
  });
  
  const endActivities = project.activities.filter(
    activity => (activitySuccessors.get(activity.id) || []).length === 0
  );
  
  const paths: Activity[][] = [];
  
  // For each start activity, find all paths to end activities
  startActivities.forEach(start => {
    findPaths(start, [], paths);
  });
  
  return paths;
  
  // Recursive helper function
  function findPaths(
    activity: Activity,
    currentPath: Activity[],
    allPaths: Activity[][]
  ): void {
    // Add current activity to path
    const path = [...currentPath, activity];
    
    // Get successors
    const successors = activitySuccessors.get(activity.id) || [];
    
    if (successors.length === 0) {
      // This is an end activity, add the path
      allPaths.push(path);
    } else {
      // Continue with each successor
      successors.forEach(successorId => {
        const successor = activityMap.get(successorId);
        if (successor) {
          findPaths(successor, path, allPaths);
        }
      });
    }
  }
}