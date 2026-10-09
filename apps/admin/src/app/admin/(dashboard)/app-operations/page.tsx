import { redirect } from 'next/navigation';
export default async function AppOperationsPage() {
  redirect('/admin/dashboard');
}
