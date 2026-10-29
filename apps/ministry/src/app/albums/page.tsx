import {redirect} from 'next/navigation';
import {workspace} from '@/lib/workspace';
import {AlbumWorkspace} from '@/components/album-workspace';
export default async function Page(){const {actor}=await workspace();if(!['ADMIN','CONTENT'].includes(actor.role))redirect('/access-denied');return <><div className="page-heading"><div><h1>교회 사진첩</h1><p>행사의 사진과 설명을 한 번 등록해 홈페이지의 같은 앨범에 반영합니다.</p></div></div><AlbumWorkspace canDelete={!!actor.canDelete}/></>;}
