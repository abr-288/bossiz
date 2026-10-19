import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Price } from "@/components/ui/price";

interface Product {
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  image_url?: string;
}

interface ArtisanOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artisanId: string;
  artisanName: string;
  product: Product;
}

export const ArtisanOrderDialog = ({ open, onOpenChange, artisanId, artisanName, product }: ArtisanOrderDialogProps) => {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState("1");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCustomerEmail(user.email || "");
        supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle().then(({ data }) => {
          if (data?.full_name) setCustomerName(data.full_name);
          if (data?.phone) setCustomerPhone(data.phone);
        });
      }
    });
  }, [open]);

  const price = product.price || 0;
  const qty = parseInt(quantity) || 0;
  const total = price * qty;

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Connectez-vous pour passer commande");
      onOpenChange(false);
      navigate("/auth");
      return;
    }

    if (!qty || qty < 1 || qty > 100) {
      toast.error("Indiquez une quantité valide");
      return;
    }
    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      toast.error("Renseignez vos coordonnées");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("artisan_orders").insert({
      artisan_id: artisanId,
      user_id: user.id,
      product_name: product.name,
      unit_price: price,
      currency: product.currency || "XOF",
      quantity: qty,
      customer_name: customerName.trim(),
      customer_email: customerEmail.trim(),
      customer_phone: customerPhone.trim(),
      message: message.trim() || null,
    });
    setSubmitting(false);

    if (error) {
      console.error("Artisan order error:", error);
      toast.error("Impossible d'envoyer votre demande, réessayez");
      return;
    }

    toast.success(`Demande envoyée à ${artisanName} ! L'artisan vous recontactera pour confirmer.`);
    onOpenChange(false);
    setQuantity("1");
    setMessage("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Demander cette création</DialogTitle>
          <DialogDescription>
            {product.name} — {artisanName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Quantité</Label>
            <Input type="number" min="1" max="100" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>

          {price > 0 && (
            <div className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">Total estimé</span>
              <span className="font-semibold">
                <Price amount={total} fromCurrency={product.currency || "XOF"} />
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label>Nom *</Label>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Téléphone *</Label>
            <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Message (personnalisation, délai souhaité...)</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} />
          </div>

          <p className="text-xs text-muted-foreground">
            Cette demande est transmise à l'artisan, qui vous recontactera pour confirmer la disponibilité et les modalités de paiement/livraison.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Annuler</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !customerName.trim() || !customerPhone.trim() || !customerEmail.trim()}
            className="gradient-primary"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                <ShoppingBag className="w-4 h-4 mr-2" />
                Envoyer la demande
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
