import { WorshipForm } from "../../../../../components/admin/worship-form";

export default function NewWorshipPage() {
  return (
    <div className="mx-auto max-w-[90rem]">
      <p className="text-sm font-bold text-primary-700">NEW WORSHIP CONTENT</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">예배 콘텐츠 등록</h1>
      <p className="mt-2 text-text-secondary">YouTube URL을 입력하면 영상 ID와 기본 썸네일을 자동으로 처리합니다.</p>
      <WorshipForm />
    </div>
  );
}
