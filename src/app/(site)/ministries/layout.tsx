import { SectionNavigation } from "@/components/site/section-navigation";
import { ministryNavigation } from "@/content/navigation";

export default function MinistriesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SectionNavigation label="교회학교와 사역 하위 메뉴" items={ministryNavigation} />
      {children}
    </>
  );
}
