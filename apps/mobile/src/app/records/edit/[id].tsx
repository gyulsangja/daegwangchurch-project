import { useLocalSearchParams } from 'expo-router';
import { MemberGate } from '../../../components/member-session';
import { RecordEditor } from '../../../components/record-editor';
export default function EditRecord() { const { id } = useLocalSearchParams<{ id: string }>(); return <MemberGate returnTo={`/records/${id}`}><RecordEditor id={id} /></MemberGate>; }
