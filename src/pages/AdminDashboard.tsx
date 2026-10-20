import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

type DashboardBooking = Tables<"bookings"> & { services: Pick<Tables<"services">, "name" | "type"> | null };
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Package, CreditCard, TrendingUp, Edit, Trash2, Plus } from "lucide-react";
import { UnifiedForm, UnifiedFormField, UnifiedSubmitButton } from "@/components/forms";
import { Price } from "@/components/ui/price";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    totalServices: 0,
    totalUsers: 0,
  });
  const [bookings, setBookings] = useState<DashboardBooking[]>([]);
  const [services, setServices] = useState<Tables<"services">[]>([]);
  const [selectedService, setSelectedService] = useState<Tables<"services"> | null>(null);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("Accès non autorisé");
      navigate("/");
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          *,
          services (name, type)
        `)
        .order("created_at", { ascending: false });

      if (bookingsError) throw bookingsError;
      setBookings(bookingsData || []);

      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: false });

      if (servicesError) throw servicesError;
      setServices(servicesData || []);

      // Calculate stats
      const totalRevenue = bookingsData?.reduce((sum, b) => sum + Number(b.total_price), 0) || 0;
      
      setStats({
        totalBookings: bookingsData?.length || 0,
        totalRevenue,
        totalServices: servicesData?.length || 0,
        totalUsers: 0, // Would need to query auth.users via admin API
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement des données");
    }
  };

  const updateBookingStatus = async (
    bookingId: string,
    status: Tables<"bookings">["status"],
    paymentStatus?: Tables<"bookings">["payment_status"],
  ) => {
    try {
      const updateData: TablesUpdate<"bookings"> = { status };
      if (paymentStatus) updateData.payment_status = paymentStatus;

      const { error } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", bookingId);

      if (error) throw error;
      toast.success("Statut mis à jour");
      fetchData();
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleServiceSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const serviceData = {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        type: formData.get("type") as "hotel" | "flight" | "car" | "tour" | "event" | "flight_hotel",
        location: formData.get("location") as string,
        price_per_unit: Number(formData.get("price")),
        currency: "EUR",
        available: true,
      };

      if (selectedService) {
        const { error } = await supabase
          .from("services")
          .update(serviceData)
          .eq("id", selectedService.id);
        if (error) throw error;
        toast.success("Service mis à jour");
      } else {
        const { error } = await supabase
          .from("services")
          .insert([serviceData]);
        if (error) throw error;
        toast.success("Service créé");
      }

      setIsServiceDialogOpen(false);
      setSelectedService(null);
      fetchData();
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce service ?")) return;

    try {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", serviceId);

      if (error) throw error;
      toast.success("Service supprimé");
      fetchData();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 mt-20">
        <h1 className="text-3xl font-bold mb-8">Tableau de Bord Admin</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="w-4 h-4" />
                Réservations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Revenus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold"><Price amount={stats.totalRevenue} fromCurrency="XOF" /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalServices}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Utilisateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Actions Rapides</h2>
          <div className="flex gap-4">
            <Button
              onClick={() => navigate("/admin/email-templates")}
              variant="outline"
              className="flex items-center gap-2"
            >
              📧 Gérer les Templates d'Emails
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="bookings" className="w-full">
          <TabsList>
            <TabsTrigger value="bookings">Réservations</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Réservations</CardTitle>
                <CardDescription>Gérez toutes les réservations clients</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Paiement</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{booking.customer_name}</div>
                            <div className="text-sm text-muted-foreground">{booking.customer_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{booking.services?.name}</TableCell>
                        <TableCell>{new Date(booking.start_date).toLocaleDateString("fr-FR")}</TableCell>
                        <TableCell><Price amount={Number(booking.total_price)} fromCurrency="XOF" /></TableCell>
                        <TableCell>
                          <Select
                            value={booking.status}
                            onValueChange={(value) => updateBookingStatus(booking.id, value as Tables<"bookings">["status"])}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">En attente</SelectItem>
                              <SelectItem value="confirmed">Confirmée</SelectItem>
                              <SelectItem value="completed">Complétée</SelectItem>
                              <SelectItem value="cancelled">Annulée</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={booking.payment_status}
                            onValueChange={(value) => updateBookingStatus(booking.id, booking.status, value as Tables<"bookings">["payment_status"])}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">En attente</SelectItem>
                              <SelectItem value="paid">Payé</SelectItem>
                              <SelectItem value="failed">Échoué</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">Voir</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gestion des Services</CardTitle>
                    <CardDescription>Gérez tous les services disponibles</CardDescription>
                  </div>
                  <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setSelectedService(null)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter un Service
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {selectedService ? "Modifier le Service" : "Nouveau Service"}
                        </DialogTitle>
                        <DialogDescription>
                          Remplissez les informations du service
                        </DialogDescription>
                      </DialogHeader>
                      <UnifiedForm onSubmit={handleServiceSubmit} variant="booking">
                        <UnifiedFormField
                          label="Nom"
                          name="name"
                          defaultValue={selectedService?.name}
                          required
                        />
                        <div className="space-y-2">
                          <label className="text-sm font-medium block">Description</label>
                          <Textarea
                            name="description"
                            defaultValue={selectedService?.description ?? undefined}
                            rows={3}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium block">Type</label>
                            <Select name="type" defaultValue={selectedService?.type} required>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hotel">Hôtel</SelectItem>
                                <SelectItem value="flight">Vol</SelectItem>
                                <SelectItem value="car">Voiture</SelectItem>
                                <SelectItem value="tour">Tour</SelectItem>
                                <SelectItem value="event">Événement</SelectItem>
                                <SelectItem value="flight_hotel">Package</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <UnifiedFormField
                            label="Prix (EUR)"
                            name="price"
                            type="number"
                            defaultValue={selectedService?.price_per_unit}
                            required
                          />
                        </div>
                        <UnifiedFormField
                          label="Localisation"
                          name="location"
                          defaultValue={selectedService?.location}
                          required
                        />
                        <div className="flex justify-end gap-2 mt-6">
                          <Button type="button" variant="outline" onClick={() => setIsServiceDialogOpen(false)}>
                            Annuler
                          </Button>
                          <UnifiedSubmitButton>
                            {selectedService ? "Modifier" : "Créer"}
                          </UnifiedSubmitButton>
                        </div>
                      </UnifiedForm>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Localisation</TableHead>
                      <TableHead>Prix</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{service.type}</Badge>
                        </TableCell>
                        <TableCell>{service.location}</TableCell>
                        <TableCell><Price amount={Number(service.price_per_unit)} fromCurrency="XOF" /></TableCell>
                        <TableCell>
                          ⭐ {service.rating || 0} ({service.total_reviews || 0})
                        </TableCell>
                        <TableCell>
                          <Badge variant={service.available ? "default" : "secondary"}>
                            {service.available ? "Disponible" : "Indisponible"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedService(service);
                                setIsServiceDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteService(service.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
