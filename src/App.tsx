// Composant principal de l'application
// Configure tous les providers et les composants globaux
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { SiteConfigProvider } from "@/contexts/SiteConfigContext";
import { BossizConfigProvider } from "@/contexts/BossizConfigContext";
import { HomepageConfigProvider } from "@/contexts/HomepageConfigContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import AnimatedRoutes from "@/components/AnimatedRoutes";
import ChatWidget from "@/components/ChatWidget";

// Client React Query pour la gestion des requêtes API et du cache
const queryClient = new QueryClient();

// Composant App qui enveloppe l'application avec tous les providers nécessaires
const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SiteConfigProvider>
          <BossizConfigProvider>
            <HomepageConfigProvider>
              <CurrencyProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <NotificationPrompt />
                  <BrowserRouter>
                    <AnimatedRoutes />
                    <ChatWidget />
                  </BrowserRouter>
                </TooltipProvider>
              </CurrencyProvider>
            </HomepageConfigProvider>
          </BossizConfigProvider>
        </SiteConfigProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
