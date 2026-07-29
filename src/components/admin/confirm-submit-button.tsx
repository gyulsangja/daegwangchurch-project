"use client";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
export function ConfirmSubmitButton({ message = "삭제한 내용은 홈페이지에서 즉시 사라집니다. 정말 삭제하시겠습니까?", label = "삭제" }: { message?: string; label?: string }) { return <Button type="submit" variant="secondary" color="error" onClick={(event) => { if (!window.confirm(message)) event.preventDefault(); }}><Trash2 aria-hidden="true" className="size-4" /> {label}</Button>; }
