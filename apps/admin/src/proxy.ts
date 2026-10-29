import {NextResponse,type NextRequest} from "next/server";
import {unifiedManagementPath} from '@daegwang/contracts/management-routes';

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  if(process.env.UNIFIED_MANAGEMENT_ENABLED==='true'){
    if(!['GET','HEAD'].includes(request.method))return NextResponse.json({message:'관리 화면이 통합되었습니다. 새 관리 화면에서 다시 열어 주세요.'},{status:409,headers:{'Cache-Control':'no-store'}});
    const response=NextResponse.redirect(new URL(unifiedManagementPath(request.nextUrl.pathname),'https://daegwangchurch-ministry.vercel.app'),307);
    response.headers.set('Cache-Control','private, no-store');return response;
  }
  return updateSession(request);
}

export const config = {
  matcher: ["/admin/:path*"],
};
