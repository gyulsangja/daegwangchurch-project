'use client';
export function PrintButton(){return <button type="button" className="button primary" onClick={async()=>{await document.fonts.ready;await Promise.all(Array.from(document.images).map(img=>img.decode().catch(()=>{})));window.print();}}>인쇄 / PDF 저장</button>;}
