import { useEffect, useState } from "react";
import { Users, MapPin, Star, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

const StatsSection = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalServices: 0,
    totalBookings: 0,
    destinations: 0,
    satisfaction: 4.8
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [servicesResult, bookingsResult] = await Promise.all([
        supabase.from('services').select('id, location', { count: 'exact' }).eq('available', true),
        supabase.from('bookings').select('id', { count: 'exact' })
      ]);

      const uniqueDestinations = new Set(servicesResult.data?.map(s => s.location) || []).size;

      setStats({
        totalServices: servicesResult.count || 0,
        totalBookings: bookingsResult.count || 0,
        destinations: uniqueDestinations,
        satisfaction: 4.8
      });
    };

    fetchStats();
  }, []);

  const statsData = [
    {
      icon: Users,
      value: stats.totalBookings.toLocaleString(),
      labelKey: "stats.bookings",
      color: "text-primary"
    },
    {
      icon: MapPin,
      value: `${stats.destinations}+`,
      labelKey: "stats.destinations",
      color: "text-secondary"
    },
    {
      icon: Calendar,
      value: `${stats.totalServices}+`,
      labelKey: "stats.services",
      color: "text-accent"
    },
    {
      icon: Star,
      value: stats.satisfaction.toFixed(1),
      labelKey: "stats.rating",
      color: "text-secondary"
    }
  ];

  return (
    <section className="py-16 md:py-20 bg-primary/5 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30">
        <div className="absolute top-10 left-10 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {statsData.map((stat, index) => (
            <div
              key={index}
              className="group text-center p-6 md:p-8 rounded-2xl glass hover:glass-dark hover:shadow-glow transition-all duration-slow ease-standard hover:scale-110 animate-slide-up-fade hover-lift relative overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Shine effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-slow ease-standard">
                <div className="absolute inset-0 animate-shimmer" />
              </div>
              
              {/* Icon with glow effect */}
              <div className="relative mb-4">
                <div className={`w-16 h-16 md:w-20 md:h-20 mx-auto rounded-2xl bg-primary/5 flex items-center justify-center group-hover:animate-pulse-glow transition-all`}>
                  <stat.icon className={`w-8 h-8 md:w-10 md:h-10 ${stat.color} group-hover:scale-110 transition-transform`} />
                </div>
              </div>
              
              {/* Value with count animation */}
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2 group-hover:text-gradient transition-all">
                {stat.value}
              </div>
              
              {/* Label */}
              <div className="text-sm md:text-base text-muted-foreground group-hover:text-foreground transition-colors">
                {t(stat.labelKey)}
              </div>
              
              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-slow ease-standard" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
