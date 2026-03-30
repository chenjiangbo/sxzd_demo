import { redirect } from 'next/navigation';

export default function ReviewRedirect() {
  redirect('/cases/workbench?step=review');
}
