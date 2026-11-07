// C08 Ex3 — ette antud ligipääsukontroll
export function mayRead(user, file) {
  return file.owner === user.id || user.role === 'organizer';
}