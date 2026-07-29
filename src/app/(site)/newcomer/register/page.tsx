import Alert from "@mui/material/Alert";
import type { Metadata } from "next";
import { InquiryForm } from "@/components/content/inquiry-form";
import { ContentShell } from "@/components/site/content-shell";
import { PageHero } from "@/components/site/page-hero";
export const metadata: Metadata = { title: "새가족 등록", description: "독산대광교회 새가족 방문과 등록 안내를 신청합니다.", alternates: { canonical: "/newcomer/register" } };
export default async function NewcomerRegisterPage({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) { const { submitted } = await searchParams; return <><PageHero eyebrow="REGISTRATION" title="새가족 등록 안내" description="독산대광교회 공동체와 함께 신앙의 여정을 시작하세요." /><ContentShell narrow>{submitted === "1" ? <Alert severity="success" className="mb-6!">새가족 등록 문의가 접수되었습니다. 담당자가 확인 후 안내드립니다.</Alert> : null}<div className="mb-6 rounded-2xl bg-primary-50 p-6"><h2 className="text-xl font-extrabold">온라인 새가족 등록 문의</h2><p className="mt-2 leading-7 text-text-secondary">방문 예정일이나 궁금한 점을 남겨주시면 새가족 담당자가 연락드립니다. 교회 방문 후 현장에서도 등록할 수 있습니다.</p></div><InquiryForm defaultType="NEWCOMER" returnPath="/newcomer/register" /></ContentShell></>; }
