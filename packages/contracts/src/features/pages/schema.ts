import { z } from "zod";

const required = (label: string, max = 2000) => z.string().trim().min(1, `${label}을(를) 입력해 주세요.`).max(max, `${max}자 이내로 입력해 주세요.`);
const status = z.enum(["DRAFT", "PUBLISHED", "PRIVATE"]);

export const churchPageSchema = z.object({
  heroTitle: required("대표 제목", 120), heroDescription: required("대표 설명", 300),
  sinceLabel: required("시작 연도 표기", 40), motto: required("표어", 200), sectionTitle: required("소개 제목", 120), body: required("소개 내용", 5000),
  value1Title: required("첫 번째 가치 제목", 80), value1Description: required("첫 번째 가치 설명", 240),
  value2Title: required("두 번째 가치 제목", 80), value2Description: required("두 번째 가치 설명", 240),
  value3Title: required("세 번째 가치 제목", 80), value3Description: required("세 번째 가치 설명", 240), status,
});

export const visionPageSchema = z.object({
  heroTitle: required("대표 제목", 120), heroDescription: required("대표 설명", 300), philosophy: required("목회철학", 300), motto: required("교회 표어", 200),
  directionTitle: required("방향 제목", 120), directionDescription: required("방향 설명", 500),
  direction1: required("첫 번째 방향", 80), direction2: required("두 번째 방향", 80), direction3: required("세 번째 방향", 80), status,
});

export const newcomerEducationSchema = z.object({
  heroTitle: required("대표 제목", 120), heroDescription: required("대표 설명", 300), processTitle: required("과정 제목", 120), duration: required("교육 기간", 300), location: required("교육 장소", 200), leader: required("담당자", 100), applicationInfo: required("신청 안내", 1000),
  step1Title: required("1단계 제목", 100), step1Description: required("1단계 설명", 500), step2Title: required("2단계 제목", 100), step2Description: required("2단계 설명", 500), step3Title: required("3단계 제목", 100), step3Description: required("3단계 설명", 500), step4Title: required("4단계 제목", 100), step4Description: required("4단계 설명", 500), step5Title: required("5단계 제목", 100), step5Description: required("5단계 설명", 500), status,
});

export const homePageSchema = z.object({
  heroBadge: required("대표 배지", 100), heroTitleBefore: required("대표 제목 첫 줄", 100), heroTitleAccent: required("대표 강조 문구", 100), heroTitleAfter: required("대표 제목 마지막 줄", 100), heroDescription: required("대표 설명", 400), worshipTitle: required("예배 영역 제목", 160), newsTitle: required("소식 영역 제목", 160), sinceLabel: required("교회 시작 표기", 40), motto: required("교회 표어", 200), churchTitle: required("교회 소개 제목", 160), churchDescription: required("교회 소개 설명", 1000), welcomeTitle: required("새가족 환영 제목", 160), welcomeDescription: required("새가족 환영 설명", 500), showWorship: z.boolean(), showNews: z.boolean(), showChurch: z.boolean(), showWelcome: z.boolean(), status,
});

function entries(formData: FormData) { return Object.fromEntries(formData.entries()); }
export function parseChurchPageFormData(formData: FormData) { return churchPageSchema.safeParse(entries(formData)); }
export function parseVisionPageFormData(formData: FormData) { return visionPageSchema.safeParse(entries(formData)); }
export function parseNewcomerEducationFormData(formData: FormData) { return newcomerEducationSchema.safeParse(entries(formData)); }
export function parseHomePageFormData(formData: FormData) { return homePageSchema.safeParse({ ...entries(formData), showWorship: formData.get("showWorship") === "on", showNews: formData.get("showNews") === "on", showChurch: formData.get("showChurch") === "on", showWelcome: formData.get("showWelcome") === "on" }); }

export const pageStatusLabels = { DRAFT: "임시저장", PUBLISHED: "공개", PRIVATE: "비공개" } as const;
