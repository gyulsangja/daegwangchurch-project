import { PersonForm } from "@/components/admin/person-form";

export default function NewPersonPage() {
  return <div className="mx-auto max-w-[90rem]"><p className="text-sm font-bold text-primary-700">NEW PERSON</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">교역자 등록</h1><p className="mt-2 text-text-secondary">공개 프로필과 노출 순서를 입력합니다.</p><PersonForm /></div>;
}

