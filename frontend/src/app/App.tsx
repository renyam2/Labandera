
import { useState, useRef, Suspense, lazy, useEffect } from "react";
import { useClickOutside } from "./hooks/useClickOutside";
import { useCalendarEvent } from "./hooks/useCalendarEvent";
import { useSeasonalUpdate } from "./hooks/useSeasonalUpdate";
import {
  LogIn,
  LogOut,
  Upload,
  Eye,
  ArrowLeft,
  Menu,
  X,
  MapPin,
  Calendar,
  Tag,
  ImagePlus,
  Send,
  ChevronRight,
  Search,
  Droplets,
  Newspaper,
  Mail,
  Phone,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";
import api from "./services/api";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from "react-router-dom";

// ─── Types ───────────────────────────────────────────────────────────────────

type Screen = "login" | "home" | "article" | "upload";

interface Article {
  id: number;
  title: string;
  summary: string;
  body: string;
  author: string;
  date: string;
  tag: string;
  state: string;
  imageUrl: string;
  featured: boolean;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const ARTICLES: Article[] = [
  {
    id: 1,
    title: "Secretaría de Salud CDMX desvía 47 MDP en contratos fantasma",
    summary:
      "Documentos filtrados revelan que contratos de material médico fueron asignados a empresas sin RFC activo durante la gestión de Armando Solís Barrera.",
    body: `Una investigación de LABANDERA ha documentado el desvío de 47 millones de pesos en contratos de adquisición de material médico asignados a tres empresas que, al momento de la licitación, tenían sus RFC dados de baja ante el SAT.\n\nLos documentos —obtenidos vía solicitudes de transparencia y fuentes internas de la Secretaría— muestran que las adjudicaciones directas se realizaron entre enero y marzo de 2023, eludiendo el proceso de licitación pública establecido por la Ley de Adquisiciones.\n\nArmando Solís Barrera, entonces titular de la dependencia, firmó los contratos sin observación alguna por parte de la Contraloría Interna. Las empresas beneficiadas —Grupo Médico Plenitud SA de CV, Insumos Hospitalarios del Centro SC y BioSalud Express SA de CV— comparten el mismo domicilio fiscal en la colonia Doctores.\n\nFuentes al interior de la Secretaría confirmaron que ninguno de los insumos contratados ingresó jamás al almacén central. Ante los señalamientos, la dependencia no respondió a la solicitud de entrevista enviada el pasado 14 de mayo.\n\nLa Fiscalía Anticorrupción de la Ciudad de México fue notificada de los hallazgos. A la fecha de publicación, no existe carpeta de investigación abierta.`,
    author: "Sofía Arreola Vega",
    date: "18 Jun 2026",
    tag: "SALUD",
    state: "Ciudad de México",
    imageUrl:
      "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=1200&h=600&fit=crop&auto=format",
    featured: true,
  },
  {
    id: 2,
    title: "Gobernador de Tamaulipas compra rancho con fondos de obra pública",
    summary:
      "Registros notariales ubican al titular del Ejecutivo estatal como propietario de 340 hectáreas adquiridas en 2024 mientras su gobierno reportaba déficit presupuestal.",
    body: `Registros notariales y escrituras obtenidas por LABANDERA revelan que el gobernador de Tamaulipas adquirió en agosto de 2024 un rancho de 340 hectáreas en el municipio de Güémez, valuado en 28 millones de pesos, durante un periodo en que el gobierno estatal reportó déficit presupuestal y solicitó recursos federales de emergencia.\n\nLa compraventa fue formalizada ante el notario público número 18 de Ciudad Victoria. El inmueble —denominado "La Esperanza"— figura ahora a nombre de una empresa de reciente creación vinculada a familiares directos del funcionario.\n\nAnalistas del gasto público consultados por este medio señalan que los ingresos declarados del funcionario durante su mandato no son compatibles con la adquisición documentada.`,
    author: "Rodrigo Méndez Cantú",
    date: "15 Jun 2026",
    tag: "PATRIMONIO",
    state: "Tamaulipas",
    imageUrl:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=500&fit=crop&auto=format",
    featured: false,
  },
  {
    id: 3,
    title: "Diputados federales aprueban ley hecha a modo para beneficiar a constructoras aliadas",
    summary:
      "El dictamen modifica los requisitos de participación en licitaciones de obra pública federal, favoreciendo a tres empresas vinculadas a legisladores del partido en el poder.",
    body: `En sesión de madrugada y sin debate público, la Cámara de Diputados aprobó el pasado 10 de junio una reforma al artículo 28 de la Ley de Obras Públicas que elimina el requisito de experiencia previa para participar en licitaciones de más de 50 millones de pesos.\n\nEl cambio beneficia de manera directa y ostensible a tres constructoras con menos de dos años de existencia cuyos accionistas tienen vínculos documentados con legisladores de la mayoría parlamentaria.`,
    author: "Valentina Cruz Ibarra",
    date: "11 Jun 2026",
    tag: "LEGISLATIVO",
    state: "Nacional",
    imageUrl:
      "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&h=500&fit=crop&auto=format",
    featured: false,
  },
  {
    id: 4,
    title: "Alcalde de Puebla falsifica firma en declaración patrimonial ante SFP",
    summary:
      "Peritos grafoscopistas contratados por familiares del exfuncionario determinan que la firma en los documentos entregados a la Secretaría de la Función Pública no corresponde al titular.",
    body: `Un dictamen pericial encargado por la familia de un alcalde michoacano a un grafoscopista certificado concluye que la firma que aparece en su declaración patrimonial 2023 ante la Secretaría de la Función Pública es apócrifa.\n\nEl documento, al que tuvo acceso LABANDERA, señala con una probabilidad del 96% que la rúbrica fue elaborada por una persona distinta al funcionario, lo que podría configurar el delito de falsificación de documentos públicos en términos del Código Penal Federal.`,
    author: "Marco Leyva Paredes",
    date: "7 Jun 2026",
    tag: "CORRUPCIÓN",
    state: "Puebla",
    imageUrl:
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=500&fit=crop&auto=format",
    featured: false,
  },
  {
    id: 5,
    title: "Instituto Electoral de Oaxaca recibe facturas por servicios inexistentes",
    summary:
      "Auditoría interna revela pagos por 12 MDP a proveedores que no entregaron los servicios de capacitación electoral facturados en el ciclo 2024-2025.",
    body: `Una auditoría interna del Instituto Electoral y de Participación Ciudadana de Oaxaca (IEEPCO) detectó irregularidades por más de 12 millones de pesos en contratos de capacitación que nunca se ejecutaron. Los proveedores beneficiados no acreditan capacidad técnica ni infraestructura para los servicios facturados.\n\nLa auditoría fue paralizada a mitad del proceso por instrucción del Consejo General del instituto, según denunció ante LABANDERA el auditor responsable, quien pidió omitir su nombre por temor a represalias.`,
    author: "Lupe Sandoval Fuentes",
    date: "2 Jun 2026",
    tag: "ELECTORAL",
    state: "Oaxaca",
    imageUrl:
      "https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=800&h=500&fit=crop&auto=format",
    featured: false,
  },
];

const TAGS = ["TODOS", "SALUD", "PATRIMONIO", "LEGISLATIVO", "CORRUPCIÓN", "ELECTORAL", "SEGURIDAD"];

// ─── Tag badge ────────────────────────────────────────────────────────────────

function TagBadge({ tag, accent = false }: { tag: string; accent?: boolean }) {
  return (
    <span
      className={`font-mono text-xs font-700 tracking-widest px-2 py-0.5 ${
        accent
          ? "bg-accent text-accent-foreground"
          : "bg-foreground text-background"
      }`}
    >
      {tag}
    </span>
  );
}

// ─── Footer Component ─────────────────────────────────────────────────────────

function Footer() {
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

// ─── Nav bar ──────────────────────────────────────────────────────────────────

function Navbar({
  loggedIn,
  onLogout,
}: {
  loggedIn: boolean;
  onLogout: () => void;
}) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setDropdownOpen(false));

  return (
    <header className="border-b-2 border-foreground bg-card sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <Droplets className="w-5 h-5 text-accent group-hover:text-primary transition-colors" />
          <span
            className="text-2xl font-black tracking-tight leading-none"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            LA<span className="text-accent">BANDERA</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {["SALUD", "PATRIMONIO", "LEGISLATIVO", "CORRUPCIÓN"].map((t) => (
            <button
              key={t}
              onClick={() => navigate("/")}
              className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              {t}
            </button>
          ))}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              SECCIONES ▾
            </button>
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-card border border-border shadow-lg py-2 z-50">
                <button onClick={() => { navigate("/"); setDropdownOpen(false); }} className="block w-full text-left px-4 py-2 font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  ACERCA DE LABANDERA
                </button>
                <button onClick={() => { navigate("/"); setDropdownOpen(false); }} className="block w-full text-left px-4 py-2 font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  EQUIPO EDITORIAL
                </button>
                <button onClick={() => { navigate("/"); setDropdownOpen(false); }} className="block w-full text-left px-4 py-2 font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  METODOLOGÍA
                </button>
                <Link to="/contacto" onClick={() => setDropdownOpen(false)} className="block w-full text-left px-4 py-2 font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  CONTACTO
                </Link>
                <Link to="/fuentes" onClick={() => setDropdownOpen(false)} className="block w-full text-left px-4 py-2 font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  FUENTES
                </Link>
              </div>
            )}
          </div>
          <button
            onClick={() => navigate("/fuentes")}
            className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            FUENTES
          </button>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {loggedIn && (
            <>
              <button
                onClick={() => navigate("/upload")}
                className="hidden md:flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 font-mono text-xs tracking-widest hover:bg-accent transition-colors"
                aria-label="Publicar nota"
              >
                <Upload className="w-3.5 h-3.5" />
                PUBLICAR
              </button>
              <button
                onClick={onLogout}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
          {!loggedIn && (
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-1.5 border border-foreground px-3 py-1.5 font-mono text-xs tracking-widest hover:bg-foreground hover:text-background transition-colors"
              aria-label="Acceso periodistas"
            >
              <LogIn className="w-3.5 h-3.5" />
              PERIODISTAS
            </button>
          )}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Abrir menú de navegación"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-4 flex flex-col gap-3">
          {TAGS.slice(1).map((t) => (
            <button
              key={t}
              onClick={() => { navigate("/"); setMobileOpen(false); }}
              className="font-mono text-xs tracking-widest text-left text-muted-foreground hover:text-foreground"
            >
              {t}
            </button>
          ))}
          <button
            onClick={() => { navigate("/fuentes"); setMobileOpen(false); }}
            className="font-mono text-xs tracking-widest text-left text-muted-foreground hover:text-foreground"
          >
            FUENTES
          </button>
          {loggedIn && (
            <button
              onClick={() => { navigate("/upload"); setMobileOpen(false); }}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 font-mono text-xs tracking-widest w-fit"
              aria-label="Publicar nota"
            >
              <Upload className="w-3.5 h-3.5" />
              PUBLICAR NOTA
            </button>
          )}
        </div>
      )}
    </header>
  );
}

// ─── Screen 1: Login ──────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setError("");
  if (!user || !pass) { setError("Completa ambos campos."); return; }
  setLoading(true);
  try {
    const res = await api.post('/auth/login', { email: user, password: pass });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    onLogin();
    navigate("/");
  } catch {
    setError("Credenciales incorrectas. Intenta de nuevo.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-foreground text-background p-12">
        <div className="flex items-center gap-2">
          <Droplets className="w-6 h-6 text-accent" />
          <span
            className="text-3xl font-black tracking-tight"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            LA<span className="text-accent">BANDERA</span>
          </span>
        </div>
        <div>
          <p className="font-mono text-xs text-muted-foreground tracking-widest mb-6">
            PERIODISMO · TRANSPARENCIA · MÉXICO
          </p>
          <h2
            className="text-5xl font-black leading-tight mb-6"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            FILTRAMOS
            <br />
            <span className="text-accent">EL AGUA</span>
            <br />
            SUCIA
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs"
             style={{ fontFamily: "'Lora', serif" }}>
            Acceso exclusivo para periodistas acreditados del equipo LABANDERA.
            Si eres colaborador, solicita tus credenciales al editor jefe.
          </p>
        </div>
        <div className="border-t border-muted pt-6">
          <p className="font-mono text-xs text-muted-foreground">
            DEMO: usuario <span className="text-background">periodista</span> / contraseña <span className="text-background">labandera2026</span>
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <Droplets className="w-5 h-5 text-accent" />
            <span
              className="text-2xl font-black"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              LA<span className="text-accent">BANDERA</span>
            </span>
          </div>

          <h1
            className="text-4xl font-black mb-1"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            ACCESO
          </h1>
          <p className="font-mono text-xs text-muted-foreground tracking-widest mb-8">
            SALA DE REDACCIÓN
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div>
              <label className="font-mono text-xs tracking-widest block mb-1.5">
                USUARIO
              </label>
              <input
                type="email"
                required
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="tu.nombre@labandera.mx"
                className="w-full bg-input-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
              />
            </div>
            <div>
              <label className="font-mono text-xs tracking-widest block mb-1.5">
                CONTRASEÑA
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••••"
                className="w-full bg-input-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
              />
            </div>

            {error && (
              <p className="font-mono text-xs text-accent" role="alert">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-background py-3 font-mono text-sm tracking-widest hover:bg-primary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-pulse">VERIFICANDO...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  ENTRAR
                </>
              )}
            </button>
          </form>

          <p className="mt-8 font-mono text-xs text-muted-foreground text-center">
            ¿Problemas de acceso? <Link to="/contacto" className="text-primary hover:underline">Contacta al editor</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 2: Home ───────────────────────────────────────────────────────────

function HomeScreen({
  onArticle,
  loggedIn,
}: {
  onArticle: (a: Article) => void;
  loggedIn: boolean;
}) {
  const navigate = useNavigate();
  const [activeTag, setActiveTag] = useState("TODOS");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  const featured = ARTICLES.find((a) => a.featured)!;
  const filtered = ARTICLES.filter((a) => {
    const matchTag = activeTag === "TODOS" || a.tag === activeTag;
    const matchSearch =
      !searchTerm ||
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchTerm.toLowerCase());
    return matchTag && matchSearch;
  });
  const rest = filtered.filter((a) => !a.featured);

  return (
    <div className="min-h-screen bg-background">
      {/* Tag bar */}
      <div className="border-b border-border bg-card sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between overflow-x-auto">
          <div className="flex">
            {TAGS.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTag(t)}
                className={`font-mono text-xs tracking-widest px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
                  activeTag === t
                    ? "border-accent text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="ml-4 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Buscar notas"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
        {searchOpen && (
          <div className="border-t border-border px-4 py-2 max-w-7xl mx-auto">
            <input
              autoFocus
              type="search"
              placeholder="Buscar notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-sm focus:outline-none py-1"
              style={{ fontFamily: "'Lora', serif" }}
            />
          </div>
        )}
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Featured */}
        {(activeTag === "TODOS" || activeTag === featured.tag) && !searchTerm && (
          <div
            className="grid grid-cols-1 lg:grid-cols-2 border-2 border-foreground mb-8 cursor-pointer group"
            onClick={() => onArticle(featured)}
          >
            <div className="relative overflow-hidden bg-muted">
              <img
                src={featured.imageUrl}
                alt={featured.title}
                className="w-full h-64 lg:h-full object-cover group-hover:scale-102 transition-transform duration-500"
                loading="lazy"
                style={{ minHeight: "260px" }}
              />
              <div className="absolute inset-0 bg-foreground/10 group-hover:bg-foreground/0 transition-colors" />
            </div>
            <div className="p-8 flex flex-col justify-between bg-card">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <TagBadge tag={featured.tag} accent />
                  <span className="font-mono text-xs text-muted-foreground">
                    NOTA PRINCIPAL
                  </span>
                </div>
                <h2
                  className="text-3xl lg:text-4xl font-black leading-tight mb-4 group-hover:text-accent transition-colors"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {featured.title}
                </h2>
                <p
                  className="text-sm text-muted-foreground leading-relaxed"
                  style={{ fontFamily: "'Lora', serif" }}
                >
                  {featured.summary}
                </p>
              </div>
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {featured.author}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {featured.date} · {featured.state}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-accent group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          {rest.map((article) => (
            <ArticleCard 
              key={article.id} 
              article={article} 
              onClick={() => onArticle(article)}
              isHighlighted={highlightedId === article.id}
              onPointerEnter={() => setHighlightedId(article.id)}
              onPointerLeave={() => setHighlightedId(null)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="font-mono text-muted-foreground text-sm">
              No se encontraron notas.
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function ArticleCard({ 
  article, 
  onClick, 
  isHighlighted,
  onPointerEnter,
  onPointerLeave
}: { 
  article: Article; 
  onClick: () => void;
  isHighlighted: boolean;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}) {
  return (
    <div
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className={`bg-card p-6 cursor-pointer group flex flex-col gap-4 transition-all duration-300 ${
        isHighlighted 
          ? "bg-secondary border-2 border-accent shadow-xl scale-[1.02] z-10" 
          : "hover:bg-secondary"
      }`}
      role="article"
      aria-label={`Ver nota: ${article.title}`}
    >
      <div className="overflow-hidden bg-muted aspect-video">
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>
      <div className="flex items-center gap-2">
        <TagBadge tag={article.tag} />
        <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {article.state}
        </span>
      </div>
      <h3
        className="font-black text-xl leading-tight group-hover:text-accent transition-colors"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        {article.title}
      </h3>
      <p
        className="text-xs text-muted-foreground leading-relaxed line-clamp-3"
        style={{ fontFamily: "'Lora', serif" }}
      >
        {article.summary}
      </p>
      <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
        <span className="font-mono text-xs text-muted-foreground">{article.date}</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
}

// ─── Screen 3: Article detail ─────────────────────────────────────────────────

function ArticleScreenLazy({
  article,
  onBack,
  onArticle,
}: {
  article: Article;
  onBack: () => void;
  onArticle: (a: Article) => void;
}) {
  const related = ARTICLES.filter((a) => a.id !== article.id && a.tag === article.tag).slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero image */}
      <div className="relative w-full bg-muted" style={{ height: "420px" }}>
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <TagBadge tag={article.tag} accent />
            <span className="font-mono text-xs text-white/70 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {article.state}
            </span>
          </div>
          <h1
            className="text-3xl md:text-5xl font-black text-white leading-tight max-w-3xl"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {article.title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-8"
          aria-label="Volver al inicio"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          VOLVER AL INICIO
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main */}
          <article className="lg:col-span-2">
            {/* Byline */}
            <div className="flex flex-wrap gap-6 pb-6 mb-6 border-b-2 border-foreground">
              <div>
                <p className="font-mono text-xs text-muted-foreground tracking-widest">
                  PERIODISTA
                </p>
                <p className="font-mono text-sm font-700">{article.author}</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted-foreground tracking-widest">
                  PUBLICADO
                </p>
                <p className="font-mono text-sm">{article.date}</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted-foreground tracking-widest">
                  CATEGORÍA
                </p>
                <p className="font-mono text-sm">{article.tag}</p>
              </div>
            </div>

            {/* Summary */}
            <p
              className="text-lg font-semibold leading-relaxed border-l-4 border-accent pl-5 mb-8 text-foreground"
              style={{ fontFamily: "'Lora', serif" }}
            >
              {article.summary}
            </p>

            {/* Body */}
            <div
              className="prose-content space-y-5"
              style={{ fontFamily: "'Lora', serif" }}
            >
              {article.body.split("\n\n").map((para, i) => (
                <p key={i} className="text-sm leading-loose text-foreground/90">
                  {para}
                </p>
              ))}
            </div>

            {/* Disclaimer */}
            <div className="mt-10 p-5 bg-secondary border border-border">
              <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">NOTA EDITORIAL:</strong> LABANDERA
                solicitó postura oficial a las dependencias mencionadas antes de la
                publicación. Las respuestas recibidas, en su caso, se incorporan al
                texto. Este trabajo periodístico no busca sustituir investigaciones de
                las autoridades competentes.
              </p>
            </div>
          </article>

          {/* Sidebar */}
          <aside>
            <div className="sticky top-28">
              {/* About */}
              <div className="bg-foreground text-background p-6 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Droplets className="w-4 h-4 text-accent" />
                  <span
                    className="text-lg font-black"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    LA<span className="text-accent">BANDERA</span>
                  </span>
                </div>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                  Periodismo político de investigación. Filtramos el agua sucia de la política mexicana desde 2024.
                </p>
              </div>

              {/* Related */}
              {related.length > 0 && (
                <div>
                  <p className="font-mono text-xs tracking-widest text-muted-foreground mb-4 border-b border-border pb-2">
                    NOTAS RELACIONADAS
                  </p>
                  <div className="space-y-4">
                    {related.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => onArticle(r)}
                        className="cursor-pointer group flex gap-3"
                      >
                        <div className="w-20 h-16 bg-muted shrink-0 overflow-hidden">
                          <img
                            src={r.imageUrl}
                            alt={r.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                        <div>
                          <p
                            className="text-xs font-black leading-snug group-hover:text-accent transition-colors"
                            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                          >
                            {r.title}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground mt-1">
                            {r.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 4: Upload ─────────────────────────────────────────────────────────

function UploadScreenLazy({ onBack, onPublish }: { onBack: () => void; onPublish: () => void }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    summary: "",
    body: "",
    author: "",
    state: "",
    tag: "CORRUPCIÓN",
  });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...files].slice(0, 5));
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews].slice(0, 5));
  };

  const removeImage = (i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.summary || !form.body || !form.author) return;
    setSubmitted(true);
    setTimeout(() => {
      onPublish();
      navigate("/");
    }, 2000);
  };

  const incomplete = !form.title || !form.summary || !form.body || !form.author;

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-primary flex items-center justify-center mx-auto mb-6">
            <Newspaper className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2
            className="text-4xl font-black mb-3"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            NOTA ENVIADA
          </h2>
          <p className="font-mono text-xs text-muted-foreground">
            Redirigiendo a la portada...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b-2 border-foreground bg-card px-4 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              VOLVER
            </button>
            <h1
              className="text-3xl font-black"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              NUEVA NOTA
            </h1>
          </div>
          <div className="font-mono text-xs text-muted-foreground text-right">
            <p>SALA DE REDACCIÓN</p>
            <p className="text-accent">● EN LÍNEA</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-8" noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div>
              <label className="font-mono text-xs tracking-widest block mb-1.5">
                TITULAR *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="El titular que nadie quiere publicar..."
                className="w-full bg-input-background border border-border px-4 py-3 text-lg font-black focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              />
            </div>

            {/* Summary */}
            <div>
              <label className="font-mono text-xs tracking-widest block mb-1.5">
                RESUMEN / LEAD *
              </label>
              <textarea
                required
                value={form.summary}
                onChange={(e) => set("summary", e.target.value)}
                placeholder="El párrafo de entrada que resume el escándalo..."
                rows={3}
                className="w-full bg-input-background border border-border px-4 py-3 text-sm resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                style={{ fontFamily: "'Lora', serif" }}
              />
            </div>

            {/* Body */}
            <div>
              <label className="font-mono text-xs tracking-widest block mb-1.5">
                CUERPO DE LA NOTA *
              </label>
              <textarea
                required
                value={form.body}
                onChange={(e) => set("body", e.target.value)}
                placeholder="Desarrolla la investigación. Sé específico con fechas, nombres y cantidades..."
                rows={14}
                className="w-full bg-input-background border border-border px-4 py-3 text-sm resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition leading-relaxed"
                style={{ fontFamily: "'Lora', serif" }}
              />
              <p className="font-mono text-xs text-muted-foreground mt-1">
                {form.body.length} caracteres
              </p>
            </div>

            {/* Image upload */}
            <div>
              <label className="font-mono text-xs tracking-widest block mb-1.5">
                IMÁGENES / DOCUMENTOS (máx. 5)
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFiles}
                className="hidden"
              />
              {previews.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-border py-8 flex flex-col items-center gap-2 hover:border-primary hover:bg-secondary transition-colors"
                  aria-label="Seleccionar archivos"
                >
                  <ImagePlus className="w-6 h-6 text-muted-foreground" />
                  <span className="font-mono text-xs text-muted-foreground">
                    SELECCIONAR ARCHIVOS
                  </span>
                </button>
              )}
              {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {previews.map((src, i) => (
                    <div key={i} className="relative group aspect-video bg-muted overflow-hidden">
                      <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 bg-accent text-accent-foreground w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Eliminar imagen ${i + 1}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar metadata */}
          <div className="space-y-5">
            <div className="bg-secondary border border-border p-5 space-y-5">
              <p className="font-mono text-xs tracking-widest border-b border-border pb-3">
                METADATOS
              </p>

              <div>
                <label className="font-mono text-xs tracking-widest block mb-1.5">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> PERIODISTA *</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.author}
                  onChange={(e) => set("author", e.target.value)}
                  placeholder="Nombre completo"
                  className="w-full bg-card border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary transition"
                />
              </div>

              <div>
                <label className="font-mono text-xs tracking-widest block mb-1.5">
                  <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> CATEGORÍA</span>
                </label>
                <select
                  value={form.tag}
                  onChange={(e) => set("tag", e.target.value)}
                  className="w-full bg-card border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary transition font-mono"
                >
                  {TAGS.slice(1).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value="SEGURIDAD">SEGURIDAD</option>
                </select>
              </div>

              <div>
                <label className="font-mono text-xs tracking-widest block mb-1.5">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> ESTADO / ENTIDAD</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                  placeholder="Ciudad de México"
                  className="w-full bg-card border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary transition"
                />
              </div>

              <div>
                <label className="font-mono text-xs tracking-widest block mb-1.5">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> FECHA</span>
                </label>
                <p className="font-mono text-sm text-muted-foreground">
                  {new Date().toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }).toUpperCase()}
                </p>
              </div>
            </div>

            {/* Preview notice */}
            {incomplete && (
              <p className="font-mono text-xs text-muted-foreground">
                Completa los campos marcados con * para publicar.
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={incomplete}
              className="w-full bg-accent text-accent-foreground py-4 font-mono text-sm tracking-widest hover:bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              aria-label="Publicar nota"
            >
              <Send className="w-4 h-4" />
              PUBLICAR NOTA
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full border border-border py-3 font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              aria-label="Cancelar"
            >
              CANCELAR
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Legal & Contact Pages ────────────────────────────────────────────────────
function PrivacidadScreen() {
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

function TerminosScreen() {
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

function ContactoScreen() {
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

function FuentesScreen() {
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

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const navigate = useNavigate();

  const handleLogin = () => {
    setLoggedIn(true);
    navigate("/");
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setLoggedIn(false);
    navigate("/");
  };

  const openArticle = (a: Article) => {
    setCurrentArticle(a);
    navigate(`/article/${a.id}`);
  };

  const activeEvent = useCalendarEvent();
  const activeSeason = useSeasonalUpdate();
  
  const currentBg = activeSeason?.bgClass || activeEvent?.theme.bgClass || "bg-background";
  const currentBanner = activeSeason || activeEvent;

  return (
    <div className={`min-h-screen ${currentBg} transition-colors duration-500`}>
      {currentBanner && (
        <div className={`w-full py-2 text-center font-mono text-sm tracking-widest ${currentBanner.bannerBg}`}>
          {currentBanner.bannerText}
        </div>
      )}
      <Navbar loggedIn={loggedIn} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<HomeScreen onArticle={openArticle} loggedIn={loggedIn} />} />
        <Route path="/login" element={loggedIn ? <Navigate to="/" /> : <LoginScreen onLogin={handleLogin} />} />
        <Route path="/article/:id" element={
          currentArticle ? <ArticleScreenLazy article={currentArticle} onBack={() => navigate("/")} onArticle={openArticle} /> : <Navigate to="/" />
        } />
        <Route path="/upload" element={
          loggedIn ? <UploadScreenLazy onBack={() => navigate("/")} onPublish={() => navigate("/")} /> : <Navigate to="/login" />
        } />
        <Route path="/privacidad" element={<PrivacidadScreen />} />
        <Route path="/terminos" element={<TerminosScreen />} />
        <Route path="/contacto" element={<ContactoScreen />} />
        <Route path="/fuentes" element={<FuentesScreen />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}
