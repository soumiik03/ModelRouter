// Genuinely manual — no automation here, and that's fine.
// This function is a placeholder that gets filled in by YOU after
// the run, reading the actual outputs. Store raw responses so you
// can score them afterward without re-running anything.
export interface ManualScoreEntry {
  taskId: string;
  model: string;
  response: string;
  score: number | null; // null until you fill it in
}