// Composant principal de l'application
// Configure tous les providers et les composants globaux
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { SiteConfigProvider } from "@/contexts/SiteConfigContext";
import { BossizConfigProvider } from "@/contexts/BossizConfigContext";
import { HomepageConfigProvider } from "@/contexts/HomepageConfigContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import AnimatedRoutes from "@/components/AnimatedRoutes";
import RouteSeo from "@/components/RouteSeo";
import ChatWidget from "@/components/ChatWidget";
import BottomNav from "@/components/BottomNav";

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
                  <MotionConfig reducedMotion="user">
                    <BrowserRouter>
                      <RouteSeo />
                      <AnimatedRoutes />
                      <BottomNav />
                      {/* Ordre d'apparition : cookies d'abord ; le chat et la demande de
                          notification attendent la réponse au bandeau. */}
                      <CookieConsentBanner />
                      <ChatWidget />
                      <NotificationPrompt />
                    </BrowserRouter>
                  </MotionConfig>
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
