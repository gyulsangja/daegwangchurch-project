type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue | undefined };

export const pageKeys = {
  church: "ABOUT_CHURCH",
  vision: "ABOUT_VISION",
  newcomerEducation: "NEWCOMER_EDUCATION",
  home: "HOME",
} as const;

export type ChurchPageContent = {
  heroTitle: string;
  heroDescription: string;
  sinceLabel: string;
  motto: string;
  sectionTitle: string;
  body: string;
  values: { title: string; description: string }[];
};

export type VisionPageContent = {
  heroTitle: string;
  heroDescription: string;
  philosophy: string;
  motto: string;
  directionTitle: string;
  directionDescription: string;
  directions: string[];
};

export type NewcomerEducationContent = {
  heroTitle: string; heroDescription: string; processTitle: string;
  duration: string; location: string; leader: string; applicationInfo: string;
  steps: { title: string; description: string }[];
};

export type HomePageContent = {
  heroBadge: string; heroTitleBefore: string; heroTitleAccent: string; heroTitleAfter: string; heroDescription: string;
  worshipTitle: string; newsTitle: string; sinceLabel: string; motto: string; churchTitle: string; churchDescription: string;
  welcomeTitle: string; welcomeDescription: string;
  showWorship: boolean; showNews: boolean; showChurch: boolean; showWelcome: boolean;
};

export const defaultChurchContent: ChurchPageContent = {
  heroTitle: "예배와 말씀으로 세워지는 공동체",
  heroDescription: "대한예수교장로회(고신)에 속한 대광교회는 성경을 믿음과 삶의 최종 권위로 삼습니다.",
  sinceLabel: "SINCE 1988",
  motto: "일어나라,\n빛을 발하라.",
  sectionTitle: "한 가정의 예배에서 시작된 교회",
  body: "대광교회는 1988년 5월 1일, 현재 교회 자리에 있던 신안연립에서 고 박성덕 원로목사 가정이 첫 예배를 드리며 시작했습니다.\n\n오늘까지 예배와 말씀을 중심으로 독산동과 이웃을 섬기며, 모든 세대가 복음 안에서 함께 자라는 공동체를 세워가고 있습니다.",
  values: [
    { title: "말씀 위에 서는 교회", description: "오직 성경을 믿음과 삶의 최종 권위로 삼습니다." },
    { title: "예배를 세우는 교회", description: "예배를 통해 세상이 회복됨을 믿습니다." },
    { title: "이웃을 섬기는 교회", description: "지역과 다음세대를 사랑으로 품고 함께 성장합니다." },
  ],
};

export const defaultVisionContent: VisionPageContent = {
  heroTitle: "모든 길은 예배로 통합니다",
  heroDescription: "대광교회는 예배를 통해 한 사람과 가정, 지역과 세상이 회복됨을 믿습니다.",
  philosophy: "예배를 통해\n세상이 회복됨을\n믿습니다.",
  motto: "일어나라,\n빛을 발하라.",
  directionTitle: "삶으로 이어지는 예배",
  directionDescription: "주일의 예배가 일상의 믿음과 섬김으로 이어지고, 모든 세대가 말씀 안에서 서로 가르치고 권면하며 성장하는 교회를 지향합니다.",
  directions: ["말씀과 기도", "세대와 공동체", "지역과 이웃"],
};

export const defaultNewcomerEducationContent: NewcomerEducationContent = {
  heroTitle: "복음 안에서 함께 자라는 여정", heroDescription: "등록에서 공동체 정착까지 단계별로 안내하고 함께합니다.", processTitle: "새가족 과정",
  duration: "과정별 일정은 새가족부에서 안내합니다.", location: "교회 내 교육실", leader: "새가족부", applicationInfo: "온라인 새가족 등록 문의 또는 예배 후 현장에서 신청할 수 있습니다.",
  steps: [
    { title: "새가족 등록", description: "교회를 알아가고 예배 공동체에 첫걸음을 내딛습니다." },
    { title: "풍성한 삶의 초대", description: "4주 동안 복음과 신앙생활의 기초를 함께 나눕니다." },
    { title: "연령별 공동체 참여", description: "삶의 자리에 맞는 기관과 공동체를 안내받습니다." },
    { title: "풍성한 삶의 기초", description: "13주 동안 믿음의 기초를 더욱 단단히 세워갑니다." },
    { title: "함께 성장", description: "피차 가르치고 권면하며 예수님의 제자로 함께 성장합니다." },
  ],
};

export const defaultHomePageContent: HomePageContent = {
  heroBadge: "모든 길은 예배로 통합니다", heroTitleBefore: "예배를 통해", heroTitleAccent: "세상이 회복됨", heroTitleAfter: "을 믿습니다.", heroDescription: "말씀 위에 굳게 서서 이웃과 다음세대를 섬기는 대광교회에 오신 것을 환영합니다.",
  worshipTitle: "말씀과 예배로 한 주를 시작하세요", newsTitle: "대광교회의 새로운 소식", sinceLabel: "SINCE 1988", motto: "일어나라,\n빛을 발하라.", churchTitle: "성경을 믿음과 삶의 최종 권위로 삼는 교회", churchDescription: "1988년 독산동에서 첫 예배를 드린 대광교회는 예배와 말씀을 중심으로 이웃과 지역을 섬기며 다음세대를 세워가고 있습니다.", welcomeTitle: "처음 오신 여러분을 진심으로 환영합니다", welcomeDescription: "낯설지 않도록 예배부터 새가족 과정까지 차근차근 안내해 드립니다.",
  showWorship: true, showNews: true, showChurch: true, showWelcome: true,
};

function record(value: JsonValue | null | undefined): Record<string, JsonValue> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, JsonValue> : {};
}

function text(value: JsonValue | undefined, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function normalizeChurchContent(value: JsonValue | null | undefined): ChurchPageContent {
  const data = record(value);
  const values = Array.isArray(data.values) ? data.values.map((item, index) => {
    const entry = record(item);
    const fallback = defaultChurchContent.values[index] ?? { title: "교회의 가치", description: "" };
    return { title: text(entry.title, fallback.title), description: text(entry.description, fallback.description) };
  }).slice(0, 3) : defaultChurchContent.values;
  return {
    heroTitle: text(data.heroTitle, defaultChurchContent.heroTitle),
    heroDescription: text(data.heroDescription, defaultChurchContent.heroDescription),
    sinceLabel: text(data.sinceLabel, defaultChurchContent.sinceLabel),
    motto: text(data.motto, defaultChurchContent.motto),
    sectionTitle: text(data.sectionTitle, defaultChurchContent.sectionTitle),
    body: text(data.body, defaultChurchContent.body),
    values: values.length === 3 ? values : defaultChurchContent.values,
  };
}

export function normalizeVisionContent(value: JsonValue | null | undefined): VisionPageContent {
  const data = record(value);
  const directions = Array.isArray(data.directions) ? data.directions.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).slice(0, 3) : defaultVisionContent.directions;
  return {
    heroTitle: text(data.heroTitle, defaultVisionContent.heroTitle),
    heroDescription: text(data.heroDescription, defaultVisionContent.heroDescription),
    philosophy: text(data.philosophy, defaultVisionContent.philosophy),
    motto: text(data.motto, defaultVisionContent.motto),
    directionTitle: text(data.directionTitle, defaultVisionContent.directionTitle),
    directionDescription: text(data.directionDescription, defaultVisionContent.directionDescription),
    directions: directions.length === 3 ? directions : defaultVisionContent.directions,
  };
}

export function normalizeNewcomerEducationContent(value: JsonValue | null | undefined): NewcomerEducationContent {
  const data = record(value);
  const steps = Array.isArray(data.steps) ? data.steps.map((item, index) => { const entry = record(item); const fallback = defaultNewcomerEducationContent.steps[index] ?? { title: "과정", description: "" }; return { title: text(entry.title, fallback.title), description: text(entry.description, fallback.description) }; }).slice(0, 5) : defaultNewcomerEducationContent.steps;
  return { heroTitle: text(data.heroTitle, defaultNewcomerEducationContent.heroTitle), heroDescription: text(data.heroDescription, defaultNewcomerEducationContent.heroDescription), processTitle: text(data.processTitle, defaultNewcomerEducationContent.processTitle), duration: text(data.duration, defaultNewcomerEducationContent.duration), location: text(data.location, defaultNewcomerEducationContent.location), leader: text(data.leader, defaultNewcomerEducationContent.leader), applicationInfo: text(data.applicationInfo, defaultNewcomerEducationContent.applicationInfo), steps: steps.length === 5 ? steps : defaultNewcomerEducationContent.steps };
}

export function normalizeHomePageContent(value: JsonValue | null | undefined): HomePageContent {
  const data = record(value); const bool = (key: string, fallback: boolean) => typeof data[key] === "boolean" ? data[key] as boolean : fallback;
  return { heroBadge: text(data.heroBadge, defaultHomePageContent.heroBadge), heroTitleBefore: text(data.heroTitleBefore, defaultHomePageContent.heroTitleBefore), heroTitleAccent: text(data.heroTitleAccent, defaultHomePageContent.heroTitleAccent), heroTitleAfter: text(data.heroTitleAfter, defaultHomePageContent.heroTitleAfter), heroDescription: text(data.heroDescription, defaultHomePageContent.heroDescription), worshipTitle: text(data.worshipTitle, defaultHomePageContent.worshipTitle), newsTitle: text(data.newsTitle, defaultHomePageContent.newsTitle), sinceLabel: text(data.sinceLabel, defaultHomePageContent.sinceLabel), motto: text(data.motto, defaultHomePageContent.motto), churchTitle: text(data.churchTitle, defaultHomePageContent.churchTitle), churchDescription: text(data.churchDescription, defaultHomePageContent.churchDescription), welcomeTitle: text(data.welcomeTitle, defaultHomePageContent.welcomeTitle), welcomeDescription: text(data.welcomeDescription, defaultHomePageContent.welcomeDescription), showWorship: bool("showWorship", true), showNews: bool("showNews", true), showChurch: bool("showChurch", true), showWelcome: bool("showWelcome", true) };
}
