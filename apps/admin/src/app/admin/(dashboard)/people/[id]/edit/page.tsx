import Alert from "@mui/material/Alert";
import { notFound } from "next/navigation";

import { PersonForm } from "../../../../../../components/admin/person-form";
import { ConfirmSubmitButton } from "../../../../../../components/admin/confirm-submit-button";
import { deletePersonAction } from "../../../../../../features/people/actions";
import { getAdminPerson, getCareerLines } from "@daegwang/server/features/people/queries";
import { getPublicStorageUrl } from "@daegwang/web-ui/lib/storage/public-url";

type Props = { params: Promise<{ id: string }> };

export default async function EditPersonPage({ params }: Props) {
  const { id } = await params;
  const person = await getAdminPerson(id);
  if (!person) notFound();
  const deleteAction = deletePersonAction.bind(null, id);
  return (
    <div className="mx-auto max-w-[90rem]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-bold text-primary-700">EDIT PERSON</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">교역자 수정</h1></div>
        <form action={deleteAction}><ConfirmSubmitButton /></form>
      </div>
      <Alert severity="info" className="mt-6!">공개를 해제하면 홈페이지에서 즉시 숨겨집니다.</Alert>
      <PersonForm initialValues={{
        id: person.id,
        name: person.name,
        position: person.position,
        ministry: person.ministry ?? "",
        introduction: person.introduction ?? "",
        careerText: getCareerLines(person.career).join("\n"),
        quote: person.quote ?? "",
        isSeniorPastor: person.isSeniorPastor,
        isVisible: person.isVisible,
        sortOrder: person.sortOrder,
        profileImageName: person.profileImage?.originalName,
        profileImageUrl: person.profileImage ? getPublicStorageUrl(person.profileImage.bucket, person.profileImage.objectPath) : "",
      }} />
    </div>
  );
}
