import { Navigate } from 'react-router-dom';

export default function Inventory() {
  return <Navigate to="/dashboard/knowledge?tab=inventory" replace />;
}
