import { SectionNavigation } from "@/components/site/section-navigation";
import { newsNavigation } from "@/content/navigation";

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SectionNavigation label="교회소식 하위 메뉴" items={newsNavigation} />
      {children}
    </>
  );
}
