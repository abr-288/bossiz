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
import heroImage from "@/assets/destination-safari.jpg";
import { useTranslation } from "react-i18next";

const Documentation = () => {
  const { t } = useTranslation();
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
        t("ux.bo.loginAuthentication"),
        t("ux.bo.navigatingDashboard"),
        t("ux.bo.viewingStatistics"),
        t("ux.bo.managingBookings"),
        t("ux.bo.profileCustomization")
      ],
      'subscription': [
        t("ux.bo.discoveringPlans"),
        t("ux.bo.comparingPrices"),
        t("ux.bo.subscriptionProcess"),
        t("ux.bo.securePayment"),
        t("ux.bo.confirmationActivation")
      ],
      'admin': [
        t("ux.bo.accessingAdminPanel"),
        t("ux.bo.userManagement"),
        t("ux.bo.systemConfiguration"),
        t("ux.bo.reportsAnalytics"),
        t("ux.bo.maintenanceSupport")
      ],
      'booking': [
        t("ux.bo.searchingDestinations"),
        t("ux.bo.choosingDatesOptions"),
        t("ux.bo.settingUpTripDetails"),
        t("ux.bo.confirmingJKo"),
        t("ux.bo.bookingConfirmation")
      ],
      'profile': [
        t("ux.bo.accessingUserProfile"),
        t("ux.bo.updatingInformation"),
        t("ux.bo.settingPreferences"),
        t("ux.bo.managingPaymentMethods"),
        t("ux.bo.activityHistory")
      ],
      'support': [
        t("ux.bo.accessHelpCenter"),
        t("ux.bo.browsingFaq"),
        t("ux.bo.contactingSupport"),
        t("ux.bo.trackingTickets"),
        t("ux.bo.accessingResources")
      ],
      'mobile': [
        t("ux.bo.responsiveMobile"),
        t("ux.bo.optimizedTouchNavigation"),
        t("ux.bo.mobileFeatures"),
        t("ux.bo.pushNotifications"),
        t("ux.bo.mobileUserExperience")
      ]
    };
    return steps[feature] || [];
  };

  const getFeatureIcon = (feature: string) => {
    const icons: Record<string, React.ReactNode> = {
      'dashboard': <BarChart3 className="w-6 h-6" />,
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
      'dashboard': t("ux.bo.dashboard"),
      'subscription': t("ux.bo.subscriptions"),
      'admin': t("ux.bo.administration"),
      'booking': t("ux.bo.bookings"),
      'profile': t("ux.bo.profile"),
      'support': t("ux.bo.support"),
      'mobile': t("ux.bo.mobile")
    };
    return titles[feature] || feature;
  };

  const getFeatureRoute = (feature: string) => {
    const routes: Record<string, string> = {
      'dashboard': '/dashboard',
      'subscription': '/',
      'admin': '/admin',
      'booking': '/booking-history',
      'profile': '/account',
      'support': '/support',
      'mobile': '/install'
    };
    return routes[feature] || '/';
  };

  const getLivePreview = (feature: string, step: number) => {
    const previews: Record<string, React.ReactNode[]> = {
      'dashboard': [
        <div className="bg-card p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-info/10 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-info" />
            </div>
            <div>
              <h4 className="font-semibold">{t("ux.bo.logged")}</h4>
              <p className="text-sm text-muted-foreground">{t("ux.bo.welcomeSpace")}</p>
            </div>
          </div>
        </div>,
        <div className="bg-card p-6 rounded-lg shadow-lg">
          <div className="flex gap-2 mb-4">
            <Button variant="ghost" size="sm"><BarChart3 className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm"><Users className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm"><Calendar className="w-4 h-4" /></Button>
          </div>
          <p className="text-sm text-muted-foreground">{t("ux.bo.intuitiveNavigationBetweenSections")}</p>
        </div>,
        <div className="bg-card p-6 rounded-lg shadow-lg">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-info">156</div>
              <div className="text-sm text-muted-foreground">{t("ux.bo.bookings")}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">€12,450</div>
              <div className="text-sm text-muted-foreground">{t("ux.bo.revenue")}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">4.8</div>
              <div className="text-sm text-muted-foreground">Note</div>
            </div>
          </div>
        </div>,
        <div className="bg-card p-6 rounded-lg shadow-lg">
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-muted rounded">
              <span className="text-sm">{t("ux.bo.booking1234")}</span>
              <Badge variant="secondary">{t("ux.bo.progress")}</Badge>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted rounded">
              <span className="text-sm">{t("ux.bo.booking1235")}</span>
              <Badge variant="outline">{t("ux.bo.confirmed")}</Badge>
            </div>
          </div>
        </div>,
        <div className="bg-card p-6 rounded-lg shadow-lg">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-muted-foreground" />
              <div>
                <h4 className="font-semibold">Jean Dupont</h4>
                <p className="text-sm text-muted-foreground">jean.dupont@email.com</p>
              </div>
            </div>
          </div>
        </div>
      ],
      'booking': [
        <div className="bg-card p-6 rounded-lg shadow-lg">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder={t("ux.bo.searchDestination")} 
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 border rounded-lg text-center">
                <Plane className="w-6 h-6 mx-auto mb-1 text-info" />
                <div className="text-sm font-medium">Paris</div>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <Plane className="w-6 h-6 mx-auto mb-1 text-info" />
                <div className="text-sm font-medium">Londres</div>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <Plane className="w-6 h-6 mx-auto mb-1 text-info" />
                <div className="text-sm font-medium">New York</div>
              </div>
            </div>
          </div>
        </div>,
        <div className="bg-card p-6 rounded-lg shadow-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("ux.bo.departureDate")}</label>
              <input type="date" className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("ux.bo.returnDate")}</label>
              <input type="date" className="w-full p-2 border rounded" />
            </div>
          </div>
        </div>,
        <div className="bg-card p-6 rounded-lg shadow-lg">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm">2 voyageurs</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm">7 nuits</span>
            </div>
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm">Premium</span>
            </div>
          </div>
        </div>,
        <div className="bg-card p-6 rounded-lg shadow-lg">
          <div className="text-center mb-4">
            <CreditCard className="w-12 h-12 mx-auto mb-2 text-info" />
            <h4 className="font-semibold">{t("ux.bo.jKoPayment")}</h4>
          </div>
          <div className="space-y-2">
            <input type="text" placeholder={t("ux.bo.cardNumber")} className="w-full p-2 border rounded" />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder={t("ux.bo.mmYy")} className="p-2 border rounded" />
              <input type="text" placeholder="CVV" className="p-2 border rounded" />
            </div>
          </div>
        </div>,
        <div className="bg-card p-6 rounded-lg shadow-lg">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-success" />
            <h4 className="font-semibold text-success">{t("ux.bo.bookingConfirmed")}</h4>
            <p className="text-sm text-muted-foreground">{t("ux.bo.tripHasBeenBookedSuccessfully")}</p>
          </div>
        </div>
      ],
      'profile': [
        <div className="bg-card p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h4 className="font-semibold">{t("ux.bo.myProfile")}</h4>
              <p className="text-sm text-muted-foreground">{t("ux.bo.managePersonalInformation")}</p>
            </div>
          </div>
        </div>,
        <div className="bg-card p-6 rounded-lg shadow-lg">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("ux.bo.fullName")}</label>
              <input type="text" defaultValue="Jean Dupont" className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" defaultValue="jean.dupont@email.com" className="w-full p-2 border rounded" />
            </div>
          </div>
        </div>,
        <div className="bg-card p-6 rounded-lg shadow-lg">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">{t("ux.bo.emailNotifications")}</span>
              <Button variant="outline" size="sm">{t("ux.bo.enable")}</Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Newsletter</span>
              <Button variant="outline" size="sm">{t("ux.bo.disable")}</Button>
            </div>
          </div>
        </div>,
        <div className="bg-card p-6 rounded-lg shadow-lg">
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 border rounded">
              <CreditCard className="w-5 h-5 text-info" />
              <span className="text-sm">••••• 4242</span>
            </div>
            <Button variant="outline" className="w-full">{t("ux.bo.addMethod")}</Button>
          </div>
        </div>,
        <div className="bg-card p-6 rounded-lg shadow-lg">
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-muted rounded">
              <span className="text-sm">{t("ux.bo.logged15042026")}</span>
              <Badge variant="secondary">{t("ux.bo.recent")}</Badge>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted rounded">
              <span className="text-sm">{t("ux.bo.booking1234")}</span>
              <Badge variant="outline">{t("ux.bo.confirmed")}</Badge>
            </div>
          </div>
        </div>
      ],
      'support': [
        <div className="bg-card p-6 rounded-lg shadow-lg">
          <div className="text-center">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 text-info" />
            <h4 className="font-semibold">{t("ux.bo.helpCenter")}</h4>
            <p className="text-sm text-muted-foreground">{t("ux.bo.findAnswersQuestions")}</p>
          </div>
        </div>,
        <div className="bg-card p-6 rounded-lg shadow-lg">
          <div className="space-y-3">
            <div className="p-3 border rounded-lg">
              <h5 className="font-medium mb-1">{t("ux.bo.howDoIBook")}</h5>
              <p className="text-sm text-muted-foreground">{t("ux.bo.completeBookingGuide")}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <h5 className="font-medium mb-1">{t("ux.bo.paymentMethods")}</h5>
              <p className="text-sm text-muted-foreground">{t("ux.bo.jKoBankCard")}</p>
            </div>
          </div>
        </div>,
        <div className="bg-card p-6 rounded-lg shadow-lg">
          <div className="space-y-4">
            <textarea 
              placeholder={t("ux.bo.describeProblem")} 
              className="w-full p-3 border rounded-lg h-24"
            />
            <Button className="w-full">{t("ux.bo.sendRequest")}</Button>
          </div>
        </div>,
        <div className="bg-card p-6 rounded-lg shadow-lg">
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-muted rounded">
              <span className="text-sm">Ticket #001</span>
              <Badge variant="secondary">{t("ux.bo.progress")}</Badge>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted rounded">
              <span className="text-sm">Ticket #002</span>
              <Badge variant="outline">{t("ux.bo.resolved")}</Badge>
            </div>
          </div>
        </div>,
        <div className="bg-card p-6 rounded-lg shadow-lg">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg text-center">
              <Book className="w-6 h-6 mx-auto mb-1 text-info" />
              <div className="text-sm">Documentation</div>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <Video className="w-6 h-6 mx-auto mb-1 text-info" />
              <div className="text-sm">{t("ux.bo.tutorials")}</div>
            </div>
          </div>
        </div>
      ],
      'mobile': [
        <div className="bg-card p-6 rounded-lg shadow-lg">
          <div className="text-center">
            <Smartphone className="w-12 h-12 mx-auto mb-4 text-info" />
            <h4 className="font-semibold">{t("ux.bo.mobileApp")}</h4>
            <p className="text-sm text-muted-foreground">{t("ux.bo.mobileOptimizedInterface")}</p>
          </div>
        </div>,
        <div className="bg-card p-6 rounded-lg shadow-lg">
          <div className="grid grid-cols-4 gap-2">
            <Button variant="ghost" size="sm"><Home className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm"><Search className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm"><Calendar className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm"><User className="w-4 h-4" /></Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{t("ux.bo.intuitiveTouchNavigation")}</p>
        </div>,
        <div className="bg-card p-6 rounded-lg shadow-lg">
          <div className="space-y-3">
            <div className="p-3 bg-info/10 rounded-lg">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-info" />
                <span className="text-sm">{t("ux.bo.newBookingConfirmed")}</span>
              </div>
            </div>
            <div className="p-3 bg-success/10 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="text-sm">{t("ux.bo.paymentSuccessful")}</span>
              </div>
            </div>
          </div>
        </div>,
        <div className="bg-card p-6 rounded-lg shadow-lg">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Fingerprint className="w-8 h-8 text-muted-foreground" />
            </div>
            <h4 className="font-semibold">{t("ux.bo.biometricAuthentication")}</h4>
            <p className="text-sm text-muted-foreground">{t("ux.bo.fastSecureLogin")}</p>
          </div>
        </div>,
        <div className="bg-card p-6 rounded-lg shadow-lg">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-success" />
                <span className="text-sm">{t("ux.bo.logged2")}</span>
              </div>
              <Badge variant="secondary">4G</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Battery className="w-5 h-5 text-success" />
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
      <div className="bg-card p-6 rounded-lg shadow-lg">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
            <Play className="w-8 h-8 text-muted-foreground" />
          </div>
          <h4 className="font-semibold">{t("ux.bo.livePreview")}</h4>
          <p className="text-sm text-muted-foreground">{t("ux.bo.discoverFeature")}</p>
        </div>
      </div>
    );
  };

  const getStepDescription = (feature: string, step: number) => {
    const descriptions: Record<string, string[]> = {
      'dashboard': [
        t("ux.bo.logEmailPasswordAccessSecure"),
        t("ux.bo.useIntuitiveSideMenuMove"),
        t("ux.bo.viewBookingStatisticsRevenueRecent"),
        t("ux.bo.easilyManageCurrentBookingsPlace"),
        t("ux.bo.customizeProfileSetPreferencesManage")
      ],
      'booking': [
        t("ux.bo.searchHundredsAvailableDestinationsOur"),
        t("ux.bo.selectTravelDatesNumberTravelers"),
        t("ux.bo.customizeTripExtraOptionsPremium"),
        t("ux.bo.paySecurelyJKoPreferred"),
        t("ux.bo.getInstantConfirmationAllDetails")
      ],
      'profile': [
        t("ux.bo.accessPersonalProfileManageAll"),
        t("ux.bo.updateContactDetailsPaymentInformation"),
        t("ux.bo.setNotificationsAlertsPrivacySettings"),
        t("ux.bo.addEditRemovePaymentMethods"),
        t("ux.bo.viewFullHistoryActivitiesBookings")
      ],
      'support': [
        t("ux.bo.accessOurCompleteHelpCenter"),
        t("ux.bo.browseOurFaqOrganizedCategory"),
        t("ux.bo.contactOurTechnicalSupport24"),
        t("ux.bo.trackStatusSupportRequestsReal"),
        t("ux.bo.accessRichLibraryVideoResources")
      ],
      'mobile': [
        t("ux.bo.enjoyInterfacePerfectlySuitedMobile"),
        t("ux.bo.navigateEasilyIntuitiveGesturesTouch"),
        t("ux.bo.accessEveryFeaturePlatformWherever"),
        t("ux.bo.getPushNotificationsStayInformed"),
        t("ux.bo.enjoySmoothFastUserExperience")
      ]
    };
    
    return descriptions[feature]?.[step] || t("ux.bo.discoverExcitingFeature");
  };

  useEffect(() => {
    if (selectedFeature) {
      const steps = getDemoSteps(selectedFeature);
      setDemoProgress((currentDemoStep / steps.length) * 100);
    }
  }, [currentDemoStep, selectedFeature]);

  return (
    <div className="min-h-screen bg-muted">
      {/* Hero Section */}
      <div className="relative bg-brand text-white overflow-hidden">
        <img src={heroImage} alt="Master Traversee Connect" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-brand/75 via-brand/60 to-brand/80" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg">
              Master Traversee Connect
            </h1>
            <p className="text-lg md:text-xl text-white/95 mb-8 max-w-2xl mx-auto">
              {t("ux.bo.exploreOurPlatformThroughImmersive")}
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <Clock className="w-5 h-5" />
                <span>15-20 min</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <Target className="w-5 h-5" />
                <span>{t("ux.bo.n40Steps")}</span>
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
      <div className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-info/10 rounded-lg">
                <Book className="w-6 h-6 text-info" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{t("ux.bo.trainingCenter")}</h2>
                <p className="text-sm text-muted-foreground">{t("ux.bo.interactiveLearning")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate('/')} className="flex items-center gap-2 hover:bg-muted">
                <Home className="w-4 h-4" />
                {t("ux.bo.home")}
              </Button>
              <Button onClick={() => navigate('/admin')} className="flex items-center gap-2 bg-info hover:bg-info/90">
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
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t("ux.bo.quickTour")}</h3>
              <p className="text-blue-100 mb-4">{t("ux.bo.discoverEssentialFeatures5Minutes")}</p>
              <Button 
                size="sm" 
                variant="secondary" 
                className="bg-card text-info hover:bg-info/10"
                onClick={() => startDemo('dashboard')}
              >
                {t("ux.bo.start")}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t("ux.bo.fullTour")}</h3>
              <p className="text-purple-100 mb-4">{t("ux.bo.exploreEveryFeatureDetail")}</p>
              <Button 
                size="sm" 
                variant="secondary" 
                className="bg-card text-primary hover:bg-primary/10"
                onClick={() => startDemo('complete-tour')}
              >
                {t("ux.bo.startTour")}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-success to-success/80 text-success-foreground">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t("ux.bo.freeModule")}</h3>
              <p className="text-green-100 mb-4">{t("ux.bo.chooseLearningModule")}</p>
              <Button 
                size="sm" 
                variant="secondary" 
                className="bg-card text-success hover:bg-success/10"
                onClick={() => document.getElementById('module-selection')?.scrollIntoView({ behavior: 'smooth' })}
              >
                {t("ux.bo.explore")}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Module Selection Section */}
        <div id="module-selection" className="bg-card rounded-2xl shadow-xl p-8 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">{t("ux.bo.learningModules")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("ux.bo.chooseSpecificModuleExploreDetail")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { id: 'dashboard', title: t("ux.bo.dashboard2"), icon: BarChart3, color: 'blue', description: t("ux.bo.mainManagement") },
              { id: 'booking', title: t("ux.bo.bookings"), icon: Calendar, color: 'purple', description: t("ux.bo.tripsStays") },
              { id: 'subscription', title: t("ux.bo.subscriptions"), icon: CreditCard, color: 'green', description: t("ux.bo.pricingPlans") },
              { id: 'profile', title: t("ux.bo.profile"), icon: User, color: 'indigo', description: t("ux.bo.personalManagement") },
              { id: 'support', title: t("ux.bo.support"), icon: HelpCircle, color: 'orange', description: t("ux.bo.helpSupport") },
              { id: 'admin', title: t("ux.bo.administration"), icon: Settings, color: 'red', description: 'Configuration' },
              { id: 'mobile', title: t("ux.bo.mobile"), icon: Smartphone, color: 'pink', description: t("ux.bo.mobileApp2") }
            ].map((module) => (
              <Dialog key={module.id}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="h-32 flex flex-col gap-3 hover:scale-105 transition-all duration-slow ease-standard border-2 hover:border-info/50 bg-card hover:bg-info/10 group"
                    onClick={() => setSelectedFeature(module.id)}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl flex items-center justify-center group-hover:from-info/20 group-hover:to-info/30 transition-colors">
                      <module.icon className="w-6 h-6 text-info" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-semibold text-foreground">{module.title}</span>
                      <p className="text-xs text-muted-foreground mt-1">{module.description}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs bg-info/10 text-info">
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
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Étape {currentDemoStep + 1} sur {getDemoSteps(module.id).length}</span>
                        <span>{Math.round(demoProgress)}%</span>
                      </div>
                      <Progress value={demoProgress} className="w-full h-3" />
                    </div>

                    {/* Demo Content */}
                    <div className="bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl p-8 min-h-[400px]">
                      <div className="text-center">
                        <div className="mb-6">
                          {getFeatureIcon(module.id)}
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-foreground">
                          {getDemoSteps(module.id)[currentDemoStep] || t("ux.bo.demoComplete")}
                        </h3>
                        <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
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
                          {t("ux.bo.previous")}
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
                          {t("ux.bo.next")}
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
                          {t("ux.bo.open")}
                        </Button>
                      </div>
                    </div>

                    {/* Complete Tour Button */}
                    {module.id !== 'complete-tour' && (
                      <div className="text-center mt-6">
                        <Button 
                          className="bg-action hover:bg-action-hover"
                          onClick={() => startDemo('complete-tour')}
                        >
                          <Rocket className="w-4 h-4 mr-2" />
                          {t("ux.bo.startFullTour")}
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
        <Card className="border-0 shadow-xl bg-gradient-to-br from-muted/40 to-muted/20">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Globe className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4">{t("ux.bo.fullSiteTour")}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
                {t("ux.bo.masterWholeTraverseeConnectPlatform")}
              </p>
              
              <div className="flex flex-wrap justify-center gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">8</div>
                  <div className="text-sm text-muted-foreground">Modules</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">40+</div>
                  <div className="text-sm text-muted-foreground">{t("ux.bo.steps")}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-pink-600 mb-1">15-20</div>
                  <div className="text-sm text-muted-foreground">{t("ux.bo.minutes")}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-success mb-1">100%</div>
                  <div className="text-sm text-muted-foreground">{t("ux.bo.practice")}</div>
                </div>
              </div>

              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                onClick={() => startDemo('complete-tour')}
              >
                <Rocket className="w-5 h-5 mr-2" />
                {t("ux.bo.startFullTour2")}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { icon: BarChart3, title: t("ux.bo.dashboard2"), description: t("ux.bo.mainManagementStatistics") },
                { icon: Calendar, title: t("ux.bo.bookings"), description: t("ux.bo.bookingTrips") },
                { icon: CreditCard, title: t("ux.bo.subscriptions"), description: t("ux.bo.plansPayment") },
                { icon: User, title: t("ux.bo.profile"), description: t("ux.bo.personalManagement") },
                { icon: HelpCircle, title: t("ux.bo.support"), description: t("ux.bo.helpSupport") },
                { icon: Settings, title: t("ux.bo.administration"), description: t("ux.bo.systemConfiguration") },
                { icon: Smartphone, title: t("ux.bo.mobile"), description: t("ux.bo.mobileApp2") }
              ].map((item, index) => (
                <div key={index} className="bg-card p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h4 className="font-semibold text-foreground">{item.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-card rounded-xl p-6">
              <h3 className="text-xl font-bold text-foreground mb-4">{t("ux.bo.benefitsFullTour")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: CheckCircle, title: t("ux.bo.fullMastery"), description: t("ux.bo.discoverEveryFeatureDepth") },
                  { icon: Award, title: 'Certification', description: t("ux.bo.earnMasteryCertificate") },
                  { icon: TrendingUp, title: t("ux.bo.productivity"), description: t("ux.bo.getMostOutPlatform") },
                  { icon: Users, title: t("ux.bo.confidence"), description: t("ux.bo.gainAutonomyConfidence") }
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <benefit.icon className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">{benefit.title}</h4>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
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
            <TabsTrigger value="overview">{t("ux.bo.overview")}</TabsTrigger>
            <TabsTrigger value="features">{t("ux.bo.features")}</TabsTrigger>
            <TabsTrigger value="guides">Guides</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="prose max-w-none">
              <h2>{t("ux.bo.traverseeConnectOverview")}</h2>
              <p>
                Traversee Connect est une plateforme complète de gestion de voyages et de réservations,
                {t("ux.bo.designedOfferOutstandingUserExperience")}
                {t("ux.bo.tourismProfessionals")}
              </p>
              
              <h3>{t("ux.bo.keyPoints")}</h3>
              <ul>
                <li>{t("ux.bo.modernIntuitiveInterface")}</li>
                <li>{t("ux.bo.completeBookingManagement")}</li>
                <li>{t("ux.bo.flexibleSubscriptionSystem")}</li>
                <li>{t("ux.bo.n247CustomerSupport")}</li>
                <li>{t("ux.bo.nativeMobileApp")}</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="features" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: <Calendar className="w-8 h-8 text-info" />,
                  title: t("ux.bo.smartBookings"),
                  description: t("ux.bo.advancedBookingSystemRealTime")
                },
                {
                  icon: <CreditCard className="w-8 h-8 text-success" />,
                  title: t("ux.bo.securePayments"),
                  description: t("ux.bo.jKoIntegrationMultipleSecure")
                },
                {
                  icon: <BarChart3 className="w-8 h-8 text-primary" />,
                  title: t("ux.bo.dashboard2"),
                  description: t("ux.bo.detailedAnalyticsRealTimeStatistics")
                },
                {
                  icon: <Smartphone className="w-8 h-8 text-pink-600" />,
                  title: t("ux.bo.mobileApp"),
                  description: t("ux.bo.nativeMobileExperienceNotificationsOffline")
                },
                {
                  icon: <HelpCircle className="w-8 h-8 text-warning-foreground" />,
                  title: t("ux.bo.n247Support"),
                  description: t("ux.bo.customerSupportAvailableAroundClock")
                }
              ].map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4">{feature.icon}</div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="guides" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: t("ux.bo.quickStartGuide"),
                  description: t("ux.bo.setUpAccount5Simple"),
                  icon: <Rocket className="w-6 h-6" />,
                  level: t("ux.bo.beginner")
                },
                {
                  title: t("ux.bo.paymentGuide"),
                  description: t("ux.bo.allAboutJKoPayment"),
                  icon: <CreditCard className="w-6 h-6" />,
                  level: t("ux.bo.intermediate")
                },
                {
                  title: t("ux.bo.mobileGuide"),
                  description: t("ux.bo.getFullPotentialMobileApp"),
                  icon: <Smartphone className="w-6 h-6" />,
                  level: t("ux.bo.intermediate")
                }
              ].map((guide, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        {guide.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">{guide.title}</h3>
                        <p className="text-muted-foreground text-sm mb-2">{guide.description}</p>
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
                  question: t("ux.bo.howDoesBookingSystemWork"),
                  answer: t("ux.bo.ourBookingSystemUsesAdvanced")
                },
                {
                  question: t("ux.bo.whichPaymentMethodsAccepted"),
                  answer: t("ux.bo.weAcceptJKoVisa")
                },
                {
                  question: t("ux.bo.howCanICancelMy"),
                  answer: t("ux.bo.youCanCancelBookingFrom")
                },
                {
                  question: t("ux.bo.mobileAppAvailable"),
                  answer: t("ux.bo.yesOurMobileAppAvailable")
                }
              ].map((faq, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <HelpCircle className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                        <p className="text-muted-foreground">{faq.answer}</p>
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
