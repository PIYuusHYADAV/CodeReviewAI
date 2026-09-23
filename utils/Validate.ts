export function getValidDiffLines(patch: string): Set<number> {
  const validLines = new Set<number>();
  if (!patch) return validLines;

  const lines = patch.split("\n");
  let currentLine = 0;

  for (const line of lines) {
    const hunkMatch = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunkMatch) {
      currentLine = parseInt(hunkMatch[1], 10);
      continue;
    }
    if (line.startsWith("+") && !line.startsWith("+++")) {
      validLines.add(currentLine);
      currentLine++;
    } else if (!line.startsWith("-")) {
      currentLine++;
    }
  }
  return validLines;
}
