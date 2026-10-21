const localHosts = new Set(['localhost:3002', '127.0.0.1:3002']);
export function isLocalReviewEnabled(env: { NODE_ENV?: string; MINISTRY_LOCAL_DEMO?: string }, host: string | null) {
  return env.NODE_ENV === 'development' && env.MINISTRY_LOCAL_DEMO === 'true' && !!host && localHosts.has(host);
}
export function isLocalMutationOrigin(host: string | null, origin: string | null) {
  return !!host && localHosts.has(host) && origin === `http://${host}`;
}
