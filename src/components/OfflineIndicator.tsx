import { Wifi, WifiOff, RefreshCw, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OfflineIndicatorProps {
  isOnline: boolean;
  isSyncing: boolean;
  storageStats: { bookings: number; pendingSync: number };
  onSync: () => void;
}

export const OfflineIndicator = ({ 
  isOnline, 
  isSyncing, 
  storageStats,
  onSync 
}: OfflineIndicatorProps) => {
  if (isOnline && storageStats.pendingSync === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-2">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-success" />
            ) : (
              <WifiOff className="h-5 w-5 text-warning-foreground" />
            )}
            
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {isOnline ? 'En ligne' : 'Mode hors ligne'}
                </span>
                {!isOnline && (
                  <Badge variant="outline" className="gap-1">
                    <Database className="h-3 w-3" />
                    {storageStats.bookings} réservation{storageStats.bookings > 1 ? 's' : ''} en cache
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {isOnline 
                  ? storageStats.pendingSync > 0 
                    ? `${storageStats.pendingSync} modification(s) en attente de synchronisation`
                    : 'Toutes les données sont synchronisées'
                  : 'Les données sont disponibles hors ligne. Elles seront synchronisées à la reconnexion.'
                }
              </p>
            </div>
          </div>

          {isOnline && storageStats.pendingSync > 0 && (
            <Button
              onClick={onSync}
              disabled={isSyncing}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Synchronisation...' : 'Synchroniser'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
