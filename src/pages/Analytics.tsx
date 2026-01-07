import { Navigate } from 'react-router-dom';

export default function Analytics() {
  return <Navigate to="/dashboard/knowledge?tab=analytics" replace />;
}