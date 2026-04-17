import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Users,
  Star,
  ArrowRight,
  Shield,
  Crown,
  Plane,
  Building,
  Car,
  Calendar,
  Hotel,
  Anchor,
  Sparkles,
  TrendingUp,
  Award,
  Headphones,
  CheckCircle,
  Menu,
  X,
  ChevronRight,
  Zap,
  Target,
  Heart,
  Briefcase,
  Utensils,
  Gamepad2,
  ShoppingBag
} from "lucide-react";
import { useBossizConfigContext } from "@/contexts/BossizConfigContext";

const BossizPortal = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { sites, globalConfig, loading } = useBossizConfigContext();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Services premium globaux - dynamiques
  const globalServices = globalConfig.services;

  // Statistiques globales premium - dynamiques
  const globalStats = globalConfig.globalStats;

  // Valeurs de l'entreprise - dynamiques
  const companyValues = globalConfig.companyValues;

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Premium */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-xl' : 'bg-white/80 backdrop-blur-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            {/* Logo Premium */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-600 via-blue-600 to-green-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">BOSSIZ</h1>
                  <p className="text-sm text-gray-600 font-medium">Portail Conciergerie</p>
                </div>
              </div>
            </div>

            {/* Navigation Desktop */}
            <nav className="hidden lg:flex items-center space-x-12">
              <a href="#sites" className="text-gray-700 hover:text-orange-600 font-semibold transition-colors text-sm uppercase tracking-wide">
                Nos Sites
              </a>
              <a href="#services" className="text-gray-700 hover:text-orange-600 font-semibold transition-colors text-sm uppercase tracking-wide">
                Services
              </a>
              <a href="#values" className="text-gray-700 hover:text-orange-600 font-semibold transition-colors text-sm uppercase tracking-wide">
                Valeurs
              </a>
              <a href="#contact" className="text-gray-700 hover:text-orange-600 font-semibold transition-colors text-sm uppercase tracking-wide">
                Contact
              </a>
            </nav>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center space-x-4">
              <Button 
                className="bg-gradient-to-r from-blue-600 to-green-600 text-white hover:from-blue-700 hover:to-green-700 px-8 py-3 font-semibold rounded-none shadow-lg"
                onClick={() => navigate('/')}
              >
                <Globe className="w-5 h-5 mr-2" />
                Réservations
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
                <a href="#sites" className="block px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-gray-50 font-semibold">Nos Sites</a>
                <a href="#services" className="block px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-gray-50 font-semibold">Services</a>
                <a href="#values" className="block px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-gray-50 font-semibold">Valeurs</a>
                <a href="#contact" className="block px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-gray-50 font-semibold">Contact</a>
                <Button 
                  className="w-full mt-4 bg-gradient-to-r from-blue-600 to-green-600 text-white"
                  onClick={() => navigate('/')}
                >
                  <Globe className="w-5 h-5 mr-2" />
                  Réservations
                </Button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section Premium */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24">
        {/* Background Premium */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-gray-900/80 to-orange-900/90"></div>
          <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1566073771259-6a8506099925d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`
          }}></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-orange-400/20 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-orange-600/20 backdrop-blur-sm border border-blue-300/30 rounded-full px-8 py-4 mb-10">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-orange-400 rounded-full animate-pulse"></div>
              <span className="text-blue-200 text-lg font-semibold tracking-wider uppercase">Excellence Internationale</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold mb-8 text-white leading-tight tracking-tight">
              BOSSIZ Group
              <span className="block bg-gradient-to-r from-blue-400 to-orange-400 bg-clip-text text-transparent">Portail Conciergerie</span>
            </h1>
            <p className="text-3xl md:text-4xl text-gray-200 mb-16 font-light leading-relaxed max-w-4xl mx-auto">
              L'excellence de la conciergerie premium en Afrique de l'Ouest
            </p>
            
            {/* Premium Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
              {globalStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                    {stat.icon}
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-gray-300 text-sm uppercase tracking-wide mb-1">{stat.label}</div>
                  <div className="text-gray-400 text-xs">{stat.description}</div>
                </div>
              ))}
            </div>

            {/* CTA Buttons Premium */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 px-12 py-6 text-xl font-semibold rounded-none shadow-2xl transform hover:scale-105 transition-all duration-300 border border-orange-400/20"
                onClick={() => navigate('/bossiz-conciergerie-ci')}
              >
                <MapPin className="w-6 h-6 mr-3" />
                Bossiz Côte d'Ivoire
                <ChevronRight className="w-6 h-6 ml-3" />
              </Button>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 px-12 py-6 text-xl font-semibold rounded-none shadow-2xl transform hover:scale-105 transition-all duration-300 border border-green-400/20"
                onClick={() => navigate('/bossiz-conciergerie-sn')}
              >
                <Anchor className="w-6 h-6 mr-3" />
                Bossiz Sénégal
                <ChevronRight className="w-6 h-6 ml-3" />
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

      {/* Sites Premium Section */}
      <section id="sites" className="py-32 bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: `radial-gradient(circle at 3px 3px, rgb(59 130 246 / 0.1) 3px, transparent 3px)`,
            backgroundSize: '100px 100px'
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <div className="inline-block">
              <div className="bg-gradient-to-r from-blue-600/10 to-orange-600/10 backdrop-blur-sm border border-blue-200/30 rounded-full px-8 py-4 mb-10">
                <span className="text-blue-800 text-lg font-semibold tracking-wider uppercase">Nos Sites Premium</span>
              </div>
            </div>
            <h2 className="text-5xl md:text-7xl font-bold text-gray-900 mb-10 leading-tight">
              Découvrez Nos
              <span className="block bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">Sites d'Excellence</span>
            </h2>
            <p className="text-2xl text-gray-600 max-w-5xl mx-auto leading-relaxed font-light">
              Chaque site BOSSIZ offre une expérience unique, adaptée aux spécificités culturelles et aux besoins de sa région
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
            {bossizSites.map((site) => (
              <Card key={site.id} className={`border-0 shadow-3xl hover:shadow-4xl transition-all duration-700 overflow-hidden ${site.bgColor} group hover:scale-105 relative`}>
                {/* Premium Badge */}
                <div className="absolute top-6 right-6 z-10">
                  <div className="bg-gradient-to-r from-blue-600 to-orange-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-2xl">
                    Excellence Locale
                  </div>
                </div>
                
                {/* Image Section */}
                <div className="h-64 bg-cover bg-center relative" style={{
                  backgroundImage: `url('${site.image}')`
                }}>
                  <div className={`absolute inset-0 bg-gradient-to-t ${site.color} opacity-80`}></div>
                  <div className="absolute bottom-6 left-6">
                    <div className={`w-20 h-20 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300`}>
                      <div className={`bg-gradient-to-br ${site.color} rounded-xl p-4`}>
                        {site.icon}
                      </div>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-10">
                  <div className="mb-8">
                    <h3 className="text-4xl font-bold text-gray-900 mb-3">{site.title}</h3>
                    <p className="text-xl font-semibold text-gray-700 mb-4">{site.subtitle}</p>
                    <p className="text-lg text-gray-600 italic mb-6">"{site.tagline}"</p>
                    <p className="text-gray-700 leading-relaxed mb-6">{site.description}</p>
                    <div className="flex items-center gap-3 text-gray-600 mb-6">
                      <MapPin className="w-5 h-5" />
                      <span className="font-medium">{site.location}</span>
                    </div>
                  </div>

                  {/* Features Grid */}
                  <div className="mb-8">
                    <h4 className="text-xl font-bold text-gray-900 mb-6">Services Premium:</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {site.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <span className="text-gray-700 font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Premium Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    {site.stats.map((stat, index) => (
                      <div key={index} className="text-center bg-white/60 backdrop-blur-sm rounded-xl p-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                          {stat.icon}
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                        <div className="text-xs text-gray-600 uppercase tracking-wide">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Highlights */}
                  <div className="mb-8">
                    <h4 className="text-xl font-bold text-gray-900 mb-4">Points Forts:</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {site.highlights.map((highlight, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-orange-400 rounded-full"></div>
                          <span className="text-gray-700 text-sm">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">Contact Premium:</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-700 font-medium">{site.contact.phone}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-700 font-medium">{site.contact.email}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-700 font-medium">{site.contact.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button 
                    className={`w-full bg-gradient-to-r ${site.color} text-white hover:shadow-2xl transition-all duration-300 py-5 text-lg font-semibold rounded-none transform hover:scale-105 border border-white/20`}
                    onClick={() => navigate(site.route)}
                  >
                    Visiter le site
                    <ArrowRight className="w-6 h-6 ml-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Global Services Premium Section */}
      <section id="services" className="py-32 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full" style={{
            backgroundImage: `radial-gradient(circle at 3px 3px, rgb(255 255 255 / 0.1) 3px, transparent 3px)`,
            backgroundSize: '80px 80px'
          }}></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <div className="inline-block">
              <div className="bg-gradient-to-r from-blue-600/20 to-orange-600/20 backdrop-blur-sm border border-blue-300/30 rounded-full px-8 py-4 mb-10">
                <span className="text-blue-200 text-lg font-semibold tracking-wider uppercase">Services Premium</span>
              </div>
            </div>
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-10 leading-tight">
              Notre Gamme de
              <span className="block bg-gradient-to-r from-blue-400 to-orange-400 bg-clip-text text-transparent">Services d'Exception</span>
            </h2>
            <p className="text-2xl text-gray-300 max-w-5xl mx-auto leading-relaxed font-light">
              Une offre complète de services premium disponibles sur tous nos sites pour répondre à toutes vos exigences
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-24">
            {globalServices.map((service, index) => (
              <Card key={index} className="border-0 shadow-2xl hover:shadow-3xl transition-all duration-700 overflow-hidden group bg-white/10 backdrop-blur-sm hover:scale-105">
                {/* Service Image */}
                <div className="h-48 bg-cover bg-center relative" style={{
                  backgroundImage: `url('${service.image}')`
                }}>
                  <div className={`absolute inset-0 bg-gradient-to-t ${service.color} opacity-80`}></div>
                  <div className="absolute bottom-4 left-4">
                    <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                      <div className={`bg-gradient-to-br ${service.color} rounded-xl p-3`}>
                        {service.icon}
                      </div>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-white mb-4">{service.title}</h3>
                  <p className="text-gray-300 mb-6 leading-relaxed">{service.description}</p>
                  
                  {/* Features */}
                  <div className="mb-6">
                    <div className="grid grid-cols-2 gap-2">
                      {service.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <span className="text-gray-300 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Button 
                    className={`w-full bg-gradient-to-r ${service.color} text-white hover:shadow-lg transition-all duration-300 py-3 font-semibold rounded-none`}
                    onClick={() => navigate('/contact')}
                  >
                    En savoir plus
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Company Values Section */}
      <section id="values" className="py-32 bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: `radial-gradient(circle at 3px 3px, rgb(59 130 246 / 0.1) 3px, transparent 3px)`,
            backgroundSize: '120px 120px'
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <div className="inline-block">
              <div className="bg-gradient-to-r from-blue-600/10 to-orange-600/10 backdrop-blur-sm border border-blue-200/30 rounded-full px-8 py-4 mb-10">
                <span className="text-blue-800 text-lg font-semibold tracking-wider uppercase">Nos Valeurs</span>
              </div>
            </div>
            <h2 className="text-5xl md:text-7xl font-bold text-gray-900 mb-10 leading-tight">
              Les Piliers de Notre
              <span className="block bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">Excellence</span>
            </h2>
            <p className="text-2xl text-gray-600 max-w-5xl mx-auto leading-relaxed font-light">
              Les valeurs qui guident notre engagement envers nos clients chaque jour
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-24">
            {companyValues.map((value, index) => (
              <Card key={index} className="border-0 shadow-2xl hover:shadow-3xl transition-all duration-700 overflow-hidden group bg-white/90 backdrop-blur-sm hover:scale-105">
                <CardContent className="p-8 text-center">
                  <div className={`w-20 h-20 bg-gradient-to-br ${value.color} rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform duration-300 shadow-2xl`}>
                    {value.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Premium Section */}
      <section id="contact" className="py-32 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full" style={{
            backgroundImage: `radial-gradient(circle at 3px 3px, rgb(255 255 255 / 0.1) 3px, transparent 3px)`,
            backgroundSize: '100px 100px'
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <div className="inline-block">
              <div className="bg-gradient-to-r from-blue-600/20 to-orange-600/20 backdrop-blur-sm border border-blue-300/30 rounded-full px-8 py-4 mb-10">
                <span className="text-blue-200 text-lg font-semibold tracking-wider uppercase">Contact Premium</span>
              </div>
            </div>
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-10 leading-tight">
              Contactez
              <span className="block bg-gradient-to-r from-blue-400 to-orange-400 bg-clip-text text-transparent">L'Excellence BOSSIZ</span>
            </h2>
            <p className="text-2xl text-gray-300 max-w-5xl mx-auto leading-relaxed font-light">
              Prêt à découvrir une expérience de conciergerie inégalée ? Contactez nos experts dès aujourd'hui
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
            <Card className="border-0 shadow-3xl overflow-hidden bg-gradient-to-br from-orange-50 via-white to-red-50">
              <div className="h-2 bg-gradient-to-r from-orange-600 to-red-600"></div>
              <CardContent className="p-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl flex items-center justify-center text-white">
                    <MapPin className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900">Bossiz Côte d'Ivoire</h3>
                    <p className="text-lg text-gray-600">Excellence en Conciergerie</p>
                  </div>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl">
                    <Phone className="w-6 h-6 text-orange-600" />
                    <span className="text-gray-700 font-medium text-lg">{bossizSites[0].contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl">
                    <Mail className="w-6 h-6 text-orange-600" />
                    <span className="text-gray-700 font-medium text-lg">{bossizSites[0].contact.email}</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl">
                    <MapPin className="w-6 h-6 text-orange-600" />
                    <span className="text-gray-700 font-medium text-lg">{bossizSites[0].contact.address}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 py-4 text-lg font-semibold rounded-none shadow-2xl transform hover:scale-105 transition-all duration-300 border border-orange-400/20"
                  onClick={() => navigate('/bossiz-conciergerie-ci')}
                >
                  Visiter Bossiz CI
                  <ArrowRight className="w-6 h-6 ml-3" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-3xl overflow-hidden bg-gradient-to-br from-green-50 via-white to-blue-50">
              <div className="h-2 bg-gradient-to-r from-green-600 to-blue-600"></div>
              <CardContent className="p-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-blue-600 rounded-2xl flex items-center justify-center text-white">
                    <Anchor className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900">Bossiz Sénégal</h3>
                    <p className="text-lg text-gray-600">Conciergerie d'Exception</p>
                  </div>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl">
                    <Phone className="w-6 h-6 text-green-600" />
                    <span className="text-gray-700 font-medium text-lg">{bossizSites[1].contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl">
                    <Mail className="w-6 h-6 text-green-600" />
                    <span className="text-gray-700 font-medium text-lg">{bossizSites[1].contact.email}</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl">
                    <MapPin className="w-6 h-6 text-green-600" />
                    <span className="text-gray-700 font-medium text-lg">{bossizSites[1].contact.address}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 py-4 text-lg font-semibold rounded-none shadow-2xl transform hover:scale-105 transition-all duration-300 border border-green-400/20"
                  onClick={() => navigate('/bossiz-conciergerie-sn')}
                >
                  Visiter Bossiz SN
                  <ArrowRight className="w-6 h-6 ml-3" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-600/10 to-orange-600/10 backdrop-blur-sm border border-blue-300/30 rounded-2xl p-12 max-w-4xl mx-auto">
              <h3 className="text-3xl font-bold text-white mb-6">Accès Rapide aux Réservations</h3>
              <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                Accédez directement à notre plateforme de réservations pour planifier vos expériences premium
              </p>
              <Button 
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-orange-600 text-white hover:from-blue-700 hover:to-orange-700 px-12 py-6 text-xl font-semibold rounded-none shadow-2xl transform hover:scale-105 transition-all duration-300 border border-blue-400/20"
                onClick={() => navigate('/')}
              >
                <Globe className="w-6 h-6 mr-3" />
                Accéder aux Réservations
                <ChevronRight className="w-6 h-6 ml-3" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Premium */}
      <footer className="bg-gray-900 text-white py-20 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: `radial-gradient(circle at 3px 3px, rgb(255 255 255 / 0.1) 3px, transparent 3px)`,
            backgroundSize: '80px 80px'
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-orange-600 to-green-600 rounded-xl flex items-center justify-center">
                  <Globe className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">BOSSIZ</h3>
                  <p className="text-sm text-gray-400">Portail Group</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed text-lg">
                Votre portail vers l'excellence en conciergerie premium en Afrique de l'Ouest.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-orange-600 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-6">Nos Sites</h4>
              <ul className="space-y-3">
                <li className="text-gray-400 hover:text-white cursor-pointer transition-colors text-lg">Bossiz Côte d'Ivoire</li>
                <li className="text-gray-400 hover:text-white cursor-pointer transition-colors text-lg">Bossiz Sénégal</li>
                <li className="text-gray-400 hover:text-white cursor-pointer transition-colors text-lg">Réservations</li>
                <li className="text-gray-400 hover:text-white cursor-pointer transition-colors text-lg">Services Globaux</li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-6">Services Premium</h4>
              <ul className="space-y-3">
                <li className="text-gray-400 hover:text-white cursor-pointer transition-colors text-lg">Voyage & Tourisme</li>
                <li className="text-gray-400 hover:text-white cursor-pointer transition-colors text-lg">Immobilier & Patrimoine</li>
                <li className="text-gray-400 hover:text-white cursor-pointer transition-colors text-lg">Transport Premium</li>
                <li className="text-gray-400 hover:text-white cursor-pointer transition-colors text-lg">Événements & Célébrations</li>
                <li className="text-gray-400 hover:text-white cursor-pointer transition-colors text-lg">Hôtellerie & Restauration</li>
                <li className="text-gray-400 hover:text-white cursor-pointer transition-colors text-lg">Services VIP</li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-6">Contact Group</h4>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5" />
                  <span className="text-lg">+225 XX XX XX XX</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5" />
                  <span className="text-lg">group@bossiz.com</span>
                </li>
                <li className="flex items-center gap-3">
                  <Globe className="w-5 h-5" />
                  <span className="text-lg">www.bossiz.com</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-12">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-lg">
                &copy; 2026 BOSSIZ Group. Tous droits réservés.
              </p>
              <div className="flex space-x-8 mt-6 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-white text-lg transition-colors">Politique de confidentialité</a>
                <a href="#" className="text-gray-400 hover:text-white text-lg transition-colors">Conditions d'utilisation</a>
                <a href="#" className="text-gray-400 hover:text-white text-lg transition-colors">Mentions légales</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BossizPortal;
