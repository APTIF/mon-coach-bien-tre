import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  children: React.ReactNode;
  requireQuestionnaire?: boolean;
  requireSubscription?: boolean;
}

export default function ProtectedRoute({ children, requireQuestionnaire, requireSubscription }: Props) {
  const { user, beneficiary, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  if (!beneficiary) return <Navigate to="/" replace />;

  if (requireSubscription && !beneficiary.subscription_active) {
    if (!beneficiary.questionnaire_completed) return <Navigate to="/questionnaire" replace />;
    return <Navigate to="/formules" replace />;
  }

  if (requireQuestionnaire && !beneficiary.questionnaire_completed) {
    return <Navigate to="/questionnaire" replace />;
  }

  return <>{children}</>;
}
