import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import type { Database, Json } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { LocationPicker, type PartnerLocation } from "@/components/agency/LocationPicker";
import { AvailableDatesInput } from "@/components/agency/AvailableDatesInput";
import { Plus, Pencil, Trash2, Package, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/config";

interface Service {
  id: string;
  name: string;
  type: string;
  description: string | null;
  location: string;
  maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
  available_dates: string[];
  price_per_unit: number;
  currency: string;
  available: boolean;
  image_url: string | null;
  images: string[] | null;
  specifications: Json | null;
  created_at: string;
}

const serviceTypes = [
  { value: "flight", get label() { return i18n.t("ux.bo.flight"); } },
  { value: "hotel", get label() { return i18n.t("ux.bo.hotel"); } },
  { value: "car", get label() { return i18n.t("ux.bo.car"); } },
  { value: "tour", get label() { return i18n.t("ux.bo.guidedTour"); } },
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
  availableDates: [] as string[],
};

interface CarPlanLimit {
  name: string;
  max_vehicles: number | null;
}

export default function AgencyServices() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const typeFilter = searchParams.get("type");
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
    maps_url: "",
    latitude: null as number | null,
    longitude: null as number | null,
    price_per_unit: "",
    currency: "XOF",
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
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!agency) return;
    setAgencyId(agency.id);
    setCarPlan(null);

    const now = new Date().toISOString();
    const { data: activeSubscription } = await supabase
      .from("car_partner_subscriptions")
      .select("plan_id")
      .eq("agency_id", agency.id)
      .eq("status", "active")
      .lte("starts_at", now)
      .gt("ends_at", now)
      .order("ends_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeSubscription?.plan_id) {
      const { data: plan } = await supabase
        .from("car_partner_plans")
        .select("name, max_vehicles")
        .eq("plan_id", activeSubscription.plan_id)
        .single();
      if (plan) setCarPlan(plan);
    } else {
      setCarPlan(null);
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
      if (!carPlan && (!editingService || editingService.type !== "car" || !editingService.available && formData.available)) {
        toast({
          title: t("ux.bo.paidPlanRequired"),
          description: t("ux.bo.subscribePaidCarPlanWait"),
          variant: "destructive",
        });
        return;
      }

      const { front, back, left, right, interior1, interior2 } = formData.carPhotos;
      if (!front || !back || !left || !right || !interior1 || !interior2) {
        toast({
          title: t("ux.bo.missingPhotos"),
          description: t("ux.bo.n4ExteriorPhotos2Interior"),
          variant: "destructive",
        });
        return;
      }

      if (!editingService && carPlan?.max_vehicles != null) {
        const currentCarCount = services.filter((s) => s.type === "car").length;
        if (currentCarCount >= carPlan.max_vehicles) {
          toast({
            title: t("ux.bo.planLimitReached"),
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
            availableDates: formData.tourSpecs.availableDates,
          }
        : null;

      const serviceData = {
        name: formData.name,
        type: formData.type as Database["public"]["Enums"]["service_type"],
        description: formData.description || null,
        location: formData.location,
        maps_url: formData.maps_url || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        available_dates: isTour ? formData.tourSpecs.availableDates : [],
        price_per_unit: parseFloat(formData.price_per_unit),
        currency: "XOF",
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
        toast({ title: t("ux.bo.success"), description: t("ux.bo.serviceUpdated") });
      } else {
        const { error } = await supabase
          .from("services")
          .insert(serviceData);

        if (error) throw error;
        toast({ title: t("ux.bo.success"), description: t("ux.bo.serviceCreated") });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAgencyAndServices();
    } catch (error: unknown) {
      toast({
        title: t("ux.bo.error"),
        description: error instanceof Error ? error.message : t("ux.bo.unableSaveService2"),
        variant: "destructive",
      });
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    const specs: Record<string, Json | undefined> =
      service.specifications && typeof service.specifications === "object" && !Array.isArray(service.specifications)
        ? service.specifications as Record<string, Json | undefined>
        : {};
    const stringSpec = (key: string, fallback: string) =>
      typeof specs[key] === "string" ? specs[key] as string : fallback;
    const numberSpec = (key: string, fallback: number) => {
      const value = specs[key];
      return typeof value === "number" || typeof value === "string" ? String(value) : String(fallback);
    };
    const images = service.images || [];
    setFormData({
      name: service.name,
      type: service.type,
      description: service.description || "",
      location: service.location,
      maps_url: service.maps_url || "",
      latitude: service.latitude,
      longitude: service.longitude,
      price_per_unit: service.price_per_unit.toString(),
      currency: service.currency,
      available: service.available,
      image_url: service.image_url || "",
      carSpecs: service.type === "car"
        ? {
            brand: stringSpec("brand", ""),
            model: stringSpec("model", ""),
            category: stringSpec("category", "Berline"),
            seats: numberSpec("seats", 5),
            doors: numberSpec("doors", 4),
            transmission: stringSpec("transmission", "Automatique"),
            fuel: stringSpec("fuel", "Essence"),
            luggage: numberSpec("luggage", 3),
            year: numberSpec("year", new Date().getFullYear()),
            unlimitedMileage: specs.unlimitedMileage === true,
            freeCancellation: specs.freeCancellation === true,
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
            duration: stringSpec("duration", ""),
            groupSizeMax: numberSpec("groupSizeMax", 10),
            meetingPoint: stringSpec("meetingPoint", ""),
            included: stringSpec("included", ""),
            excluded: stringSpec("excluded", ""),
            languages: stringSpec("languages", "Français"),
            difficulty: stringSpec("difficulty", "Facile"),
            category: stringSpec("category", "Culture & Patrimoine"),
            availableDates: service.available_dates || [],
          }
        : emptyTourSpecs,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("ux.bo.deleteService"))) return;

    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) {
      toast({ title: t("ux.bo.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("ux.bo.success"), description: t("ux.bo.serviceDeleted") });
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
      maps_url: "",
      latitude: null,
      longitude: null,
      price_per_unit: "",
      currency: "XOF",
      available: true,
      image_url: "",
      carSpecs: emptyCarSpecs,
      carPhotos: emptyCarPhotos,
      tourSpecs: emptyTourSpecs,
    });
  };

  const filteredServices = services.filter((s) =>
    (!typeFilter || s.type === typeFilter) &&
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AgencyLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{typeFilter === "tour" ? t("ux.bo.myTours") : "Mes Services"}</h1>
            <p className="text-muted-foreground">{typeFilter === "tour" ? t("ux.bo.manageTours") : t("ux.bo.manageTravelServices")}</p>
            {!carPlan && (
              <p className="mt-2 text-sm text-warning-foreground">
                Aucun forfait voiture payant actif. Les nouvelles annonces de véhicules sont bloquées jusqu'à confirmation du paiement.{" "}
                <a href="/partenaires/voitures" className="font-medium underline">{t("ux.bo.seePlans")}</a>
              </p>
            )}
            {carPlan && (
              <Badge variant="outline" className="mt-2 gap-1.5">
                Forfait {carPlan.name} ·{" "}
                {carPlan.max_vehicles
                  ? `${services.filter((s) => s.type === "car").length} / ${carPlan.max_vehicles} véhicules`
                  : t("ux.bo.unlimitedVehicles")}
              </Badge>
            )}
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />{t("ux.bo.newService")}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingService ? t("ux.bo.editService") : t("ux.bo.newService2")}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("ux.bo.name2")}</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("ux.bo.type2")}</Label>
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
                <LocationPicker
                  value={{ location: formData.location, maps_url: formData.maps_url, latitude: formData.latitude, longitude: formData.longitude }}
                  onChange={(location: PartnerLocation) => setFormData({ ...formData, ...location })}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("ux.bo.price2")}</Label>
                    <Input
                      type="number"
                      value={formData.price_per_unit}
                      onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex items-end pb-2 text-sm text-muted-foreground">{t("ux.bo.priceShownChargedXofFcfa")}</div>
                </div>
                <div className="space-y-2">
                  <Label>{t("ux.bo.description")}</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>
                {formData.type === "car" ? (
                  <div className="space-y-4 border-t pt-4">
                    <p className="text-sm font-medium">{t("ux.bo.vehicleSpecifications")}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t("ux.bo.make")}</Label>
                        <Input
                          placeholder={t("ux.bo.eGToyota")}
                          value={formData.carSpecs.brand}
                          onChange={(e) => setFormData({ ...formData, carSpecs: { ...formData.carSpecs, brand: e.target.value } })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("ux.bo.model")}</Label>
                        <Input
                          placeholder={t("ux.bo.eGCorolla")}
                          value={formData.carSpecs.model}
                          onChange={(e) => setFormData({ ...formData, carSpecs: { ...formData.carSpecs, model: e.target.value } })}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t("ux.bo.category2")}</Label>
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
                        <Label>{t("ux.bo.year")}</Label>
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
                        <Label>{t("ux.bo.transmission")}</Label>
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
                        <Label>{t("ux.bo.fuel")}</Label>
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
                        <Label>{t("ux.bo.seats")}</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.carSpecs.seats}
                          onChange={(e) => setFormData({ ...formData, carSpecs: { ...formData.carSpecs, seats: e.target.value } })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("ux.bo.doors")}</Label>
                        <Input
                          type="number"
                          min="2"
                          value={formData.carSpecs.doors}
                          onChange={(e) => setFormData({ ...formData, carSpecs: { ...formData.carSpecs, doors: e.target.value } })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("ux.bo.luggage")}</Label>
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
                        <Label>{t("ux.bo.unlimitedMileage")}</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.carSpecs.freeCancellation}
                          onCheckedChange={(c) => setFormData({ ...formData, carSpecs: { ...formData.carSpecs, freeCancellation: c } })}
                        />
                        <Label>{t("ux.bo.freeCancellation")}</Label>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <p className="text-sm font-medium">{t("ux.bo.exteriorPhotos4Sides")}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <ImageUpload
                          label={t("ux.bo.front")}
                          folder="agency-cars"
                          value={formData.carPhotos.front}
                          onChange={(url) => setFormData({ ...formData, carPhotos: { ...formData.carPhotos, front: url } })}
                        />
                        <ImageUpload
                          label={t("ux.bo.rear")}
                          folder="agency-cars"
                          value={formData.carPhotos.back}
                          onChange={(url) => setFormData({ ...formData, carPhotos: { ...formData.carPhotos, back: url } })}
                        />
                        <ImageUpload
                          label={t("ux.bo.leftSide")}
                          folder="agency-cars"
                          value={formData.carPhotos.left}
                          onChange={(url) => setFormData({ ...formData, carPhotos: { ...formData.carPhotos, left: url } })}
                        />
                        <ImageUpload
                          label={t("ux.bo.rightSide")}
                          folder="agency-cars"
                          value={formData.carPhotos.right}
                          onChange={(url) => setFormData({ ...formData, carPhotos: { ...formData.carPhotos, right: url } })}
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <p className="text-sm font-medium">{t("ux.bo.interiorPhotos2Photos")}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <ImageUpload
                          label={t("ux.bo.interior1")}
                          folder="agency-cars"
                          value={formData.carPhotos.interior1}
                          onChange={(url) => setFormData({ ...formData, carPhotos: { ...formData.carPhotos, interior1: url } })}
                        />
                        <ImageUpload
                          label={t("ux.bo.interior2")}
                          folder="agency-cars"
                          value={formData.carPhotos.interior2}
                          onChange={(url) => setFormData({ ...formData, carPhotos: { ...formData.carPhotos, interior2: url } })}
                        />
                      </div>
                    </div>
                  </div>
                ) : formData.type === "tour" ? (
                  <div className="space-y-4 border-t pt-4">
                    <p className="text-sm font-medium">{t("ux.bo.tourDetails")}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t("ux.bo.duration2")}</Label>
                        <Input
                          placeholder={t("ux.bo.eG1Day3")}
                          value={formData.tourSpecs.duration}
                          onChange={(e) => setFormData({ ...formData, tourSpecs: { ...formData.tourSpecs, duration: e.target.value } })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("ux.bo.groupSizeMax")}</Label>
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
                        <Label>{t("ux.bo.category2")}</Label>
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
                        <Label>{t("ux.bo.difficulty")}</Label>
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
                    <AvailableDatesInput dates={formData.tourSpecs.availableDates} onChange={(availableDates) => setFormData({ ...formData, tourSpecs: { ...formData.tourSpecs, availableDates } })} label={t("ux.bo.tourDepartureDates")} />
                    <div className="space-y-2">
                      <Label>{t("ux.bo.meetingPoint")}</Label>
                      <Input
                        placeholder={t("ux.bo.eGFrontHotelIvoire")}
                        value={formData.tourSpecs.meetingPoint}
                        onChange={(e) => setFormData({ ...formData, tourSpecs: { ...formData.tourSpecs, meetingPoint: e.target.value } })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("ux.bo.languagesSpoken")}</Label>
                      <Input
                        placeholder={t("ux.bo.eGFrenchEnglish")}
                        value={formData.tourSpecs.languages}
                        onChange={(e) => setFormData({ ...formData, tourSpecs: { ...formData.tourSpecs, languages: e.target.value } })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("ux.bo.includedPrice")}</Label>
                      <Textarea
                        placeholder={t("ux.bo.eGTransportGuideLunch")}
                        value={formData.tourSpecs.included}
                        onChange={(e) => setFormData({ ...formData, tourSpecs: { ...formData.tourSpecs, included: e.target.value } })}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("ux.bo.notIncluded")}</Label>
                      <Textarea
                        placeholder={t("ux.bo.eGDrinksTips")}
                        value={formData.tourSpecs.excluded}
                        onChange={(e) => setFormData({ ...formData, tourSpecs: { ...formData.tourSpecs, excluded: e.target.value } })}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("ux.bo.coverPhoto")}</Label>
                      <ImageUpload
                        label={t("ux.bo.tourPhoto")}
                        folder="agency-tours"
                        value={formData.image_url}
                        onChange={(url) => setFormData({ ...formData, image_url: url })}
                      />
                    </div>
                  </div>
                ) : (
                  <ImageUpload label={t("ux.bo.servicePhoto")} folder="agency-services" value={formData.image_url} onChange={(image_url) => setFormData({ ...formData, image_url })} />
                )}
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.available}
                    onCheckedChange={(c) => setFormData({ ...formData, available: c })}
                  />
                  <Label>{t("ux.bo.available")}</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {t("ux.bo.cancel")}
                  </Button>
                  <Button type="submit">{editingService ? t("ux.bo.update") : "Créer"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("ux.bo.search")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("ux.bo.service")}</TableHead>
                <TableHead>{t("ux.bo.type")}</TableHead>
                <TableHead>{t("ux.bo.location")}</TableHead>
                <TableHead>{t("ux.bo.price")}</TableHead>
                <TableHead>{t("ux.bo.status")}</TableHead>
                <TableHead className="text-right">{t("ux.bo.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">{t("ux.bo.loading")}</TableCell>
                </TableRow>
              ) : filteredServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    {t("ux.bo.noService")}
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
                        {service.available ? t("ux.bo.available") : "Indisponible"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button aria-label={t("ux.bo.edit")} variant="ghost" size="icon" onClick={() => handleEdit(service)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button aria-label={t("ux.bo.delete")} variant="ghost" size="icon" onClick={() => handleDelete(service.id)}>
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
