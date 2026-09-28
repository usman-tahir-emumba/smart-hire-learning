export function normalizeSkills(skills: string[] | undefined | null): string[] {
  if (!skills) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of skills) {
    if (typeof raw !== 'string') continue;
    const skill = raw.trim().toLowerCase();
    if (skill === '' || seen.has(skill)) continue;
    seen.add(skill);
    result.push(skill);
  }
  return result;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
