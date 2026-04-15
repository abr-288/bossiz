import { ReactNode } from "react";

interface MajesticClubThemeProps {
  children: ReactNode;
}

export function MajesticClubTheme({ children }: MajesticClubThemeProps) {
  return (
    <div className="min-h-screen bg-[#0A192F] text-[#F5F5F5] font-['Montserrat'] selection:bg-[#C5A059] selection:text-[#0A192F]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');

        .majestic-title {
          font-family: 'Cinzel', serif;
          color: #C5A059;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .majestic-text-serif {
          font-family: 'Playfair Display', serif;
        }
        .majestic-gold-text {
          color: #C5A059;
        }
        .majestic-card {
          background: rgba(16, 24, 32, 0.6);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(197, 160, 89, 0.1);
          border-radius: 2px;
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .majestic-card:hover {
          border-color: rgba(197, 160, 89, 0.5);
          box-shadow: 0 0 30px rgba(197, 160, 89, 0.15);
          transform: translateY(-2px);
        }
        .majestic-button-gold {
          background: #C5A059;
          color: #0A192F;
          font-weight: 700;
          border: none;
          border-radius: 2px;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          font-size: 0.75rem;
          transition: all 0.4s ease;
        }
        .majestic-button-gold:hover {
          background: #D4AF37;
          box-shadow: 0 0 20px rgba(197, 160, 89, 0.3);
          transform: scale(1.02);
        }
        .majestic-border-gold {
          border-color: #C5A059;
          border-width: 1px;
        }
        .majestic-icon {
          stroke-width: 1px;
          color: #C5A059;
        }
        /* Ambient image filter */
        .majestic-image-ambient {
          filter: sepia(0.15) contrast(1.1) brightness(0.9);
          transition: all 0.8s ease;
        }
        .majestic-image-ambient:hover {
          filter: sepia(0) contrast(1) brightness(1);
        }
        /* Slow fade-in for page transitions */
        .majestic-fade-in {
          animation: majesticFadeIn 1.2s ease-out forwards;
        }
        @keyframes majesticFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="relative overflow-hidden selection:bg-[#C5A059]/30">
        {/* Subtle atmospheric light */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#C5A059] opacity-[0.03] rounded-full blur-[180px] -mr-96 -mt-96" />
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-[#C5A059] opacity-[0.02] rounded-full blur-[180px] -ml-96 -mb-96" />
        
        <div className="relative z-10 majestic-fade-in">
          {children}
        </div>
      </div>
    </div>
  );
}
