import { optimizeImage } from '@daegwang/web-ui/lib/optimize-image';
import { isNoticeImage } from '@daegwang/contracts/features/notices/attachments';

// Leave room for multipart headers and text below the hosting request limit.
const TOTAL_BYTES = 3.5 * 1024 * 1024;

export async function prepareNoticeAttachments(form: FormData, progress: (message: string) => void) {
  const files = form.getAll('attachmentFiles').filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length > 10) throw new Error('첨부파일은 한 번에 10개까지 올릴 수 있습니다.');
  const images = files.filter(file => isNoticeImage(file.type));
  const documentBytes = files.filter(file => !isNoticeImage(file.type)).reduce((sum, file) => sum + file.size, 0);
  if (documentBytes > TOTAL_BYTES || (images.length && TOTAL_BYTES - documentBytes < images.length * 100 * 1024)) throw new Error('문서 파일의 전체 용량을 3MB 이하로 줄이거나 나누어 올려 주세요. 이미지는 자동으로 축소됩니다.');
  const budget = Math.floor(Math.min(900 * 1024, (TOTAL_BYTES - documentBytes) / Math.max(images.length, 1)));
  const prepared: File[] = [];
  for (const file of files) {
    if (isNoticeImage(file.type)) { progress(`이미지 자동 최적화 중 · ${prepared.length + 1}/${files.length}`); prepared.push(await optimizeImage(file, budget)); }
    else prepared.push(file);
  }
  form.delete('attachmentFiles');
  for (const file of prepared) form.append('attachmentFiles', file);
  progress('저장 중…');
}
