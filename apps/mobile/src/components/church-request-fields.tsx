import { Text } from 'react-native';
import type { ChurchDetails } from '@daegwang/contracts/features/member/church-membership';
import { FormField, Check } from './form-controls';
import { styles } from './ui';
export const emptyChurchDetails: ChurchDetails = { realName: '', phone: '', position: '' };
export function ChurchRequestFields({ value, onChange, checked, onCheck, busy = false, signup = false }: { value: ChurchDetails; onChange: (value: ChurchDetails) => void; checked: boolean; onCheck: (value: boolean) => void; busy?: boolean; signup?: boolean }) {
  return <><Text style={styles.title}>대광교회 교인 확인 · 선택</Text><Text style={styles.caption}>교인 확인을 원하시면 아래 정보를 입력하고 체크해 주세요. 이름·연락처·직분은 교회 관리자가 본인 확인과 소속 지정에 사용합니다. 신청하지 않아도 개인 묵상·기도를 이용할 수 있어요.</Text>
    <FormField label="교인 이름" value={value.realName} onChangeText={realName => onChange({ ...value, realName })} maxLength={40} editable={!busy} />
    <FormField label="연락처" value={value.phone} onChangeText={phone => onChange({ ...value, phone })} keyboardType="phone-pad" maxLength={30} editable={!busy} />
    <FormField label="직분" value={value.position} onChangeText={position => onChange({ ...value, position })} placeholder="예: 성도, 집사, 권사, 장로 · 없으면 없음" maxLength={40} editable={!busy} />
    <Check label="대광교회 교인입니다 · 정보 전달 및 확인 요청에 동의합니다" value={checked} onChange={onCheck} disabled={busy} />
    <Text style={styles.caption}>{signup ? '체크하면 가입 인증 완료 시 교인 확인 요청이 자동 접수됩니다.' : '정보 입력 후 체크하면 별도 버튼 없이 확인 요청이 접수됩니다.'}</Text></>;
}
