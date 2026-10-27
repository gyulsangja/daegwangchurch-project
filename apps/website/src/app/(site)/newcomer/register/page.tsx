import Alert from "@mui/material/Alert";
import type { Metadata } from "next";
import { InquiryForm } from "../../../../components/content/inquiry-form";
import { ContentShell } from "../../../../components/site/content-shell";
import { PageHero } from "../../../../components/site/page-hero";
export const metadata: Metadata = { title: "새가족 방문·등록 문의", description: "대광교회 첫 방문과 새가족 등록 방법을 문의하세요. 방문 예정일과 궁금한 점을 남기면 담당자가 안내합니다. 이 양식은 앱 회원가입과 별개입니다.", alternates: { canonical: "/newcomer/register" } };
export default async function NewcomerRegisterPage({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) { const { submitted } = await searchParams; return <><PageHero eyebrow="REGISTRATION" title="새가족 등록 안내" description="처음 방문하시거나 교회 등록을 원하시면 방문 예정일과 궁금한 점을 남겨 주세요." /><ContentShell narrow>{submitted === "1" ? <Alert severity="success" className="mb-6!">새가족 등록 문의가 접수되었습니다. 담당자가 확인 후 안내드립니다.</Alert> : null}<div className="mb-6 rounded-2xl bg-primary-50 p-6"><h2 className="text-xl font-extrabold">온라인 새가족 등록 문의</h2><p className="mt-2 leading-7 text-text-secondary">이 양식은 새가족 방문·등록에 관한 문의를 접수합니다. 작성만으로 교인 등록이나 앱 회원가입이 완료되지는 않습니다. 담당자의 안내를 받거나 예배 후 현장에서 등록 방법을 문의해 주세요.</p></div><InquiryForm defaultType="NEWCOMER" returnPath="/newcomer/register" /></ContentShell></>; }
