import { lazy } from 'react';

const Dashboard = lazy(() => import('../components/Dashboard'));

export default function DashboardPage() {
  return <Dashboard />;
}
