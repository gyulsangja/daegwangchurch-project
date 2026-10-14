"use client";
import { Trash2 } from "lucide-react";
import { Button } from "@daegwang/web-ui/components/ui/button";
import { useFormStatus } from 'react-dom';
export function ConfirmSubmitButton({ message = "삭제하면 홈페이지와 앱의 해당 공개 목록에서 사라집니다. 정말 삭제하시겠습니까?", label = "삭제" }: { message?: string; label?: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" variant="secondary" color="error" disabled={pending} onClick={(event) => { if (!window.confirm(message)) event.preventDefault(); }}><Trash2 aria-hidden="true" className="size-4" /> {pending ? '삭제 중…' : label}</Button>;
}
