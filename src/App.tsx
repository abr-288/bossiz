import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { SiteConfigProvider } from "@/contexts/SiteConfigContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import AnimatedRoutes from "@/components/AnimatedRoutes";
import ChatWidget from "@/components/ChatWidget";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SiteConfigProvider>
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
        </SiteConfigProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
