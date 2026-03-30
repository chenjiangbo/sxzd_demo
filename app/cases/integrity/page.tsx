import { redirect } from 'next/navigation';

export default function IntegrityRedirect() {
  redirect('/cases/workbench?step=integrity');
}
