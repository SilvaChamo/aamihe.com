import { AdminPanelLoading } from '@/components/Admin/AdminPanelLoading';

export default function AdminDashboardLoading() {
  return (
    <div className="admin-main-content" aria-busy="true" aria-label="A carregar">
      <AdminPanelLoading variant="dashboard" />
    </div>
  );
}
