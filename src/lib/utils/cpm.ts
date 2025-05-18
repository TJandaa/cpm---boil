import type { Task, CPMResult, CPMResults } from '$lib/types/project';

// Funkcja do obliczania najwcześniejszych czasów (forward pass)
export function calculateEarliestTimes(tasks: Task[]): Record<string, { start: number; finish: number }> {
  const results: Record<string, { start: number; finish: number }> = {};
  
  // Inicjalizacja wszystkich zadań z zerowym earliest start
  tasks.forEach(task => {
    results[task.id] = { start: 0, finish: task.duration };
  });
  
  // Przetwarzanie zadań w porządku topologicznym
  let changed = true;
  while (changed) {
    changed = false;
    tasks.forEach(task => {
      let maxPredecessorFinish = 0;
      
      task.dependencies.forEach(depId => {
        if (results[depId] && results[depId].finish > maxPredecessorFinish) {
          maxPredecessorFinish = results[depId].finish;
        }
      });
      
      if (maxPredecessorFinish > results[task.id].start) {
        results[task.id].start = maxPredecessorFinish;
        results[task.id].finish = maxPredecessorFinish + task.duration;
        changed = true;
      }
    });
  }
  
  return results;
}

// Poprawiona funkcja do obliczania najpóźniejszych czasów (backward pass)
export function calculateLatestTimes(
  tasks: Task[],
  earliestTimes: Record<string, { start: number; finish: number }>,
  maxDuration: number
): Record<string, { start: number; finish: number }> {
  const results: Record<string, { start: number; finish: number }> = {};
  
  // Inicjalizacja wszystkich zadań z najpóźniejszym zakończeniem równym maksymalnemu czasowi projektu
  tasks.forEach(task => {
    results[task.id] = {
      finish: maxDuration,
      start: maxDuration - task.duration
    };
  });
  
  // Znajdź kolejność zadań w odwrotnej kolejności (od końca do początku)
  const taskOrder: Task[] = [...tasks];
  taskOrder.sort((a, b) => {
    const aEF = earliestTimes[a.id].finish;
    const bEF = earliestTimes[b.id].finish;
    return bEF - aEF; // Sortowanie malejąco po earliest finish
  });
  
  // Przetwarzanie zadań w odwrotnej kolejności
  let changed = true;
  while (changed) {
    changed = false;
    
    for (const task of taskOrder) {
      // Dla każdego zadania sprawdź wszystkie zadania, które od niego zależą
      const successors = tasks.filter(t => t.dependencies.includes(task.id));
      
      if (successors.length > 0) {
        // Znajdź minimum z latest start następników
        let minSuccessorStart = Number.MAX_SAFE_INTEGER;
        for (const successor of successors) {
          if (results[successor.id].start < minSuccessorStart) {
            minSuccessorStart = results[successor.id].start;
          }
        }
        
        // Aktualizuj latest finish i latest start dla zadania
        const newLatestFinish = minSuccessorStart;
        const newLatestStart = newLatestFinish - task.duration;
        
        if (newLatestFinish < results[task.id].finish) {
          results[task.id].finish = newLatestFinish;
          results[task.id].start = newLatestStart;
          changed = true;
        }
      }
    }
  }
  
  return results;
}

// Funkcja do obliczania luzu czasowego
export function calculateSlack(
  earliestTimes: Record<string, { start: number; finish: number }>,
  latestTimes: Record<string, { start: number; finish: number }>
): Record<string, number> {
  const slack: Record<string, number> = {};
  
  Object.keys(earliestTimes).forEach(taskId => {
    slack[taskId] = latestTimes[taskId].start - earliestTimes[taskId].start;
  });
  
  return slack;
}

// Funkcja do znajdowania ścieżki krytycznej
export function findCriticalPath(tasks: Task[], slack: Record<string, number>): string[] {
  return tasks
    .filter(task => slack[task.id] === 0)
    .map(task => task.id);
}

// Główna funkcja do obliczania CPM
export function calculateCPM(tasks: Task[]): CPMResults {
  // Obliczenie najwcześniejszych czasów
  const earliestTimes = calculateEarliestTimes(tasks);
  
  // Znajdź maksymalny czas trwania projektu
  let maxDuration = 0;
  Object.values(earliestTimes).forEach(time => {
    if (time.finish > maxDuration) {
      maxDuration = time.finish;
    }
  });
  
  // Obliczenie najpóźniejszych czasów
  const latestTimes = calculateLatestTimes(tasks, earliestTimes, maxDuration);
  
  // Obliczenie luzu czasowego
  const slack = calculateSlack(earliestTimes, latestTimes);
  
  // Znalezienie ścieżki krytycznej
  const criticalPath = findCriticalPath(tasks, slack);
  
  // Przygotowanie wyników
  const results: Record<string, CPMResult> = {};
  tasks.forEach(task => {
    results[task.id] = {
      taskId: task.id,
      earliestStart: earliestTimes[task.id].start,
      earliestFinish: earliestTimes[task.id].finish,
      latestStart: latestTimes[task.id].start,
      latestFinish: latestTimes[task.id].finish,
      slack: slack[task.id],
      isCritical: criticalPath.includes(task.id)
    };
  });
  
  return {
    results,
    criticalPath,
    projectDuration: maxDuration
  };
}