import type {FinanceCategory} from '@daegwang/contracts/finance';

export function groupedAccounts(categories: FinanceCategory[]) {
  const grouped = new Map<string, FinanceCategory[]>();
  for (const category of categories) {
    const kind = category.kind === 'EXPENSE' ? '세출' : category.offering ? '세입 · 헌금' : '세입 · 기타 수입';
    const group = category.section?.trim() ? kind+' / '+category.section.trim() : kind;
    const items = grouped.get(group) ?? [];
    items.push(category);
    grouped.set(group,items);
  }
  return [...grouped.entries()].sort(([a],[b])=>a.localeCompare(b,'ko')).map(([name,items])=>({
    name,items:items.sort((a,b)=>a.name.localeCompare(b.name,'ko')),
    budget:items.reduce((n,c)=>n+c.budget,0),actual:items.reduce((n,c)=>n+c.actual,0),
  }));
}

export const budgetRate=(actual:number,budget:number)=>budget ? (100*actual/budget).toLocaleString('ko-KR',{maximumFractionDigits:1})+'%' : '예산 미편성';
