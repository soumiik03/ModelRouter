export function scoreExtraction(response: string, expectedKeywords: string[]): number {
  const lowerResponse = response.toLowerCase();
  const found = expectedKeywords.filter((kw) => lowerResponse.includes(kw.toLowerCase()));
  return found.length / expectedKeywords.length; 
}