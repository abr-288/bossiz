-- Migration pour ajouter les tarifications par défaut aux plans existants
-- Résout l'erreur "tarif non disponible"

-- Insertion des tarifications par défaut pour tous les plans actifs (en XOF/FCFA pour le marché africain)
INSERT INTO subscription_pricing (plan_id, billing_cycle, price, currency, discount_percentage, trial_days, setup_fee, created_at, updated_at)
VALUES 
  -- Plans Majestic Club (convertis en XOF: 1 EUR ≈ 655.957 XOF)
  ('majestic_access', 'monthly', 327000.00, 'XOF', 0, 7, 0, NOW(), NOW()),
  ('majestic_access', 'yearly', 3270000.00, 'XOF', 17, 14, 0, NOW(), NOW()),
  
  ('majestic_prive', 'monthly', 655000.00, 'XOF', 0, 14, 0, NOW(), NOW()),
  ('majestic_prive', 'yearly', 6550000.00, 'XOF', 17, 30, 0, NOW(), NOW()),
  
  ('majestic_black', 'monthly', 1310000.00, 'XOF', 0, 30, 0, NOW(), NOW()),
  ('majestic_black', 'yearly', 13100000.00, 'XOF', 17, 60, 0, NOW(), NOW()),
  
  -- Plans Standards (convertis en XOF pour le marché africain)
  ('basic', 'monthly', 51800.00, 'XOF', 0, 0, 0, NOW(), NOW()),
  ('basic', 'yearly', 518000.00, 'XOF', 17, 0, 0, NOW(), NOW()),
  
  ('premium', 'monthly', 97700.00, 'XOF', 0, 0, 0, NOW(), NOW()),
  ('premium', 'yearly', 977000.00, 'XOF', 17, 0, 0, NOW(), NOW()),
  
  ('business', 'monthly', 196000.00, 'XOF', 0, 0, 0, NOW(), NOW()),
  ('business', 'yearly', 1960000.00, 'XOF', 17, 0, 0, NOW(), NOW()),
  
  ('enterprise', 'monthly', 393000.00, 'XOF', 0, 0, 0, NOW(), NOW()),
  ('enterprise', 'yearly', 3930000.00, 'XOF', 17, 0, 0, NOW(), NOW())
ON CONFLICT (plan_id, billing_cycle) 
DO UPDATE SET 
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  discount_percentage = EXCLUDED.discount_percentage,
  trial_days = EXCLUDED.trial_days,
  setup_fee = EXCLUDED.setup_fee,
  updated_at = NOW();

-- Mettre à jour les plans qui n'ont pas de prix dans subscription_plans (en XOF/FCFA)
UPDATE subscription_plans 
SET price = CASE 
  WHEN plan_id = 'majestic_access' THEN '327000'
  WHEN plan_id = 'majestic_prive' THEN '655000'
  WHEN plan_id = 'majestic_black' THEN '1310000'
  WHEN plan_id = 'basic' THEN '51800'
  WHEN plan_id = 'premium' THEN '97700'
  WHEN plan_id = 'business' THEN '196000'
  WHEN plan_id = 'enterprise' THEN '393000'
  ELSE price
END,
updated_at = NOW()
WHERE price IS NULL OR price = '';

-- Activer tous les plans s'ils ne le sont pas déjà
UPDATE subscription_plans 
SET is_active = true,
updated_at = NOW()
WHERE is_active = false;

-- Créer une fonction pour récupérer les tarifications par défaut si elles n'existent pas
CREATE OR REPLACE FUNCTION get_default_pricing(p_plan_id text, p_billing_cycle text)
RETURNS TABLE (
  price numeric,
  currency text,
  discount_percentage integer,
  trial_days integer,
  setup_fee numeric
) AS $$
BEGIN
  -- Essayer de récupérer les tarifications existantes
  RETURN QUERY
  SELECT sp.price, sp.currency, sp.discount_percentage, sp.trial_days, sp.setup_fee
  FROM subscription_pricing sp
  WHERE sp.plan_id = p_plan_id AND sp.billing_cycle = p_billing_cycle;
  
  -- Si aucune tarification n'existe, retourner les valeurs par défaut
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      CASE 
        WHEN p_plan_id = 'majestic_access' THEN 499.00
        WHEN p_plan_id = 'majestic_prive' THEN 999.00
        WHEN p_plan_id = 'majestic_black' THEN 1999.00
        WHEN p_plan_id = 'basic' THEN 79.00
        WHEN p_plan_id = 'premium' THEN 149.00
        WHEN p_plan_id = 'business' THEN 299.00
        WHEN p_plan_id = 'enterprise' THEN 599.00
        ELSE 99.00
      END as price,
      'EUR' as currency,
      CASE 
        WHEN p_billing_cycle = 'yearly' THEN 17
        ELSE 0
      END as discount_percentage,
      CASE 
        WHEN p_plan_id LIKE 'majestic_%' THEN 
          CASE 
            WHEN p_plan_id = 'majestic_access' THEN CASE WHEN p_billing_cycle = 'monthly' THEN 7 ELSE 14 END
            WHEN p_plan_id = 'majestic_prive' THEN CASE WHEN p_billing_cycle = 'monthly' THEN 14 ELSE 30 END
            WHEN p_plan_id = 'majestic_black' THEN CASE WHEN p_billing_cycle = 'monthly' THEN 30 ELSE 60 END
            ELSE 0
          END
        ELSE 0
      END as trial_days,
      0 as setup_fee;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Créer un trigger pour ajouter automatiquement les tarifications par défaut
CREATE OR REPLACE FUNCTION ensure_pricing_exists()
RETURNS TRIGGER AS $$
BEGIN
  -- Insérer les tarifications mensuelles et annuelles par défaut pour les nouveaux plans
  INSERT INTO subscription_pricing (plan_id, billing_cycle, price, currency, discount_percentage, trial_days, setup_fee, created_at, updated_at)
  VALUES 
    (NEW.plan_id, 'monthly', 
      CASE 
        WHEN NEW.plan_id = 'majestic_access' THEN 499.00
        WHEN NEW.plan_id = 'majestic_prive' THEN 999.00
        WHEN NEW.plan_id = 'majestic_black' THEN 1999.00
        WHEN NEW.plan_id = 'basic' THEN 79.00
        WHEN NEW.plan_id = 'premium' THEN 149.00
        WHEN NEW.plan_id = 'business' THEN 299.00
        WHEN NEW.plan_id = 'enterprise' THEN 599.00
        ELSE 99.00
      END,
      'EUR', 0, 
      CASE 
        WHEN NEW.plan_id LIKE 'majestic_%' THEN 
          CASE 
            WHEN NEW.plan_id = 'majestic_access' THEN 7
            WHEN NEW.plan_id = 'majestic_prive' THEN 14
            WHEN NEW.plan_id = 'majestic_black' THEN 30
            ELSE 0
          END
        ELSE 0
      END,
      0, NOW(), NOW()),
    
    (NEW.plan_id, 'yearly', 
      CASE 
        WHEN NEW.plan_id = 'majestic_access' THEN 4990.00
        WHEN NEW.plan_id = 'majestic_prive' THEN 9990.00
        WHEN NEW.plan_id = 'majestic_black' THEN 19990.00
        WHEN NEW.plan_id = 'basic' THEN 790.00
        WHEN NEW.plan_id = 'premium' THEN 1490.00
        WHEN NEW.plan_id = 'business' THEN 2990.00
        WHEN NEW.plan_id = 'enterprise' THEN 5990.00
        ELSE 990.00
      END,
      'EUR', 17, 
      CASE 
        WHEN NEW.plan_id LIKE 'majestic_%' THEN 
          CASE 
            WHEN NEW.plan_id = 'majestic_access' THEN 14
            WHEN NEW.plan_id = 'majestic_prive' THEN 30
            WHEN NEW.plan_id = 'majestic_black' THEN 60
            ELSE 0
          END
        ELSE 0
      END,
      0, NOW(), NOW())
  ON CONFLICT (plan_id, billing_cycle) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS ensure_pricing_trigger ON subscription_plans;
CREATE TRIGGER ensure_pricing_trigger
AFTER INSERT ON subscription_plans
FOR EACH ROW
EXECUTE FUNCTION ensure_pricing_exists();

-- Mettre à jour la page de debug pour afficher les tarifications manquantes
COMMENT ON TABLE subscription_pricing IS 'Tarifications pour les plans d abonnement avec cycles mensuels/annuels';
COMMENT ON FUNCTION get_default_pricing IS 'Fonction pour récupérer les tarifications par défaut si elles n existent pas';
COMMENT ON FUNCTION ensure_pricing_exists IS 'Trigger pour ajouter automatiquement les tarifications par défaut aux nouveaux plans';
