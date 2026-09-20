import { ArrowLeft } from "lucide-react";

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => window.history.back()} className="flex items-center gap-1.5 font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-8" aria-label="Volver">
          <ArrowLeft className="w-3.5 h-3.5" /> VOLVER
        </button>
        <h1 className="text-4xl font-black mb-6" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Política de Privacidad</h1>
        <div className="prose max-w-none font-mono text-sm text-foreground/90 space-y-4">
          <p>Última actualización: Junio 2026</p>
          <p>En LABANDERA nos comprometemos a proteger tu información personal. Esta política describe cómo recopilamos, usamos y protegemos tus datos cuando utilizamos nuestra plataforma.</p>
          <h3 className="text-xl font-bold mt-4">1. Información que Recopilamos</h3>
          <p>Recopilamos información que nos proporcionas directamente al registrarte, publicar notas o contactarnos. Esto incluye nombre, correo electrónico, credenciales de acceso y contenido de tus publicaciones.</p>
          <h3 className="text-xl font-bold mt-4">2. Uso de la Información</h3>
          <p>Utilizamos tus datos para gestionar tu cuenta, publicar contenido, mejorar nuestros servicios y cumplir con obligaciones legales. No vendemos ni compartimos tu información con terceros sin tu consentimiento, salvo requerimiento legal.</p>
          <h3 className="text-xl font-bold mt-4">3. Seguridad</h3>
          <p>Implementamos medidas técnicas y organizativas para proteger tus datos contra acceso no autorizado, alteración, divulgación o destrucción.</p>
          <h3 className="text-xl font-bold mt-4">4. Tus Derechos</h3>
          <p>Puedes solicitar el acceso, rectificación, cancelación u oposición al tratamiento de tus datos contactándonos a contacto@labandera.mx.</p>
        </div>
      </div>
    </div>
  );
}
