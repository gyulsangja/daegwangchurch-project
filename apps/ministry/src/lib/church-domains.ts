export const ministryHost = 'ministry.daegwangchurch.kr';
export const financeHost = 'finance.daegwangchurch.kr';

export function customDestination(host: string | null, path: string, search: string) {
  if (host !== ministryHost && host !== financeHost) return null;
  const financePath = path === '/finance' || path.startsWith('/finance/');
  let target = '';
  let pathname = path;
  if (host === financeHost && path === '/') {
    target = financeHost;
    pathname = '/finance';
  } else if (host === ministryHost && financePath) {
    target = financeHost;
  }
  if (!target) return null;
  const url = new URL('https://' + target);
  url.pathname = pathname;
  url.search = search;
  return url;
}
