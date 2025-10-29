export function parseChartBlock(str: string) {
  const lines = str.split("\n").filter(Boolean);
  const obj: any = {};
  for (const line of lines) {
    const [key, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    try {
      obj[key.trim()] = JSON.parse(value);
    } catch {
      obj[key.trim()] = value;
    }
  }
  return obj;
}
