import { SectionNavigation } from "@/components/site/section-navigation";
import { aboutNavigation } from "@/content/navigation";

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SectionNavigation label="교회소개 하위 메뉴" items={aboutNavigation} />
      {children}
    </>
  );
}
