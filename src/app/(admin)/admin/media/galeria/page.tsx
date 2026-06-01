import { redirect } from 'next/navigation';

export default function GalleryRedirectPage() {
  redirect('/admin/media');
}
