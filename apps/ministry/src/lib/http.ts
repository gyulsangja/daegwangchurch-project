import { ZodError } from 'zod';
import { isDirectoryError } from '@daegwang/ministry-core/directory';
import { isLocalMutationOrigin } from '@daegwang/ministry-core/local-access';
import { directory, enabled, reviewActor,requestWorkspace } from './workspace';
import {operationalEnabled,operationalOrigin} from './operational-config';

export async function handle(request: Request, action: (service: ReturnType<typeof directory>, actor: typeof reviewActor) => unknown | Promise<unknown>) {
  if (!operationalEnabled()&&!enabled(request.headers.get('host'))) return Response.json({ message: '운영 연결 전입니다.' }, { status: 503 });
  if (request.method !== 'GET' && !(operationalEnabled()?request.headers.get('origin')===operationalOrigin():isLocalMutationOrigin(request.headers.get('host'), request.headers.get('origin')))) return Response.json({ message: '허용되지 않은 요청입니다.' }, { status: 403 });
  try { const {service,actor}=await requestWorkspace(request.headers.get('host'));return Response.json(await action(service, actor), { headers: { 'Cache-Control': 'no-store' } }); }
  catch (error) {
    if(error instanceof Error&&error.message==='MINISTRY_LOGIN_REQUIRED')return Response.json({message:'로그인이 필요합니다.'},{status:401});
    if(error instanceof Error&&(error.name==='MinistryAccessError'||error.message==='MINISTRY_INVALID_HOST'))return Response.json({message:'목회 접근 권한이 없습니다.'},{status:403});
    if (error instanceof ZodError) return Response.json({ message: '입력값을 확인해 주세요.', errors: error.flatten().fieldErrors }, { status: 422 });
    if (isDirectoryError(error)) {
      const messages = { CONFLICT: '다른 작업에서 정보가 변경되었습니다. 새로고침 후 다시 수정해 주세요.', NOT_FOUND: '교인 정보를 찾을 수 없습니다.', FORBIDDEN: '이 작업을 할 권한이 없습니다.', INVALID: '상태·직분·소속을 다시 확인해 주세요.' };
      return Response.json({ message: error.message === error.code ? messages[error.code] : error.message }, { status: { CONFLICT: 409, NOT_FOUND: 404, FORBIDDEN: 403, INVALID: 422 }[error.code] });
    }
    if(error instanceof Error && error.name==='MinistryStorageError') return Response.json({message:'개발 저장소를 열지 못했습니다. 데이터를 초기화하지 않았습니다. 백업과 파일 상태를 확인해 주세요.'},{status:503});
    if (error instanceof SyntaxError) return Response.json({ message: '잘못된 요청 형식입니다.' }, { status: 400 });
    if (error instanceof Error && error.message === 'BODY_LIMIT') return Response.json({ message: '입력 내용이 너무 큽니다.' }, { status: 413 });
    return Response.json({ message: '처리하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 });
  }
}
export async function readInput(request: Request, limit = 16384) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new SyntaxError();
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError();
  const chunks: Uint8Array[] = []; let length = 0;
  for (;;) { const { done, value } = await reader.read(); if (done) break; length += value.length; if (length > limit) { await reader.cancel(); throw new Error('BODY_LIMIT'); } chunks.push(value); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
