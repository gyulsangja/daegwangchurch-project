export function PageLoading({title='목회시스템',search=false,cards=false}:{title?:string;search?:boolean;cards?:boolean}) {
 return <section aria-busy="true" aria-label={`${title} 불러오는 중`}>
  <div className="page-heading"><div><p className="eyebrow">대광교회 목회시스템</p><h1>{title}</h1></div></div>
  {search&&<div className="panel loading-filters" aria-hidden="true"><span className="loading-block"/><span className="loading-block"/><span className="loading-block"/></div>}
  <div className="loading-status" role="status"><span className="loading-spinner" aria-hidden="true"/>데이터를 불러오는 중입니다.</div>
  <div className={cards?'loading-cards':'panel loading-rows'} aria-hidden="true">{Array.from({length:cards?4:5},(_,i)=><div className="loading-row" key={i}><span className="loading-block"/><span className="loading-block"/><span className="loading-block"/></div>)}</div>
 </section>;
}
