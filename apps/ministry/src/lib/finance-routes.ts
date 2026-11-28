export const financePaths = {
  overview:'/', entries:'/ledger/entries', budget:'/ledger/budget',
  giving:'/giving/history', tax:'/giving/receipts', payroll:'/giving/payroll',
  accounts:'/settings/accounts', categories:'/settings/categories',
  audit:'/settings/audit', access:'/settings/access',
} as const;
export type FinanceTab=keyof typeof financePaths;
export function financeTab(path:string):FinanceTab|undefined{
  const local=path.replace(/^\/finance(?=\/|$)/,'')||'/';
  return (Object.keys(financePaths) as FinanceTab[]).find(key=>financePaths[key]===local);
}
export function financeHref(tab:FinanceTab,custom:boolean){
  const path=financePaths[tab];
  return custom?path:'/finance'+(path==='/'?'':path);
}
