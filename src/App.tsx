import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import TestToolbar from "@/components/TestToolbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import Auth from "@/pages/Auth";
import Accueil from "@/pages/Accueil";
import Questionnaire from "@/pages/Questionnaire";
import Transition from "@/pages/Transition";
import Formules from "@/pages/Formules";
import Confirmation from "@/pages/Confirmation";
import Profil from "@/pages/Profil";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/accueil" element={<ProtectedRoute><Accueil /></ProtectedRoute>} />
            <Route path="/questionnaire" element={<ProtectedRoute><Questionnaire /></ProtectedRoute>} />
            <Route path="/transition" element={<ProtectedRoute requireQuestionnaire><Transition /></ProtectedRoute>} />
            <Route path="/formules" element={<ProtectedRoute requireQuestionnaire><Formules /></ProtectedRoute>} />
            <Route path="/confirmation" element={<ProtectedRoute requireQuestionnaire><Confirmation /></ProtectedRoute>} />
            <Route path="/profil" element={<ProtectedRoute><Profil /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
          <TestToolbar />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
