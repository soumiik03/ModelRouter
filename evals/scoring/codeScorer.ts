export function scoreCode(response: string, testCases: { input: string; expectedOutput: string }[]): number {
  const hasFunctionDef = /def\s+\w+\(|function\s+\w+\(/.test(response);
  return hasFunctionDef ? 1 : 0;
}
