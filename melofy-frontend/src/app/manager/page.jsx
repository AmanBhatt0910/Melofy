import ProtectedRoute from '@/components/ProtectedRoute';
import SongManager from '@/components/songManager';

export default function ManagerPage() {
  return (
    <ProtectedRoute>
      <SongManager />
    </ProtectedRoute>
  );
}