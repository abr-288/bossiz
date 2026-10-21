import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage } from "@/lib/errorMessage";

interface MFAFactor {
  id: string;
  friendly_name: string;
  factor_type: string;
  status: string;
  created_at: string;
}

interface EnrollmentData {
  factorId: string;
  qrCode: string;
  secret: string;
}

export function useMFA() {
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchFactors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;

      // Filter to only verified TOTP factors
      const verifiedFactors = data.totp.filter((f) => f.status === "verified");
      setFactors(verifiedFactors as MFAFactor[]);
    } catch (err) {
      setError(getErrorMessage(err) || "Erreur lors de la récupération des facteurs MFA");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFactors();
  }, [fetchFactors]);

  const enrollTOTP = async (friendlyName: string = "Authenticator App") => {
    setEnrolling(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName,
      });

      if (error) throw error;

      setEnrollmentData({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      });

      return data;
    } catch (err) {
      setError(getErrorMessage(err) || "Erreur lors de l'inscription TOTP");
      throw err;
    } finally {
      setEnrolling(false);
    }
  };

  const verifyAndActivate = async (code: string) => {
    if (!enrollmentData) {
      setError("Aucune inscription en cours");
      return false;
    }

    setVerifying(true);
    setError(null);
    try {
      // Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollmentData.factorId,
      });

      if (challengeError) throw challengeError;

      // Verify the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollmentData.factorId,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) throw verifyError;

      // Clear enrollment data and refresh factors
      setEnrollmentData(null);
      await fetchFactors();

      return true;
    } catch (err) {
      setError(getErrorMessage(err) || "Code invalide");
      return false;
    } finally {
      setVerifying(false);
    }
  };

  const cancelEnrollment = () => {
    setEnrollmentData(null);
    setError(null);
  };

  const unenrollFactor = async (factorId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (error) throw error;

      await fetchFactors();
      return true;
    } catch (err) {
      setError(getErrorMessage(err) || "Erreur lors de la désactivation");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getAAL = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Error getting AAL:", err);
      return null;
    }
  };

  return {
    factors,
    loading,
    enrolling,
    verifying,
    enrollmentData,
    error,
    enrollTOTP,
    verifyAndActivate,
    cancelEnrollment,
    unenrollFactor,
    fetchFactors,
    getAAL,
    hasMFAEnabled: factors.length > 0,
  };
}
