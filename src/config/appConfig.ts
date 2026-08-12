// Configuration centralisée de l'application
// Utilisé pour gérer toutes les variables d'environnement et clés API

export interface AppConfig {
  // Supabase
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseProjectId: string;

  // Application
  appName: string;
  appVersion: string;
  appEnvironment: string;
  
  // URLs
  apiBaseUrl: string;
  webBaseUrl: string;
}

const normalizeEnvValue = (value: string | undefined): string => {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  return trimmed;
};

export const resolveEnvValue = (viteKey: string, legacyKey?: string): string => {
  const viteValue = normalizeEnvValue(import.meta.env[viteKey]);
  if (viteValue) {
    return viteValue;
  }

  if (legacyKey) {
    const legacyValue = normalizeEnvValue(import.meta.env[legacyKey]);
    if (legacyValue) {
      return legacyValue;
    }
  }

  return '';
};

// Configuration par défaut (développement)
const defaultConfig: AppConfig = {
  supabaseUrl: resolveEnvValue('VITE_SUPABASE_URL', 'REACT_APP_SUPABASE_URL') || 'https://your-project-id.supabase.co',
  supabaseAnonKey: resolveEnvValue('VITE_SUPABASE_PUBLISHABLE_KEY', 'REACT_APP_SUPABASE_PUBLISHABLE_KEY') || 'your-anon-key',
  supabaseProjectId: resolveEnvValue('VITE_SUPABASE_PROJECT_ID', 'REACT_APP_SUPABASE_PROJECT_ID') || 'your-project-id',

  appName: resolveEnvValue('VITE_APP_NAME') || 'Bossiz Conciergerie',
  appVersion: resolveEnvValue('VITE_APP_VERSION') || '1.0.0',
  appEnvironment: resolveEnvValue('VITE_APP_ENVIRONMENT') || 'development',
  
  apiBaseUrl: resolveEnvValue('VITE_API_BASE_URL') || 'http://localhost:8080/api',
  webBaseUrl: resolveEnvValue('VITE_WEB_BASE_URL') || 'http://localhost:8083',
};

// Configuration de production
const productionConfig: Partial<AppConfig> = {
  appEnvironment: 'production',
  // En production, les variables doivent être définies dans les variables d'environnement
};

// Configuration de développement
const developmentConfig: Partial<AppConfig> = {
  appEnvironment: 'development',
  // En développement, utiliser les clés sandbox
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

  return errors;
};

// Export des variables spécifiques pour faciliter l'utilisation
export const {
  supabaseUrl,
  supabaseAnonKey,
  appName,
  appVersion,
  appEnvironment,
  apiBaseUrl,
  webBaseUrl,
} = appConfig;
