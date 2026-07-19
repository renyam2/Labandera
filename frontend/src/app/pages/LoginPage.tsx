import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Droplets, LogIn, Eye, EyeOff } from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { login } from "../services/auth";

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Completa todos los campos.");
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      localStorage.setItem("token", res.data.token);
	localStorage.setItem("user", JSON.stringify(res.data.user));
      onLogin();
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Credenciales incorrectas. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel - Branding */}
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
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs" style={{ fontFamily: "'Lora', serif" }}>
            Acceso exclusivo para periodistas acreditados del equipo LABANDERA.
          </p>
        </div>
        <div className="border-t border-muted pt-6">
          <p className="font-mono text-xs text-muted-foreground">
            ¿No tienes cuenta? <Link to="/register" className="text-accent hover:underline">Regístrate</Link>
          </p>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-sm">
          <CardHeader className="space-y-1">
            <div className="lg:hidden flex items-center gap-2 mb-4">
              <Droplets className="w-5 h-5 text-accent" />
              <span
                className="text-2xl font-black"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                LA<span className="text-accent">BANDERA</span>
              </span>
            </div>
            <CardTitle className="text-3xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              ACCESO
            </CardTitle>
            <CardDescription className="font-mono text-xs tracking-widest">
              SALA DE REDACCIÓN
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <label className="font-mono text-xs tracking-widest text-muted-foreground">
                  USUARIO
                </label>
                <Input
                  type="email"
                  placeholder="tu.nombre@labandera.mx"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="font-mono text-xs tracking-widest text-muted-foreground">
                  CONTRASEÑA
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="font-mono text-xs text-accent" role="alert">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <span className="animate-pulse">VERIFICANDO...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    ENTRAR
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/register")}
            >
              ¿No tienes cuenta? <span className="font-bold">Regístrate</span>
            </Button>
            <p className="font-mono text-xs text-muted-foreground text-center">
              ¿Problemas de acceso? <Link to="/contacto" className="text-primary hover:underline">Contacta al editor</Link>.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
