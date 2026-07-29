export default function Loading() {
  return (
    <div className="container-site flex min-h-[50vh] items-center justify-center" role="status">
      <span className="size-10 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600" />
      <span className="sr-only">페이지를 불러오는 중입니다.</span>
    </div>
  );
}
