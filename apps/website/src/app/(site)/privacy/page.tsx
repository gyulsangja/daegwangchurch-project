import type { Metadata } from "next";
import { ContentShell, SectionTitle } from "../../../components/site/content-shell";
import { PageHero } from "../../../components/site/page-hero";
import { getSiteSettings } from "@daegwang/server/features/settings/queries";
export const metadata: Metadata = { title: "개인정보처리방침", robots: { index: false }, alternates: { canonical: "/privacy" } };
const sections = [
  { title: "수집하는 개인정보", content: "온라인 문의와 새가족 등록 문의 시 이름, 전화번호 또는 이메일, 선호 연락 방법, 문의 내용을 수집합니다. 전화번호와 이메일은 둘 중 하나만 입력해도 됩니다." },
  { title: "이용 목적", content: "새가족 방문 안내, 교회 생활 문의, 상담 및 기도 요청에 답변하고 처리 현황을 관리하기 위해 이용합니다." },
  { title: "보유 및 이용 기간", content: "문의 처리 목적이 달성된 후 지체 없이 삭제하는 것을 원칙으로 하며, 별도의 보존 필요성이 있는 경우에도 접수일로부터 최대 1년 이내에 삭제합니다. 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관할 수 있습니다." },
  { title: "개인정보의 제공", content: "수집한 개인정보를 외부에 제공하지 않습니다. 다만 정보주체의 동의가 있거나 법령에 근거가 있는 경우는 예외입니다." },
  { title: "정보주체의 권리", content: "문의자는 본인의 개인정보에 대한 열람, 정정, 삭제 및 처리 정지를 요청할 수 있습니다. 요청은 교회 대표 연락처 또는 방문을 통해 접수할 수 있습니다." },
  { title: "안전성 확보 조치", content: "문의 정보는 인증된 최고 관리자만 확인할 수 있도록 접근 권한을 제한하며, 관리자 처리 기록과 내부 메모를 분리해 관리합니다. 반복 제출 방지를 위해 접속 주소 원문 대신 단방향 식별값을 최대 15분 동안 처리합니다." },
];
export default async function PrivacyPage() { const settings = await getSiteSettings(); const contact = [settings.privacyOfficer, settings.privacyContact].filter(Boolean).join(" · "); return <><PageHero eyebrow="PRIVACY" title="개인정보처리방침" description={`${settings.siteName}는 문의자의 개인정보를 필요한 범위에서 안전하게 처리합니다.`} /><ContentShell narrow><SectionTitle eyebrow="POLICY" title="온라인 문의 개인정보 처리 안내" /><div className="mt-10 divide-y divide-border border-y border-border">{sections.map((section) => <section key={section.title} className="py-7"><h2 className="text-xl font-extrabold">{section.title}</h2><p className="mt-3 leading-8 text-text-secondary">{section.content}</p></section>)}</div><div className="mt-8 rounded-2xl bg-background-warm p-6"><h2 className="font-extrabold">개인정보 보호 담당</h2><p className="mt-2 leading-7 text-text-secondary">{contact || "정식 운영 전 개인정보 보호 담당자와 문의 연락처를 확정하여 게시합니다. 현재 삭제 요청은 교회 방문을 통해 접수해 주세요."}</p></div><p className="mt-6 text-sm text-text-secondary">시행일: 2026년 7월 16일</p></ContentShell></>; }
