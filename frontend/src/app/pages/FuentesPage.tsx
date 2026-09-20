import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// @ts-expect-error -- objeto global inyectado por widgets.js de Twitter
declare global {
  interface Window {
    twttr?: { widgets?: { load: () => void } };
  }
}

export default function FuentesPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const loadTwitterScript = () => {
      if (!document.querySelector('script[src="https://platform.twitter.com/widgets.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        document.body.appendChild(script);
      }
      if (window.twttr && window.twttr.widgets) {
        window.twttr.widgets.load();
      }
    };

    loadTwitterScript();
    const interval = setInterval(() => {
      if (window.twttr && window.twttr.widgets) {
        window.twttr.widgets.load();
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-8" aria-label="Volver">
          <ArrowLeft className="w-3.5 h-3.5" /> VOLVER
        </button>
        <h1 className="text-4xl font-black mb-6" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Fuentes y Corresponsales</h1>
        <p className="font-mono text-sm text-muted-foreground mb-8">
          Conoce a los periodistas y fuentes clave que hacen posible nuestra investigación.
        </p>

        <div className="bg-card border border-border p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Juan Ortiz</h2>
          <p className="text-sm text-foreground/90 leading-relaxed mb-6" style={{ fontFamily: "'Lora', serif" }}>
            Corresponsal principal en la Ciudad de México. Con más de 15 años de experiencia en periodismo de investigación, Juan ha sido pieza clave en la desinformación de escándalos de corrupción a nivel federal y estatal. Sus contactos en dependencias gubernamentales y su rigor documental han permitido publicar más de 40 investigaciones verificadas.
          </p>
          <div className="border-t border-border pt-6">
            <p className="font-mono text-xs tracking-widest text-muted-foreground mb-4">PERFIL PÚBLICO</p>
            <div className="twitter-widget-container">
              <a className="twitter-timeline" data-height="600" data-dnt="true" href="https://twitter.com/Juan_OrtizMX">Tweets de @Juan_OrtizMX</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
