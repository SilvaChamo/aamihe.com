import { preload } from 'react-dom';

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  preload('/images/login-bg.png', { as: 'image' });
  return children;
}
