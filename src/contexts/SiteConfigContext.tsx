import React, { useContext, useEffect, ReactNode } from "react";
import { useSiteConfig, SiteConfig } from "@/hooks/useSiteConfig";
import { applyDefaultLanguage } from "@/i18n/config";
import { singletonContext } from "@/lib/singletonContext";

interface SiteConfigContextType {
  config: SiteConfig;
  loading: boolean;
  updateConfig: (key: keyof SiteConfig, value: any) => Promise<void>;
  refetch: () => Promise<void>;
}

const SiteConfigContext = singletonContext<SiteConfigContextType | undefined>("SiteConfig", undefined);

export const SiteConfigProvider = ({ children }: { children: ReactNode }) => {
  const { config, loading, updateConfig, refetch } = useSiteConfig();

  useEffect(() => {
    if (!loading && config.locale?.defaultLanguage) {
      applyDefaultLanguage(config.locale.defaultLanguage);
    }
  }, [loading, config.locale?.defaultLanguage]);

  return (
    <SiteConfigContext.Provider value={{ config, loading, updateConfig, refetch }}>
      {children}
    </SiteConfigContext.Provider>
  );
};

export const useSiteConfigContext = () => {
  const context = useContext(SiteConfigContext);
  if (!context) {
    throw new Error("useSiteConfigContext must be used within SiteConfigProvider");
  }
  return context;
};
