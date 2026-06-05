// Configuration centralisée de l'application
// Utilisé pour gérer toutes les variables d'environnement et clés API

export interface AppConfig {
  // Supabase
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseProjectId: string;
  
  // CinetPay
  cinetPayApiKey: string;
  cinetPaySiteId: string;
  
  // Application
  appName: string;
  appVersion: string;
  appEnvironment: string;
  
  // URLs
  apiBaseUrl: string;
  webBaseUrl: string;
}

// Configuration par défaut (développement)
const defaultConfig: AppConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://your-project-id.supabase.co',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'your-anon-key',
  supabaseProjectId: import.meta.env.VITE_SUPABASE_PROJECT_ID || 'your-project-id',
  
  // CinetPay - clés réelles fournies
  cinetPayApiKey: import.meta.env.REACT_APP_CINETPAY_API_KEY || '143651967568ca9e4b0f0f14.89848998',
  cinetPaySiteId: import.meta.env.REACT_APP_CINETPAY_SITE_ID || '105906547',
  
  appName: import.meta.env.VITE_APP_NAME || 'Bossiz Conciergerie',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  appEnvironment: import.meta.env.VITE_APP_ENVIRONMENT || 'development',
  
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  webBaseUrl: import.meta.env.VITE_WEB_BASE_URL || 'http://localhost:8083',
};

// Configuration de production
const productionConfig: Partial<AppConfig> = {
  appEnvironment: 'production',
  // En production, les variables doivent être définies dans les variables d'environnement
  cinetPayApiKey: import.meta.env.REACT_APP_CINETPAY_API_KEY || '143651967568ca9e4b0f0f14.89848998',
  cinetPaySiteId: import.meta.env.REACT_APP_CINETPAY_SITE_ID || '105906547',
};

// Configuration de développement
const developmentConfig: Partial<AppConfig> = {
  appEnvironment: 'development',
  // En développement, utiliser les clés sandbox
  cinetPayApiKey: '143651967568ca9e4b0f0f14.89848998',
  cinetPaySiteId: '105906547',
};

// Fusion des configurations selon l'environnement
const getConfig = (): AppConfig => {
  const env = defaultConfig.appEnvironment;
  
  let config = { ...defaultConfig };
  
  if (env === 'production') {
    config = { ...config, ...productionConfig };
  } else {
    config = { ...config, ...developmentConfig };
  }
  
  return config;
};

export const appConfig = getConfig();

// Validation de la configuration
export const validateConfig = (): string[] => {
  const errors: string[] = [];
  
  if (!appConfig.supabaseUrl || appConfig.supabaseUrl.includes('your-project-id')) {
    errors.push('Supabase URL non configurée');
  }
  
  if (!appConfig.supabaseAnonKey || appConfig.supabaseAnonKey.includes('your-anon-key')) {
    errors.push('Supabase Anon Key non configurée');
  }
  
  if (!appConfig.cinetPayApiKey || appConfig.cinetPayApiKey.includes('YOUR_API_KEY')) {
    errors.push('CinetPay API Key non configurée');
  }
  
  if (!appConfig.cinetPaySiteId || appConfig.cinetPaySiteId.includes('YOUR_SITE_ID')) {
    errors.push('CinetPay Site ID non configuré');
  }
  
  return errors;
};

// Export des variables spécifiques pour faciliter l'utilisation
export const {
  supabaseUrl,
  supabaseAnonKey,
  cinetPayApiKey,
  cinetPaySiteId,
  appName,
  appVersion,
  appEnvironment,
  apiBaseUrl,
  webBaseUrl,
} = appConfig;
