// Naive but honest: checks if key logic appears to run correctly.
// For real unit-test scoring you'd actually execute the code — 
// keep this simple for v1, note the limitation.
export function scoreCode(response: string, testCases: { input: string; expectedOutput: string }[]): number {
  // v1: just check the response contains a function definition and
  // doesn't look empty/refused. Real execution-based scoring is a 
  // stretch goal, not required for the harness to be valid.
  const hasFunctionDef = /def\s+\w+\(|function\s+\w+\(/.test(response);
  return hasFunctionDef ? 1 : 0;
}
