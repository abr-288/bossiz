// Best-effort user notifications for the Business Travel approval workflow
// (and anything else that wants to reach a user by phone going forward).
// Tries WhatsApp first (if a whatsapp-category provider is active), falls
// back to SMS (if an sms-category provider is active), and silently no-ops
// if neither is configured - a missing notification provider should never
// block a booking/approval from going through.
//
// Self-contained: builds its own service-role client rather than requiring
// the caller to have one, since integration_credentials is admin-only RLS
// and several callers of this module (create-booking) don't otherwise need
// a service-role client at all.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendSms, sendWhatsapp } from "./integrations.ts";

function getAdminClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Sends to a raw phone number, WhatsApp first then SMS. Returns which
// channel actually delivered it (or null if both failed / neither is
// configured) - purely informational for logging, callers shouldn't branch
// on it.
export async function notifyPhone(phone: string, message: string): Promise<"whatsapp" | "sms" | null> {
  const supabase = getAdminClient();
  if (!supabase || !phone) return null;

  const whatsappResult = await sendWhatsapp(supabase, { to: phone, message });
  if (whatsappResult.ok) return "whatsapp";

  const smsResult = await sendSms(supabase, { to: phone, message });
  if (smsResult.ok) return "sms";

  return null;
}

// Notifies every approver/admin of a company (the people who can act on a
// pending-approval booking) - looks up their phone numbers from `profiles`
// via `company_members`.
export async function notifyCompanyApprovers(companyId: string, message: string): Promise<void> {
  const supabase = getAdminClient();
  if (!supabase) return;

  try {
    const { data: approvers } = await supabase
      .from("company_members")
      .select("user_id, profiles(phone)")
      .eq("company_id", companyId)
      .in("role", ["admin", "approver"]);

    for (const approver of approvers || []) {
      const phone = (approver as any).profiles?.phone;
      if (phone) await notifyPhone(phone, message);
    }
  } catch (error) {
    console.error("notifyCompanyApprovers failed (non-fatal):", error instanceof Error ? error.message : error);
  }
}

// Notifies the traveler who submitted a booking once an approver has
// reviewed it.
export async function notifyBookingOwner(userId: string, message: string): Promise<void> {
  const supabase = getAdminClient();
  if (!supabase) return;

  try {
    const { data: profile } = await supabase.from("profiles").select("phone").eq("id", userId).maybeSingle();
    if (profile?.phone) await notifyPhone(profile.phone, message);
  } catch (error) {
    console.error("notifyBookingOwner failed (non-fatal):", error instanceof Error ? error.message : error);
  }
}
