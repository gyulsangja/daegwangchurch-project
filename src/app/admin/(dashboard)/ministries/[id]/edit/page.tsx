import Alert from "@mui/material/Alert";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MinistryForm } from "@/components/admin/ministry-form";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { Button } from "@/components/ui/button";
import { deleteMinistryAction } from "@/features/ministries/actions";
import { getAdminMinistry, getMinistryPrograms } from "@/features/ministries/queries";
import { getPublicStorageUrl } from "@/lib/storage/public-url";
export default async function EditMinistryPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const item = await getAdminMinistry(id); if (!item) notFound(); return <div className="mx-auto max-w-[90rem]"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold text-primary-700">EDIT MINISTRY</p><h1 className="mt-1 text-3xl font-extrabold">사역 수정</h1></div><div className="flex gap-2"><Button asChild variant="secondary"><Link href={`/ministries/${item.slug}`} target="_blank"><ExternalLink className="size-4" /> 공개 페이지</Link></Button><form action={deleteMinistryAction.bind(null, id)}><ConfirmSubmitButton /></form></div></div><Alert severity="info" className="mt-6!">페이지 주소를 변경하면 기존 주소로 연결된 링크도 함께 수정해야 합니다.</Alert><MinistryForm initialValues={{ id: item.id, name: item.name, slug: item.slug, type: item.type, introduction: item.introduction, audience: item.audience ?? "", meetingDay: item.meetingDay ?? "", meetingTime: item.meetingTime ?? "", location: item.location ?? "", leader: item.leader ?? "", contactName: item.contactName ?? "", contactValue: item.contactValue ?? "", showContact: item.showContact, programText: getMinistryPrograms(item.sections).join("\n"), status: item.status, sortOrder: item.sortOrder, coverImageUrl: item.coverImage ? getPublicStorageUrl(item.coverImage.bucket, item.coverImage.objectPath) : "" }} /></div>; }
