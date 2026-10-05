import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Action, colors, styles } from './ui';

const moments = [
  { title: '잠시 마음을 모아요', question: '오늘 내 마음에 남아 있는 일은 무엇인가요?', help: '말씀을 들었다면 기억에 남는 한 구절이나 한 장면을 떠올려 보세요. 바로 답이 떠오르지 않아도 괜찮습니다.' },
  { title: '있는 마음 그대로 기도해요', question: '감사한 일 하나, 맡기고 싶은 일 하나를 하나님께 말씀드려요.', help: '길게 말하지 않아도 괜찮습니다. 나와 가까운 사람 한 명을 떠올리며 기도해도 좋습니다.' },
  { title: '일상으로 이어가요', question: '오늘 할 수 있는 작은 사랑 한 가지는 무엇일까요?', help: '안부 한마디, 미뤄둔 사과, 잠깐의 경청처럼 작은 것으로 시작해도 좋습니다. 기록은 남기고 싶을 때만 해 주세요.' },
];
export function FaithPractice({ worshipId }: { worshipId?: string }) {
  const [step, setStep] = useState(0); const [large, setLarge] = useState(false);
  const moment = moments[step];
  return <View style={{ gap: 16 }}>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}><Text style={styles.caption}>마음 모으기 · 기도 · 일상</Text><Pressable accessibilityRole="button" accessibilityState={{ selected: large }} onPress={() => setLarge(!large)} style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: 12 }}><Text style={styles.title}>{large ? '기본 글씨' : '큰 글씨'}</Text></Pressable></View>
    <View style={{ backgroundColor: '#f6f1e7', borderRadius: 18, padding: 24, gap: 20, borderTopWidth: 3, borderTopColor: '#a4b39b' }}>
      <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={[styles.title, { fontSize: large ? 26 : 22, lineHeight: large ? 40 : 34 }]}>{moment.title}</Text>
      <Text selectable style={[styles.title, { fontSize: large ? 24 : 20, lineHeight: large ? 38 : 32, color: colors.primary }]}>{moment.question}</Text>
      <Text selectable style={[styles.caption, { fontSize: large ? 20 : 16, lineHeight: large ? 34 : 28 }]}>{moment.help}</Text>
    </View>
    {step < 2 ? <Action title={step === 0 ? '이 마음으로 기도하기' : '기도를 마치고 일상으로'} onPress={() => setStep(step + 1)} /> : <>
      <Action title="오늘은 여기까지 · 홈으로" onPress={() => router.replace('/')} />
      {worshipId && <Action secondary title="기억하고 싶은 묵상 남기기" onPress={() => router.push({ pathname: '/records/new', params: { kind: 'REFLECTION', worshipId } })} />}
      <Action secondary title="개인 기도 남기기" onPress={() => router.push({ pathname: '/records/new', params: { kind: 'PRAYER' } })} />
      <Text style={styles.caption}>기록을 저장할 때만 로그인이 필요합니다. 저장한 묵상과 기도는 나만 볼 수 있습니다.</Text>
    </>}
    {step > 0 && <Action secondary title="앞의 안내로" onPress={() => setStep(step - 1)} />}
    <Text style={styles.caption}>시간 제한이나 완료 점수는 없습니다. 지금은 마음으로만 머물러도 괜찮아요.</Text>
  </View>;
}
