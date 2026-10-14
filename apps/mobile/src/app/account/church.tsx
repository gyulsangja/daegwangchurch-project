import { router } from 'expo-router';
import { AppScreen } from '../../components/app-screen';
import { MemberGate } from '../../components/member-session';
import { ChurchMembership } from '../../components/church-membership';
export default function ChurchConfirmation() { return <MemberGate returnTo="/account/church"><AppScreen title="교인 확인 및 소속" onBack={() => router.dismissTo('/my')}><ChurchMembership /></AppScreen></MemberGate>; }
