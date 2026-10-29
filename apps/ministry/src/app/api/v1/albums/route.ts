import {handle,readInput} from '@/lib/http';
import {manageAlbums} from '@/lib/album-management';
export function GET(request:Request){return handle(request,(_s,actor,session)=>manageAlbums(actor,Object.fromEntries(new URL(request.url).searchParams),false,session));}
export function POST(request:Request){return handle(request,async(_s,actor,session)=>manageAlbums(actor,await readInput(request,100000),true,session));}
