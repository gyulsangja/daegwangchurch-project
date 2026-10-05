"use server";
import { requireAdmin } from '../../lib/auth/permissions';
export type AppPublicationState = { message: string; success: boolean };
// Reject old tabs/actions so they cannot diverge from the shared publication state.
export async function changeAppPublicationAction(_id: string, _expectedUpdatedAt: string, _state: AppPublicationState, _formData: FormData): Promise<AppPublicationState> {
  void [_id, _expectedUpdatedAt, _state, _formData];
  await requireAdmin();
  return { success: false, message: '발행 방식이 통합되었습니다. 페이지를 새로고침하고 위의 저장 버튼을 사용해 주세요.' };
}
