import Alert from "@mui/material/Alert";
import type { Metadata } from "next";
import { InquiryForm } from "../../../../components/content/inquiry-form";
import { ContentShell } from "../../../../components/site/content-shell";
import { PageHero } from "../../../../components/site/page-hero";
export const metadata: Metadata = { title: "방문·교회 생활 문의", description: "대광교회 예배 방문, 교회학교와 청년부 참여, 교회 생활에 관한 질문을 남겨 주세요. 연락받을 전화번호 또는 이메일로 답변을 안내합니다.", alternates: { canonical: "/newcomer/contact" } };
export default async function NewcomerContactPage({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) { const { submitted } = await searchParams; return <><PageHero eyebrow="CONTACT" title="방문과 교회 생활, 궁금한 점을 남겨 주세요" description="예배 방문이나 모임 참여에 관한 질문을 남겨 주세요. 담당자가 확인 후 입력하신 연락처로 안내드립니다." /><ContentShell narrow>{submitted === "1" ? <Alert severity="success" className="mb-6!">문의가 정상적으로 접수되었습니다. 담당자가 확인 후 입력하신 연락처로 안내드립니다.</Alert> : null}<InquiryForm /></ContentShell></>; }
