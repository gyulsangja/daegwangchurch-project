import { NoticeForm } from "@/components/admin/notice-form";

export default function NewNoticePage() {
  return (
    <div className="mx-auto max-w-[90rem]">
      <p className="text-sm font-bold text-primary-700">NEW NOTICE</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">공지사항 등록</h1>
      <p className="mt-2 text-text-secondary">본문과 공개 상태, 게시 기간을 설정합니다.</p>
      <NoticeForm />
    </div>
  );
}

