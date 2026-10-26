import {PastoralPage} from '@/components/pastoral-page';
export default async function Page({searchParams}:{searchParams:Promise<{activity?:string}>}){return <PastoralPage mode="PRAYER" initialId={(await searchParams).activity}/>;}
