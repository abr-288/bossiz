import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  Globe,
  ChevronRight,
  Star,
  Users,
  Shield,
  Clock,
  Plane,
  Building,
  Car,
  Calendar,
  Heart,
  Utensils,
  ShoppingBag,
  Gamepad2,
  Briefcase,
  Anchor,
  Crown,
  ArrowRight,
  CheckCircle
} from "lucide-react";

const BossizConciergerieCI = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Services basés sur bossiz.com
  const services = [
    {
      id: 'voyage',
      title: 'Voyage',
      description: 'Voyagez avec simplicité et élégance',
      icon: <Plane className="w-8 h-8" />,
      features: [
        'Billet d\'avion',
        'Assurance voyage', 
        'Assistance visa et conseils',
        'Assistance VIP à l\'aéroport et livraison de vos bagages',
        'Navette aéroport',
        'Assistances expatriations',
        'Réservation d\'hébergement (hôtels, auberges, camping, résidences privées)',
        'Organisation de circuit touristique',
        'Organisation d\'excursions',
        'Organisation de voyages d\'affaires',
        'Balade en hélicoptère',
        'Activités et loisirs'
      ],
      color: 'from-blue-600 to-blue-700',
      price: 'Sur devis'
    },
    {
      id: 'immobilier',
      title: 'Immobilier',
      description: 'Votre partenaire de confiance pour l\'immobilier de luxe',
      icon: <Building className="w-8 h-8" />,
      features: [
        'Conseils en gestion de patrimoine immobilier',
        'Location saisonnière',
        'Assistance achat et location de biens immobiliers',
        'Décoration d\'intérieur, déménagement et aménagement',
        'Gestion locative'
      ],
      color: 'from-green-600 to-green-700',
      price: 'Sur devis'
    },
    {
      id: 'transport',
      title: 'Transport',
      description: 'Votre porte d\'accès aux transports de luxe',
      icon: <Car className="w-8 h-8" />,
      features: [
        'Location de Jets Privés',
        'Location d\'hélicoptères',
        'Location de véhicules de luxe',
        'Location de yatch'
      ],
      color: 'from-purple-600 to-purple-700',
      price: 'Sur devis'
    },
    {
      id: 'evenementiel',
      title: 'Événementiel',
      description: 'Créez des moments inoubliables avec BOSSIZ',
      icon: <Calendar className="w-8 h-8" />,
      features: [
        'Wedding planner, fête de fiançaille',
        'Cocktails, brunch',
        'Anniversaires, baby shower',
        'Réservation premium de places de spectacles et de concerts',
        'Vernissages',
        'Sport (Tennis, Formule 1, Jeux Olympique, Football, Golf, NBA)'
      ],
      color: 'from-orange-600 to-orange-700',
      price: 'Sur devis'
    }
  ];

  // Services additionnels basés sur bossiz.com
  const additionalServices = [
    {
      id: 'personnel',
      title: 'Personnel à la Demande',
      icon: <Users className="w-6 h-6" />,
      description: 'Services personnalisés selon vos besoins',
      items: ['Assistant personnel', 'Chauffeur privé', 'Gardien', 'Personnel de maison', 'Sécurité privée']
    },
    {
      id: 'quotidien',
      title: 'Service au Quotidien',
      icon: <Briefcase className="w-6 h-6" />,
      description: 'Simplifiez votre quotidien',
      items: ['Courses et livraisons', 'Entretien maison', 'Services de maintenance', 'Gestion administrative']
    },
    {
      id: 'bien-etre',
      title: 'Bien-être',
      icon: <Heart className="w-6 h-6" />,
      description: 'Prenez soin de vous',
      items: ['Spa et massage', 'Coach sportif', 'Nutritionniste', 'Médecins privés']
    },
    {
      id: 'loisirs',
      title: 'Loisirs',
      icon: <Gamepad2 className="w-6 h-6" />,
      description: 'Détente et divertissement',
      items: ['Réservation restaurants', 'Billets spectacles', 'Activités sportives', 'Sorties culturelles']
    },
    {
      id: 'gastronomie',
      title: 'Gastronomie',
      icon: <Utensils className="w-6 h-6" />,
      description: 'Expériences culinaires d\'exception',
      items: ['Chefs privés', 'Cours de cuisine', 'Dégustations', 'Événements gastronomiques']
    },
    {
      id: 'shopping',
      title: 'Shopping',
      icon: <ShoppingBag className="w-6 h-6" />,
      description: 'Shopping personnalisé et luxe',
      items: ['Personal shopper', 'Produits de luxe', 'Art et décoration', 'Livraisons express']
    }
  ];

  const testimonials = [
    {
      name: 'M. Kouadio',
      role: 'Directeur',
      company: 'Multinationale Abidjan',
      content: 'BOSSIZ a transformé ma façon de voyager en Côte d\'Ivoire. Service impeccable et attention aux détails.',
      rating: 5,
      location: 'Abidjan'
    },
    {
      name: 'Mme. Touré',
      role: 'Responsable Événements',
      company: 'Luxe Events CI',
      content: 'L\'organisation de notre mariage par BOSSIZ était parfaite. Chaque détail était soigné avec professionnalisme.',
      rating: 5,
      location: 'Yamoussoukro'
    },
    {
      name: 'M. Bamba',
      role: 'Entrepreneur',
      company: 'Startup Tech',
      content: 'Les services de conciergerie BOSSIZ m\'ont fait gagner un temps précieux. Un partenaire indispensable.',
      rating: 5,
      location: 'San Pedro'
    }
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Navigation - Style bossiz.com exact */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 border-b border-gray-100">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                  <Crown className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">BOSSIZ</h1>
                  <p className="text-sm text-gray-600 font-medium">Côte d'Ivoire</p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-10">
              <a href="#accueil" className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm uppercase tracking-wide">Accueil</a>
              <a href="#a-propos" className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm uppercase tracking-wide">À Propos</a>
              <a href="#services" className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm uppercase tracking-wide">Conciergerie privée</a>
              <a href="#membership" className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm uppercase tracking-wide">Membership</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm uppercase tracking-wide">Contacts</a>
            </nav>

            {/* CTA Button */}
            <div className="hidden lg:flex items-center space-x-4">
              <div className="flex items-center space-x-2 mr-4">
                <span className="text-sm text-gray-600 font-medium">FR</span>
                <span className="text-gray-400">|</span>
                <span className="text-sm text-gray-400">EN</span>
              </div>
              <Button 
                className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 font-medium rounded-none"
                onClick={() => navigate('/contact')}
              >
                Book now
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-3 rounded-lg hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="lg:hidden py-6 border-t border-gray-100">
              <nav className="flex flex-col space-y-4">
                <a href="#accueil" className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-gray-50 font-medium">Accueil</a>
                <a href="#a-propos" className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-gray-50 font-medium">À Propos</a>
                <a href="#services" className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-gray-50 font-medium">Conciergerie privée</a>
                <a href="#membership" className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-gray-50 font-medium">Membership</a>
                <a href="#contact" className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-gray-50 font-medium">Contacts</a>
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 font-medium">FR</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-sm text-gray-400">EN</span>
                  </div>
                  <Button 
                    className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 font-medium rounded-none"
                    onClick={() => navigate('/contact')}
                  >
                    Book now
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section - Premium Design */}
      <section id="accueil" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Video/Image */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-gray-900/80 to-orange-900/90"></div>
          <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1566073771259-6a8506099925d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80')`
          }}></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-gradient-to-br from-orange-400/20 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-orange-600/20 backdrop-blur-sm border border-blue-300/30 rounded-full px-6 py-3 mb-8">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-orange-400 rounded-full animate-pulse"></div>
              <span className="text-blue-200 text-sm font-medium tracking-wider uppercase">Premium Conciergerie</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold mb-8 text-white leading-tight tracking-tight">
              La conciergerie qui vous
              <span className="block bg-gradient-to-r from-blue-400 to-orange-400 bg-clip-text text-transparent">simplifie la vie</span>
            </h1>
            <p className="text-3xl md:text-4xl text-gray-200 mb-16 font-light leading-relaxed max-w-4xl mx-auto">
              pour que vous en profitiez pleinement
            </p>
            
            {/* Stats Premium */}
            <div className="grid grid-cols-3 gap-8 mb-12 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">15+</div>
                <div className="text-gray-300 text-sm uppercase tracking-wide">Années d'Excellence</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-400 mb-2">5000+</div>
                <div className="text-gray-300 text-sm uppercase tracking-wide">Clients Satisfaits</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">24/7</div>
                <div className="text-gray-300 text-sm uppercase tracking-wide">Disponibilité</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 px-12 py-6 text-xl font-semibold rounded-none shadow-2xl transform hover:scale-105 transition-all duration-300 border border-blue-400/20"
                onClick={() => scrollToSection('services')}
              >
                Découvrir nos services
                <ChevronRight className="w-6 h-6 ml-3" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-gray-400/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 px-12 py-6 text-xl font-semibold rounded-none shadow-2xl transform hover:scale-105 transition-all duration-300"
                onClick={() => navigate('/contact')}
              >
                Nous contacter
              </Button>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="w-6 h-10 border-2 border-gray-400/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-gray-400/50 rounded-full mt-2 animate-bounce"></div>
          </div>
        </div>
      </section>

      {/* Services Premium Section */}
      <section id="services" className="py-32 bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: `radial-gradient(circle at 3px 3px, rgb(59 130 246 / 0.1) 3px, transparent 3px)`,
            backgroundSize: '80px 80px'
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <div className="inline-block">
              <div className="bg-gradient-to-r from-blue-600/10 to-orange-600/10 backdrop-blur-sm border border-blue-200/30 rounded-full px-8 py-4 mb-8">
                <span className="text-blue-800 text-lg font-semibold tracking-wider uppercase">Services Premium</span>
              </div>
            </div>
            <h2 className="text-5xl md:text-7xl font-bold text-gray-900 mb-10 leading-tight">
              Explorez nos services
              <span className="block bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">haut de gamme</span>
              <br />
              qui couvrent tout
            </h2>
            <p className="text-2xl text-gray-600 max-w-5xl mx-auto leading-relaxed font-light">
              Nous nous engageons à vous offrir une gamme complète de services, allant des déplacements d'affaires à la gestion administrative, 
              en passant par les loisirs et le bien-être. Quels que soient vos besoins, nos équipes expérimentées sont là pour vous apporter 
              une assistance professionnelle et personnalisée, pour que vous puissiez profiter d'une tranquillité d'esprit totale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-24">
            {services.map((service, index) => (
              <Card key={service.id} className="border-0 shadow-2xl hover:shadow-3xl transition-all duration-700 overflow-hidden group bg-white/80 backdrop-blur-sm hover:scale-105">
                {/* Service Image Background */}
                <div className="h-48 bg-cover bg-center relative" style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-${service.id === 'voyage' ? '1436777815745-23d67422a4c3' : service.id === 'immobilier' ? '1560448214-04b83dc834d1' : service.id === 'transport' ? '1551882547-ff40c63fe5fa' : '1464207695886-cc468a7a5a4e'}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')`
                }}>
                  <div className={`absolute inset-0 bg-gradient-to-t ${service.color} opacity-80`}></div>
                  <div className="absolute bottom-4 left-4">
                    <div className={`w-16 h-16 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <div className={`bg-gradient-to-br ${service.color} rounded-xl p-3`}>
                        {service.icon}
                      </div>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>
                  
                  {/* Features List */}
                  <div className="space-y-2 mb-6">
                    {service.features.slice(0, 3).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-orange-400 rounded-full"></div>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-blue-600 font-semibold">{service.price}</div>
                    <Button 
                      className={`bg-gradient-to-r ${service.color} text-white hover:shadow-lg transition-all duration-300 px-6 py-3 rounded-none`}
                      onClick={() => navigate('/contact')}
                    >
                      Demander un devis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Description philosophique */}
          <div className="text-center mb-16">
            <p className="text-lg text-gray-700 italic max-w-4xl mx-auto leading-relaxed">
              BOSSIZ transcende le concept traditionnel de la conciergerie. Nous sommes votre compagnon dévoué dans la quête de l'excellence 
              et du bien-être. Notre vocation consiste à vous proposer un service de luxe entièrement sur mesure, répondant à vos attentes 
              les plus exigeantes.
            </p>
          </div>

          {/* Services additionnels */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalServices.map((service) => (
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
                            <CheckCircle className="w-3 h-3 text-orange-500 flex-shrink-0" />
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
      </section>

      {/* À Propos Section - Premium Design */}
      <section id="a-propos" className="py-32 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full" style={{
            backgroundImage: `radial-gradient(circle at 3px 3px, rgb(255 255 255 / 0.1) 3px, transparent 3px)`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <div className="inline-block">
              <div className="bg-gradient-to-r from-blue-600/20 to-orange-600/20 backdrop-blur-sm border border-blue-300/30 rounded-full px-8 py-4 mb-8">
                <span className="text-blue-200 text-lg font-semibold tracking-wider uppercase">Conciergerie Privée</span>
              </div>
            </div>
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-10 leading-tight">
              Service exclusif pour les
              <span className="block bg-gradient-to-r from-blue-400 to-orange-400 bg-clip-text text-transparent">particuliers qui recherchent</span>
              <br />
              l'excellence
            </h2>
            <p className="text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-light">
              Une expérience sur mesure conçue pour les plus exigeants
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-24">
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500">
                  <Shield className="w-12 h-12 text-orange-400" />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-500"></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-6">Confiance</h3>
              <p className="text-gray-300 leading-relaxed text-lg">
                Relation de confiance basée sur la discrétion et la confidentialité absolue de vos informations.
              </p>
            </div>
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500">
                  <Clock className="w-12 h-12 text-blue-400" />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-500"></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-6">Disponibilité</h3>
              <p className="text-gray-300 leading-relaxed text-lg">
                Service 24/7 pour répondre à toutes vos demandes, même les plus urgentes.
              </p>
            </div>
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500">
                  <Star className="w-12 h-12 text-green-400" />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-500"></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-6">Excellence</h3>
              <p className="text-gray-300 leading-relaxed text-lg">
                Standards d'excellence dans chaque service rendu, avec une attention méticuleuse aux détails.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-orange-600 text-white hover:from-blue-700 hover:to-orange-700 px-12 py-6 text-xl font-semibold rounded-none shadow-2xl transform hover:scale-105 transition-all duration-300 border border-white/20"
              onClick={() => scrollToSection('membership')}
            >
              Découvrir nos formules
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
          </div>
        </div>
      </section>

      {/* Membership Section - Premium Design avec plans existants */}
      <section id="membership" className="py-32 bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: `radial-gradient(circle at 3px 3px, rgb(59 130 246 / 0.1) 3px, transparent 3px)`,
            backgroundSize: '100px 100px'
          }}></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-10 right-20 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-20 w-48 h-48 bg-gradient-to-br from-orange-400/10 to-transparent rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <div className="inline-block">
              <div className="bg-gradient-to-r from-blue-600/10 to-orange-600/10 backdrop-blur-sm border border-blue-200/30 rounded-full px-8 py-4 mb-10">
                <span className="text-blue-800 text-lg font-semibold tracking-wider uppercase">Membership</span>
              </div>
            </div>
            <h2 className="text-5xl md:text-7xl font-bold text-gray-900 mb-10 leading-tight">
              Choisissez la formule d'adhésion qui
              <span className="block bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">correspond le mieux</span>
              <br />
              à vos attentes et à votre style de vie.
            </h2>
            <p className="text-2xl text-gray-600 max-w-5xl mx-auto leading-relaxed font-light">
              Des formules adaptées à tous les besoins pour un service premium sur mesure
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-24">
            {/* Essentiel - Basé sur les services de base */}
            <Card className="border-0 shadow-2xl hover:shadow-3xl transition-all duration-700 overflow-hidden group bg-white/90 backdrop-blur-sm hover:scale-105 relative">
              <div className="h-2 bg-gradient-to-r from-gray-400 to-gray-600"></div>
              <CardContent className="p-12 text-center">
                <div className="mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Briefcase className="w-10 h-10 text-gray-600" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Essentiel</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">Services fondamentaux pour un quotidien simplifié</p>
                </div>
                <div className="text-5xl font-bold text-gray-700 mb-10">€99<span className="text-xl text-gray-500 font-light">/mois</span></div>
                
                {/* Services inclus */}
                <div className="text-left mb-10">
                  <h4 className="text-lg font-semibold text-gray-900 mb-6">Services inclus:</h4>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-700">Voyage & Tourisme</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-700">Transport premium</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-700">Service au quotidien</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-700">Assistance 5j/7</span>
                    </li>
                  </ul>
                </div>
                
                <Button className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800 px-8 py-4 text-lg font-semibold rounded-none shadow-lg transform hover:scale-105 transition-all duration-300">
                  Choisir cette formule
                </Button>
              </CardContent>
            </Card>

            {/* Premium - Basé sur tous les services */}
            <Card className="border-0 shadow-3xl hover:shadow-4xl transition-all duration-700 overflow-hidden group bg-white/95 backdrop-blur-sm hover:scale-105 relative">
              <div className="h-2 bg-gradient-to-r from-blue-600 to-orange-600"></div>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-gradient-to-r from-blue-600 to-orange-600 text-white px-8 py-3 rounded-full text-sm font-bold shadow-2xl animate-pulse">
                  Plus Populaire
                </div>
              </div>
              <CardContent className="p-12 text-center">
                <div className="mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Crown className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Premium</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">L'excellence de la conciergerie complète</p>
                </div>
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent mb-10">€199<span className="text-xl text-gray-500 font-light">/mois</span></div>
                
                {/* Services inclus */}
                <div className="text-left mb-10">
                  <h4 className="text-lg font-semibold text-gray-900 mb-6">Services inclus:</h4>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <span className="text-gray-700">Tous les services essentiels</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <span className="text-gray-700">Immobilier & Patrimoine</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <span className="text-gray-700">Événements & Célébrations</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <span className="text-gray-700">Assistance 24/7 VIP</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <span className="text-gray-700">Gastronomie & Bien-être</span>
                    </li>
                  </ul>
                </div>
                
                <Button className="w-full bg-gradient-to-r from-blue-600 to-orange-600 text-white hover:from-blue-700 hover:to-orange-700 px-8 py-4 text-lg font-semibold rounded-none shadow-2xl transform hover:scale-105 transition-all duration-300 border border-blue-400/20">
                  Choisir cette formule
                </Button>
              </CardContent>
            </Card>

            {/* VIP - Basé sur services sur-mesure */}
            <Card className="border-0 shadow-2xl hover:shadow-3xl transition-all duration-700 overflow-hidden group bg-white/90 backdrop-blur-sm hover:scale-105 relative">
              <div className="h-2 bg-gradient-to-r from-gray-800 to-black"></div>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-gradient-to-r from-gray-800 to-black text-white px-8 py-3 rounded-full text-sm font-bold shadow-2xl">
                  Ultra Premium
                </div>
              </div>
              <CardContent className="p-12 text-center">
                <div className="mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Star className="w-10 h-10 text-gray-800" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">VIP</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">Le luxe sur mesure, sans compromis</p>
                </div>
                <div className="text-5xl font-bold text-gray-900 mb-10">€399<span className="text-xl text-gray-500 font-light">/mois</span></div>
                
                {/* Services inclus */}
                <div className="text-left mb-10">
                  <h4 className="text-lg font-semibold text-gray-900 mb-6">Services inclus:</h4>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-gray-800 flex-shrink-0" />
                      <span className="text-gray-700">Tous les services premium</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-gray-800 flex-shrink-0" />
                      <span className="text-gray-700">Manager personnel dédié</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-gray-800 flex-shrink-0" />
                      <span className="text-gray-700">Accès prioritaire & exclusif</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-gray-800 flex-shrink-0" />
                      <span className="text-gray-700">Services sur-mesure illimités</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-gray-800 flex-shrink-0" />
                      <span className="text-gray-700">Conciergerie privée 360°</span>
                    </li>
                  </ul>
                </div>
                
                <Button className="w-full bg-gradient-to-r from-gray-800 to-black text-white hover:from-gray-900 hover:to-black px-8 py-4 text-lg font-semibold rounded-none shadow-2xl transform hover:scale-105 transition-all duration-300 border border-gray-600/20">
                  Choisir cette formule
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* CTA finale */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-600/10 to-orange-600/10 backdrop-blur-sm border border-blue-200/30 rounded-2xl p-8 max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Pas sûr ?</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Contactez notre équipe pour un conseil personnalisé et trouvez la formule idéale pour vos besoins
              </p>
              <Button 
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-orange-600 text-white hover:from-blue-700 hover:to-orange-700 px-12 py-5 text-xl font-semibold rounded-none shadow-2xl transform hover:scale-105 transition-all duration-300 border border-blue-400/20"
                onClick={() => navigate('/contact')}
              >
                Parler à un conseiller
                <Phone className="w-6 h-6 ml-3" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Témoignages Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Ce que nos clients disent de nous
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Découvrez les expériences de nos clients satisfaits
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-orange-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.name.charAt(0)}
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
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Contactez-nous
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Prêt à simplifier votre vie avec BOSSIZ ? Contactez-nous dès aujourd'hui
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Téléphone</h3>
              <p className="text-gray-600 mb-4">Appelez-nous pour une consultation immédiate</p>
              <a href="tel:+225XXXXXXXX" className="text-orange-600 font-semibold hover:text-orange-700">
                +225 XX XX XX XX
              </a>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600 mb-4">Envoyez-nous vos demandes par email</p>
              <a href="mailto:ci@bossiz.com" className="text-blue-600 font-semibold hover:text-blue-700">
                ci@bossiz.com
              </a>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-green-600" />
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
              className="bg-orange-600 text-white hover:bg-orange-700 px-8 py-4 text-lg font-semibold"
              onClick={() => navigate('/contact')}
            >
              Prendre rendez-vous
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
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
                  <p className="text-sm text-gray-400">Côte d'Ivoire</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4">
                La conciergerie qui vous simplifie la vie en Côte d'Ivoire.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2">
                <li className="text-gray-400 hover:text-white cursor-pointer transition-colors">Voyage</li>
                <li className="text-gray-400 hover:text-white cursor-pointer transition-colors">Immobilier</li>
                <li className="text-gray-400 hover:text-white cursor-pointer transition-colors">Transport</li>
                <li className="text-gray-400 hover:text-white cursor-pointer transition-colors">Événementiel</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Entreprise</h4>
              <ul className="space-y-2">
                <li className="text-gray-400 hover:text-white cursor-pointer transition-colors">À Propos</li>
                <li className="text-gray-400 hover:text-white cursor-pointer transition-colors">Membership</li>
                <li className="text-gray-400 hover:text-white cursor-pointer transition-colors">Carrières</li>
                <li className="text-gray-400 hover:text-white cursor-pointer transition-colors">Presse</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>+225 XX XX XX XX</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>ci@bossiz.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Abidjan, Plateau</span>
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
