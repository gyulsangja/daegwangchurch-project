"use client";

import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import TextField from "@mui/material/TextField";
import { Images, LoaderCircle, Save } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { createAlbumAction, updateAlbumAction, type AlbumActionState } from "@/features/albums/actions";
import { albumStatusLabels } from "@/features/albums/schema";

type ExistingImage = { id: string; mediaId: string; name: string; url: string; isCover: boolean; caption: string; altText: string };

export type AlbumFormValues = {
  id?: string;
  title?: string;
  eventDate?: string;
  category?: string;
  description?: string;
  status?: keyof typeof albumStatusLabels;
  showOnMain?: boolean;
  images?: ExistingImage[];
};

const initialState: AlbumActionState = {};

export function AlbumForm({ initialValues = {} }: { initialValues?: AlbumFormValues }) {
  const action = useMemo(() => (initialValues.id ? updateAlbumAction.bind(null, initialValues.id) : createAlbumAction), [initialValues.id]);
  const [state, formAction, pending] = useActionState(action, initialState);
  const error = (name: string) => state.errors?.[name]?.[0];

  return (
    <form action={formAction} data-unsaved-warning className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
      <Paper variant="outlined" className="flex flex-col gap-6 p-5 md:p-7">
        {state.message ? <Alert severity="error">{state.message}</Alert> : null}
        <TextField fullWidth required label="앨범 제목" name="title" defaultValue={initialValues.title ?? ""} error={Boolean(error("title"))} helperText={error("title")} />
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField fullWidth required type="date" label="행사 날짜" name="eventDate" defaultValue={initialValues.eventDate ?? ""} error={Boolean(error("eventDate"))} helperText={error("eventDate")} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField fullWidth required label="분류" name="category" defaultValue={initialValues.category ?? "교회행사"} error={Boolean(error("category"))} helperText={error("category") ?? "예: 교회행사, 다음세대, 새가족"} />
        </div>
        <TextField fullWidth multiline minRows={6} label="앨범 설명" name="description" defaultValue={initialValues.description ?? ""} error={Boolean(error("description"))} helperText={error("description")} />

        {initialValues.images?.length ? (
          <section>
            <h2 className="text-lg font-extrabold">등록된 사진</h2>
            <p className="mt-1 text-sm text-text-secondary">대표 사진을 선택하거나 삭제할 사진을 표시한 뒤 저장하세요.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {initialValues.images.map((image) => (
                <div key={image.id} className="overflow-hidden rounded-2xl border border-border bg-white">
                  <Image src={image.url} alt={image.name} width={640} height={480} className="aspect-[4/3] w-full object-cover" />
                  <div className="grid gap-1 p-3 text-sm">
                    <p className="truncate font-bold">{image.name}</p>
                    <TextField name={`caption_${image.id}`} defaultValue={image.caption} size="small" label="사진 설명" className="mt-2!" />
                    <TextField name={`alt_${image.id}`} defaultValue={image.altText} size="small" label="대체 텍스트" helperText="화면낭독기를 위한 이미지 설명" className="mt-2!" />
                    <FormControlLabel control={<Radio name="coverMediaId" value={image.mediaId} defaultChecked={image.isCover} size="small" />} label="대표 사진" />
                    <FormControlLabel control={<Checkbox name="removeImageIds" value={image.id} size="small" />} label="저장할 때 삭제" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className={`rounded-2xl border border-dashed p-6 ${error("imageFiles") ? "border-red-500" : "border-border"}`}>
          <div className="flex items-start gap-4">
            <Images aria-hidden="true" className="mt-1 size-7 shrink-0 text-primary-600" />
            <div className="min-w-0 flex-1">
              <label htmlFor="imageFiles" className="font-extrabold">{initialValues.id ? "사진 추가" : "앨범 사진"}</label>
              <p className="mt-1 text-sm text-text-secondary">JPG, PNG, WebP · 각 5MB 이하 · 전체 10MB 이하 · 최대 30장</p>
              <input id="imageFiles" name="imageFiles" type="file" accept="image/jpeg,image/png,image/webp" multiple required={!initialValues.id} className="mt-4 block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:font-bold file:text-primary-700" />
              {error("imageFiles") ? <p className="mt-2 text-sm text-red-600">{error("imageFiles")}</p> : null}
            </div>
          </div>
        </div>
      </Paper>
      <Paper component="aside" variant="outlined" className="flex h-fit flex-col gap-5 p-5 lg:sticky lg:top-24">
        <h2 className="font-extrabold">공개 설정</h2>
        <TextField select fullWidth size="small" label="상태" name="status" defaultValue={initialValues.status ?? "DRAFT"} error={Boolean(error("status"))} helperText={error("status")}>
          {Object.entries(albumStatusLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
        </TextField>
        <FormControlLabel control={<Checkbox name="showOnMain" defaultChecked={initialValues.showOnMain} />} label="메인 화면에 노출" />
        <Alert severity="info">공개 상태로 저장한 앨범만 홈페이지에서 확인할 수 있습니다.</Alert>
        <div className="grid gap-2 pt-2">
          <Button type="submit" disabled={pending}>{pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Save aria-hidden="true" className="size-4" />}{pending ? "업로드 및 저장 중" : "저장"}</Button>
          <Button asChild variant="secondary"><Link href="/admin/albums">취소</Link></Button>
        </div>
      </Paper>
    </form>
  );
}
