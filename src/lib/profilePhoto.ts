import { supabase } from "@/integrations/supabase/client";

export function getProfilePhotoUrl(value?: string | null): string | undefined {
  const source = value?.trim();
  if (!source) return undefined;

  if (/^https?:\/\//i.test(source)) return source;

  const publicStoragePath = source.match(/^\/?storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (publicStoragePath) {
    const { data } = supabase.storage.from(publicStoragePath[1]).getPublicUrl(publicStoragePath[2]);
    return data.publicUrl;
  }

  const storagePath = source.replace(/^\/+/, "").replace(/^site-assets\//, "");
  const { data } = supabase.storage.from("site-assets").getPublicUrl(storagePath);
  return data.publicUrl;
}

export const PROFILE_UPDATED_EVENT = "bossiz:profile-updated";

export function notifyProfileUpdated() {
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
}

export function getUserPhotoFromMetadata(user: {
  user_metadata?: Record<string, unknown>;
}): string | undefined {
  const metadata = user.user_metadata || {};
  const photo = metadata.avatar_url ?? metadata.picture ?? metadata.photo_url;
  return typeof photo === "string" && photo.trim() ? photo : undefined;
}
