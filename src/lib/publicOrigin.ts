import { Capacitor } from "@capacitor/core";
import { SITE_URL } from "@/config/seo";

// Adresse du site pour les liens envoyés ou partagés (e-mails, QR codes,
// parrainage). Dans l'app Android / iOS, la page tourne sur https://localhost :
// ces liens doivent pointer vers le site public.
export const publicOrigin = () => (Capacitor.isNativePlatform() ? SITE_URL : window.location.origin);
