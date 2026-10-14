import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { hasOfferingAccount } from '@daegwang/contracts/features/church/offering';
import { AppScreen, MenuCard } from '../../components/app-screen';
import { Action, Card, Failure, styles } from '../../components/ui';
import { useChurchContact } from '../../hooks/use-church';
export default function OfferingScreen() {
  const state = useChurchContact(); const account = state.data?.offering; const [message, setMessage] = useState('');
  async function copy() { if (!account) return; try { const ok = await Clipboard.setStringAsync(account.number.replace(/[\s-]/g, '')); setMessage(ok ? '계좌번호를 복사했습니다.' : '계좌번호를 길게 눌러 복사해 주세요.'); } catch { setMessage('복사하지 못했어요. 계좌번호를 길게 눌러 복사해 주세요.'); } }
  return <AppScreen title="헌금 안내" onBack={() => router.canGoBack() ? router.back() : router.replace('/church')}>
    {state.loading && <ActivityIndicator accessibilityLabel="헌금 안내를 불러오는 중" />}
    {!!state.error && <Failure message={state.error} retry={state.reload} />}
    {account && (hasOfferingAccount(account) ? <><View style={styles.card}><Text style={styles.title}>{account.bank}</Text><Text selectable style={[styles.title, { fontSize: 24, lineHeight: 34 }]}>{account.number}</Text><Text style={styles.caption}>예금주 · {account.holder}</Text><Action title="계좌번호 복사" onPress={copy} />{!!message && <Text accessibilityRole="alert" style={styles.caption}>{message}</Text>}</View><Card title="헌금 안내">{[account.note, '이체 전 은행과 예금주를 확인해 주세요.'].filter(Boolean).join('\n\n')}</Card></> : <Card title="헌금 계좌">공개된 헌금 계좌가 없습니다. 교회에 문의해 주세요.</Card>)}
    <MenuCard title="교회에 문의하기" description={state.data?.phone} onPress={() => router.push('/church-info/contact')} />
  </AppScreen>;
}
