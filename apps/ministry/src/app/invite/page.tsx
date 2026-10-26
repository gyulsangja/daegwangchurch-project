import {cookies} from 'next/headers';
import {authClient} from '@/lib/auth';
import {InvitationForm} from '@/components/auth-forms';
export default async function Page(){let token='',email='';try{const saved=JSON.parse((await cookies()).get('ministry-invitation')?.value??'{}');if(/^[a-f0-9]{64}$/.test(saved.token)){token=saved.token;email=typeof saved.email==='string'?saved.email:'';}}catch{/* expired browser invitation */}const {data}=await (await authClient()).auth.getUser();return <InvitationForm initialToken={token} initialEmail={email} signedInEmail={data.user?.email}/>;}
