import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";

export default function ContactoPage() {
  const [sent, setSent] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => window.history.back()} className="flex items-center gap-1.5 font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-8" aria-label="Volver">
          <ArrowLeft className="w-3.5 h-3.5" /> VOLVER
        </button>
        <h1 className="text-4xl font-black mb-6" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Contacto</h1>
        <p className="font-mono text-sm text-muted-foreground mb-8">¿Tienes una pista, documento o sugerencia? Escríbenos de forma segura.</p>
        
        {sent ? (
          <div className="bg-primary/10 border border-primary p-6 text-center">
            <p className="font-mono text-sm text-primary font-bold">Mensaje enviado correctamente. Te responderemos a la brevedad.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="font-mono text-xs tracking-widest block mb-1.5">NOMBRE</label>
              <input type="text" required className="w-full bg-input-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition" />
            </div>
            <div>
              <label className="font-mono text-xs tracking-widest block mb-1.5">CORREO ELECTRÓNICO</label>
              <input type="email" required className="w-full bg-input-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition" />
            </div>
            <div>
              <label className="font-mono text-xs tracking-widest block mb-1.5">MENSAJE</label>
              <textarea required rows={5} className="w-full bg-input-background border border-border px-4 py-3 text-sm resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition" style={{ fontFamily: "'Lora', serif" }}></textarea>
            </div>
            <button type="submit" className="w-full bg-accent text-accent-foreground py-3 font-mono text-sm tracking-widest hover:bg-primary transition-colors flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> ENVIAR MENSAJE
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
