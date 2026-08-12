import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Clock, Star, Loader2 } from "lucide-react";
import { BossizSiteLayout } from "@/components/bossiz/BossizSiteLayout";
import { useBossizMicrositeContent } from "@/hooks/useBossizMicrositeContent";
import aboutImage from "@/assets/hero-beach.jpg";

const BossizSNAPropos = () => {
  const navigate = useNavigate();
  const { content, loading } = useBossizMicrositeContent("sn");

  if (loading || !content) {
    return (
      <BossizSiteLayout country="sn" activePage="a-propos">
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-bossiz-teal-dark" />
        </div>
      </BossizSiteLayout>
    );
  }

  const values = [
    { icon: Shield, ...content.about.values.trust },
    { icon: Clock, ...content.about.values.availability },
    { icon: Star, ...content.about.values.excellence },
  ];

  return (
    <BossizSiteLayout country="sn" activePage="a-propos" tagline={content.tagline}>
      {/* Bannière avec image de fond */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={aboutImage} alt="Bossiz Sénégal" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-bossiz-navy-dark/92 via-bossiz-teal-dark/85 to-bossiz-navy-dark/92" />
        </div>
        <div className="relative py-24 min-h-[70vh] flex items-center">
          <div className="max-w-6xl mx-auto px-6 lg:px-10 w-full">
            <div className="text-center mb-20 max-w-3xl mx-auto">
              <h1 className="font-black text-3xl md:text-5xl text-white mb-6 drop-shadow-lg">
                {content.about.title}
              </h1>
              <p className="text-white/85 leading-relaxed">
                {content.about.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {values.map(({ icon: Icon, title, text }) => (
                <div key={title} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-6">
                    <Icon className="w-7 h-7 text-bossiz-gold-light" strokeWidth={1.25} />
                  </div>
                  <h3 className="font-black text-xl text-white mb-3">{title}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{text}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-16">
              <Button
                size="lg"
                className="rounded-full bg-bossiz-gold text-bossiz-teal-dark hover:bg-bossiz-gold-light font-semibold text-sm px-10 py-6"
                onClick={() => navigate("/bossiz-conciergerie-sn/formules")}
              >
                {content.about.cta}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </BossizSiteLayout>
  );
};

export default BossizSNAPropos;
