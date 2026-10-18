import type { Metadata } from "next";
import Link from 'next/link';
import { ContentShell, SectionTitle } from "../../../components/site/content-shell";
import { PageHero } from "../../../components/site/page-hero";
import { getSiteSettings } from "@daegwang/server/features/settings/queries";
export const metadata: Metadata = { title: "개인정보처리방침", robots: { index: false }, alternates: { canonical: "/privacy" } };
const sections = [
  { title: "앱 회원가입과 이용 연령", content: "대광교회 앱은 만 14세 이상만 회원가입할 수 있습니다. 본인이 가입 시 연령을 확인하며 생년월일·신분증·법정대리인 정보를 받지 않습니다. 공개 말씀·주보·교회 안내는 가입 없이 이용할 수 있습니다. 회원 인증을 위해 이메일과 인증 정보, 회원 식별자 및 연령 확인·정책 동의 이력을 처리합니다." },
  { title: "앱에서 선택하여 이용하는 기능", content: "프로필, 교인 확인을 위한 이름·연락처·직분과 소속, 직접 작성한 묵상·기도·일정, 저장 목록, 알림 설정·푸시 토큰을 해당 기능 제공에 이용합니다. 교인 확인과 상담·심방은 별도 신청 사항입니다. 개인 묵상·기도는 일반 회원이나 일반 관리자 화면에 공개하지 않습니다. 종교·건강 정보 또는 다른 사람의 개인정보는 꼭 필요한 범위에서만 작성해 주세요." },
  { title: "상담·심방 보관 기준", content: "신규 상담·심방 요청은 별도 접수 안내와 동의에 따라 접수일로부터 달력 기준 5년간 보관합니다. 기존 요청의 만료일은 연장하지 않습니다. 지정된 담당자만 열람하며, 회원탈퇴 시 보관 기간이 남아 있어도 계정에 연결된 요청을 삭제합니다. 접수 기능은 교회가 담당자와 접수 설정을 완료한 경우 이용할 수 있습니다." },
  { title: "앱 로그인 유지와 삭제 요청", content: "기기에 비밀번호 대신 세션 토큰을 보관하며 Android의 보안 저장소와 iOS Keychain을 사용합니다. 앱 MY에서 로그아웃하거나 회원탈퇴를 요청할 수 있습니다. 앱을 사용할 수 없다면 위 온라인 계정 삭제 요청을 이용해 주세요. 본인 확인 후 계정에 연결된 프로필·묵상·기도·일정·알림·교인 확인·소속·상담 요청을 삭제합니다. 접수와 삭제 완료는 구분하여 안내합니다." },
  { title: "수집하는 개인정보", content: "온라인 문의, 새가족 등록 문의 및 앱 계정 삭제 요청 시 이름, 전화번호 또는 이메일, 선호 연락 방법, 요청 내용을 수집합니다. 전화번호와 이메일은 둘 중 하나만 입력해도 됩니다. 비밀번호·인증번호·신분증은 요청 양식에 입력하지 마세요." },
  { title: "이용 목적", content: "새가족 방문 안내, 교회 생활 문의, 상담 및 기도 요청에 답변하고 처리 현황을 관리하기 위해 이용합니다. 앱 계정 삭제 요청은 계정 소유 여부 확인, 삭제 처리 및 결과 안내에 이용합니다. 요청 접수만으로 계정을 자동 삭제하지 않습니다." },
  { title: "홈페이지 문의의 보유 및 이용 기간", content: "홈페이지 문의는 처리 목적이 달성된 후 지체 없이 삭제하는 것을 원칙으로 하며, 별도의 보존 필요성이 있는 경우에도 접수일로부터 최대 1년 이내에 삭제합니다. 앱의 상담·심방 요청에는 위에 안내한 별도 보관 기준이 적용됩니다." },
  { title: "외부 서비스 이용", content: "회원 인증·데이터 및 파일 저장에는 Supabase, 웹·API 운영에는 Vercel, Android 푸시 전달에는 Expo Push Service와 Firebase FCM을 이용합니다. 영상·지도 등 외부 서비스를 열면 해당 서비스의 개인정보 처리방침이 적용됩니다. 서비스 제공에 필요한 처리 위탁과 제3자 제공은 구분하며, 이용자 동의나 법적 근거 없이 별도 목적의 제3자 제공을 하지 않습니다." },
  { title: "정보주체의 권리", content: "문의자는 본인의 개인정보에 대한 열람, 정정, 삭제 및 처리 정지를 요청할 수 있습니다. 요청은 교회 대표 연락처 또는 방문을 통해 접수할 수 있습니다." },
  { title: "안전성 확보 조치", content: "문의 정보는 인증된 최고 관리자만 확인할 수 있도록 접근 권한을 제한하며, 관리자 처리 기록과 내부 메모를 분리해 관리합니다. 반복 제출 방지를 위해 접속 주소 원문 대신 단방향 식별값을 최대 15분 동안 처리합니다." },
];
export default async function PrivacyPage() { const settings = await getSiteSettings(); const contact = [settings.privacyOfficer, settings.privacyContact].filter(Boolean).join(" · "); return <><PageHero eyebrow="PRIVACY" title="개인정보처리방침" description={`${settings.siteName}는 이용자의 개인정보를 필요한 범위에서 안전하게 처리합니다.`} /><ContentShell narrow><p className="mb-6 leading-7"><Link href="/account-deletion" className="focus-ring font-bold text-primary-700 underline">대광교회 앱 계정 및 데이터 삭제 요청</Link></p><SectionTitle eyebrow="POLICY" title="홈페이지와 앱 개인정보 처리 안내" /><div className="mt-10 divide-y divide-border border-y border-border">{sections.map((section) => <section key={section.title} className="py-7"><h2 className="text-xl font-extrabold">{section.title}</h2><p className="mt-3 leading-8 text-text-secondary">{section.content}</p></section>)}</div><div className="mt-8 rounded-2xl bg-background-warm p-6"><h2 className="font-extrabold">개인정보 보호 담당</h2><p className="mt-2 leading-7 text-text-secondary">{contact || "정식 운영 전 개인정보 보호 담당자와 문의 연락처를 확정하여 게시합니다. 삭제 요청은 위의 온라인 계정 삭제 요청 경로를 이용해 주세요."}</p></div><p className="mt-6 text-sm text-text-secondary">시행일: 2026년 7월 16일 · 계정 삭제 요청 안내 보완: 2026년 10월 18일</p></ContentShell></>; }
