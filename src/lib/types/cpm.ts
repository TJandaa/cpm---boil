/**
 * Types for Critical Path Method (CPM) calculations
 */

// Represents a project in the CPM system
export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  activities: Activity[];
  createdAt: Date;
  updatedAt: Date;
}

// Represents an activity/task in the CPM system
export interface Activity {
  id: string;
  name: string;
  description: string;
  duration: number; // Duration in days
  predecessors: string[]; // IDs of predecessor activities
  earliestStart: number; // ES - Earliest Start Time
  earliestFinish: number; // EF - Earliest Finish Time
  latestStart: number; // LS - Latest Start Time
  latestFinish: number; // LF - Latest Finish Time
  slack: number; // Float or slack time
  isCritical: boolean; // Is this activity on the critical path?
  projectId: string; // Reference to parent project
  createdAt: Date;
  updatedAt: Date;
}

// Represents a relationship between activities
export interface ActivityDependency {
  id: string;
  predecessorId: string;
  successorId: string;
  type: DependencyType;
  lag: number; // Lag time in days
}

// Types of dependencies between activities
export enum DependencyType {
  FinishToStart = 'FS', // Most common: successor can't start until predecessor finishes
  StartToStart = 'SS', // Successor can't start until predecessor starts
  FinishToFinish = 'FF', // Successor can't finish until predecessor finishes
  StartToFinish = 'SF' // Successor can't finish until predecessor starts (rarely used)
}

// Network diagram node
export interface ActivityNode {
  id: string;
  activityId: string;
  x: number; // Position X
  y: number; // Position Y
}

// Network diagram edge
export interface ActivityEdge {
  id: string;
  from: string; // Source activity ID
  to: string; // Target activity ID
  dependencyType: DependencyType;
}

// Result of CPM calculations
export interface CPMResult {
  criticalPath: string[]; // IDs of activities on the critical path
  projectDuration: number; // Total project duration
  activities: Activity[]; // Activities with calculated values
}