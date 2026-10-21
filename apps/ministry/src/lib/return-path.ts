export function memberReturnPath(value: unknown) {
  return typeof value === 'string' && (value === '/members' || value.startsWith('/members?')) && !/[\\\r\n]/.test(value) ? value : '/members';
}
