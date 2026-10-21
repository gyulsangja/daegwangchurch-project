import Link from 'next/link';
export default function NotFound() { return <section className="panel empty"><h1>정보를 찾을 수 없습니다.</h1><p>삭제되었거나 접근할 수 없는 자료입니다.</p><Link className="button" href="/members">교인 목록으로</Link></section>; }
