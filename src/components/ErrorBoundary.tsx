import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary - Composant de gestion d'erreurs globale
 * Capture les erreurs React et affiche un UI de fallback élégant
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log l'erreur pour le monitoring
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Vous pouvez envoyer l'erreur à un service de monitoring ici
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Utiliser le fallback personnalisé si fourni
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Sinon, utiliser le UI par défaut
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-full bg-destructive/10">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Une erreur s'est produite</CardTitle>
                  <CardDescription>Nous nous excusons pour ce désagrément</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm font-medium text-muted-foreground mb-2">Détails de l'erreur:</p>
                <p className="text-sm font-mono text-destructive">{this.state.error?.message || "Erreur inconnue"}</p>
              </div>

              {import.meta.env.DEV && this.state.errorInfo && (
                <details className="p-4 rounded-lg bg-muted">
                  <summary className="text-sm font-medium cursor-pointer hover:text-primary">
                    Stack trace (développement uniquement)
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto">{this.state.errorInfo.componentStack}</pre>
                </details>
              )}

              <div className="flex gap-3">
                <Button onClick={this.handleReset} className="flex-1" variant="default">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Réessayer
                </Button>
                <Button onClick={() => (window.location.href = "/")} variant="outline" className="flex-1">
                  <Home className="mr-2 h-4 w-4" />
                  Retour à l'accueil
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Si le problème persiste, veuillez{" "}
                <a href="/support" className="text-primary hover:underline">
                  contacter le support
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

/**
 * Hook pour réinitialiser l'ErrorBoundary
 * Utilisation: const resetError = useErrorBoundary();
 */
export const useErrorBoundary = () => {
  const [, setError] = React.useState();

  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
};

/**
 * ErrorFallback - Composant de fallback réutilisable
 */
export const ErrorFallback: React.FC<{
  error?: Error;
  resetError?: () => void;
  title?: string;
  description?: string;
}> = ({
  error,
  resetError,
  title = "Une erreur s'est produite",
  description = "Impossible de charger cette section",
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="p-4 rounded-full bg-destructive/10 mb-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {error && <p className="text-xs text-destructive mb-4 font-mono">{error.message}</p>}
      {resetError && (
        <Button onClick={resetError} size="sm" variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Réessayer
        </Button>
      )}
    </div>
  );
};
