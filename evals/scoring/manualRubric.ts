export interface ManualScoreEntry {
  taskId: string;
  model: string;
  response: string;
  score: number | null; 
}