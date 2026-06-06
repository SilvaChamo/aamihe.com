import { preload } from 'react-dom';

const LOGIN_BG = '/images/login-bg.webp';

export default function DashboardLoginLayout({ children }: { children: React.ReactNode }) {
  preload(LOGIN_BG, { as: 'image', fetchPriority: 'high' });
  return children;
}
