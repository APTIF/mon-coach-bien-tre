import { useLocation, useNavigate } from 'react-router-dom';
import { User, Map, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function BottomNav() {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const items = [
    { label: 'Mon profil', icon: User, path: '/profil' },
    { label: 'Mon parcours', icon: Map, path: '/accueil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-lg">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <item.icon size={22} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={async () => { await signOut(); navigate('/'); }}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-muted-foreground transition-colors"
        >
          <LogOut size={22} strokeWidth={1.5} />
          <span className="text-xs font-medium">Déconnexion</span>
        </button>
      </div>
    </nav>
  );
}
