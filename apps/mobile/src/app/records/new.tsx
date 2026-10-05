import { useLocalSearchParams } from 'expo-router';
import { MemberGate } from '../../components/member-session';
import { RecordEditor } from '../../components/record-editor';
export default function NewRecord() { const params = useLocalSearchParams<{ kind?: string; worshipId?: string; reflectionId?: string }>(); const query = new URLSearchParams(Object.entries(params).filter(([, value]) => typeof value === 'string')); return <MemberGate returnTo={`/records/new?${query}`}><RecordEditor {...params} /></MemberGate>; }
