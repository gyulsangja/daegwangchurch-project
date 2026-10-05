import { useLocalSearchParams } from 'expo-router';
import { MemberGate } from '../../components/member-session';
import { ScheduleEditor } from '../../components/schedule-editor';
export default function NewSchedule() { const { date } = useLocalSearchParams<{ date?: string }>(); return <MemberGate returnTo="/schedules/new"><ScheduleEditor date={date} /></MemberGate>; }
