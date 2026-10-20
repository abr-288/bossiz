import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Json, TablesInsert } from '@/integrations/supabase/types';

export interface BookingData {
  id: string;
  user_id: string;
  service_id: string;
  status: string;
  payment_status: string;
  start_date: string;
  end_date: string | null;
  guests: number;
  total_price: number;
  booking_details: Json;
  services: { name: string; type: string; location: string } | null;
  created_at: string;
  updated_at: string;
  notes: string | null;
  external_ref: string | null;
  currency: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}

interface BReserveDB extends DBSchema {
  bookings: {
    key: string;
    value: BookingData & { synced_at: string };
    indexes: { 'by-user': string };
  };
  sync_queue: {
    key: number;
    value: {
      id?: number;
      action: 'create' | 'update' | 'delete';
      table: string;
      data: TablesInsert<'bookings'>;
      timestamp: string;
    };
  };
}

const DB_NAME = 'b-reserve-offline';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<BReserveDB> | null = null;

export const initOfflineDB = async () => {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<BReserveDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create bookings store
      if (!db.objectStoreNames.contains('bookings')) {
        const bookingStore = db.createObjectStore('bookings', { keyPath: 'id' });
        bookingStore.createIndex('by-user', 'user_id');
      }

      // Create sync queue store
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
      }
    },
  });

  return dbInstance;
};

// Bookings operations
export const saveBookingsOffline = async (bookings: BookingData[], userId: string) => {
  const db = await initOfflineDB();
  const tx = db.transaction('bookings', 'readwrite');
  
  const synced_at = new Date().toISOString();
  
  await Promise.all([
    ...bookings.map(booking => 
      tx.store.put({ ...booking, synced_at })
    ),
    tx.done
  ]);
};

export const getOfflineBookings = async (userId: string): Promise<BookingData[]> => {
  const db = await initOfflineDB();
  const bookings = await db.getAllFromIndex('bookings', 'by-user', userId);
  return bookings;
};

export const getOfflineBookingById = async (id: string): Promise<BookingData | undefined> => {
  const db = await initOfflineDB();
  return await db.get('bookings', id);
};

export const deleteOfflineBooking = async (id: string) => {
  const db = await initOfflineDB();
  await db.delete('bookings', id);
};

export const clearOfflineBookings = async () => {
  const db = await initOfflineDB();
  await db.clear('bookings');
};

// Sync queue operations
export const addToSyncQueue = async (
  action: 'create' | 'update' | 'delete',
  table: string,
  data: TablesInsert<'bookings'>
) => {
  const db = await initOfflineDB();
  await db.add('sync_queue', {
    action,
    table,
    data,
    timestamp: new Date().toISOString()
  });
};

export const getSyncQueue = async () => {
  const db = await initOfflineDB();
  const items = await db.getAll('sync_queue');
  return items.map((item, index) => ({
    ...item,
    id: item.id || index
  }));
};

export const clearSyncQueue = async () => {
  const db = await initOfflineDB();
  await db.clear('sync_queue');
};

export const removeSyncQueueItem = async (id: number) => {
  const db = await initOfflineDB();
  await db.delete('sync_queue', id);
};

// Check if data is stale (older than 5 minutes)
export const isDataStale = (syncedAt: string) => {
  const syncedTime = new Date(syncedAt).getTime();
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  return (now - syncedTime) > fiveMinutes;
};

// Get storage stats
export const getStorageStats = async () => {
  const db = await initOfflineDB();
  const bookingsCount = await db.count('bookings');
  const queueCount = await db.count('sync_queue');
  
  return {
    bookings: bookingsCount,
    pendingSync: queueCount
  };
};
