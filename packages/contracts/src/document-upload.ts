import {z} from 'zod';
export const documentTypes={pdf:'application/pdf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',hwp:'application/x-hwp',txt:'text/plain'} as const;
export const documentExtension=z.enum(['pdf','docx','xlsx','pptx','hwp','txt']);
export const prepareDocument=z.object({operation:z.literal('PREPARE_DOCUMENT'),name:z.string().trim().min(1).max(240),extension:documentExtension,size:z.number().int().positive().max(5*1024*1024)}).strict().refine(v=>v.name.toLowerCase().endsWith('.'+v.extension),'파일 확장자를 확인해 주세요.');
export const completeDocument=z.object({operation:z.literal('COMPLETE_DOCUMENT'),receipt:z.string().min(1).max(4000)}).strict();
