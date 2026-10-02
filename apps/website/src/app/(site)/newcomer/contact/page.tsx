import Alert from "@mui/material/Alert";
import type { Metadata } from "next";
import { InquiryForm } from "../../../../components/content/inquiry-form";
import { ContentShell } from "../../../../components/site/content-shell";
import { PageHero } from "../../../../components/site/page-hero";
export const metadata: Metadata = { title: "문의하기", description: "독산대광교회에 안전하게 문의를 접수합니다.", alternates: { canonical: "/newcomer/contact" } };
export default async function NewcomerContactPage({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) { const { submitted } = await searchParams; return <><PageHero eyebrow="CONTACT" title="무엇이든 편안하게 물어보세요" description="새가족 방문과 교회 생활에 관한 질문을 안전하게 접수합니다." /><ContentShell narrow>{submitted === "1" ? <Alert severity="success" className="mb-6!">문의가 정상적으로 접수되었습니다. 담당자가 확인 후 입력하신 연락처로 안내드립니다.</Alert> : null}<InquiryForm /></ContentShell></>; }
