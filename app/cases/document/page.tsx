import { redirect } from 'next/navigation';

export default function DocumentRedirect() {
  redirect('/cases/workbench?step=document');
}
