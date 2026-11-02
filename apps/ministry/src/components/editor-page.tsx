'use client';
import {createContext,forwardRef,useCallback,useContext,useEffect,useLayoutEffect,useId,useImperativeHandle,useMemo,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';


type Host={host:HTMLDivElement|null;activate:(id:string)=>void;release:(id:string)=>void};
const HostContext=createContext<Host|null>(null);
const FormContext=createContext({dirty:false});
const historyKey='daegwangEditor';
// Keep list filters mounted, but mount form contents only while editing.
// The portal belongs to the normal main layout: no overlay, focus trap or nested scroll area.
export function EditorProvider({children}:{children:ReactNode}){
 const [host,setHost]=useState<HTMLDivElement|null>(null),[active,setActive]=useState<string|null>(null);
 const activate=useCallback((id:string)=>setActive(id),[]);
 const release=useCallback((id:string)=>setActive(current=>current===id?null:current),[]);
 const value=useMemo(()=>({host,activate,release}),[host,activate,release]);
 return <HostContext.Provider value={value}><div hidden={active!==null} className="editor-list-content">{children}</div><div ref={setHost} className="editor-page-host"/></HostContext.Provider>;
}
export type EditorPageHandle={show:()=>void;close:()=>void;readonly open:boolean;querySelector:(selector:'form')=>HTMLFormElement|null};
type Props={children:ReactNode;busy?:boolean;className?:string;onCancel?:(event:Event)=>void};
export const EditorPage=forwardRef<EditorPageHandle,Props>(function EditorPage({children,busy=false,onCancel},ref){
 const context=useContext(HostContext);if(!context)throw Error('EditorProvider is required');
 const {host,activate,release}=context;const id=useId();
 const [opened,setOpened]=useState(false),[dirty,setDirty]=useState(false);const openRef=useRef(false),section=useRef<HTMLElement>(null),returnFocus=useRef<HTMLElement|null>(null),scroll=useRef(0);
 const close=useCallback((fromHistory=false)=>{
  if(!openRef.current)return;
  openRef.current=false;setOpened(false);setDirty(false);release(id);
  if(!fromHistory&&history.state?.[historyKey]===id){const state={...history.state};delete state[historyKey];history.replaceState(state,'',location.href);history.back();}
  requestAnimationFrame(()=>{returnFocus.current?.focus({preventScroll:true});window.scrollTo({top:scroll.current,behavior:'instant'});});
 },[id,release]);
 useImperativeHandle(ref,()=>({
  show(){if(openRef.current)return;returnFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null;scroll.current=window.scrollY;openRef.current=true;setDirty(false);setOpened(true);activate(id);history.pushState({...history.state,[historyKey]:id},'',location.href);},
  close:()=>close(),get open(){return openRef.current;},querySelector:selector=>section.current?.querySelector(selector)??null,
 }),[activate,close,id]);
 useLayoutEffect(()=>{if(opened)activate(id);return()=>release(id);},[opened,id,activate,release]);
 useEffect(()=>{if(!opened||!host)return;section.current?.focus({preventScroll:true});section.current?.scrollIntoView({block:'start'});},[opened,host]);

 useEffect(()=>{if(!opened||!dirty)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[opened,dirty]);
 useEffect(()=>{
  if(!opened)return;
  const back=()=>{
   if(!openRef.current||history.state?.[historyKey]===id)return;
   const event=new Event('cancel',{cancelable:true});
   if(busy||dirty&&!window.confirm('저장하지 않은 내용을 버리고 목록으로 돌아갈까요?'))event.preventDefault();
   else onCancel?.(event);
   if(event.defaultPrevented)history.pushState({...history.state,[historyKey]:id},'',location.href);
   else close(true);
  };
  window.addEventListener('popstate',back);return()=>window.removeEventListener('popstate',back);
 },[opened,id,busy,dirty,onCancel,close]);
 useEffect(()=>{if(!opened)return;const guard=(event:MouseEvent)=>{const link=(event.target as Element)?.closest?.('a');if(!link||link.target==='_blank'||link.hasAttribute('download')||event.ctrlKey||event.metaKey||event.shiftKey||new URL(link.href,location.href).href===location.href)return;if(busy||(dirty&&!window.confirm('저장하지 않은 내용을 버리고 이동할까요?'))){event.preventDefault();event.stopImmediatePropagation();}};document.addEventListener('click',guard,true);return()=>document.removeEventListener('click',guard,true);},[opened,dirty,busy]);
 function cancel(){if(busy||dirty&&!window.confirm('저장하지 않은 내용을 버리고 목록으로 돌아갈까요?'))return;const event=new Event('cancel',{cancelable:true});onCancel?.(event);if(!event.defaultPrevented)close();}
 if(!opened||!host)return null;
 return createPortal(<FormContext.Provider value={{dirty}}><section ref={section} tabIndex={-1} className="editor-page" aria-label="등록·수정 화면" onChangeCapture={()=>setDirty(true)} onClickCapture={event=>{const target=event.target as Element;if(target.closest('[data-editor-change]'))setDirty(true);const button=target.closest('button');if(button&&['닫기','목록으로'].includes(button.textContent?.trim()??'')){event.preventDefault();event.stopPropagation();cancel();}}}><div className="editor-page-navigation"><button type="button" className="button" disabled={busy} onClick={cancel}>← 목록으로 돌아가기</button><span>작성 후 아래 저장 버튼을 눌러 주세요.</span></div>{children}</section></FormContext.Provider>,host);
});
export function EditorActions({children}:{children:ReactNode}){const {dirty}=useContext(FormContext);return <div className="editor-actions"><span role="status">{dirty?'저장하지 않은 변경사항이 있습니다.':'내용을 확인한 후 저장하세요.'}</span><div>{children}</div></div>;}
