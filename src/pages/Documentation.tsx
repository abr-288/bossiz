import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  Book, 
  Users, 
  Crown, 
  Shield, 
  Lock, 
  Settings, 
  CreditCard, 
  Home, 
  Phone, 
  Mail, 
  Calendar,
  FileText,
  BarChart3,
  Database,
  Key,
  UserCheck,
  Building2,
  Plane,
  Star,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowRight,
  Menu,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
  LogIn,
  LogOut,
  UserPlus,
  UserMinus,
  MessageSquare,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Globe,
  MapPin,
  Clock,
  TrendingUp,
  Award,
  Gift,
  Zap,
  Heart,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Maximize,
  Minimize,
  Monitor,
  Smartphone,
  Tablet,
  Code,
  Terminal,
  Package,
  Layers,
  GitBranch,
  Rocket,
  Target,
  Compass,
  Navigation,
  Map,
  Bookmark,
  Share2,
  Copy,
  ExternalLink,
  Video,
  Mic,
  Camera,
  Image,
  Film,
  Music,
  Headphones,
  Wifi,
  Battery,
  Signal,
  Cloud,
  CloudRain,
  Sun,
  Moon,
  ZapOff,
  Activity,
  Brain,
  Cpu,
  HardDrive,
  Server,
  Router,
  ShieldCheck,
  LockOpen,
  KeyRound,
  Fingerprint,
  User,
  Users2,
  UserCircle,
  UserX,
  MailCheck,
  MailOpen,
  MailWarning,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  CalendarCheck,
  CalendarPlus,
  CalendarMinus,
  CalendarX,
  Timer,
  TimerReset,
  AlarmClock,
  AlarmClockCheck,
  AlarmClockOff,
  Bell,
  BellRing,
  BellOff,
  BellDot,
  BellMinus,
  BellPlus,
  Volume,
  VolumeX,
  VolumeOff,
  Radio,
  RadioReceiver,
  Tv,
  Tv2,
  Laptop,
  Laptop2,
  SmartphoneNfc,
  TabletSmartphone,
  Watch,
  Speaker,
  MicOff,
  VideoOff,
  CameraOff,
  ImagePlus,
  ImageMinus,
  Music2,
  Music3,
  Music4,
  PlayCircle,
  PauseCircle,
  Repeat,
  Repeat1,
  Repeat2,
  Shuffle,
  FastForward,
  Rewind,
  Square,
  SquarePlus,
  SquareMinus,
  SquareX,
  SquareCheck,
  SquareDot,
  SquareDashed,
  SquareEqual,
  SquarePower,
  SquareScissors,
  SquareTerminal,
  SquareUser,
  SquareUserRound,
  SquareVariable,
  Triangle,
  TriangleDashed,
  TriangleSquare,
  Diamond,
  DiamondDashed,
  DiamondSquare,
  Hexagon,
  Octagon,
  Pentagon
} from "lucide-react";

const Documentation = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [currentDemoStep, setCurrentDemoStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section) 
        : [...prev, section]
    );
  };

  const startDemo = (feature: string) => {
    setSelectedFeature(feature);
    setDemoMode(true);
    setCurrentDemoStep(0);
    setDemoProgress(0);
    setIsPlaying(true);
  };

  const stopDemo = () => {
    setDemoMode(false);
    setCurrentDemoStep(0);
    setDemoProgress(0);
    setIsPlaying(false);
    setSelectedFeature(null);
  };

  const nextDemoStep = () => {
    if (selectedFeature) {
      const steps = getDemoSteps(selectedFeature);
      if (currentDemoStep < steps.length - 1) {
        setCurrentDemoStep(currentDemoStep + 1);
        setDemoProgress(((currentDemoStep + 1) / steps.length) * 100);
      }
    }
  };

  const prevDemoStep = () => {
    if (currentDemoStep > 0) {
      setCurrentDemoStep(currentDemoStep - 1);
      setDemoProgress(((currentDemoStep - 1) / getDemoSteps(selectedFeature || '').length) * 100);
    }
  };

  const getDemoSteps = (feature: string) => {
    const steps: Record<string, string[]> = {
      'dashboard': [
        'Connexion et authentification',
        'Navigation dans le tableau de bord',
        'Consultation des statistiques',
        'Gestion des réservations',
        'Personnalisation du profil'
      ],
      'majestic': [
        'Accès espace VIP',
        'Modules premium exclusifs',
        'Service conciergerie 24/7',
        'Chat privé et assistance',
        'Gestion séjours exclusifs'
      ],
      'subscription': [
        'Découverte des plans',
        'Comparaison des tarifs',
        'Processus de souscription',
        'Paiement sécurisé',
        'Confirmation et activation'
      ],
      'admin': [
        'Accès panneau admin',
        'Gestion des utilisateurs',
        'Configuration système',
        'Rapports et analytics',
        'Maintenance et support'
      ],
      'booking': [
        'Recherche de destinations',
        'Sélection des dates et options',
        'Configuration des détails du voyage',
        'Validation avec CinetPay',
        'Confirmation de réservation'
      ],
      'profile': [
        'Accès au profil utilisateur',
        'Mise à jour des informations',
        'Configuration des préférences',
        'Gestion des méthodes de paiement',
        'Historique des activités'
      ],
      'support': [
        'Accès au centre d\'aide',
        'Navigation dans la FAQ',
        'Contact avec le support',
        'Suivi des tickets',
        'Accès aux ressources'
      ],
      'mobile': [
        'Interface responsive mobile',
        'Navigation tactile optimisée',
        'Fonctionnalités mobiles',
        'Notifications push',
        'Expérience utilisateur mobile'
      ]
    };
    return steps[feature] || [];
  };

  const getFeatureIcon = (feature: string) => {
    const icons: Record<string, React.ReactNode> = {
      'dashboard': <BarChart3 className="w-6 h-6" />,
      'majestic': <Crown className="w-6 h-6" />,
      'subscription': <CreditCard className="w-6 h-6" />,
      'admin': <Settings className="w-6 h-6" />,
      'booking': <Calendar className="w-6 h-6" />,
      'profile': <User className="w-6 h-6" />,
      'support': <HelpCircle className="w-6 h-6" />,
      'mobile': <Smartphone className="w-6 h-6" />
    };
    return icons[feature] || <Book className="w-6 h-6" />;
  };

  const getFeatureTitle = (feature: string) => {
    const titles: Record<string, string> = {
      'dashboard': 'Tableau de Bord',
      'majestic': 'Majestic Club',
      'subscription': 'Abonnements',
      'admin': 'Administration',
      'booking': 'Réservations',
      'profile': 'Profil',
      'support': 'Support',
      'mobile': 'Mobile'
    };
    return titles[feature] || feature;
  };

  const getFeatureRoute = (feature: string) => {
    const routes: Record<string, string> = {
      'dashboard': '/dashboard',
      'majestic': '/majestic-dashboard',
      'subscription': '/subscriptions',
      'admin': '/admin',
      'booking': '/booking',
      'profile': '/profile',
      'support': '/support',
      'mobile': '/mobile'
    };
    return routes[feature] || '/';
  };

  const getLivePreview = (feature: string, step: number) => {
    const previews: Record<string, React.ReactNode[]> = {
      'dashboard': [
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold">Connexion réussie</h4>
              <p className="text-sm text-gray-600">Bienvenue sur votre espace</p>
            </div>
          </div>
        </div>,
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex gap-2 mb-4">
            <Button variant="ghost" size="sm"><BarChart3 className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm"><Users className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm"><Calendar className="w-4 h-4" /></Button>
          </div>
          <p className="text-sm text-gray-600">Navigation intuitive entre les sections</p>
        </div>,
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">156</div>
              <div className="text-sm text-gray-600">Réservations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">€12,450</div>
              <div className="text-sm text-gray-600">Revenus</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">4.8</div>
              <div className="text-sm text-gray-600">Note</div>
            </div>
          </div>
        </div>,
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm">Réservation #1234</span>
              <Badge variant="secondary">En cours</Badge>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm">Réservation #1235</span>
              <Badge variant="outline">Confirmée</Badge>
            </div>
          </div>
        </div>,
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-gray-600" />
              <div>
                <h4 className="font-semibold">Jean Dupont</h4>
                <p className="text-sm text-gray-600">jean.dupont@email.com</p>
              </div>
            </div>
          </div>
        </div>
      ],
      'booking': [
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Rechercher une destination..." 
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 border rounded-lg text-center">
                <Plane className="w-6 h-6 mx-auto mb-1 text-blue-600" />
                <div className="text-sm font-medium">Paris</div>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <Plane className="w-6 h-6 mx-auto mb-1 text-blue-600" />
                <div className="text-sm font-medium">Londres</div>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <Plane className="w-6 h-6 mx-auto mb-1 text-blue-600" />
                <div className="text-sm font-medium">New York</div>
              </div>
            </div>
          </div>
        </div>,
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date de départ</label>
              <input type="date" className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date de retour</label>
              <input type="date" className="w-full p-2 border rounded" />
            </div>
          </div>
        </div>,
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-600" />
              <span className="text-sm">2 voyageurs</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-600" />
              <span className="text-sm">7 nuits</span>
            </div>
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-gray-600" />
              <span className="text-sm">Premium</span>
            </div>
          </div>
        </div>,
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="text-center mb-4">
            <CreditCard className="w-12 h-12 mx-auto mb-2 text-blue-600" />
            <h4 className="font-semibold">Paiement CinetPay</h4>
          </div>
          <div className="space-y-2">
            <input type="text" placeholder="Numéro de carte" className="w-full p-2 border rounded" />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="MM/AA" className="p-2 border rounded" />
              <input type="text" placeholder="CVV" className="p-2 border rounded" />
            </div>
          </div>
        </div>,
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
            <h4 className="font-semibold text-green-600">Réservation confirmée!</h4>
            <p className="text-sm text-gray-600">Votre voyage a été réservé avec succès</p>
          </div>
        </div>
      ],
      'profile': [
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-600" />
            </div>
            <div>
              <h4 className="font-semibold">Mon Profil</h4>
              <p className="text-sm text-gray-600">Gérez vos informations personnelles</p>
            </div>
          </div>
        </div>,
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom complet</label>
              <input type="text" defaultValue="Jean Dupont" className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" defaultValue="jean.dupont@email.com" className="w-full p-2 border rounded" />
            </div>
          </div>
        </div>,
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Notifications email</span>
              <Button variant="outline" size="sm">Activer</Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Newsletter</span>
              <Button variant="outline" size="sm">Désactiver</Button>
            </div>
          </div>
        </div>,
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 border rounded">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span className="text-sm">••••• 4242</span>
            </div>
            <Button variant="outline" className="w-full">Ajouter une méthode</Button>
          </div>
        </div>,
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm">Connexion le 15/04/2026</span>
              <Badge variant="secondary">Récent</Badge>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm">Réservation #1234</span>
              <Badge variant="outline">Confirmée</Badge>
            </div>
          </div>
        </div>
      ],
      'support': [
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="text-center">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <h4 className="font-semibold">Centre d'Aide</h4>
            <p className="text-sm text-gray-600">Trouvez des réponses à vos questions</p>
          </div>
        </div>,
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="space-y-3">
            <div className="p-3 border rounded-lg">
              <h5 className="font-medium mb-1">Comment réserver?</h5>
              <p className="text-sm text-gray-600">Guide complet de réservation...</p>
            </div>
            <div className="p-3 border rounded-lg">
              <h5 className="font-medium mb-1">Modes de paiement</h5>
              <p className="text-sm text-gray-600">CinetPay, carte bancaire...</p>
            </div>
          </div>
        </div>,
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="space-y-4">
            <textarea 
              placeholder="Décrivez votre problème..." 
              className="w-full p-3 border rounded-lg h-24"
            />
            <Button className="w-full">Envoyer la demande</Button>
          </div>
        </div>,
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm">Ticket #001</span>
              <Badge variant="secondary">En cours</Badge>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm">Ticket #002</span>
              <Badge variant="outline">Résolu</Badge>
            </div>
          </div>
        </div>,
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg text-center">
              <Book className="w-6 h-6 mx-auto mb-1 text-blue-600" />
              <div className="text-sm">Documentation</div>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <Video className="w-6 h-6 mx-auto mb-1 text-blue-600" />
              <div className="text-sm">Tutoriels</div>
            </div>
          </div>
        </div>
      ],
      'mobile': [
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="text-center">
            <Smartphone className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <h4 className="font-semibold">Application Mobile</h4>
            <p className="text-sm text-gray-600">Interface optimisée mobile</p>
          </div>
        </div>,
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="grid grid-cols-4 gap-2">
            <Button variant="ghost" size="sm"><Home className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm"><Search className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm"><Calendar className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm"><User className="w-4 h-4" /></Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">Navigation tactile intuitive</p>
        </div>,
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <span className="text-sm">Nouvelle réservation confirmée</span>
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm">Paiement réussi</span>
              </div>
            </div>
          </div>
        </div>,
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Fingerprint className="w-8 h-8 text-gray-600" />
            </div>
            <h4 className="font-semibold">Authentification biométrique</h4>
            <p className="text-sm text-gray-600">Connexion sécurisée rapide</p>
          </div>
        </div>,
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-green-600" />
                <span className="text-sm">Connecté</span>
              </div>
              <Badge variant="secondary">4G</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Battery className="w-5 h-5 text-green-600" />
                <span className="text-sm">85%</span>
              </div>
            </div>
          </div>
        </div>
      ]
    };
    
    if (previews[feature] && previews[feature][step]) {
      return previews[feature][step];
    }
    
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Play className="w-8 h-8 text-gray-600" />
          </div>
          <h4 className="font-semibold">Aperçu en direct</h4>
          <p className="text-sm text-gray-600">Découvrez cette fonctionnalité</p>
        </div>
      </div>
    );
  };

  const getStepDescription = (feature: string, step: number) => {
    const descriptions: Record<string, string[]> = {
      'dashboard': [
        "Connectez-vous avec votre email et mot de passe pour accéder à votre espace personnel sécurisé.",
        "Utilisez le menu latéral intuitif pour naviguer entre les différentes sections de votre tableau de bord.",
        "Consultez vos statistiques de réservations, vos revenus et vos activités récentes en temps réel.",
        "Gérez facilement vos réservations en cours et passez de nouvelles commandes en quelques clics.",
        "Personnalisez votre profil, configurez vos préférences et gérez vos paramètres de compte."
      ],
      'booking': [
        "Recherchez parmi des centaines de destinations disponibles avec notre moteur de recherche avancé.",
        "Sélectionnez vos dates de voyage, le nombre de voyageurs et vos préférences de vol.",
        "Personnalisez votre voyage avec des options supplémentaires et des services premium.",
        "Payez en toute sécurité avec CinetPay ou votre carte bancaire préférée.",
        "Recevez une confirmation instantanée avec tous les détails de votre réservation."
      ],
      'profile': [
        "Accédez à votre profil personnel pour gérer toutes vos informations en un seul endroit.",
        "Mettez à jour vos coordonnées, informations de paiement et préférences de voyage.",
        "Configurez vos notifications, alertes et paramètres de confidentialité selon vos besoins.",
        "Ajoutez, modifiez ou supprimez vos méthodes de paiement en toute sécurité.",
        "Consultez l'historique complet de vos activités, réservations et transactions."
      ],
      'support': [
        "Accédez à notre centre d'aide complet avec des guides et tutoriels détaillés.",
        "Parcourez notre FAQ organisée par catégories pour trouver rapidement des réponses.",
        "Contactez notre support technique 24/7 par chat, email ou téléphone.",
        "Suivez l'état de vos demandes d'assistance en temps réel.",
        "Accédez à une riche bibliothèque de ressources vidéo et documentation."
      ],
      'mobile': [
        "Profitez d'une interface parfaitement adaptée aux écrans mobiles et tablettes.",
        "Naviguez facilement avec des gestes intuitifs et une optimisation tactile.",
        "Accédez à toutes les fonctionnalités de la plateforme où que vous soyez.",
        "Recevez des notifications push pour rester informé des importantes mises à jour.",
        "Vivez une expérience utilisateur fluide et rapide sur tous vos appareils mobiles."
      ]
    };
    
    return descriptions[feature]?.[step] || "Découvrez cette fonctionnalité passionnante.";
  };

  useEffect(() => {
    if (selectedFeature) {
      const steps = getDemoSteps(selectedFeature);
      setDemoProgress((currentDemoStep / steps.length) * 100);
    }
  }, [currentDemoStep, selectedFeature]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Rocket className="w-16 h-16 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
              Master Traversee Connect
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Explorez notre plateforme à travers une démo interactive immersive
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <Clock className="w-5 h-5" />
                <span>15-20 min</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <Target className="w-5 h-5" />
                <span>40+ étapes</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <Award className="w-5 h-5" />
                <span>Certification</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Book className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Centre de Formation</h2>
                <p className="text-sm text-gray-500">Apprentissage interactif</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate('/')} className="flex items-center gap-2 hover:bg-gray-50">
                <Home className="w-4 h-4" />
                Accueil
              </Button>
              <Button onClick={() => navigate('/admin')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                <Settings className="w-4 h-4" />
                Admin
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Interactive Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Start Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Tour Rapide</h3>
              <p className="text-blue-100 mb-4">Découvrez les fonctionnalités essentielles en 5 minutes</p>
              <Button 
                size="sm" 
                variant="secondary" 
                className="bg-white text-blue-600 hover:bg-blue-50"
                onClick={() => startDemo('dashboard')}
              >
                Commencer
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Tour Complet</h3>
              <p className="text-purple-100 mb-4">Explorez toutes les fonctionnalités en détail</p>
              <Button 
                size="sm" 
                variant="secondary" 
                className="bg-white text-purple-600 hover:bg-purple-50"
                onClick={() => startDemo('complete-tour')}
              >
                Lancer le Tour
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Module Libre</h3>
              <p className="text-green-100 mb-4">Choisissez votre module d'apprentissage</p>
              <Button 
                size="sm" 
                variant="secondary" 
                className="bg-white text-green-600 hover:bg-green-50"
                onClick={() => document.getElementById('module-selection')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explorer
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Module Selection Section */}
        <div id="module-selection" className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Modules d'Apprentissage</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choisissez un module spécifique pour explorer en détail ou lancez le tour complet pour une expérience complète
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { id: 'dashboard', title: 'Tableau de Bord', icon: BarChart3, color: 'blue', description: 'Gestion principale' },
              { id: 'booking', title: 'Réservations', icon: Calendar, color: 'purple', description: 'Voyages et séjours' },
              { id: 'majestic', title: 'Majestic Club', icon: Crown, color: 'yellow', description: 'Services VIP' },
              { id: 'subscription', title: 'Abonnements', icon: CreditCard, color: 'green', description: 'Plans tarifaires' },
              { id: 'profile', title: 'Profil', icon: User, color: 'indigo', description: 'Gestion personnelle' },
              { id: 'support', title: 'Support', icon: HelpCircle, color: 'orange', description: 'Aide et assistance' },
              { id: 'admin', title: 'Administration', icon: Settings, color: 'red', description: 'Configuration' },
              { id: 'mobile', title: 'Mobile', icon: Smartphone, color: 'pink', description: 'Application mobile' }
            ].map((module) => (
              <Dialog key={module.id}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="h-32 flex flex-col gap-3 hover:scale-105 transition-all duration-300 border-2 hover:border-blue-400 bg-white hover:bg-blue-50 group"
                    onClick={() => setSelectedFeature(module.id)}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300 transition-colors">
                      <module.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-semibold text-gray-900">{module.title}</span>
                      <p className="text-xs text-gray-500 mt-1">{module.description}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                      {getDemoSteps(module.id).length} étapes
                    </Badge>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                      {getFeatureIcon(module.id)}
                      {getFeatureTitle(module.id)} - Démo Interactive
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Étape {currentDemoStep + 1} sur {getDemoSteps(module.id).length}</span>
                        <span>{Math.round(demoProgress)}%</span>
                      </div>
                      <Progress value={demoProgress} className="w-full h-3" />
                    </div>

                    {/* Demo Content */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 min-h-[400px]">
                      <div className="text-center">
                        <div className="mb-6">
                          {getFeatureIcon(module.id)}
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-gray-800">
                          {getDemoSteps(module.id)[currentDemoStep] || 'Démo terminée'}
                        </h3>
                        <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                          {getStepDescription(module.id, currentDemoStep)}
                        </p>
                        
                        {/* Live Preview */}
                        <div className="mb-6">
                          {getLivePreview(module.id, currentDemoStep)}
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={prevDemoStep}
                          disabled={currentDemoStep === 0}
                        >
                          <SkipBack className="w-4 h-4 mr-1" />
                          Précédent
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsPlaying(!isPlaying)}
                        >
                          {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                          {isPlaying ? 'Pause' : 'Play'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={nextDemoStep}
                          disabled={currentDemoStep >= getDemoSteps(module.id).length - 1}
                        >
                          Suivant
                          <SkipForward className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowPreview(!showPreview)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {showPreview ? 'Masquer' : 'Voir'} aperçu
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => navigate(getFeatureRoute(module.id))}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Accéder
                        </Button>
                      </div>
                    </div>

                    {/* Complete Tour Button */}
                    {module.id !== 'complete-tour' && (
                      <div className="text-center mt-6">
                        <Button 
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          onClick={() => startDemo('complete-tour')}
                        >
                          <Rocket className="w-4 h-4 mr-2" />
                          Lancer le Tour Complet
                        </Button>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>

        {/* Complete Site Tour Section */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Globe className="w-10 h-10 text-indigo-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Tour Complet du Site</h2>
              <p className="text-gray-600 max-w-2xl mx-auto mb-6">
                Maîtrisez l'ensemble de la plateforme Traversee Connect à travers une expérience d'apprentissage complète et structurée
              </p>
              
              <div className="flex flex-wrap justify-center gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600 mb-1">8</div>
                  <div className="text-sm text-gray-600">Modules</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">40+</div>
                  <div className="text-sm text-gray-600">Étapes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-pink-600 mb-1">15-20</div>
                  <div className="text-sm text-gray-600">Minutes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">100%</div>
                  <div className="text-sm text-gray-600">Pratique</div>
                </div>
              </div>

              <Button 
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                onClick={() => startDemo('complete-tour')}
              >
                <Rocket className="w-5 h-5 mr-2" />
                Commencer le Tour Complet
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { icon: BarChart3, title: 'Tableau de Bord', description: 'Gestion principale et statistiques' },
                { icon: Calendar, title: 'Réservations', description: 'Booking et voyages' },
                { icon: Crown, title: 'Majestic Club', description: 'Services VIP premium' },
                { icon: CreditCard, title: 'Abonnements', description: 'Plans et paiement' },
                { icon: User, title: 'Profil', description: 'Gestion personnelle' },
                { icon: HelpCircle, title: 'Support', description: 'Aide et assistance' },
                { icon: Settings, title: 'Administration', description: 'Configuration système' },
                { icon: Smartphone, title: 'Mobile', description: 'Application mobile' }
              ].map((item, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">{item.title}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Bénéfices du Tour Complet</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: CheckCircle, title: 'Maîtrise Complète', description: 'Découvrez toutes les fonctionnalités en profondeur' },
                  { icon: Award, title: 'Certification', description: 'Obtenez une certification de maîtrise' },
                  { icon: TrendingUp, title: 'Productivité', description: 'Optimisez votre utilisation de la plateforme' },
                  { icon: Users, title: 'Confiance', description: 'Gagnez en autonomie et confiance' }
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <benefit.icon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{benefit.title}</h4>
                      <p className="text-sm text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documentation Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="features">Fonctionnalités</TabsTrigger>
            <TabsTrigger value="guides">Guides</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="prose max-w-none">
              <h2>Vue d'ensemble de Traversee Connect</h2>
              <p>
                Traversee Connect est une plateforme complète de gestion de voyages et de réservations,
                conçue pour offrir une expérience utilisateur exceptionnelle à la fois aux voyageurs
                et aux professionnels du tourisme.
              </p>
              
              <h3>Points clés</h3>
              <ul>
                <li>Interface moderne et intuitive</li>
                <li>Gestion complète des réservations</li>
                <li>Système d'abonnements flexible</li>
                <li>Services VIP Majestic Club</li>
                <li>Support client 24/7</li>
                <li>Application mobile native</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="features" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: <Calendar className="w-8 h-8 text-blue-600" />,
                  title: "Réservations Intelligentes",
                  description: "Système de réservation avancé avec gestion des disponibilités en temps réel"
                },
                {
                  icon: <Crown className="w-8 h-8 text-yellow-600" />,
                  title: "Majestic Club",
                  description: "Services exclusifs VIP avec conciergerie personnelle et avantages premium"
                },
                {
                  icon: <CreditCard className="w-8 h-8 text-green-600" />,
                  title: "Paiements Sécurisés",
                  description: "Intégration CinetPay et multiples méthodes de paiement sécurisées"
                },
                {
                  icon: <BarChart3 className="w-8 h-8 text-purple-600" />,
                  title: "Tableau de Bord",
                  description: "Analytics détaillées et statistiques en temps réel pour votre activité"
                },
                {
                  icon: <Smartphone className="w-8 h-8 text-pink-600" />,
                  title: "Application Mobile",
                  description: "Expérience mobile native avec notifications et hors-ligne"
                },
                {
                  icon: <HelpCircle className="w-8 h-8 text-orange-600" />,
                  title: "Support 24/7",
                  description: "Assistance client disponible en permanence via multiples canaux"
                }
              ].map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4">{feature.icon}</div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="guides" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "Guide de démarrage rapide",
                  description: "Configurez votre compte en 5 étapes simples",
                  icon: <Rocket className="w-6 h-6" />,
                  level: "Débutant"
                },
                {
                  title: "Guide Majestic Club",
                  description: "Maîtrisez tous les services VIP exclusifs",
                  icon: <Crown className="w-6 h-6" />,
                  level: "Avancé"
                },
                {
                  title: "Guide des paiements",
                  description: "Tout sur CinetPay et les méthodes de paiement",
                  icon: <CreditCard className="w-6 h-6" />,
                  level: "Intermédiaire"
                },
                {
                  title: "Guide mobile",
                  description: "Exploitez tout le potentiel de l'application mobile",
                  icon: <Smartphone className="w-6 h-6" />,
                  level: "Intermédiaire"
                }
              ].map((guide, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {guide.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">{guide.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">{guide.description}</p>
                        <Badge variant="secondary">{guide.level}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="faq" className="mt-6">
            <div className="space-y-4">
              {[
                {
                  question: "Comment fonctionne le système de réservation ?",
                  answer: "Notre système de réservation utilise un algorithme avancé pour vérifier les disponibilités en temps réel et proposer les meilleures options selon vos critères."
                },
                {
                  question: "Qu'est-ce que le Majestic Club ?",
                  answer: "Le Majestic Club est notre programme VIP qui offre des avantages exclusifs comme la conciergerie personnelle, des réductions spéciales et un accès prioritaire au support."
                },
                {
                  question: "Quelles méthodes de paiement sont acceptées ?",
                  answer: "Nous acceptons CinetPay, les cartes bancaires Visa/Mastercard, les portefeuilles mobiles et les virements bancaires selon votre pays."
                },
                {
                  question: "Comment puis-je annuler ma réservation ?",
                  answer: "Vous pouvez annuler votre réservation depuis votre tableau de bord jusqu'à 24h avant la date de départ. Les conditions d'annulation varient selon le type de tarif."
                },
                {
                  question: "L'application mobile est-elle disponible ?",
                  answer: "Oui, notre application mobile est disponible sur iOS et Android, offrant toutes les fonctionnalités de la plateforme avec une expérience optimisée mobile."
                }
              ].map((faq, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                        <p className="text-gray-600">{faq.answer}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Documentation;
