import type { AccountPolicy } from './account-service';

// Versioned notice also becomes part of the persisted consent snapshot.
export function withAgePolicy(policy: AccountPolicy): AccountPolicy {
  return {
    ...policy,
    version: `${policy.version.slice(0, 80)}-age14-20261018`,
    terms: `${policy.terms}\n회원가입은 만 14세 이상만 가능합니다. 가입 시 본인이 연령을 확인하며 생년월일이나 신분증은 수집하지 않습니다. 공개 말씀·주보·교회 안내는 가입 없이 이용할 수 있습니다.`.trim(),
    privacy: `${policy.privacy}\n회원가입과 로그인을 위해 이메일, 인증 정보와 회원 식별자를 처리하며, 연령 확인 및 정책 동의 이력을 저장합니다. 선택한 기능에서 작성한 프로필·묵상·기도·일정·교인 확인 정보와 알림 설정을 처리합니다. 상담·심방은 별도 신청과 안내에 따라 처리합니다. 앱 MY의 회원탈퇴 또는 https://daegwangchurch.kr/account-deletion 에서 계정 삭제를 요청할 수 있습니다. 개인정보 보호 담당자: 한상은 성도. 문의: 교회 대표번호 02-857-0191. 상세 안내: https://daegwangchurch.kr/privacy`.trim(),
  };
}
