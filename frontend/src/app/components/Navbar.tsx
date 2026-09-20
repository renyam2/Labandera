import { useNavigate, Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "../components/ui/sheet";
import { LogIn, LogOut, Upload, Menu, Droplets } from "lucide-react";

export default function Navbar({
  loggedIn,
  onLogout,
}: {
  loggedIn: boolean;
  onLogout: () => void;
}) {
  const navigate = useNavigate();

  const isAdmin = (() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return false;
      const user = JSON.parse(raw);
      return user.roles?.includes("Administrador");
    } catch {
      return false;
    }
  })();

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
        <div className="hidden md:flex items-center gap-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
                aria-label="Ver secciones"
              >
                SECCIONES ▾
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Secciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/acerca">ACERCA DE LABANDERA</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/equipo">EQUIPO EDITORIAL</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/metodologia">METODOLOGÍA</Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuSeparator />
              )}
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link to="/estadisticas">ESTADÍSTICAS</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link to="/contacto">CONTACTO</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/fuentes">FUENTES</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link
            to="/fuentes"
            className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            FUENTES
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {loggedIn && (
            <>
              <button
                onClick={() => navigate("/upload")}
                className="hidden md:flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 font-mono text-xs tracking-widest hover:bg-accent transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
                aria-label="Publicar nota"
              >
                <Upload className="w-3.5 h-3.5" />
                PUBLICAR
              </button>
              <button
                onClick={onLogout}
                className="text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
          {!loggedIn && (
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-1.5 border border-foreground px-3 py-1.5 font-mono text-xs tracking-widest hover:bg-foreground hover:text-background transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
              aria-label="Acceso periodistas"
            >
              <LogIn className="w-3.5 h-3.5" />
              PERIODISTAS
            </button>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <button
                className="md:hidden"
                aria-label="Abrir menú de navegación"
              >
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80%] sm:w-[350px]" aria-label="Menú de navegación móvil">
              <SheetHeader className="border-b border-border pb-4">
                <SheetTitle className="font-mono text-xs tracking-widest">MENÚ</SheetTitle>
                <SheetDescription className="sr-only">Navegación móvil</SheetDescription>
              </SheetHeader>
              <ul className="flex flex-col gap-4 mt-6 list-none" aria-label="Secciones">
                <li>
                  <SheetClose asChild>
                    <Link
                      to="/acerca"
                      className="font-mono text-xs tracking-widest text-left text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
                    >
                      ACERCA DE LABANDERA
                    </Link>
                  </SheetClose>
                </li>
                <li>
                  <SheetClose asChild>
                    <Link
                      to="/equipo"
                      className="font-mono text-xs tracking-widest text-left text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
                    >
                      EQUIPO EDITORIAL
                    </Link>
                  </SheetClose>
                </li>
                <li>
                  <SheetClose asChild>
                    <Link
                      to="/metodologia"
                      className="font-mono text-xs tracking-widest text-left text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
                    >
                      METODOLOGÍA
                    </Link>
                  </SheetClose>
                </li>
                <li>
                  <SheetClose asChild>
                    <Link
                      to="/contacto"
                      className="font-mono text-xs tracking-widest text-left text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
                    >
                      CONTACTO
                    </Link>
                  </SheetClose>
                </li>
                <li>
                  <SheetClose asChild>
                    <Link
                      to="/fuentes"
                      className="font-mono text-xs tracking-widest text-left text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
                    >
                      FUENTES
                    </Link>
                  </SheetClose>
                </li>
                {loggedIn && (
                  <li>
                    <SheetClose asChild>
                      <Link
                        to="/upload"
                        className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 font-mono text-xs tracking-widest w-fit"
                        aria-label="Publicar nota"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        PUBLICAR NOTA
                      </Link>
                    </SheetClose>
                  </li>
                )}
              </ul>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
