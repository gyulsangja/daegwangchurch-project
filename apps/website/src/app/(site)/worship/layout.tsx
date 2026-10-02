import { SectionNavigation } from "../../../components/site/section-navigation";
import { worshipNavigation } from "@daegwang/contracts/content/navigation";

export default function WorshipLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SectionNavigation label="예배 하위 메뉴" items={worshipNavigation} />
      {children}
    </>
  );
}
export const dynamic = "force-dynamic";
