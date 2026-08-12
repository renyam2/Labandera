import { Droplets, Mail, Phone, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function AcercaDePage() {
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
          <Droplets className="w-8 h-8 text-accent" />
          <h1
            className="text-4xl font-black"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            LA<span className="text-accent">BANDERA</span>
          </h1>
        </div>

        {/* Misión */}
        <section className="mb-10">
          <h2
            className="text-2xl font-bold mb-3"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            MISIÓN
          </h2>
          <p
            className="text-sm leading-relaxed text-foreground/90"
            style={{ fontFamily: "'Lora', serif" }}
          >
            LABANDERA es un medio de periodismo de investigación político para México.
            Nacimos con una misión clara: filtrar el agua sucia de la política mexicana,
            exponiendo corrupción, malversación de fondos públicos y abusos de poder
            con rigor, fuentes verificables y sin censura.
          </p>
        </section>

        {/* Enfoque */}
        <section className="mb-10">
          <h2
            className="text-2xl font-bold mb-3"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            ENFOQUE
          </h2>
          <p
            className="text-sm leading-relaxed text-foreground/90 mb-4"
            style={{ fontFamily: "'Lora', serif" }}
          >
            Trabajamos en las áreas de salud pública, patrimonio nacional, proceso
            legislativo, corrupción y delitos electorales. Cada nota pasa por un proceso
            de verificación en doble fuente antes de su publicación.
          </p>
          <ul className="space-y-2 font-mono text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-accent">▸</span>
              Periodismo de datos y documentos oficiales.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">▸</span>
              Redacción colaborativa con periodistas acreditados.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">▸</span>
              Derecho de respuesta garantizado a los involucrados.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">▸</span>
              Transparencia total en fuentes y metodología.
            </li>
          </ul>
        </section>

        {/* Equipo */}
        <section className="mb-10">
          <h2
            className="text-2xl font-bold mb-3"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            EQUIPO
          </h2>
          <p
            className="text-sm leading-relaxed text-foreground/90"
            style={{ fontFamily: "'Lora', serif" }}
          >
            LABANDERA cuenta con un equipo editorial independiente y corresponsales en
            las principales entidades del país. Nuestro compromiso es con la ciudadanía,
            no con partidos políticos ni grupos de interés.
          </p>
        </section>

        {/* Contacto */}
        <section className="bg-secondary border border-border p-6">
          <h2
            className="text-2xl font-bold mb-4"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            CONTACTO
          </h2>
          <div className="space-y-2 font-mono text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-accent" />
              contacto@labandera.mx
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-accent" />
              +52 55 1234 5678
            </p>
          </div>
          <p className="font-mono text-xs text-muted-foreground mt-4">
            Para denuncias anónimas y envío de documentos, utiliza nuestro formulario
            de contacto seguro.
          </p>
        </section>
      </div>
    </div>
  );
}
