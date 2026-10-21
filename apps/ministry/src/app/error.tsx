'use client';
export default function ErrorPage({ reset }: { reset: () => void }) { return <section className="panel empty" role="alert"><h2>정보를 불러오지 못했습니다.</h2><p>잠시 후 다시 시도해 주세요.</p><button className="button" onClick={reset}>다시 시도</button></section>; }
