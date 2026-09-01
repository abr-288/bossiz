import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Star, Phone, Mail, MapPin, Loader2 } from "lucide-react";
import { BossizSiteLayout } from "@/components/bossiz/BossizSiteLayout";
import { useBossizMicrositeContent } from "@/hooks/useBossizMicrositeContent";
import heroImage from "@/assets/hotel-ivoire.jpg";

const BossizCIAccueil = () => {
  const navigate = useNavigate();
  const { content, loading } = useBossizMicrositeContent("ci");

  if (loading || !content) {
    return (
      <BossizSiteLayout country="ci" activePage="accueil">
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-bossiz-ci-green" />
        </div>
      </BossizSiteLayout>
    );
  }

  return (
    <BossizSiteLayout country="ci" activePage="accueil" tagline={content.tagline}>
      {/* Hero avec image de fond */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Bossiz Conciergerie Côte d'Ivoire" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-bossiz-ci-green/90 via-bossiz-ci-green/75 to-bossiz-ci-green/90" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 py-24 md:py-32 text-center">
          <p className="text-bossiz-gold-light text-sm font-semibold uppercase tracking-[0.25em] mb-6">
            {content.hero.eyebrow}
          </p>
          <h1 className="font-black text-4xl sm:text-5xl md:text-6xl text-white leading-tight mb-6 drop-shadow-lg">
            {content.hero.titleLine1}
            <span className="block text-bossiz-gold-light">{content.hero.titleLine2}</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 italic mb-14 max-w-2xl mx-auto font-light drop-shadow">
            {content.hero.subtitle}
          </p>

          <div className="grid grid-cols-3 gap-6 max-w-xl mx-auto mb-14">
            {[content.hero.stats.clients, content.hero.stats.partners, content.hero.stats.availability].map((stat) => (
              <div key={stat.label}>
                <div className="font-black text-3xl md:text-4xl text-bossiz-gold-light mb-1">{stat.value}</div>
                <div className="text-white/70 text-[11px] uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="rounded-full bg-bossiz-gold text-bossiz-ci-green hover:bg-bossiz-gold-light font-semibold text-sm px-10 py-6"
              onClick={() => navigate("/bossiz-conciergerie-ci/services")}
            >
              {content.services.title}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-white/40 text-white hover:bg-white/10 font-semibold text-sm px-10 py-6"
              onClick={() => navigate("/bossiz-conciergerie-ci/formules")}
            >
              {content.plans.title}
            </Button>
          </div>
        </div>
      </section>

      {/* Philosophy quote */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-xl md:text-2xl text-bossiz-navy-dark/80 italic leading-relaxed">
            « {content.philosophy} »
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-bossiz-ci-green-pale">
        <div className="max-w-6xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-16">
            <h2 className="font-black text-3xl md:text-4xl text-bossiz-navy-dark mb-4">
              {content.testimonialsTitle}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {content.testimonialsList.map((testimonial) => (
              <Card key={testimonial.name} className="rounded-xl border-0 bg-white shadow-md">
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-bossiz-gold fill-bossiz-gold" />
                    ))}
                  </div>
                  <p className="text-sm text-bossiz-navy-dark/80 italic leading-relaxed mb-6">
                    "{testimonial.content}"
                  </p>
                  <div className="font-semibold text-bossiz-navy-dark">{testimonial.name}</div>
                  <div className="text-xs text-bossiz-navy-dark/50">{testimonial.role}</div>
                  <div className="text-xs text-bossiz-gold-dark">{testimonial.location}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-24 bg-bossiz-ci-green">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 text-center">
          <h2 className="font-black text-3xl md:text-5xl text-white mb-16">
            {content.contactCta.title}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
            {content.contact.phone && (
              <div>
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-bossiz-gold-light" strokeWidth={1.5} />
                </div>
                <a href={content.contact.phoneHref} className="text-white font-semibold hover:text-bossiz-gold-light">
                  {content.contact.phone}
                </a>
              </div>
            )}
            <div>
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-bossiz-gold-light" strokeWidth={1.5} />
              </div>
              <a href={`mailto:${content.contact.email}`} className="text-white font-semibold hover:text-bossiz-gold-light">
                {content.contact.email}
              </a>
            </div>
            <div>
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-bossiz-gold-light" strokeWidth={1.5} />
              </div>
              <p className="text-white font-semibold">{content.contact.address}</p>
            </div>
          </div>

          <Button
            size="lg"
            className="rounded-full bg-bossiz-gold text-bossiz-ci-green hover:bg-bossiz-gold-light font-semibold text-sm px-10 py-6"
            onClick={() => navigate("/support")}
          >
            {content.contactCta.button}
          </Button>
        </div>
      </section>
    </BossizSiteLayout>
  );
};

export default BossizCIAccueil;
