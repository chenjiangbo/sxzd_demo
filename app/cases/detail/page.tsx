import { redirect } from 'next/navigation';

export default function CaseDetailRedirect() {
  redirect('/cases/workbench?step=overview');
}
