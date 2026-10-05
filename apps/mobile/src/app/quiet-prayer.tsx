import { router } from 'expo-router';
import { AppScreen } from '../components/app-screen';
import { FaithPractice } from '../components/faith-practice';
export default function QuietPrayer() {
  return <AppScreen title="잠시 기도하기" onBack={() => router.canGoBack() ? router.back() : router.replace('/')}><FaithPractice /></AppScreen>;
}
