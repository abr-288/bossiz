import { useState } from "react";
import { motion } from "framer-motion";
import { 
  CreditCard, Wallet, ArrowUpRight, ArrowDownLeft, 
  Clock, CheckCircle2, AlertCircle, Plus, PieChart, Shield
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

const PaymentWallet = () => {
  return (
    <div className="space-y-20 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-end gap-10 border-b border-white/5 pb-10">
        <div className="space-y-4">
          <h2 className="majestic-title text-4xl">Trésorerie de Prestige</h2>
          <p className="text-white/30 text-sm tracking-widest uppercase font-light italic">Gestion sécurisée de vos actifs et investissements services.</p>
        </div>
        <Badge className="bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30 rounded-none px-6 py-2 font-bold uppercase tracking-[0.3em] text-[10px]">
          Statut: Certifié Majestic
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Wallet Balance Card */}
        <div className="lg:col-span-2 space-y-12">
          <Card className="majestic-card border-none bg-gradient-to-br from-[#C5A059] to-[#8C6B3F] text-[#0A192F] p-12 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-12 opacity-10">
              <Wallet className="w-80 h-80 -mr-24 -mt-24" strokeWidth={0.5} />
            </div>
            
            <div className="relative z-10 space-y-12">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.5em] font-black opacity-60 mb-3">Solde Disponible</p>
                  <h3 className="majestic-title text-6xl tracking-tighter">450.000 <span className="text-2xl font-light opacity-60">FCFA</span></h3>
                </div>
                <div className="p-4 border border-[#0A192F]/20 rounded-sm">
                  <PieChart className="w-8 h-8" strokeWidth={1} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <Button 
                  className="bg-[#0A192F] text-white hover:bg-[#0A192F]/90 flex items-center gap-4 py-8 rounded-none font-bold uppercase tracking-[0.2em] text-[10px] shadow-2xl"
                  onClick={handleTopUp}
                >
                  <Plus className="w-5 h-5" strokeWidth={1} /> Alimenter la trésorerie
                </Button>
                <Button variant="outline" className="border-[#0A192F]/20 text-[#0A192F] hover:bg-[#0A192F]/5 py-8 rounded-none font-bold uppercase tracking-[0.2em] text-[10px]">
                  Cartes Enregistrées
                </Button>
              </div>
            </div>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <Card className="majestic-card border-none p-10 bg-white/[0.01]">
                <div className="flex justify-between items-center mb-8">
                  <div className="p-4 border border-green-500/20 text-green-400 bg-green-500/5">
                    <ArrowDownLeft className="w-6 h-6" strokeWidth={1} />
                  </div>
                  <Badge variant="ghost" className="text-[9px] text-white/20 uppercase tracking-[0.3em] font-bold">Flux Avril</Badge>
                </div>
                <p className="text-[10px] text-[#C5A059] mb-2 uppercase tracking-[0.2em] font-bold">Crédits</p>
                <h4 className="majestic-title text-3xl tabular-nums">+120.000 FCFA</h4>
             </Card>
              <Card className="majestic-card border-none p-10 bg-white/[0.01]">
                <div className="flex justify-between items-center mb-8">
                  <div className="p-4 border border-[#C5A059]/20 text-[#C5A059] bg-[#C5A059]/5">
                    <ArrowUpRight className="w-6 h-6" strokeWidth={1} />
                  </div>
                  <Badge variant="ghost" className="text-[9px] text-white/20 uppercase tracking-[0.3em] font-bold">Flux Avril</Badge>
                </div>
                <p className="text-[10px] text-[#C5A059] mb-2 uppercase tracking-[0.2em] font-bold">Investissements</p>
                <h4 className="majestic-title text-3xl tabular-nums">-45.500 FCFA</h4>
             </Card>
          </div>
        </div>

        {/* Transaction History */}
        <Card className="majestic-card border-none text-white">
          <CardHeader className="p-10 pb-8 border-b border-white/5">
            <CardTitle className="majestic-gold-text text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-between">
              Journal d'Excellence <Clock className="w-5 h-5 opacity-20" strokeWidth={1} />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10 space-y-10">
            {TRANSACTIONS.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-6">
                  <div className={`p-4 transition-all border ${
                    tx.amount.startsWith('+') ? 'border-green-500/10 text-green-400' : 'border-white/5 text-white/20 group-hover:border-[#C5A059]/40 group-hover:text-[#C5A059]'
                  }`}>
                    {tx.amount.startsWith('+') ? <ArrowDownLeft className="w-5 h-5" strokeWidth={1} /> : <CreditCard className="w-5 h-5" strokeWidth={1} />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest group-hover:text-[#C5A059] transition-colors truncate">{tx.label}</span>
                    <span className="text-[9px] text-white/20 italic font-light">{tx.date}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-light tabular-nums ${
                    tx.amount.startsWith('+') ? 'text-green-400' : 'text-white'
                  }`}>
                    {tx.amount}
                  </div>
                  <span className={`text-[8px] uppercase tracking-[0.2em] font-bold ${
                    tx.status === 'completed' ? 'text-green-500/30' : 'text-[#C5A059]/40'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
            <Button variant="ghost" className="w-full text-[9px] font-bold uppercase tracking-[0.4em] text-[#C5A059] hover:bg-[#C5A059]/5 py-8 mt-6">
              Télécharger mon Relevé Privé
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Security alert */}
      <div className="p-12 majestic-card border-[#C5A059]/10 bg-[#C5A059]/5 text-[#C5A059]/60">
        <div className="flex items-start gap-8 max-w-4xl mx-auto">
          <Shield className="w-10 h-10 shrink-0 opacity-40" strokeWidth={1} />
          <div className="space-y-3">
             <h4 className="majestic-title text-sm tracking-[0.2em]">Protocole de Haute Confidentialité</h4>
             <p className="text-[11px] font-light leading-loose italic">
              Vos transactions sont protégées par un chiffrement de niveau souverain. En accord avec les standards du Majestic Club, aucune donnée de paiement n'est conservée au-delà de la durée légale de conservation des documents fiscaux.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentWallet;
