'use client';
import {useState} from 'react';
import type {Family} from '@daegwang/ministry-core/directory';
import {FamilyMap} from './family-map';
import {FamilyWorkspace} from './family-workspace';
export function FamilyHub({families,candidates,initialId,initialMember}:{families:Family[];candidates:{id:string;name:string;familyId:string|null}[];initialId?:string;initialMember?:string}){const [tab,setTab]=useState('list');return <><div className="pastoral-toolbar"><button className="button" aria-pressed={tab==='list'} onClick={()=>setTab('list')}>가구 등록·구성원</button><button className="button" aria-pressed={tab==='map'} onClick={()=>setTab('map')}>가구 간 관계맵</button></div><div hidden={tab!=='list'}><FamilyWorkspace families={families} candidates={candidates} initialId={initialId} initialMember={initialMember}/></div>{tab==='map'&&<FamilyMap families={families} candidates={candidates}/>}</>;}
