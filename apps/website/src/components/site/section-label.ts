const labels: Record<string, string> = {
  'ALBUM': '공동체의 소중한 순간', 'TRANSPORTATION': '방문과 교통 안내',
  'OUR HISTORY': '지나온 은혜의 시간', 'TIMELINE': '대광교회의 발자취', 'MINISTRY TEAM': '함께 섬기는 사람들',
  'NEXT GENERATION & MINISTRY': '믿음 안에서 함께 자라는 공동체', 'INFORMATION': '함께하는 모임',
  'SUNDAY WORSHIP': '주일의 말씀', 'WEDNESDAY WORSHIP': '수요일의 말씀', 'PRAISE': '찬양으로 드리는 고백',
  'REGISTRATION': '대광교회 가족으로 함께해요', 'NEWCOMER JOURNEY': '함께 시작하는 신앙의 여정',
  'PROCESS': '한 걸음씩 알아가요', 'POLICY': '개인정보 보호 약속',
  'ABOUT DAEGWANG': '대광교회를 소개합니다', 'WORSHIP INFORMATION': '함께 드리는 예배', 'WEEKLY WORSHIP': '예배 안내',
  'OUR VALUES': '말씀 · 예배 · 섬김', 'VISION & MISSION': '우리의 믿음과 소망', 'OUR DIRECTION': '함께 걸어갈 길',
  'WELCOME': '처음 오신 여러분께', 'FIRST VISIT': '첫 방문 안내', 'CONTACT': '함께 이야기 나눠요', 'LOCATION': '교회로 오시는 길',
  'CHURCH HISTORY': '지나온 은혜의 시간', 'HISTORY': '지나온 은혜의 시간', 'PEOPLE': '함께 섬기는 사람들', 'PASTOR': '목회자 소개',
  'NOTICE': '함께 나누는 소식', 'NOTICES': '함께 나누는 소식', 'BULLETIN': '주보', 'BULLETINS': '주보', 'EVENTS': '함께하는 교회생활',
  'ALBUMS': '우리의 소중한 순간', 'GALLERY': '우리의 소중한 순간', 'NEWCOMER': '새가족 안내', 'EDUCATION': '믿음으로 함께 자라요',
  'SUNDAY MORNING': '주일 오전예배', 'SUNDAY AFTERNOON': '주일 오후예배', 'WEDNESDAY': '수요예배', 'FIRST HOUR': '첫시간 주님께',
  'SPECIAL WORSHIP': '특별 예배', 'PRIVACY': '개인정보 안내',
};
export function sectionLabel(value: string) { return labels[value] ?? value; }
