import { BulletinForm } from "../../../../../components/admin/bulletin-form";

export default function NewBulletinPage() {
  return <div className="mx-auto max-w-[90rem]"><p className="text-sm font-bold text-primary-700">NEW BULLETIN</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">주보 등록</h1><p className="mt-2 text-text-secondary">예배 날짜와 PDF 파일을 등록합니다.</p><BulletinForm /></div>;
}

