import { Users, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const TEAM_MEMBERS = [
  {
    name: "Juan Ortiz",
    role: "Director de Investigación",
    bio: "Más de 15 años cubriendo corrupción y política federal. Ex reportero de investigación en medios nacionales. Especialista en análisis de documentos oficiales y finanzas públicas.",
  },
  {
    name: "María del Carmen Vega",
    role: "Periodista de Datos",
    bio: "Ingeniera de sistemas con maestría en periodismo de datos. Transforma bases públicas en investigaciones accionables. Experta en transparencia y acceso a la información.",
  },
  {
    name: "Roberto Fuentes",
    role: "Corresponsal Nacional",
    bio: "Cubre procesos legislativos y delitos electorales en las principales entidades del país. Su red de fuentes en congresos estatales ha permitido desentrañar acuerdos de poder.",
  },
  {
    name: "Ana Lucía Ríos",
    role: "Editora de Verificación",
    bio: "Líder del equipo de verificación en doble fuente. Garantiza que cada publicación cumpla con los estándares más rigurosos de precisión y derecho de respuesta.",
  },
];

export default function EquipoPage() {
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
          <Users className="w-8 h-8 text-accent" />
          <h1
            className="text-4xl font-black"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            EQUIPO<span className="text-accent"> EDITORIAL</span>
          </h1>
        </div>

        <p
          className="text-sm leading-relaxed text-foreground/90 mb-10"
          style={{ fontFamily: "'Lora', serif" }}
        >
          LABANDERA cuenta con un equipo editorial independiente y corresponsales en
          las principales entidades del país. Nuestro compromiso es con la ciudadanía,
          no con partidos políticos ni grupos de interés.
        </p>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TEAM_MEMBERS.map((member, i) => (
            <div
              key={i}
              className="bg-card border border-border p-6 hover:border-accent transition-colors"
            >
              <h3
                className="text-xl font-black mb-1"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {member.name}
              </h3>
              <p className="font-mono text-xs tracking-widest text-accent mb-3">
                {member.role}
              </p>
              <p
                className="text-sm leading-relaxed text-foreground/90"
                style={{ fontFamily: "'Lora', serif" }}
              >
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
