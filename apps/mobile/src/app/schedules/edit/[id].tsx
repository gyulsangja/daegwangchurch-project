import { useLocalSearchParams } from 'expo-router';
import { MemberGate } from '../../../components/member-session';
import { ScheduleEditor } from '../../../components/schedule-editor';
export default function EditSchedule() { const { id } = useLocalSearchParams<{ id: string }>(); return <MemberGate returnTo={`/schedules/${id}`}><ScheduleEditor id={id} /></MemberGate>; }
