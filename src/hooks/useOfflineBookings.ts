import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  saveBookingsOffline,
  getOfflineBookings,
  addToSyncQueue,
  getSyncQueue,
  clearSyncQueue,
  removeSyncQueueItem,
  getStorageStats,
  type BookingData,
} from "@/lib/offlineStorage";
import { useToast } from "@/hooks/use-toast";

export const useOfflineBookings = (userId: string | undefined) => {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [storageStats, setStorageStats] = useState({ bookings: 0, pendingSync: 0 });
  const { toast } = useToast();

  // Update online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connexion rétablie",
        description: "Synchronisation des données en cours...",
      });
      syncPendingChanges();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Mode hors ligne",
        description: "Vous pouvez toujours consulter vos réservations",
        variant: "destructive",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Update storage stats
  const updateStats = useCallback(async () => {
    const stats = await getStorageStats();
    setStorageStats(stats);
  }, []);

  // Fetch bookings from Supabase or IndexedDB
  const fetchBookings = useCallback(async () => {
    if (!userId) {
      setBookings([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      if (isOnline) {
        // Try to fetch from Supabase
        const { data, error } = await supabase
          .from("bookings")
          .select("*, services(name, type, location)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Save to IndexedDB for offline access
        if (data) {
          await saveBookingsOffline(data, userId);
          setBookings(data);
          await updateStats();
        }
      } else {
        // Fetch from IndexedDB when offline
        const offlineData = await getOfflineBookings(userId);
        setBookings(offlineData);
        await updateStats();
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);

      // Fallback to offline data
      try {
        const offlineData = await getOfflineBookings(userId);
        setBookings(offlineData);
        await updateStats();

        if (offlineData.length > 0) {
          toast({
            title: "Données hors ligne",
            description: "Affichage des réservations en cache",
          });
        }
      } catch (offlineError) {
        console.error("Error fetching offline bookings:", offlineError);
        toast({
          title: "Erreur",
          description: "Impossible de charger les réservations",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [userId, isOnline, toast, updateStats]);

  // Sync pending changes when online
  const syncPendingChanges = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);

    try {
      const queue = await getSyncQueue();

      if (queue.length === 0) {
        await fetchBookings();
        return;
      }

      for (const item of queue) {
        try {
          // Only handle bookings table for now
          if (item.table === "bookings") {
            if (item.action === "create") {
              await supabase.from("bookings").insert(item.data);
            } else if (item.action === "update") {
              await supabase
                .from("bookings")
                .update(item.data)
                .eq("id", item.data.id ?? "");
            } else if (item.action === "delete") {
              await supabase
                .from("bookings")
                .delete()
                .eq("id", item.data.id ?? "");
            }
          }

          // Remove from queue after successful sync
          if (item.id !== undefined) {
            await removeSyncQueueItem(item.id);
          }
        } catch (error) {
          console.error("Error syncing item:", error);
        }
      }

      await clearSyncQueue();
      await fetchBookings();
      await updateStats();

      toast({
        title: "Synchronisation réussie",
        description: `${queue.length} modification(s) synchronisée(s)`,
      });
    } catch (error) {
      console.error("Error syncing changes:", error);
      toast({
        title: "Erreur de synchronisation",
        description: "Certaines modifications n'ont pas pu être synchronisées",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, fetchBookings, toast, updateStats]);

  // Initial fetch
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Set up realtime subscription when online
  useEffect(() => {
    if (!userId || !isOnline) return;

    const channel = supabase
      .channel("bookings-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchBookings();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isOnline, fetchBookings]);

  return {
    bookings,
    loading,
    isOnline,
    isSyncing,
    storageStats,
    refetch: fetchBookings,
    syncPendingChanges,
  };
};
