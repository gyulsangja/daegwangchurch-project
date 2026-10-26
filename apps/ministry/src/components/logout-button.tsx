'use client';
import {useState} from 'react';
export function LogoutButton(){
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function logout(e:React.FormEvent){e.preventDefault();if(busy)return;setBusy(true);setError('');try{const response=await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin',cache:'no-store'});if(!response.ok)throw new Error(response.status===403?'접속 주소를 확인한 뒤 새로고침하고 다시 시도해 주세요.':'로그아웃하지 못했습니다. 다시 시도해 주세요.');window.location.replace('/login');}catch(cause){setError(cause instanceof Error?cause.message:'네트워크를 확인해 주세요.');setBusy(false);}}
 return <form action="/api/auth/logout" method="post" onSubmit={logout}><button className="button" disabled={busy}>{busy?'로그아웃 중…':'로그아웃'}</button>{error&&<p role="alert">{error}</p>}</form>;
}
