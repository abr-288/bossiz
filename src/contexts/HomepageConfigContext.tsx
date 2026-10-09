import React, { useContext, ReactNode } from "react";
import { useHomepageConfig, HomepageConfig, HomepageFeature, HomepageSection } from "@/hooks/useHomepageConfig";
import { singletonContext } from "@/lib/singletonContext";

interface HomepageConfigContextType {
  config: HomepageConfig;
  loading: boolean;
  updateFeature: (featureId: string, updates: Partial<HomepageFeature>) => Promise<void>;
  updateSection: (sectionId: string, updates: Partial<HomepageSection>) => Promise<void>;
  refetch: () => Promise<void>;
}

const HomepageConfigContext = singletonContext<HomepageConfigContextType | undefined>("HomepageConfig", undefined);

export const HomepageConfigProvider = ({ children }: { children: ReactNode }) => {
  const { config, loading, updateFeature, updateSection, refetch } = useHomepageConfig();

  return (
    <HomepageConfigContext.Provider value={{ 
      config, 
      loading, 
      updateFeature, 
      updateSection, 
      refetch 
    }}>
      {children}
    </HomepageConfigContext.Provider>
  );
};

export const useHomepageConfigContext = () => {
  const context = useContext(HomepageConfigContext);
  if (!context) {
    throw new Error("useHomepageConfigContext must be used within HomepageConfigProvider");
  }
  return context;
};
