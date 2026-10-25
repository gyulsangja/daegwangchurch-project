'use client';
import {useState} from 'react';
export default function Login(){const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setMessage('');const form=new FormData(e.currentTarget);try{const response=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.get('email'),password:form.get('password')})});const result=await response.json();if(!response.ok)throw new Error(result.message);window.location.assign('/');}catch(error){setMessage(error instanceof Error?error.message:'로그인하지 못했습니다.');setBusy(false);}}
 return <main className="locked"><h1>대광교회 목회시스템</h1><p>목회 권한을 부여받은 계정으로 로그인해 주세요.</p><form onSubmit={submit} className="panel detail-body"><fieldset disabled={busy} className="pastoral-fields"><label>이메일<input name="email" type="email" autoComplete="username" required/></label><label>비밀번호<input name="password" type="password" autoComplete="current-password" required/></label><p role="status">{message}</p><button className="button primary">{busy?'확인 중…':'로그인'}</button></fieldset></form></main>;
}
