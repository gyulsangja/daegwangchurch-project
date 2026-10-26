import {PastoralPage} from '@/components/pastoral-page';
export default async function Page({searchParams}:{searchParams:Promise<{activity?:string}>}){return <PastoralPage mode="GOAL" initialId={(await searchParams).activity}/>;}
