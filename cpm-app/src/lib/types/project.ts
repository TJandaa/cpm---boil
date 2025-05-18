/**
 * Types for the Critical Path Method (CPM) calculation
 */

/**
 * Interface for a project task
 * Represents a single activity in a project network
 */
export interface Task {
  id: string;
  name: string;
  description?: string;
  duration: number; // Duration in time units (usually days)
  dependencies: string[]; // IDs of tasks that must be completed before this task can start
}

/**
 * Interface for a project
 * Contains project metadata and collection of tasks
 */
export interface Project {
  id: string;
  name: string;
  description?: string;
  startDate?: Date;
  tasks: Task[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Interface for CPM calculation results for a single task
 * Contains all the calculated values from the CPM analysis
 */
export interface CPMResult {
  taskId: string;
  earliestStart: number; // ES - Earliest time a task can start
  earliestFinish: number; // EF - Earliest time a task can finish
  latestStart: number; // LS - Latest time a task can start without delaying the project
  latestFinish: number; // LF - Latest time a task can finish without delaying the project
  slack: number; // Float - Amount of time a task can be delayed without delaying the project
  isCritical: boolean; // Whether this task is on the critical path
}

/**
 * Interface for compiled CPM results for a project
 * Aggregates all calculation results and additional project data
 */
export interface ProjectCPMResults {
  projectId: string;
  projectDuration: number; // Total project duration (in time units)
  criticalPath: string[]; // IDs of tasks on the critical path
  taskResults: Record<string, CPMResult>; // Map of task IDs to their CPM results
}

/**
 * Enum for activity relationship types
 * Used primarily in Activity-on-Arrow (AoA) approach
 */
export enum DependencyType {
  FinishToStart = 'FS', // Most common: successor can't start until predecessor finishes
  StartToStart = 'SS', // Successor can't start until predecessor starts
  FinishToFinish = 'FF', // Successor can't finish until predecessor finishes
  StartToFinish = 'SF' // Successor can't finish until predecessor starts (rarely used)
}

/**
 * Interface for tracking earliest and latest times for Activity-on-Arrow diagrams
 * Represents events or nodes in an AoA network
 */
export interface EventTime {
  eventId: string;
  earliestTime: number; // Earliest time this event can occur
  latestTime: number; // Latest time this event can occur without delaying the project
  slack: number; // Slack time for this event
}