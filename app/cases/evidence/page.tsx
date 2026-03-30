import { redirect } from 'next/navigation';

export default function EvidenceRedirect() {
  redirect('/cases/workbench?step=verify');
}
