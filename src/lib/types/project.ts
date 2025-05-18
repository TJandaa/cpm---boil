// Podstawowe definicje typów dla aplikacji CPM

// Definicja zadania
export interface Task {
  id: string;
  name: string;
  duration: number;
  dependencies: string[];
}

// Definicja projektu
export interface Project {
  id: string;
  name: string;
  description?: string;
  tasks: Task[];
}

// Wyniki obliczeń CPM dla zadania
export interface CPMResult {
  taskId: string;
  earliestStart: number;
  earliestFinish: number;
  latestStart: number;
  latestFinish: number;
  slack: number;
  isCritical: boolean;
}

// Wyniki obliczeń CPM dla projektu
export interface CPMResults {
  results: Record<string, CPMResult>;
  criticalPath: string[];
  projectDuration: number;
}
