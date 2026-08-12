import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, Star, ArrowLeft, Clock, 
  Camera, Utensils, Mountain, Building2, Waves,
  ThermometerSun
} from "lucide-react";
import { useState, useEffect } from "react";
import { useDestinations } from "@/hooks/useDestinations";
import { useWeather, WeatherData } from "@/hooks/useWeather";
import { Price } from "@/components/ui/price";

// Destination-specific gallery images as fallback
const destinationGalleryMap: Record<string, string[]> = {
  'Paris': ['https://images.unsplash.com/photo-1549144511-f099e773c147?w=800&q=80','https://images.unsplash.com/photo-1431274172761-fca41d930114?w=800&q=80','https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94?w=800&q=80'],
  'Dubaï': ['https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80','https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=800&q=80','https://images.unsplash.com/photo-1546412414-e1885259563a?w=800&q=80'],
  'Maldives': ['https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80','https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80','https://images.unsplash.com/photo-1578922746465-3a80a228f223?w=800&q=80'],
  'Tokyo': ['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&q=80','https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80','https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80'],
  'Bali': ['https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&q=80','https://images.unsplash.com/photo-1573790387438-4da905039392?w=800&q=80','https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?w=800&q=80'],
  'New York': ['https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80','https://images.unsplash.com/photo-1522083165195-3424ed129620?w=800&q=80','https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=800&q=80'],
  'Santorini': ['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80','https://images.unsplash.com/photo-1571406252241-db0280bd36cd?w=800&q=80','https://images.unsplash.com/photo-1560703650-ef3e0f254ae0?w=800&q=80'],
  'Marrakech': ['https://images.unsplash.com/photo-1587974928442-77dc3e0748b1?w=800&q=80','https://images.unsplash.com/photo-1509735579945-1d10071d0cb4?w=800&q=80','https://images.unsplash.com/photo-1548820492-2c9fadb873c3?w=800&q=80'],
  'Barcelona': ['https://images.unsplash.com/photo-1562883676-8c7feb83f09b?w=800&q=80','https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800&q=80','https://images.unsplash.com/photo-1529551739587-e242c564f727?w=800&q=80'],
};

function getDestinationGalleryImages(name: string): string[] {
  return destinationGalleryMap[name] || [
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
  ];
}

const DestinationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState(0);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const { data: destinations } = useDestinations();
  const { getWeather } = useWeather();
  const destination = destinations?.find(d => d.id === id);

  useEffect(() => {
    if (destination?.name) {
      getWeather(destination.name).then(data => {
        if (data) setWeather(data);
      });
    }
  }, [destination?.name]);

  if (!destination) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Destination non trouvée</h2>
          <Button onClick={() => navigate("/")}>Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  // Use destination's own images for gallery, deduplicate
  const rawImages = [destination.image, ...(destination.images || [])];
  const uniqueImages = [...new Set(rawImages)].filter(Boolean);
  const galleryImages = uniqueImages.length >= 2 ? uniqueImages : [
    destination.image,
    ...getDestinationGalleryImages(destination.name),
  ];


  // Generate activities based on destination category
  const destinationActivitiesMap: Record<string, typeof defaultActivities> = {
    'Paris': [
      { icon: Camera, name: "Tour Eiffel & Croisière Seine", duration: "4h", price: "35 000 FCFA", description: "Montez au sommet de la Tour Eiffel puis croisière panoramique sur la Seine" },
      { icon: Building2, name: "Musée du Louvre guidé", duration: "3h", price: "28 000 FCFA", description: "Découvrez la Joconde et les chefs-d'œuvre avec un guide expert" },
      { icon: Utensils, name: "Dégustation dans le Marais", duration: "2h30", price: "40 000 FCFA", description: "Fromages, vins et pâtisseries dans le quartier historique du Marais" },
      { icon: Mountain, name: "Versailles & ses jardins", duration: "6h", price: "55 000 FCFA", description: "Excursion au Château de Versailles avec visite des jardins royaux" },
      { icon: Waves, name: "Balade en bateau-mouche", duration: "1h30", price: "20 000 FCFA", description: "Navigation commentée passant sous les ponts historiques de Paris" },
      { icon: ThermometerSun, name: "Montmartre & Sacré-Cœur", duration: "3h", price: "22 000 FCFA", description: "Promenade artistique à Montmartre, vignes et vue panoramique" },
    ],
    'Dubai': [
      { icon: Building2, name: "Burj Khalifa & Dubai Mall", duration: "4h", price: "45 000 FCFA", description: "Montée au 148e étage du plus haut gratte-ciel et shopping au Dubai Mall" },
      { icon: ThermometerSun, name: "Safari dans le désert", duration: "6h", price: "65 000 FCFA", description: "Dunes bashing en 4x4, balade en chameau et dîner bédouin sous les étoiles" },
      { icon: Waves, name: "Croisière en dhow", duration: "2h", price: "30 000 FCFA", description: "Dîner-croisière traditionnelle sur la Creek de Dubai au coucher du soleil" },
      { icon: Camera, name: "Vieux Dubai & souks", duration: "3h", price: "20 000 FCFA", description: "Découverte du quartier historique, souk de l'or et souk des épices" },
      { icon: Utensils, name: "Brunch panoramique", duration: "2h", price: "50 000 FCFA", description: "Brunch gastronomique avec vue sur la skyline depuis un rooftop" },
      { icon: Mountain, name: "Excursion à Abu Dhabi", duration: "Full day", price: "75 000 FCFA", description: "Grande Mosquée Sheikh Zayed, Louvre Abu Dhabi et corniche" },
    ],
    'Tokyo': [
      { icon: Building2, name: "Temples & sanctuaires", duration: "4h", price: "25 000 FCFA", description: "Visite du Senso-ji à Asakusa et du sanctuaire Meiji à Harajuku" },
      { icon: Utensils, name: "Street food à Tsukiji", duration: "2h30", price: "30 000 FCFA", description: "Dégustation de sushi frais, takoyaki et spécialités au marché extérieur" },
      { icon: Camera, name: "Shibuya & Harajuku", duration: "3h", price: "18 000 FCFA", description: "Traversée du célèbre carrefour, mode kawaii et culture pop japonaise" },
      { icon: Mountain, name: "Excursion Mont Fuji", duration: "Full day", price: "80 000 FCFA", description: "Journée au pied du Mont Fuji avec lac Kawaguchi et onsen traditionnel" },
      { icon: ThermometerSun, name: "Cérémonie du thé", duration: "1h30", price: "22 000 FCFA", description: "Initiation à la cérémonie du thé dans une maison traditionnelle" },
      { icon: Waves, name: "Croisière baie de Tokyo", duration: "2h", price: "35 000 FCFA", description: "Navigation dans la baie avec vue sur Rainbow Bridge et Odaiba" },
    ],
    'Bali': [
      { icon: Mountain, name: "Rizières de Tegallalang", duration: "4h", price: "20 000 FCFA", description: "Trek dans les rizières en terrasses classées UNESCO" },
      { icon: Waves, name: "Surf à Kuta Beach", duration: "3h", price: "25 000 FCFA", description: "Cours de surf pour débutants sur les vagues douces de Kuta" },
      { icon: Building2, name: "Temples sacrés d'Ubud", duration: "5h", price: "28 000 FCFA", description: "Visite de Tirta Empul, Goa Gajah et de la forêt des singes" },
      { icon: ThermometerSun, name: "Lever de soleil au Mont Batur", duration: "6h", price: "35 000 FCFA", description: "Randonnée nocturne pour admirer le lever de soleil sur le volcan" },
      { icon: Utensils, name: "Cours de cuisine balinaise", duration: "4h", price: "30 000 FCFA", description: "Marché local et préparation de plats traditionnels avec un chef" },
      { icon: Camera, name: "Cascades de Sekumpul", duration: "5h", price: "22 000 FCFA", description: "Randonnée tropicale vers les plus belles cascades de Bali" },
    ],
    'New York': [
      { icon: Building2, name: "Empire State & Times Square", duration: "3h", price: "30 000 FCFA", description: "Vue panoramique depuis l'Empire State et immersion à Times Square" },
      { icon: Camera, name: "Statue de la Liberté", duration: "4h", price: "35 000 FCFA", description: "Ferry vers Liberty Island et Ellis Island avec audio-guide" },
      { icon: Mountain, name: "Central Park à vélo", duration: "2h30", price: "18 000 FCFA", description: "Balade à vélo dans le poumon vert de Manhattan" },
      { icon: Utensils, name: "Food tour à Brooklyn", duration: "3h", price: "40 000 FCFA", description: "Pizza, bagels et spécialités de Brooklyn avec un guide foodie" },
      { icon: Waves, name: "Croisière autour de Manhattan", duration: "2h", price: "28 000 FCFA", description: "Tour complet de l'île avec vues sur la skyline et les ponts" },
      { icon: ThermometerSun, name: "Broadway & spectacle", duration: "4h", price: "65 000 FCFA", description: "Visite du quartier des théâtres et billet pour un spectacle Broadway" },
    ],
    'Marrakech': [
      { icon: Building2, name: "Médina & souks", duration: "3h", price: "15 000 FCFA", description: "Plongée dans le labyrinthe coloré des souks avec guide local" },
      { icon: Utensils, name: "Cours de cuisine marocaine", duration: "4h", price: "25 000 FCFA", description: "Préparez tagine, couscous et pastilla dans un riad traditionnel" },
      { icon: Mountain, name: "Excursion Atlas", duration: "Full day", price: "45 000 FCFA", description: "Randonnée dans les montagnes de l'Atlas et villages berbères" },
      { icon: ThermometerSun, name: "Hammam & spa", duration: "2h", price: "20 000 FCFA", description: "Rituel de hammam traditionnel avec gommage et massage" },
      { icon: Camera, name: "Jardin Majorelle & palais", duration: "3h", price: "18 000 FCFA", description: "Visite du jardin Majorelle, Palais Bahia et tombeaux Saadiens" },
      { icon: Waves, name: "Excursion Essaouira", duration: "Full day", price: "40 000 FCFA", description: "Journée dans la cité portuaire avec médina, plage et poisson frais" },
    ],
    'Abidjan': [
      { icon: Camera, name: "Tour du Plateau", duration: "3h", price: "12 000 FCFA", description: "Découverte du quartier d'affaires, cathédrale Saint-Paul et marché" },
      { icon: Waves, name: "Plages de Grand-Bassam", duration: "Full day", price: "20 000 FCFA", description: "Journée balnéaire dans la cité historique classée UNESCO" },
      { icon: Utensils, name: "Maquis & street food", duration: "3h", price: "15 000 FCFA", description: "Tour des meilleurs maquis pour attiéké, alloco et grillades" },
      { icon: Building2, name: "Musée des civilisations", duration: "2h", price: "8 000 FCFA", description: "Art et histoire de la Côte d'Ivoire au musée d'Abidjan" },
      { icon: Mountain, name: "Parc du Banco", duration: "4h", price: "10 000 FCFA", description: "Randonnée en forêt tropicale au cœur de la ville" },
      { icon: ThermometerSun, name: "Île Boulay en pirogue", duration: "5h", price: "18 000 FCFA", description: "Traversée en pirogue et découverte de la vie insulaire lagunaire" },
    ],
    'Dakar': [
      { icon: Camera, name: "Île de Gorée", duration: "4h", price: "15 000 FCFA", description: "Visite historique de l'île classée UNESCO, Maison des Esclaves" },
      { icon: Waves, name: "Surf à Ngor", duration: "3h", price: "20 000 FCFA", description: "Cours de surf sur les spots réputés de la presqu'île de Ngor" },
      { icon: Utensils, name: "Thiéboudienne & saveurs", duration: "3h", price: "18 000 FCFA", description: "Dégustation du plat national et spécialités sénégalaises" },
      { icon: Mountain, name: "Lac Rose", duration: "Full day", price: "30 000 FCFA", description: "Excursion au Lac Retba avec baignade et villages de pêcheurs" },
      { icon: Building2, name: "Monument de la Renaissance", duration: "2h", price: "10 000 FCFA", description: "Visite du monument et vue panoramique sur Dakar" },
      { icon: ThermometerSun, name: "Marché Sandaga", duration: "2h", price: "8 000 FCFA", description: "Immersion dans le plus grand marché de Dakar, tissus et artisanat" },
    ],
  };

  const defaultActivities = [
    { icon: Camera, name: "Visite guidée de la ville", duration: "3-4h", price: "25 000 FCFA", description: "Explorez les sites emblématiques avec un guide local expérimenté" },
    { icon: Utensils, name: "Découverte gastronomique", duration: "2-3h", price: "35 000 FCFA", description: "Dégustez les spécialités culinaires locales authentiques" },
    { icon: Mountain, name: "Randonnée & Nature", duration: "5-6h", price: "40 000 FCFA", description: "Parcourez les paysages naturels spectaculaires de la région" },
    { icon: Building2, name: "Patrimoine culturel", duration: "4-5h", price: "30 000 FCFA", description: "Visitez les monuments historiques et musées incontournables" },
    { icon: Waves, name: "Activités nautiques", duration: "2-3h", price: "45 000 FCFA", description: "Sports et loisirs aquatiques pour tous les niveaux" },
    { icon: ThermometerSun, name: "Expérience locale", duration: "Full day", price: "50 000 FCFA", description: "Immersion complète dans la culture et les traditions locales" },
  ];

  const destName = destination?.name || '';
  const activities = destinationActivitiesMap[destName] || defaultActivities;

  const availabilities = [
    { date: "Aujourd'hui", slots: 5, status: "available" },
    { date: "Demain", slots: 8, status: "available" },
    { date: new Date(Date.now() + 2 * 86400000).toLocaleDateString('fr-FR'), slots: 3, status: "limited" },
    { date: new Date(Date.now() + 3 * 86400000).toLocaleDateString('fr-FR'), slots: 0, status: "full" },
    { date: new Date(Date.now() + 4 * 86400000).toLocaleDateString('fr-FR'), slots: 12, status: "available" },
  ];

  const destinationReviewsMap: Record<string, typeof defaultReviews> = {
    'Paris': [
      { author: "Aminata Diallo", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aminata", rating: 5, date: "Il y a 1 semaine", comment: "Paris est magique ! La Tour Eiffel illuminée le soir et les croissants chauds le matin, un vrai rêve éveillé." },
      { author: "Kouamé Yao", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kouame", rating: 4, date: "Il y a 3 semaines", comment: "Le Louvre est immense, prévoyez une journée entière. Les quais de Seine sont parfaits pour se balader." },
      { author: "Fatou Sow", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fatou", rating: 5, date: "Il y a 1 mois", comment: "Montmartre est mon coup de cœur ! Ambiance bohème et vue exceptionnelle sur tout Paris." },
    ],
    'Dubai': [
      { author: "Ibrahim Koné", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ibrahim", rating: 5, date: "Il y a 2 semaines", comment: "Le safari dans le désert est absolument incroyable. Le dîner sous les étoiles restera gravé dans ma mémoire." },
      { author: "Awa Traoré", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Awa", rating: 5, date: "Il y a 1 mois", comment: "Dubai dépasse toutes les attentes ! Le Burj Khalifa au coucher du soleil, c'est juste extraordinaire." },
      { author: "Moussa Camara", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Moussa", rating: 4, date: "Il y a 2 mois", comment: "Le Dubai Mall est gigantesque. Les souks traditionnels offrent un beau contraste avec la modernité." },
    ],
    'Abidjan': [
      { author: "Adjoua Kouassi", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Adjoua", rating: 5, date: "Il y a 1 semaine", comment: "Grand-Bassam est magnifique ! La plage et la cité historique, un mélange parfait de détente et culture." },
      { author: "Seydou Ouattara", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Seydou", rating: 4, date: "Il y a 2 semaines", comment: "Le Parc du Banco est une vraie surprise au cœur d'Abidjan. Nature et tranquillité garanties." },
      { author: "Marie-Laure Aka", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=MarieLaure", rating: 5, date: "Il y a 1 mois", comment: "Les maquis d'Abidjan sont incontournables ! Attiéké poisson braisé, un régal absolu." },
    ],
    'Dakar': [
      { author: "Ousmane Ndiaye", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ousmane", rating: 5, date: "Il y a 1 semaine", comment: "L'île de Gorée est un lieu chargé d'histoire. Émouvant et magnifique, à visiter absolument." },
      { author: "Aïssatou Ba", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aissatou", rating: 5, date: "Il y a 3 semaines", comment: "Le Lac Rose est spectaculaire ! Les couleurs changent selon la lumière, c'est fascinant." },
      { author: "Pape Diop", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pape", rating: 4, date: "Il y a 1 mois", comment: "Dakar est vivante et accueillante. Le thiéboudienne sur la corniche, moment parfait." },
    ],
  };

  const defaultReviews = [
    { author: "Marie Dubois", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marie", rating: 5, date: "Il y a 2 semaines", comment: "Destination absolument magnifique ! L'accueil était chaleureux et les paysages à couper le souffle." },
    { author: "Jean Martin", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jean", rating: 4, date: "Il y a 1 mois", comment: "Très belle expérience. Quelques points d'amélioration mais globalement très satisfait." },
    { author: "Sophie Laurent", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie", rating: 5, date: "Il y a 2 mois", comment: "Un voyage inoubliable ! Je recommande vivement cette destination." },
  ];

  const reviews = destinationReviewsMap[destName] || defaultReviews;

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background border-b">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>

      {/* Gallery Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Main Image */}
            <div className="space-y-4">
              <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={galleryImages[selectedImage]}
                  alt={destination.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Thumbnail Gallery */}
              <div className="grid grid-cols-4 gap-4">
                {galleryImages.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative h-24 rounded-lg overflow-hidden cursor-pointer transition-all ${
                      selectedImage === idx ? "ring-4 ring-primary" : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>

            {/* Info Section */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{destination.location}</span>
                </div>
                <h1 className="text-4xl font-bold mb-4">{destination.name}</h1>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-secondary text-secondary" />
                    <span className="font-semibold">{destination.rating}</span>
                    <span className="text-muted-foreground">({destination.reviews} avis)</span>
                  </div>
                </div>
                <p className="text-lg text-muted-foreground">{destination.description}</p>
              </div>

              {/* Weather Widget */}
              {weather && (
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Météo actuelle</h3>
                        <div className="flex items-center gap-4">
                          <ThermometerSun className="w-8 h-8 text-orange-500" />
                          <div>
                            <p className="text-3xl font-bold">{weather.temperature}°C</p>
                            <p className="text-muted-foreground capitalize">{weather.condition}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Humidité: {weather.humidity}%</p>
                        <p className="text-sm text-muted-foreground">Vent: {weather.windSpeed} km/h</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Booking Card */}
              <Card className="bg-gradient-card shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-baseline justify-between mb-4">
                    <div>
                      <span className="text-3xl font-bold text-primary">
                        <Price amount={typeof destination.price === 'number' ? destination.price : parseFloat(String(destination.price).replace(/\s/g, '')) || 0} fromCurrency="EUR" />
                      </span>
                      <span className="text-muted-foreground ml-2">/ nuit</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full gradient-primary shadow-primary hover:shadow-xl transition-all"
                    onClick={() => {
                      const priceStr = typeof destination.price === 'number' ? String(destination.price) : String(destination.price).replace(/\s/g, '');
                      const params = new URLSearchParams({
                        type: 'stay',
                        name: destination.name,
                        price: priceStr,
                        currency: 'EUR',
                        location: destination.location,
                        serviceId: destination.id,
                      });
                      navigate(`/booking/stay?${params.toString()}`);
                    }}
                  >
                    Réserver maintenant
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Details Section */}
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-2xl font-bold">À propos de cette destination</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {destination.description}
                  </p>
                  
                  {/* Category Badge */}
                  {destination.category && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-muted-foreground">Catégorie:</span>
                        <Badge variant="secondary" className="text-sm">
                          {destination.category}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Amenities */}
                  {destination.amenities && destination.amenities.length > 0 && (
                    <div className="pt-4 border-t space-y-3">
                      <h4 className="font-semibold text-lg">Équipements et services</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {destination.amenities.map((amenity, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <span>{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Highlights */}
                  {destination.highlights && destination.highlights.length > 0 && (
                    <div className="pt-4 border-t space-y-3">
                      <h4 className="font-semibold text-lg">Points forts</h4>
                      <div className="space-y-2">
                        {destination.highlights.map((highlight, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <Star className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground">{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Availability Card */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-xl font-bold">Disponibilités</h3>
                  <div className="space-y-3">
                    {availabilities.map((avail, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm font-medium">{avail.date}</span>
                        <div className="flex items-center gap-2">
                          {avail.status === 'available' && (
                            <>
                              <span className="text-xs text-muted-foreground">{avail.slots} places</span>
                              <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20">
                                Disponible
                              </Badge>
                            </>
                          )}
                          {avail.status === 'limited' && (
                            <>
                              <span className="text-xs text-muted-foreground">{avail.slots} places</span>
                              <Badge className="bg-orange-500/10 text-orange-700 hover:bg-orange-500/20">
                                Limité
                              </Badge>
                            </>
                          )}
                          {avail.status === 'full' && (
                            <Badge variant="destructive" className="opacity-60">
                              Complet
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Info */}
              <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardContent className="p-6 space-y-3">
                  <h3 className="text-lg font-bold">Informations pratiques</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>Check-in: 14h00 - Check-out: 11h00</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{destination.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary" />
                      <span>Annulation gratuite jusqu'à 24h avant</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="activities" className="mt-12">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="activities">Activités & Excursions</TabsTrigger>
              <TabsTrigger value="reviews">Avis Clients ({reviews.length})</TabsTrigger>
            </TabsList>

            {/* Activities Tab */}
            <TabsContent value="activities" className="mt-6">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Activités et excursions disponibles</h3>
                <p className="text-muted-foreground">
                  Profitez d'une large gamme d'activités pour enrichir votre séjour
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activities.map((activity, idx) => (
                  <Card key={idx} className="hover:shadow-lg transition-all hover-lift group">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-all">
                          <activity.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg mb-1">{activity.name}</h3>
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>Durée: {activity.duration}</span>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t">
                            <p className="text-primary font-bold text-lg">{activity.price}</p>
                            <Button size="sm" variant="outline" className="hover:bg-primary/5">
                              Réserver
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="mt-6">
              {/* Rating Summary */}
              <Card className="mb-6 bg-gradient-to-br from-secondary/5 to-primary/5">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-primary mb-2">{destination.rating}</div>
                      <div className="flex items-center gap-1 justify-center mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.floor(destination.rating)
                                ? "fill-secondary text-secondary"
                                : "text-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">{destination.reviews} avis</p>
                    </div>
                    <div className="flex-1 space-y-2 w-full">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const percentage = Math.random() * 100; // Simulé
                        return (
                          <div key={stars} className="flex items-center gap-3">
                            <span className="text-sm font-medium w-12">{stars} ⭐</span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-secondary rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-12 text-right">
                              {Math.round(percentage)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Individual Reviews */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4">Avis des voyageurs</h3>
                {reviews.map((review, idx) => (
                  <Card key={idx} className="hover:shadow-md transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={review.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {review.author[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-lg">{review.author}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < review.rating
                                          ? "fill-secondary text-secondary"
                                          : "text-muted"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  Séjour vérifié
                                </Badge>
                              </div>
                            </div>
                            <span className="text-sm text-muted-foreground whitespace-nowrap">{review.date}</span>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">{review.comment}</p>
                          <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm">
                            <button className="text-muted-foreground hover:text-primary transition-colors">
                              👍 Utile (12)
                            </button>
                            <button className="text-muted-foreground hover:text-primary transition-colors">
                              Répondre
                            </button>
                          </div>
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

export default DestinationDetail;
