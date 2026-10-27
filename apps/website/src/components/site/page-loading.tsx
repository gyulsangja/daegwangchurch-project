export function PageLoading({title='대광교회',section=false}:{title?:string;section?:boolean}) {
 return <section className="container-site py-10 md:py-14" aria-busy="true" aria-label={`${title} 불러오는 중`}>
  {section?<h2 className="text-2xl font-bold">{title}</h2>:<h1 className="text-3xl font-bold">{title}</h1>}
  <div role="status" className="my-6 flex items-center gap-3 text-sm text-text-secondary"><span aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none rounded-full border-2 border-primary-100 border-t-primary-700"/>내용을 불러오는 중입니다.</div>
  <div aria-hidden="true" className="grid gap-6 md:grid-cols-2">{[0,1].map(i=><div key={i} className="min-h-40 space-y-5 rounded-xl border border-border p-6"><div className="h-6 w-3/4 animate-pulse motion-reduce:animate-none rounded bg-primary-100"/><div className="h-4 w-full animate-pulse motion-reduce:animate-none rounded bg-primary-100"/><div className="h-4 w-1/2 animate-pulse motion-reduce:animate-none rounded bg-primary-100"/></div>)}</div>
 </section>;
}
