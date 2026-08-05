export function scoreExactMatch(response: string, expectedAnswer: string): number {
  return response.includes(expectedAnswer) ? 1 : 0;
}