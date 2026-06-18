export function generateId(): string {
  // Safe uuid generation that doesn't rely on crypto.randomUUID() being available in all contexts
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}
