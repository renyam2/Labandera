import { Link } from "react-router-dom";
import { Droplets, Mail, Phone, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t-2 border-foreground bg-foreground text-background mt-16 py-10">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Droplets className="w-4 h-4 text-accent" />
            <span
              className="text-xl font-black"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              LA<span className="text-accent">BANDERA</span>
            </span>
          </div>
          <p className="font-mono text-xs text-muted-foreground max-w-xs mb-3">
            Periodismo de investigación política para México. Filtramos el agua sucia.
          </p>
          <div className="flex flex-col gap-1 font-mono text-xs text-muted-foreground">
            <span className="flex items-center gap-2"><Mail className="w-3 h-3" /> contacto@labandera.mx</span>
            <span className="flex items-center gap-2"><Phone className="w-3 h-3" /> +52 55 1234 5678</span>
          </div>
        </div>
        <div className="flex flex-col gap-3 font-mono text-xs text-muted-foreground">
          <div className="flex gap-4 mb-2">
            <Link to="/privacidad" className="hover:text-accent transition-colors">Política de Privacidad</Link>
            <Link to="/terminos" className="hover:text-accent transition-colors">Términos de Uso</Link>
            <Link to="/contacto" className="hover:text-accent transition-colors">Contacto</Link>
            <Link to="/fuentes" className="hover:text-accent transition-colors">Fuentes</Link>
          </div>
          <div className="flex gap-4 mb-2">
            <a href="https://twitter.com/labandera" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="hover:text-accent transition-colors"><Twitter className="w-4 h-4" /></a>
            <a href="https://facebook.com/labandera" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-accent transition-colors"><Facebook className="w-4 h-4" /></a>
            <a href="https://instagram.com/labandera" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-accent transition-colors"><Instagram className="w-4 h-4" /></a>
            <a href="https://linkedin.com/company/labandera" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-accent transition-colors"><Linkedin className="w-4 h-4" /></a>
          </div>
          <p>© 2026 LABANDERA</p>
          <p className="mt-1">Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
