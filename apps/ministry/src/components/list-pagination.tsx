'use client';
import {useState} from 'react';
export function useListPagination<T>(rows:T[],filterKey:string,size=10){
 const [position,setPosition]=useState({key:filterKey,page:0});
 const pages=Math.max(1,Math.ceil(rows.length/size));
 const page=position.key===filterKey?Math.min(position.page,pages-1):0;
 return {items:rows.slice(page*size,(page+1)*size),page,pages,total:rows.length,setPage:(next:number)=>setPosition({key:filterKey,page:Math.max(0,Math.min(next,pages-1))})};
}
export function ListPagination({page,pages,total,setPage}:{page:number;pages:number;total:number;setPage:(page:number)=>void}){
 return <nav className="list-pagination" aria-label="목록 페이지"><span>검색 결과 <strong>{total}건</strong></span><div><button type="button" className="button" disabled={page===0} onClick={()=>setPage(page-1)}>이전</button><span aria-live="polite">{page+1} / {pages}</span><button type="button" className="button" disabled={page+1>=pages} onClick={()=>setPage(page+1)}>다음</button></div></nav>;
}
