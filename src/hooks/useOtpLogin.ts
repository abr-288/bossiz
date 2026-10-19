import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type OtpChannel = "email" | "sms";
export type OtpPurpose = "login" | "signup" | "verify_phone";

export const useOtpLogin = () => {
  const [loading, setLoading] = useState(false);

  const requestOtp = useCallback(async (destination: string, channel: OtpChannel, purpose: OtpPurpose = "login") => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { destination, channel, purpose },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Échec de l'envoi du code");
      return { success: true as const };
    } catch (error: any) {
      return { success: false as const, error: error.message || "Échec de l'envoi du code" };
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (destination: string, code: string, purpose: OtpPurpose = "login") => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { destination, code, purpose },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Code invalide");

      if (data.session?.token_hash) {
        const { error: sessionError } = await supabase.auth.verifyOtp({
          email: data.session.email,
          token: data.session.token_hash,
          type: "email",
        });
        if (sessionError) throw sessionError;
      }

      return { success: true as const };
    } catch (error: any) {
      return { success: false as const, error: error.message || "Code invalide" };
    } finally {
      setLoading(false);
    }
  }, []);

  return { requestOtp, verifyOtp, loading };
};
