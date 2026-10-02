import { SectionNavigation } from "../../../components/site/section-navigation";
import { newcomerNavigation } from "@daegwang/contracts/content/navigation";

export default function NewcomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SectionNavigation label="새가족 하위 메뉴" items={newcomerNavigation} />
      {children}
    </>
  );
}
