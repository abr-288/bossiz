import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type NotificationPermission = 'default' | 'granted' | 'denied';

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    // Check if notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      
      // Get existing subscription
      navigator.serviceWorker.ready.then((registration) => {
        (registration as any).pushManager?.getSubscription().then((sub: PushSubscription | null) => {
          setSubscription(sub);
        });
      });
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      console.warn('Push notifications are not supported');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const subscribe = async () => {
    if (!isSupported || permission !== 'granted') {
      console.warn('Cannot subscribe: notifications not granted');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check for existing subscription
      const existingSubscription = await (registration as any).pushManager?.getSubscription();
      if (existingSubscription) {
        setSubscription(existingSubscription);
        await savePushSubscription(existingSubscription);
        return existingSubscription;
      }
      
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error('VITE_VAPID_PUBLIC_KEY is not configured — cannot subscribe to push notifications');
        return null;
      }

      // Create a subscription
      const sub = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
      
      setSubscription(sub);
      await savePushSubscription(sub);
      return sub;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  };

  const savePushSubscription = async (subscription: PushSubscription) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const subscriptionData = subscription.toJSON();
      await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint: subscriptionData.endpoint!,
        p256dh: subscriptionData.keys!.p256dh,
        auth: subscriptionData.keys!.auth,
      }, {
        onConflict: 'user_id,endpoint'
      });
    } catch (error) {
      console.error('Error saving push subscription:', error);
    }
  };

  const unsubscribe = async () => {
    if (!subscription) return false;

    try {
      await subscription.unsubscribe();
      setSubscription(null);
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      console.warn('Cannot send notification: permission not granted');
      return;
    }

    // Send via service worker for better reliability
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        icon: 'https://storage.googleapis.com/gpt-engineer-file-uploads/eELbhqThzPVCUnExIw7dfxcDOAj2/uploads/1761678567741-new_logo_bossizG.png',
        badge: 'https://storage.googleapis.com/gpt-engineer-file-uploads/eELbhqThzPVCUnExIw7dfxcDOAj2/uploads/1761678567741-new_logo_bossizG.png',
        ...options
      });
    });
  };

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    sendNotification
  };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
