import { redirect } from 'next/navigation';

export default function VerifyRedirect() {
  redirect('/cases/workbench?step=verify');
}
