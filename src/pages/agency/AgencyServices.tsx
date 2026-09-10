import { useState, useEffect } from "react";
import { AgencyLayout } from "@/components/agency/AgencyLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Plus, Pencil, Trash2, Package, Search } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Service {
  id: string;
  name: string;
  type: string;
  description: string | null;
  location: string;
  price_per_unit: number;
  currency: string;
  available: boolean;
  image_url: string | null;
  images: string[] | null;
  specifications: Record<string, any> | null;
  created_at: string;
}

const serviceTypes = [
  { value: "flight", label: "Vol" },
  { value: "hotel", label: "Hôtel" },
  { value: "car", label: "Voiture" },
  { value: "tour", label: "Circuit touristique" },
];

const carCategories = ["Mini", "Économique", "Compacte", "Berline", "SUV", "Luxe", "Monospace"];
const carTransmissions = ["Automatique", "Manuelle"];
const carFuels = ["Essence", "Diesel", "Hybride", "Électrique"];

const emptyCarSpecs = {
  brand: "",
  model: "",
  category: "Berline",
  seats: "5",
  doors: "4",
  transmission: "Automatique",
  fuel: "Essence",
  luggage: "3",
  year: new Date().getFullYear().toString(),
  unlimitedMileage: false,
  freeCancellation: false,
};

const emptyCarPhotos = { front: "", back: "", left: "", right: "", interior1: "", interior2: "" };

const tourCategories = ["Culture & Patrimoine", "Nature & Randonnée", "Aventure", "Plage & Détente", "Gastronomie", "Ville & Découverte"];
const tourDifficulties = ["Facile", "Modéré", "Difficile"];

const emptyTourSpecs = {
  duration: "",
  groupSizeMax: "10",
  meetingPoint: "",
  included: "",
  excluded: "",
  languages: "Français",
  difficulty: "Facile",
  category: "Culture & Patrimoine",
};

interface CarPlanLimit {
  name: string;
  max_vehicles: number | null;
}

export default function AgencyServices() {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [carPlan, setCarPlan] = useState<CarPlanLimit | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "hotel",
    description: "",
    location: "",
    price_per_unit: "",
    currency: "EUR",
    available: true,
    image_url: "",
    carSpecs: emptyCarSpecs,
    carPhotos: emptyCarPhotos,
    tourSpecs: emptyTourSpecs,
  });

  useEffect(() => {
    fetchAgencyAndServices();
  }, []);

  const fetchAgencyAndServices = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: agency } = await supabase
      .from("agencies")
      .select("id, car_plan_id")
      .eq("owner_id", user.id)
      .single();

    if (!agency) return;
    setAgencyId(agency.id);

    if (agency.car_plan_id) {
      const { data: plan } = await supabase
        .from("car_partner_plans")
        .select("name, max_vehicles")
        .eq("plan_id", agency.car_plan_id)
        .single();
      if (plan) setCarPlan(plan);
    }

    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("agency_id", agency.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching services:", error);
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyId) return;

    const isCarType = formData.type === "car";
    if (isCarType) {
      const { front, back, left, right, interior1, interior2 } = formData.carPhotos;
      if (!front || !back || !left || !right || !interior1 || !interior2) {
        toast({
          title: "Photos manquantes",
          description: "Les 4 photos extérieures et les 2 photos intérieures sont obligatoires.",
          variant: "destructive",
        });
        return;
      }

      if (!editingService && carPlan?.max_vehicles != null) {
        const currentCarCount = services.filter((s) => s.type === "car").length;
        if (currentCarCount >= carPlan.max_vehicles) {
          toast({
            title: "Limite du forfait atteinte",
            description: `Votre forfait ${carPlan.name} autorise jusqu'à ${carPlan.max_vehicles} véhicules. Passez à un forfait supérieur pour en ajouter davantage.`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    try {
      const isCar = formData.type === "car";
      const carPhotos = [
        formData.carPhotos.front,
        formData.carPhotos.back,
        formData.carPhotos.left,
        formData.carPhotos.right,
        formData.carPhotos.interior1,
        formData.carPhotos.interior2,
      ].filter(Boolean);

      const isTour = formData.type === "tour";
      const specifications = isCar
        ? {
            brand: formData.carSpecs.brand,
            model: formData.carSpecs.model,
            category: formData.carSpecs.category,
            seats: parseInt(formData.carSpecs.seats) || 5,
            doors: parseInt(formData.carSpecs.doors) || 4,
            transmission: formData.carSpecs.transmission,
            fuel: formData.carSpecs.fuel,
            luggage: parseInt(formData.carSpecs.luggage) || 3,
            year: parseInt(formData.carSpecs.year) || new Date().getFullYear(),
            unlimitedMileage: formData.carSpecs.unlimitedMileage,
            freeCancellation: formData.carSpecs.freeCancellation,
          }
        : isTour
        ? {
            duration: formData.tourSpecs.duration,
            groupSizeMax: parseInt(formData.tourSpecs.groupSizeMax) || 10,
            meetingPoint: formData.tourSpecs.meetingPoint,
            included: formData.tourSpecs.included,
            excluded: formData.tourSpecs.excluded,
            languages: formData.tourSpecs.languages,
            difficulty: formData.tourSpecs.difficulty,
            category: formData.tourSpecs.category,
          }
        : null;

      const serviceData = {
        name: formData.name,
        type: formData.type as any,
        description: formData.description || null,
        location: formData.location,
        price_per_unit: parseFloat(formData.price_per_unit),
        currency: formData.currency,
        available: formData.available,
        image_url: isCar ? (carPhotos[0] || null) : (formData.image_url || null),
        images: isCar && carPhotos.length > 0 ? carPhotos : null,
        specifications,
        agency_id: agencyId,
      };

      if (editingService) {
        const { error } = await supabase
          .from("services")
          .update(serviceData)
          .eq("id", editingService.id);

        if (error) throw error;
        toast({ title: "Succès", description: "Service mis à jour" });
      } else {
        const { error } = await supabase
          .from("services")
          .insert(serviceData);

        if (error) throw error;
        toast({ title: "Succès", description: "Service créé" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAgencyAndServices();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    const specs = service.specifications || {};
    const images = service.images || [];
    setFormData({
      name: service.name,
      type: service.type,
      description: service.description || "",
      location: service.location,
      price_per_unit: service.price_per_unit.toString(),
      currency: service.currency,
      available: service.available,
      image_url: service.image_url || "",
      carSpecs: service.type === "car"
        ? {
            brand: specs.brand || "",
            model: specs.model || "",
            category: specs.category || "Berline",
            seats: (specs.seats ?? 5).toString(),
            doors: (specs.doors ?? 4).toString(),
            transmission: specs.transmission || "Automatique",
            fuel: specs.fuel || "Essence",
            luggage: (specs.luggage ?? 3).toString(),
            year: (specs.year ?? new Date().getFullYear()).toString(),
            unlimitedMileage: !!specs.unlimitedMileage,
            freeCancellation: !!specs.freeCancellation,
          }
        : emptyCarSpecs,
      carPhotos: service.type === "car"
        ? {
            front: images[0] || "",
            back: images[1] || "",
            left: images[2] || "",
            right: images[3] || "",
            interior1: images[4] || "",
            interior2: images[5] || "",
          }
        : emptyCarPhotos,
      tourSpecs: service.type === "tour"
        ? {
            duration: specs.duration || "",
            groupSizeMax: (specs.groupSizeMax ?? 10).toString(),
            meetingPoint: specs.meetingPoint || "",
            included: specs.included || "",
            excluded: specs.excluded || "",
            languages: specs.languages || "Français",
            difficulty: specs.difficulty || "Facile",
            category: specs.category || "Culture & Patrimoine",
          }
        : emptyTourSpecs,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce service ?")) return;

    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Succès", description: "Service supprimé" });
      fetchAgencyAndServices();
    }
  };

  const resetForm = () => {
    setEditingService(null);
    setFormData({
      name: "",
      type: "hotel",
      description: "",
      location: "",
      price_per_unit: "",
      currency: "EUR",
      available: true,
      image_url: "",
      carSpecs: emptyCarSpecs,
      carPhotos: emptyCarPhotos,
      tourSpecs: emptyTourSpecs,
    });
  };

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AgencyLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Mes Services</h1>
            <p className="text-muted-foreground">Gérez vos services de voyage</p>
            {carPlan && (
              <Badge variant="outline" className="mt-2 gap-1.5">
                Forfait {carPlan.name} ·{" "}
                {carPlan.max_vehicles
                  ? `${services.filter((s) => s.type === "car").length} / ${carPlan.max_vehicles} véhicules`
                  : "véhicules illimités"}
              </Badge>
            )}
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nouveau Service</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingService ? "Modifier le service" : "Nouveau service"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(v) => setFormData({ ...formData, type: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {serviceTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Localisation *</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prix *</Label>
                    <Input
                      type="number"
                      value={formData.price_per_unit}
                      onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Devise</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(v) => setFormData({ ...formData, currency: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="XOF">XOF</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>
                {formData.type === "car" ? (
                  <div className="space-y-4 border-t pt-4">
                    <p className="text-sm font-medium">Caractéristiques du véhicule</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Marque *</Label>
                        <Input
                          placeholder="Ex: Toyota"
                          value={formData.carSpecs.brand}
                          onChange={(e) => setFormData({ ...formData, carSpecs: { ...formData.carSpecs, brand: e.target.value } })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Modèle *</Label>
                        <Input
                          placeholder="Ex: Corolla"
                          value={formData.carSpecs.model}
                          onChange={(e) => setFormData({ ...formData, carSpecs: { ...formData.carSpecs, model: e.target.value } })}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Catégorie *</Label>
                        <Select
                          value={formData.carSpecs.category}
                          onValueChange={(v) => setFormData({ ...formData, carSpecs: { ...formData.carSpecs, category: v } })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {carCategories.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Année</Label>
                        <Input
                          type="number"
                          min="1990"
                          max={new Date().getFullYear() + 1}
                          value={formData.carSpecs.year}
                          onChange={(e) => setFormData({ ...formData, carSpecs: { ...formData.carSpecs, year: e.target.value } })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Transmission *</Label>
                        <Select
                          value={formData.carSpecs.transmission}
                          onValueChange={(v) => setFormData({ ...formData, carSpecs: { ...formData.carSpecs, transmission: v } })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {carTransmissions.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Carburant *</Label>
                        <Select
                          value={formData.carSpecs.fuel}
                          onValueChange={(v) => setFormData({ ...formData, carSpecs: { ...formData.carSpecs, fuel: v } })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {carFuels.map((f) => (
                              <SelectItem key={f} value={f}>{f}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Places *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.carSpecs.seats}
                          onChange={(e) => setFormData({ ...formData, carSpecs: { ...formData.carSpecs, seats: e.target.value } })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Portes</Label>
                        <Input
                          type="number"
                          min="2"
                          value={formData.carSpecs.doors}
                          onChange={(e) => setFormData({ ...formData, carSpecs: { ...formData.carSpecs, doors: e.target.value } })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Bagages</Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.carSpecs.luggage}
                          onChange={(e) => setFormData({ ...formData, carSpecs: { ...formData.carSpecs, luggage: e.target.value } })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.carSpecs.unlimitedMileage}
                          onCheckedChange={(c) => setFormData({ ...formData, carSpecs: { ...formData.carSpecs, unlimitedMileage: c } })}
                        />
                        <Label>Kilométrage illimité</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.carSpecs.freeCancellation}
                          onCheckedChange={(c) => setFormData({ ...formData, carSpecs: { ...formData.carSpecs, freeCancellation: c } })}
                        />
                        <Label>Annulation gratuite</Label>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <p className="text-sm font-medium">Photos extérieures (4 côtés) *</p>
                      <div className="grid grid-cols-2 gap-4">
                        <ImageUpload
                          label="Avant"
                          folder="agency-cars"
                          value={formData.carPhotos.front}
                          onChange={(url) => setFormData({ ...formData, carPhotos: { ...formData.carPhotos, front: url } })}
                        />
                        <ImageUpload
                          label="Arrière"
                          folder="agency-cars"
                          value={formData.carPhotos.back}
                          onChange={(url) => setFormData({ ...formData, carPhotos: { ...formData.carPhotos, back: url } })}
                        />
                        <ImageUpload
                          label="Côté gauche"
                          folder="agency-cars"
                          value={formData.carPhotos.left}
                          onChange={(url) => setFormData({ ...formData, carPhotos: { ...formData.carPhotos, left: url } })}
                        />
                        <ImageUpload
                          label="Côté droit"
                          folder="agency-cars"
                          value={formData.carPhotos.right}
                          onChange={(url) => setFormData({ ...formData, carPhotos: { ...formData.carPhotos, right: url } })}
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <p className="text-sm font-medium">Photos intérieures (2 photos) *</p>
                      <div className="grid grid-cols-2 gap-4">
                        <ImageUpload
                          label="Intérieur 1"
                          folder="agency-cars"
                          value={formData.carPhotos.interior1}
                          onChange={(url) => setFormData({ ...formData, carPhotos: { ...formData.carPhotos, interior1: url } })}
                        />
                        <ImageUpload
                          label="Intérieur 2"
                          folder="agency-cars"
                          value={formData.carPhotos.interior2}
                          onChange={(url) => setFormData({ ...formData, carPhotos: { ...formData.carPhotos, interior2: url } })}
                        />
                      </div>
                    </div>
                  </div>
                ) : formData.type === "tour" ? (
                  <div className="space-y-4 border-t pt-4">
                    <p className="text-sm font-medium">Détails du circuit</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Durée *</Label>
                        <Input
                          placeholder="Ex: 1 jour, 3 jours / 2 nuits"
                          value={formData.tourSpecs.duration}
                          onChange={(e) => setFormData({ ...formData, tourSpecs: { ...formData.tourSpecs, duration: e.target.value } })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Taille du groupe (max) *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.tourSpecs.groupSizeMax}
                          onChange={(e) => setFormData({ ...formData, tourSpecs: { ...formData.tourSpecs, groupSizeMax: e.target.value } })}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Catégorie *</Label>
                        <Select
                          value={formData.tourSpecs.category}
                          onValueChange={(v) => setFormData({ ...formData, tourSpecs: { ...formData.tourSpecs, category: v } })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {tourCategories.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Difficulté</Label>
                        <Select
                          value={formData.tourSpecs.difficulty}
                          onValueChange={(v) => setFormData({ ...formData, tourSpecs: { ...formData.tourSpecs, difficulty: v } })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {tourDifficulties.map((d) => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Point de rendez-vous *</Label>
                      <Input
                        placeholder="Ex: Devant l'hôtel Ivoire, Abidjan"
                        value={formData.tourSpecs.meetingPoint}
                        onChange={(e) => setFormData({ ...formData, tourSpecs: { ...formData.tourSpecs, meetingPoint: e.target.value } })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Langues parlées</Label>
                      <Input
                        placeholder="Ex: Français, Anglais"
                        value={formData.tourSpecs.languages}
                        onChange={(e) => setFormData({ ...formData, tourSpecs: { ...formData.tourSpecs, languages: e.target.value } })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Inclus dans le prix</Label>
                      <Textarea
                        placeholder="Ex: Transport, guide, déjeuner"
                        value={formData.tourSpecs.included}
                        onChange={(e) => setFormData({ ...formData, tourSpecs: { ...formData.tourSpecs, included: e.target.value } })}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Non inclus</Label>
                      <Textarea
                        placeholder="Ex: Boissons, pourboires"
                        value={formData.tourSpecs.excluded}
                        onChange={(e) => setFormData({ ...formData, tourSpecs: { ...formData.tourSpecs, excluded: e.target.value } })}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Photo de couverture</Label>
                      <ImageUpload
                        label="Photo du circuit"
                        folder="agency-tours"
                        value={formData.image_url}
                        onChange={(url) => setFormData({ ...formData, image_url: url })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>URL Image</Label>
                    <Input
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.available}
                    onCheckedChange={(c) => setFormData({ ...formData, available: c })}
                  />
                  <Label>Disponible</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">{editingService ? "Mettre à jour" : "Créer"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Chargement...</TableCell>
                </TableRow>
              ) : filteredServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    Aucun service
                  </TableCell>
                </TableRow>
              ) : (
                filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {serviceTypes.find((t) => t.value === service.type)?.label || service.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{service.location}</TableCell>
                    <TableCell>{service.price_per_unit} {service.currency}</TableCell>
                    <TableCell>
                      <Badge variant={service.available ? "default" : "secondary"}>
                        {service.available ? "Disponible" : "Indisponible"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AgencyLayout>
  );
}