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

const BossizConciergerieSN = () => {
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

  // Services adaptés pour le Sénégal
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
        'Organisation d\'excursions (Gorée, Saint-Louis, Saly)',
        'Organisation de voyages d\'affaires',
        'Balade en hélicoptère',
        'Activités et loisirs'
      ],
      color: 'from-green-600 to-green-700',
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
      color: 'from-blue-600 to-blue-700',
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
      color: 'from-teal-600 to-teal-700',
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
        'Sport (Basket, Football, Rallye Dakar, Golf, NBA)'
      ],
      color: 'from-cyan-600 to-cyan-700',
      price: 'Sur devis'
    }
  ];

  // Services additionnels adaptés pour le Sénégal
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
      items: ['Chefs privés', 'Cours de cuisine sénégalaise', 'Dégustations', 'Événements gastronomiques']
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
      name: 'M. Diop',
      role: 'Directeur',
      company: 'Multinationale Dakar',
      content: 'BOSSIZ a transformé ma façon de voyager au Sénégal. Service impeccable et attention aux détails.',
      rating: 5,
      location: 'Dakar'
    },
    {
      name: 'Mme. Fall',
      role: 'Responsable Événements',
      company: 'Luxe Events SN',
      content: 'L\'organisation de notre mariage par BOSSIZ était parfaite. Chaque détail était soigné avec professionnalisme.',
      rating: 5,
      location: 'Saint-Louis'
    },
    {
      name: 'M. Samba',
      role: 'Entrepreneur',
      company: 'Startup Tech',
      content: 'Les services de conciergerie BOSSIZ m\'ont fait gagner un temps précieux. Un partenaire indispensable.',
      rating: 5,
      location: 'Saly'
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
      {/* Header Navigation - Style bossiz.com */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-lg' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Anchor className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">BOSSIZ</h1>
                  <p className="text-xs text-gray-600">Sénégal</p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#accueil" className="text-gray-700 hover:text-green-600 font-medium transition-colors">Accueil</a>
              <a href="#services" className="text-gray-700 hover:text-green-600 font-medium transition-colors">Services</a>
              <a href="#a-propos" className="text-gray-700 hover:text-green-600 font-medium transition-colors">À Propos</a>
              <a href="#membership" className="text-gray-700 hover:text-green-600 font-medium transition-colors">Membership</a>
              <a href="#contact" className="text-gray-700 hover:text-green-600 font-medium transition-colors">Contacts</a>
            </nav>

            {/* CTA Button */}
            <div className="hidden md:flex items-center space-x-4">
              <Button 
                className="bg-green-600 text-white hover:bg-green-700 px-6 py-2"
                onClick={() => navigate('/contact')}
              >
                Book now
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
                <a href="#accueil" className="block px-4 py-2 text-gray-700 hover:text-green-600 hover:bg-gray-50">Accueil</a>
                <a href="#services" className="block px-4 py-2 text-gray-700 hover:text-green-600 hover:bg-gray-50">Services</a>
                <a href="#a-propos" className="block px-4 py-2 text-gray-700 hover:text-green-600 hover:bg-gray-50">À Propos</a>
                <a href="#membership" className="block px-4 py-2 text-gray-700 hover:text-green-600 hover:bg-gray-50">Membership</a>
                <a href="#contact" className="block px-4 py-2 text-gray-700 hover:text-green-600 hover:bg-gray-50">Contacts</a>
                <Button 
                  className="w-full mt-4 bg-green-600 text-white"
                  onClick={() => navigate('/contact')}
                >
                  Book now
                </Button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section - Style bossiz.com */}
      <section id="accueil" className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80')`
        }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gray-900">
              La conciergerie qui vous simplifie la vie
            </h1>
            <p className="text-2xl md:text-3xl text-gray-700 mb-8">
              pour que vous en profitiez pleinement
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-green-600 text-white hover:bg-green-700 px-8 py-4 text-lg font-semibold"
                onClick={() => scrollToSection('services')}
              >
                Découvrir nos services
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-green-600 text-green-600 hover:bg-green-50 px-8 py-4 text-lg font-semibold"
                onClick={() => navigate('/contact')}
              >
                Nous contacter
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Premium Section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-800 border-green-200">
              Services premium
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Explorez nos services haut de gamme qui couvrent tout
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Nous nous engageons à vous offrir une gamme complète de services, allant des déplacements d'affaires à la gestion administrative, 
              en passant par les loisirs et le bien-être. Quels que soient vos besoins, nos équipes expérimentées sont là pour vous apporter 
              une assistance professionnelle et personnalisée, pour que vous puissiez profiter d'une tranquillité d'esprit totale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {services.map((service) => (
              <Card key={service.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div className={`h-2 bg-gradient-to-r ${service.color}`}></div>
                <CardContent className="p-6">
                  <div className={`w-16 h-16 bg-gradient-to-br ${service.color} rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <div className="text-sm text-green-600 font-semibold mb-4">{service.price}</div>
                  <Button 
                    className={`w-full bg-gradient-to-r ${service.color} text-white hover:shadow-lg transition-all`}
                    onClick={() => navigate('/contact')}
                  >
                    Demander un devis
                  </Button>
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
              <Card key={service.id} className="border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {service.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h4>
                      <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                      <div className="space-y-1">
                        {service.items.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
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

      {/* À Propos Section */}
      <section id="a-propos" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Concergerie privée
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Service exclusif pour les particuliers qui recherchent l'excellence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Confiance</h3>
              <p className="text-gray-600 leading-relaxed">
                Relation de confiance basée sur la discrétion et la confidentialité absolue de vos informations.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Disponibilité</h3>
              <p className="text-gray-600 leading-relaxed">
                Service 24/7 pour répondre à toutes vos demandes, même les plus urgentes.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="w-10 h-10 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Excellence</h3>
              <p className="text-gray-600 leading-relaxed">
                Standards d'excellence dans chaque service rendu, avec une attention méticuleuse aux détails.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Button 
              size="lg"
              className="bg-green-600 text-white hover:bg-green-700 px-8 py-4 text-lg font-semibold"
              onClick={() => scrollToSection('membership')}
            >
              Découvrir nos formules
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Membership Section */}
      <section id="membership" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Choisissez la formule d'adhésion qui correspond le mieux à vos attentes et à votre style de vie.
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Des formules adaptées à tous les besoins pour un service premium sur mesure
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-2 border-gray-200 hover:border-green-300 transition-all">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Essentiel</h3>
                <div className="text-3xl font-bold text-green-600 mb-6">€99<span className="text-lg text-gray-600">/mois</span></div>
                <ul className="space-y-3 mb-8 text-left">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Services de base</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Assistance 5j/7</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Accès aux partenaires</span>
                  </li>
                </ul>
                <Button className="w-full bg-gray-600 text-white hover:bg-gray-700">
                  Choisir cette formule
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-500 shadow-xl transform scale-105">
              <CardContent className="p-8 text-center">
                <Badge className="mb-4 bg-green-100 text-green-800">Populaire</Badge>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Premium</h3>
                <div className="text-3xl font-bold text-green-600 mb-6">€199<span className="text-lg text-gray-600">/mois</span></div>
                <ul className="space-y-3 mb-8 text-left">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Tous les services essentiels</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Assistance 24/7</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Services VIP exclusifs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Conciergerie dédiée</span>
                  </li>
                </ul>
                <Button className="w-full bg-green-600 text-white hover:bg-green-700">
                  Choisir cette formule
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 hover:border-green-300 transition-all">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">VIP</h3>
                <div className="text-3xl font-bold text-green-600 mb-6">€399<span className="text-lg text-gray-600">/mois</span></div>
                <ul className="space-y-3 mb-8 text-left">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Tous les services premium</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Manager personnel dédié</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Accès prioritaire</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Services sur-mesure</span>
                  </li>
                </ul>
                <Button className="w-full bg-gray-800 text-white hover:bg-gray-900">
                  Choisir cette formule
                </Button>
              </CardContent>
            </Card>
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
                      <Star key={i} className="w-4 h-4 text-green-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                      <div className="text-sm text-green-600">{testimonial.company}</div>
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
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Téléphone</h3>
              <p className="text-gray-600 mb-4">Appelez-nous pour une consultation immédiate</p>
              <a href="tel:+221XXXXXXXX" className="text-green-600 font-semibold hover:text-green-700">
                +221 XX XX XX XX
              </a>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600 mb-4">Envoyez-nous vos demandes par email</p>
              <a href="mailto:sn@bossiz.com" className="text-blue-600 font-semibold hover:text-blue-700">
                sn@bossiz.com
              </a>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Adresse</h3>
              <p className="text-gray-600 mb-4">Visitez notre bureau principal</p>
              <p className="text-teal-600 font-semibold">
                Dakar, Plateau<br />
                Sénégal
              </p>
            </div>
          </div>

          <div className="text-center">
            <Button 
              size="lg"
              className="bg-green-600 text-white hover:bg-green-700 px-8 py-4 text-lg font-semibold"
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
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Anchor className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">BOSSIZ</h3>
                  <p className="text-sm text-gray-400">Sénégal</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4">
                La conciergerie qui vous simplifie la vie au Sénégal.
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
                  <span>+221 XX XX XX XX</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>sn@bossiz.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Dakar, Plateau</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                &copy; 2026 BOSSIZ Conciergerie Sénégal. Tous droits réservés.
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

export default BossizConciergerieSN;
