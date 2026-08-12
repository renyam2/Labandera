import { Shield, CheckCircle, FileText, Users, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const STEPS = [
  {
    icon: FileText,
    title: "RECOLECCIÓN",
    desc: "El periodista identifica una pista o fuente de información relevante para la investigación.",
  },
  {
    icon: CheckCircle,
    title: "VERIFICACIÓN EN DOBLE FUENTE",
    desc: "Cada dato clave debe ser confirmado por al menos dos fuentes independientes y verificables.",
  },
  {
    icon: Users,
    title: "DERECHO DE RESPUESTA",
    desc: "Se solicita postura oficial a las dependencias o personas involucradas antes de publicar.",
  },
  {
    icon: Shield,
    title: "REVISIÓN EDITORIAL",
    desc: "Un editor independiente verifica el cumplimiento de estándares de precisión y ética periodística.",
  },
];

export default function MetodologiaPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="flex items-center gap-1.5 font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-8"
          aria-label="Volver al inicio"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          VOLVER AL INICIO
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-accent" />
          <h1
            className="text-4xl font-black"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            METODOLOGÍA
          </h1>
        </div>

        <p
          className="text-sm leading-relaxed text-foreground/90 mb-10"
          style={{ fontFamily: "'Lora', serif" }}
        >
          En LABANDERA, cada nota pasa por un riguroso proceso de verificación antes de
          su publicación. Nuestro compromiso es con la precisión y la transparencia.
        </p>

        {/* Process Steps */}
        <div className="space-y-6 mb-10">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="flex gap-4 p-5 bg-card border border-border hover:border-accent transition-colors"
            >
              <div className="shrink-0">
                <div className="w-10 h-10 bg-secondary border border-border flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-accent" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-xs text-muted-foreground">
                    PASO {i + 1}
                  </span>
                  <h3
                    className="text-lg font-black"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    {step.title}
                  </h3>
                </div>
                <p
                  className="text-sm leading-relaxed text-foreground/90"
                  style={{ fontFamily: "'Lora', serif" }}
                >
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Principles */}
        <section className="bg-secondary border border-border p-6">
          <h2
            className="text-2xl font-bold mb-4"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            PRINCIPIOS
          </h2>
          <ul className="space-y-3 font-mono text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-accent">▸</span>
              Transparencia total en fuentes y metodología.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">▸</span>
              Derecho de respuesta garantizado a todos los involucrados.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">▸</span>
              Independencia editorial sin vínculos con partidos políticos.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">▸</span>
              Corrección inmediata de errores si se detectan.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
