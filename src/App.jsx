import GameMap from './components/Map/GameMap';
import OnboardingModal from './components/UI/OnboardingModal';
import { useUser } from './context/UserContext';
import { Loader2 } from 'lucide-react';

function App() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="w-screen h-screen bg-game-dark flex items-center justify-center text-white">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-game-dark overflow-hidden relative">
      {!user && <OnboardingModal />}
      {user && <GameMap />}
    </div>
  );
}

export default App;
