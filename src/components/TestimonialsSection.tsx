import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import { supabase } from "@/integrations/supabase/client";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  rating: number;
  comment: string;
  avatar: string;
}

// Shown only as filler while real customer reviews are still accumulating -
// dropped from the carousel entirely once enough real ones exist (see
// fetchTestimonials below).
const FALLBACK_TESTIMONIALS: Testimonial[] = [
  { id: "fallback-1", name: "Kouadio Marie", role: "testimonials.traveler", rating: 5, comment: "testimonials.comment1", avatar: "KM" },
  { id: "fallback-2", name: "Jean-Baptiste Koffi", role: "testimonials.entrepreneur", rating: 5, comment: "testimonials.comment2", avatar: "JK" },
  { id: "fallback-3", name: "Aminata Traoré", role: "testimonials.guide", rating: 5, comment: "testimonials.comment3", avatar: "AT" },
];

const MIN_REAL_TESTIMONIALS = 3;

const getInitials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() || "").join("") || "?";

const TestimonialsSection = () => {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(FALLBACK_TESTIMONIALS);

  useEffect(() => {
    const fetchTestimonials = async () => {
      const { data: reviews, error } = await supabase
        .from("reviews")
        .select("id, user_id, rating, comment, reviewer_name")
        .eq("status", "approved")
        .not("comment", "is", null)
        .order("rating", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(9);

      if (error || !reviews || reviews.length === 0) return;

      const userIds = [...new Set(reviews.map(r => r.user_id).filter((id): id is string => !!id))];
      const profilesById = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
        (profiles || []).forEach(p => profilesById.set(p.id, p.full_name || ""));
      }

      const real: Testimonial[] = reviews
        .map(r => {
          const name = (r.user_id && profilesById.get(r.user_id)) || r.reviewer_name || "Client B-Reserve";
          return {
            id: r.id,
            name,
            role: "testimonials.verifiedCustomer",
            rating: r.rating,
            comment: r.comment || "",
            avatar: getInitials(name),
          };
        })
        .filter(t => t.name);

      if (real.length >= MIN_REAL_TESTIMONIALS) {
        setTestimonials(real);
      } else if (real.length > 0) {
        setTestimonials([...real, ...FALLBACK_TESTIMONIALS.slice(0, MIN_REAL_TESTIMONIALS - real.length)]);
      }
    };

    fetchTestimonials();
  }, []);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "center",
      skipSnaps: false,
    },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="py-12 md:py-20 lg:py-28 bg-gradient-to-b from-muted/30 via-accent/10 to-background relative overflow-hidden w-full">
      {/* Background decoration */}
      <div className="absolute inset-0 gradient-mesh opacity-40" />
      <div className="absolute top-20 left-20 w-40 md:w-64 h-40 md:h-64 bg-primary/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-20 w-48 md:w-72 h-48 md:h-72 bg-secondary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      
      <div className="site-container relative z-10">
        <div className="text-center mb-8 md:mb-14 lg:mb-16 animate-slide-up-fade px-4">
          <div className="inline-block mb-3 md:mb-4">
            <span className="px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-secondary/10 text-secondary text-xs md:text-sm font-semibold">
              ⭐ Avis Clients
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-gradient mb-4 md:mb-6">
            {t('testimonials.title')}
          </h2>
          <p className="text-sm md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('testimonials.subtitle')}
          </p>
          
          {/* Decorative line */}
          <div className="flex justify-center gap-2 mt-4 md:mt-8">
            <div className="w-12 md:w-16 h-1 md:h-1.5 bg-gradient-primary rounded-full" />
            <div className="w-6 md:w-8 h-1 md:h-1.5 bg-secondary/50 rounded-full" />
          </div>
        </div>

        {/* Carousel Container */}
        <div className="relative max-w-6xl mx-auto">
          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full glass hover:glass-dark hover:shadow-glow transition-all hidden md:flex"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full glass hover:glass-dark hover:shadow-glow transition-all hidden md:flex"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>

          {/* Embla Carousel */}
          <div className="overflow-hidden px-2 md:px-0" ref={emblaRef}>
            <div className="flex gap-4 md:gap-6 lg:gap-8">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={testimonial.id}
                  className="flex-[0_0_85%] sm:flex-[0_0_70%] md:flex-[0_0_calc(50%-1rem)] lg:flex-[0_0_calc(33.333%-1.5rem)] min-w-0"
                >
                  <Card 
                    className="group border-2 border-border/50 hover:border-secondary/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover-lift rounded-xl md:rounded-2xl bg-gradient-card relative overflow-hidden h-full"
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                      <div className="absolute inset-0 animate-shimmer" />
                    </div>
                    
                    <CardContent className="p-5 md:p-8 lg:p-10 relative z-10 h-full flex flex-col">
                      {/* Quote icon with glow effect */}
                      <div className="mb-4 md:mb-6 relative">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center group-hover:animate-pulse-glow">
                          <Quote className="w-6 h-6 md:w-8 md:h-8 text-primary group-hover:text-secondary transition-colors" />
                        </div>
                      </div>

                      {/* Rating stars with animation */}
                      <div className="flex gap-1 mb-4 md:mb-6">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star 
                            key={i} 
                            className="w-4 h-4 md:w-5 md:h-5 fill-secondary text-secondary group-hover:scale-110 transition-transform" 
                            style={{ transitionDelay: `${i * 0.05}s` }}
                          />
                        ))}
                      </div>

                      {/* Comment with enhanced typography */}
                      <p className="text-muted-foreground group-hover:text-foreground mb-4 md:mb-8 italic text-sm md:text-base lg:text-lg leading-relaxed transition-colors flex-1">
                        "{testimonial.id.startsWith("fallback-") ? t(testimonial.comment) : testimonial.comment}"
                      </p>

                      {/* Author info with enhanced styling */}
                      <div className="flex items-center gap-3 md:gap-4 pt-4 md:pt-6 border-t border-border/50">
                        <Avatar className="w-10 h-10 md:w-14 md:h-14 gradient-primary ring-2 ring-secondary/20 group-hover:ring-secondary transition-all">
                          <AvatarFallback className="gradient-primary text-white font-bold text-sm md:text-lg">
                            {testimonial.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-foreground text-sm md:text-lg">{testimonial.name}</p>
                          <p className="text-xs md:text-sm text-muted-foreground">{t(testimonial.role)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Navigation */}
          <div className="flex justify-center gap-3 mt-10">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`group transition-all duration-300 ${
                  index === selectedIndex ? 'w-12' : 'w-3'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              >
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    index === selectedIndex
                      ? 'gradient-primary shadow-primary'
                      : 'bg-border group-hover:bg-secondary/50'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
