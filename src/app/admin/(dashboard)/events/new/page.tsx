import { EventForm } from "@/components/admin/event-form";

export default function NewEventPage() {
  return <div className="mx-auto max-w-[90rem]"><p className="text-sm font-bold text-primary-700">NEW EVENT</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">교회 일정 등록</h1><p className="mt-2 text-text-secondary">일정 시간, 장소와 공개 상태를 입력합니다.</p><EventForm /></div>;
}
