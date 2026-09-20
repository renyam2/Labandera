import { ArrowLeft } from "lucide-react";

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => window.history.back()} className="flex items-center gap-1.5 font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-8" aria-label="Volver">
          <ArrowLeft className="w-3.5 h-3.5" /> VOLVER
        </button>
        <h1 className="text-4xl font-black mb-6" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Términos de Uso</h1>
        <div className="prose max-w-none font-mono text-sm text-foreground/90 space-y-4">
          <p>Última actualización: Junio 2026</p>
          <p>Al acceder y utilizar LABANDERA, aceptas cumplir con los siguientes términos y condiciones. Si no estás de acuerdo, te pedimos que no utilices nuestra plataforma.</p>
          <h3 className="text-xl font-bold mt-4">1. Acceso y Cuenta</h3>
          <p>El acceso está restringido a periodistas acreditados. Debes mantener la confidencialidad de tus credenciales y eres responsable de todas las actividades realizadas bajo tu cuenta.</p>
          <h3 className="text-xl font-bold mt-4">2. Contenido</h3>
          <p>Los usuarios son responsables de la veracidad y legalidad del contenido que publiquen. LABANDERA se reserva el derecho de moderar, editar o eliminar contenido que viole nuestras políticas o la ley.</p>
          <h3 className="text-xl font-bold mt-4">3. Propiedad Intelectual</h3>
          <p>Todo el contenido original publicado en LABANDERA está protegido por derechos de autor. Su reproducción total o parcial requiere autorización expresa.</p>
          <h3 className="text-xl font-bold mt-4">4. Limitación de Responsabilidad</h3>
          <p>LABANDERA no garantiza la disponibilidad ininterrumpida del servicio ni se hace responsable de daños indirectos derivados del uso de la plataforma.</p>
        </div>
      </div>
    </div>
  );
}
