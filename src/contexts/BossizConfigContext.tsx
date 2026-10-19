import React, { useContext, ReactNode } from "react";
import { useBossizConfig, BossizSiteConfig, BossizGlobalConfig } from "@/hooks/useBossizConfig";
import { singletonContext } from "@/lib/singletonContext";

interface BossizConfigContextType {
  sites: BossizSiteConfig[];
  globalConfig: BossizGlobalConfig;
  loading: boolean;
  updateSiteConfig: (siteId: string, updates: Partial<BossizSiteConfig>) => Promise<void>;
  updateGlobalConfig: (updates: Partial<BossizGlobalConfig>) => Promise<void>;
  refetch: () => Promise<void>;
}

const BossizConfigContext = singletonContext<BossizConfigContextType | undefined>("BossizConfig", undefined);

export const BossizConfigProvider = ({ children }: { children: ReactNode }) => {
  const { sites, globalConfig, loading, updateSiteConfig, updateGlobalConfig, refetch } = useBossizConfig();

  return (
    <BossizConfigContext.Provider value={{ 
      sites, 
      globalConfig, 
      loading, 
      updateSiteConfig, 
      updateGlobalConfig, 
      refetch 
    }}>
      {children}
    </BossizConfigContext.Provider>
  );
};

export const useBossizConfigContext = () => {
  const context = useContext(BossizConfigContext);
  if (!context) {
    throw new Error("useBossizConfigContext must be used within BossizConfigProvider");
  }
  return context;
};
