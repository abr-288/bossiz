import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Users,
  Star,
  CheckCircle,
  ArrowRight,
  Shield,
  Crown,
  Plane,
  Hotel,
  Car,
  Calendar,
  CreditCard,
  Headphones,
  MessageSquare,
  Award,
  Building2,
  Briefcase,
  Heart,
  Zap,
  Target,
  TrendingUp,
  Globe,
  Luggage,
  Utensils,
  ShoppingBag,
  Camera,
  Music,
  Gamepad2,
  Baby,
  Stethoscope,
  GraduationCap,
  Dumbbell,
  Home,
  Anchor,
  Ship,
  Menu,
  X,
  ChevronDown,
  PhoneCall,
  MailIcon,
  MapPinIcon,
  ClockIcon,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  ArrowRight as ArrowRightIcon,
  Check as CheckIcon,
  Sparkles,
  TrendingUpIcon,
  ShieldCheck,
  UsersRound,
  Building,
  Handshake,
  Award as AwardIcon,
  Star as StarIcon
} from "lucide-react";

const BossizConciergerieCI = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigation menu items
  const menuItems = [
    { id: 'home', label: 'Accueil', icon: <Home className="w-4 h-4" /> },
    { id: 'services', label: 'Services', icon: <Crown className="w-4 h-4" /> },
    { id: 'about', label: 'À Propos', icon: <Building className="w-4 h-4" /> },
    { id: 'testimonials', label: 'Témoignages', icon: <StarIcon className="w-4 h-4" /> },
    { id: 'contact', label: 'Contact', icon: <PhoneCall className="w-4 h-4" /> }
  ];

  // Services professionnels
  const professionalServices = [
    {
      id: 'voyage',
      title: 'Voyage & Tourisme',
      subtitle: 'Solutions complètes pour tous vos déplacements',
      description: 'Voyagez avec simplicité et élégance grâce à notre expertise locale et nos partenariats exclusifs.',
      icon: <Plane className="w-12 h-12" />,
      features: [
        'Billetterie internationale et régionale',
        'Assistance visa et documents de voyage',
        'Services VIP dans tous les aéroports',
        'Transferts privés et navettes premium',
        'Hébergements de luxe et résidences privées',
        'Circuits touristiques personnalisés',
        'Excursions et activités sur mesure',
        'Voyages d\'affaires et missions corporatives',
        'Transport hélicoptère et balades aériennes'
      ],
      color: 'from-blue-600 to-blue-800',
      bgGradient: 'from-blue-50 to-indigo-50'
    },
    {
      id: 'immobilier',
      title: 'Immobilier & Patrimoine',
      subtitle: 'Gestion experte de vos biens immobiliers',
      description: 'Votre partenaire de confiance pour l\'immobilier de luxe et la gestion optimisée de votre patrimoine.',
      icon: <Building className="w-12 h-12" />,
      features: [
        'Conseil stratégique en gestion patrimoniale',
        'Location saisonnière et gestion locative',
        'Assistance acquisition et vente de biens',
        'Design d\'intérieur et aménagement sur mesure',
        'Services de déménagement et logistique',
        'Maintenance et gestion technique',
        'Investissement immobilier et conseil fiscal',
        'Gestion de propriétés multiples'
      ],
      color: 'from-green-600 to-green-800',
      bgGradient: 'from-green-50 to-emerald-50'
    },
    {
      id: 'transport',
      title: 'Transport Premium',
      subtitle: 'Mobilité d\'exception et solutions de transport',
      description: 'Accédez à une flotte de véhicules de prestige et des solutions de transport personnalisées.',
      icon: <Car className="w-12 h-12" />,
      features: [
        'Location de jets privés et hélicoptères',
        'Véhicules de luxe avec chauffeurs professionnels',
        'Yachts et bateaux de plaisance',
        'Services de transport corporatif',
        'Logistique événementielle',
        'Transferts VIP et services discrets',
        'Flotte de véhicules électriques premium',
        'Assistance 24/7 et suivi en temps réel'
      ],
      color: 'from-purple-600 to-purple-800',
      bgGradient: 'from-purple-50 to-pink-50'
    },
    {
      id: 'evenementiel',
      title: 'Événements & Célébrations',
      subtitle: 'Création d\'expériences mémorables',
      description: 'Organisation d\'événements d\'exception avec une attention méticuleuse à chaque détail.',
      icon: <Calendar className="w-12 h-12" />,
      features: [
        'Wedding planning et coordination complète',
        'Réceptions corporatives et événements d\'entreprise',
        'Gala et soirées de prestige',
        'Réservations VIP spectacles et concerts',
        'Événements sportifs et expériences exclusives',
        'Célébrations privées et anniversaires',
        'Lancements de produits et vernissages',
        'Coordination logistique et gestion des invités'
      ],
      color: 'from-orange-600 to-orange-800',
      bgGradient: 'from-orange-50 to-amber-50'
    }
  ];

  // Services spécialisés
  const specializedServices = [
    {
      id: 'personnel',
      title: 'Services Personnalisés',
      icon: <UsersRound className="w-8 h-8" />,
      description: 'Personnel dédié selon vos besoins spécifiques',
      items: ['Assistant personnel', 'Chauffeur privé', 'Personnel de maison', 'Sécurité privée', 'Assistant virtuel']
    },
    {
      id: 'quotidien',
      title: 'Assistance Quotidienne',
      icon: <Zap className="w-8 h-8" />,
      description: 'Simplification de votre vie quotidienne',
      items: ['Courses et livraison', 'Entretien domicile', 'Services de maintenance', 'Gestion administrative', 'Conciergerie digitale']
    },
    {
      id: 'bien-etre',
      title: 'Bien-être & Santé',
      icon: <Heart className="w-8 h-8" />,
      description: 'Services de santé et bien-être premium',
      items: ['Spa et massage thérapeutique', 'Coach sportif personnel', 'Nutritionniste et diététicien', 'Médecins privés', 'Programmes wellness']
    },
    {
      id: 'gastronomie',
      title: 'Excellence Culinaire',
      icon: <Utensils className="w-8 h-8" />,
      description: 'Expériences gastronomiques d\'exception',
      items: ['Chefs privés et cuisine à domicile', 'Cours de cuisine gourmet', 'Dégustations et oenologie', 'Événements gastronomiques', 'Catering premium']
    },
    {
      id: 'shopping',
      title: 'Shopping & Luxe',
      icon: <ShoppingBag className="w-8 h-8" />,
      description: 'Accès exclusif aux meilleures adresses',
      items: ['Personal shopping', 'Produits de luxe et artisanaux', 'Galeries d\'art et antiquités', 'Shopping privé et VIP', 'Livraisons express internationales']
    },
    {
      id: 'loisirs',
      title: 'Loisirs & Divertissement',
      icon: <Gamepad2 className="w-8 h-8" />,
      description: 'Activités et expériences uniques',
      items: ['Réservations restaurants étoilés', 'Billets spectacles et événements', 'Activités sportives et aventures', 'Sorties culturelles et artistiques', 'Expériences exclusives']
    }
  ];

  // Statistiques professionnelles
  const stats = [
    { value: '15+', label: 'Années d\'expertise', icon: <AwardIcon className="w-6 h-6" /> },
    { value: '5000+', label: 'Clients satisfaits', icon: <UsersRound className="w-6 h-6" /> },
    { value: '1000+', label: 'Partenaires locaux', icon: <Handshake className="w-6 h-6" /> },
    { value: '24/7', label: 'Support disponible', icon: <Headphones className="w-6 h-6" /> }
  ];

  // Témoignages professionnels
  const professionalTestimonials = [
    {
      name: 'M. Kouadio Konan',
      role: 'Directeur Général',
      company: 'Africa Tech Solutions',
      content: 'BOSSIZ Conciergerie CI est devenu notre partenaire stratégique pour toutes nos missions en Côte d\'Ivoire. Leur professionnalisme et leur connaissance du marché sont exceptionnels.',
      rating: 5,
      location: 'Abidjan, Plateau',
      avatar: 'K'
    },
    {
      name: 'Mme. Touré Awa',
      role: 'Présidente Fondatrice',
      company: 'Luxe Events International',
      content: 'L\'organisation de nos événements corporatifs par BOSSIZ a dépassé toutes nos attentes. Une attention méticuleuse aux détails et une exécution parfaite.',
      rating: 5,
      location: 'Yamoussoukro',
      avatar: 'T'
    },
    {
      name: 'M. Bamba Yacouba',
      role: 'CEO',
      company: 'Innovation Ventures',
      content: 'Les services de conciergerie de BOSSIZ m\'ont permis de me concentrer sur mon développement d\'affaires en toute sérénité. Un service indispensable pour les dirigeants.',
      rating: 5,
      location: 'San Pedro',
      avatar: 'B'
    },
    {
      name: 'Mme. Diarra Fatou',
      role: 'Directrice Marketing',
      company: 'Global Brands CI',
      content: 'BOSSIZ transforme la conciergerie en Côte d\'Ivoire. Leur approche personnalisée et leur réseau exceptionnel font toute la différence.',
      rating: 5,
      location: 'Grand-Bassam',
      avatar: 'D'
    }
  ];

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    setIsMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Navigation Professionnel */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-lg' : 'bg-white/95 backdrop-blur-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">BOSSIZ</h1>
                  <p className="text-xs text-gray-600">Conciergerie CI</p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    activeSection === item.id 
                      ? 'bg-orange-100 text-orange-700' 
                      : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>

            {/* CTA Button Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <Button 
                className="bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 px-6 py-2"
                onClick={() => navigate('/contact')}
              >
                <PhoneCall className="w-4 h-4 mr-2" />
                Contact
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <nav className="flex flex-col space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeSection === item.id 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
                <Button 
                  className="w-full mt-4 bg-gradient-to-r from-orange-600 to-red-600 text-white"
                  onClick={() => navigate('/contact')}
                >
                  <PhoneCall className="w-4 h-4 mr-2" />
                  Contact
                </Button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section Professionnel */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-red-50">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23f97316\" fill-opacity=\"0.05\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"2\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="mb-8">
              <Badge className="mb-4 bg-orange-100 text-orange-800 border-orange-200">
                <Sparkles className="w-4 h-4 mr-2" />
                Excellence en Conciergerie
              </Badge>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                BOSSIZ Conciergerie
              </h1>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Côte d'Ivoire
              </h2>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
                La conciergerie qui vous simplifie la vie pour que vous en profitiez pleinement
              </p>
            </div>
            
            {/* Contact Info */}
            <div className="flex flex-wrap justify-center gap-6 mb-12">
              <div className="flex items-center gap-2 text-gray-700">
                <MapPinIcon className="w-5 h-5 text-orange-600" />
                <span>Abidjan, Plateau</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <PhoneCall className="w-5 h-5 text-orange-600" />
                <span>+225 XX XX XX XX</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <MailIcon className="w-5 h-5 text-orange-600" />
                <span>ci@bossiz.com</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <ClockIcon className="w-5 h-5 text-orange-600" />
                <span>24/7 Disponible</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 px-8 py-4 text-lg font-semibold shadow-lg"
                onClick={() => navigate('/contact')}
              >
                <Crown className="w-5 h-5 mr-2" />
                Devenir Client VIP
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-orange-600 text-orange-600 hover:bg-orange-50 px-8 py-4 text-lg font-semibold"
                onClick={() => scrollToSection('services')}
              >
                <ArrowRightIcon className="w-5 h-5 mr-2" />
                Découvrir nos Services
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section Professionnelle */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-orange-100 text-orange-800 border-orange-200">
              À Propos de BOSSIZ
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Excellence en Conciergerie depuis 15 ans
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Notre mission est de simplifier votre vie en vous offrant un éventail de services de conciergerie 
              haut de gamme. Nous comprenons que chaque aspect de votre quotidien mérite une attention particulière, 
              c'est pourquoi nous avons conçu une gamme complète de services pour répondre à tous vos besoins.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-orange-600 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <AwardIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Excellence Locale</h3>
              <p className="text-gray-600 leading-relaxed">
                Expertise approfondie de la culture et des meilleures adresses en Côte d'Ivoire pour un service authentique et personnalisé.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Confiance & Discrétion</h3>
              <p className="text-gray-600 leading-relaxed">
                Solutions sur mesure adaptées à vos besoins spécifiques avec une confidentialité absolue et un service personnalisé.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center mb-6">
                <Headphones className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Disponibilité 24/7</h3>
              <p className="text-gray-600 leading-relaxed">
                Assistance permanente pour toutes vos urgences et demandes avec une équipe dédiée à votre service jour et nuit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section Professionnelle */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-orange-100 text-orange-800 border-orange-200">
              Nos Services
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Solutions de Conciergerie Premium
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Découvrez notre gamme complète de services exclusifs en Côte d'Ivoire
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {professionalServices.map((service) => (
              <Card key={service.id} className={`border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden ${service.bgGradient}`}>
                <CardHeader className="pb-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${service.color} rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
                      {service.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                        {service.title}
                      </CardTitle>
                      <p className="text-orange-600 font-semibold mb-2">{service.subtitle}</p>
                      <p className="text-gray-600">{service.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Services inclus:</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {service.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="text-gray-700 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 mt-4 border-t border-gray-200">
                      <Button 
                        className={`w-full bg-gradient-to-r ${service.color} text-white hover:shadow-lg transition-all`}
                        onClick={() => navigate('/contact')}
                      >
                        Demander un devis
                        <ArrowRightIcon className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Services Spécialisés */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Services Complémentaires</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {specializedServices.map((service) => (
                <Card key={service.id} className="border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {service.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h4>
                        <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                        <div className="space-y-1">
                          {service.items.map((item, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                              <span className="text-sm text-gray-700">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Témoignages Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-orange-100 text-orange-800 border-orange-200">
              Témoignages Clients
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Ce que nos clients disent de nous
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Découvrez les expériences de nos clients satisfaits en Côte d'Ivoire
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {professionalTestimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <StarIcon key={i} className="w-4 h-4 text-orange-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic leading-relaxed text-sm">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                      <div className="text-sm text-orange-600">{testimonial.company}</div>
                      <div className="text-xs text-gray-500">{testimonial.location}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-orange-100 text-orange-800 border-orange-200">
              Contact
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Contactez notre équipe
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Prêt à simplifier votre vie avec BOSSIZ ? Contactez-nous dès aujourd'hui
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <PhoneCall className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Téléphone</h3>
              <p className="text-gray-600 mb-4">Appelez-nous pour une consultation immédiate</p>
              <a href="tel:+225XXXXXXXX" className="text-orange-600 font-semibold hover:text-orange-700">
                +225 XX XX XX XX
              </a>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MailIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600 mb-4">Envoyez-nous vos demandes par email</p>
              <a href="mailto:ci@bossiz.com" className="text-blue-600 font-semibold hover:text-blue-700">
                ci@bossiz.com
              </a>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MapPinIcon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Adresse</h3>
              <p className="text-gray-600 mb-4">Visitez notre bureau principal</p>
              <p className="text-green-600 font-semibold">
                Abidjan, Plateau<br />
                Côte d'Ivoire
              </p>
            </div>
          </div>

          <div className="text-center">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 px-8 py-4 text-lg font-semibold shadow-lg"
              onClick={() => navigate('/contact')}
            >
              <Crown className="w-5 h-5 mr-2" />
              Devenir Client VIP
            </Button>
          </div>
        </div>
      </section>

      {/* Footer Professionnel */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">BOSSIZ</h3>
                  <p className="text-sm text-gray-400">Conciergerie CI</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4">
                La conciergerie qui vous simplifie la vie en Côte d'Ivoire.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 cursor-pointer transition-colors">
                  <Facebook className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 cursor-pointer transition-colors">
                  <Instagram className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 cursor-pointer transition-colors">
                  <Linkedin className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 cursor-pointer transition-colors">
                  <Twitter className="w-5 h-5" />
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2">
                <li className="text-gray-400 hover:text-white cursor-pointer transition-colors">Voyage & Tourisme</li>
                <li className="text-gray-400 hover:text-white cursor-pointer transition-colors">Immobilier & Patrimoine</li>
                <li className="text-gray-400 hover:text-white cursor-pointer transition-colors">Transport Premium</li>
                <li className="text-gray-400 hover:text-white cursor-pointer transition-colors">Événements & Célébrations</li>
                <li className="text-gray-400 hover:text-white cursor-pointer transition-colors">Services Personnalisés</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Entreprise</h4>
              <ul className="space-y-2">
                <li className="text-gray-400 hover:text-white cursor-pointer transition-colors">À Propos</li>
                <li className="text-gray-400 hover:text-white cursor-pointer transition-colors">Notre Équipe</li>
                <li className="text-gray-400 hover:text-white cursor-pointer transition-colors">Carrières</li>
                <li className="text-gray-400 hover:text-white cursor-pointer transition-colors">Partenaires</li>
                <li className="text-gray-400 hover:text-white cursor-pointer transition-colors">Presse</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4" />
                  <span>+225 XX XX XX XX</span>
                </li>
                <li className="flex items-center gap-2">
                  <MailIcon className="w-4 h-4" />
                  <span>ci@bossiz.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4" />
                  <span>Abidjan, Plateau</span>
                </li>
                <li className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" />
                  <span>24/7 Disponible</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                &copy; 2026 BOSSIZ Conciergerie Côte d'Ivoire. Tous droits réservés.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Politique de confidentialité</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Conditions d'utilisation</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Mentions légales</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BossizConciergerieCI;
