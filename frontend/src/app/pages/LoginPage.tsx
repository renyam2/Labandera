import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Droplets, LogIn, ShieldCheck, QrCode } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { login, type LoginResponse } from "../services/auth";
import { verifyTwoFactor } from "../services/totp";

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Segundo paso: el token pendiente vive SOLO en memoria (React state),
  // nunca en localStorage (Hito H5).
  const [step, setStep] = useState<"credentials" | "totp">("credentials");
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [code, setCode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const finishLogin = (token: string, user: NonNullable<LoginResponse["user"]>) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    onLogin();
    navigate("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.requires2fa && res.pendingToken) {
        setPendingToken(res.pendingToken);
        setQrUri(res.otpauthUri ?? null);
        setStep("totp");
        // El QR salta de inmediato al validar las credenciales.
        setShowQr(true);
      } else if (res.token && res.user) {
        finishLogin(res.token, res.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!pendingToken) return;
    if (!/^\d{6,8}$/.test(code)) {
      setError("Ingresa el código de 6 dígitos (o un código de respaldo de 8).");
      return;
    }
    setLoading(true);
    try {
      const res = await verifyTwoFactor(pendingToken, code);
      if (res.token && res.user) {
        finishLogin(res.token, res.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Código incorrecto.");
    } finally {
      setLoading(false);
    }
  };

  const backToCredentials = () => {
    setStep("credentials");
    setPendingToken(null);
    setQrUri(null);
    setShowQr(false);
    setCode("");
    setError("");
  };

  const closeQr = () => {
    setShowQr(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  useEffect(() => {
    if (!showQr) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeQr();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showQr]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-10">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <Droplets className="w-6 h-6 text-accent" />
              <CardTitle className="text-3xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {step === "credentials" ? "INICIAR SESIÓN" : "VERIFICACIÓN 2FA"}
              </CardTitle>
            </div>
            <CardDescription className="font-mono text-xs tracking-widest">
              {step === "credentials" ? "ACCESO PERIODISTAS" : "SEGUNDO PASO"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "credentials" ? (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <label className="font-mono text-xs tracking-widest text-muted-foreground">
                    CORREO
                  </label>
                  <Input
                    type="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-xs tracking-widest text-muted-foreground">
                    CONTRASEÑA
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                {error && (
                  <p className="font-mono text-xs text-accent" role="alert">{error}</p>
                )}
                <Button type="submit" disabled={loading} className="w-full">
                  <LogIn className="w-4 h-4" />
                  {loading ? "VERIFICANDO..." : "INICIAR SESIÓN"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4" noValidate>
                <div className="flex items-start gap-2 rounded-md border border-border bg-card p-3">
                  <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                    INGRESA EL CÓDIGO DE 6 DÍGITOS DE TU APP AUTENTICADORA
                    (SMART WATCH O TELÉFONO). SI NO LA TIENES A LA MANO,
                    USA UN CÓDIGO DE RESPALDO DE 8 DÍGITOS.
                  </p>
                </div>
                {qrUri && (
                  <Button variant="outline" type="button" onClick={() => setShowQr(true)} className="w-full">
                    <QrCode className="w-4 h-4" />
                    VER CÓDIGO QR
                  </Button>
                )}
                <div className="space-y-2">
                  <label className="font-mono text-xs tracking-widest text-muted-foreground">
                    CÓDIGO
                  </label>
                  <Input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    required
                    minLength={6}
                    maxLength={8}
                    className="font-mono text-center text-2xl tracking-[0.5em]"
                  />
                </div>
                {error && (
                  <p className="font-mono text-xs text-accent" role="alert">{error}</p>
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={backToCredentials} className="flex-1">
                    VOLVER
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    <ShieldCheck className="w-4 h-4" />
                    {loading ? "VERIFICANDO..." : "VERIFICAR"}
                  </Button>
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  El token pendiente expira en 5 minutos y no se guarda en el navegador.
                </p>
              </form>
            )}
          </CardContent>
          <CardFooter>
            <p className="font-mono text-xs text-muted-foreground text-center">
              ¿No tienes cuenta?{" "}
              <a href="/register" className="text-accent hover:underline">
                REGÍSTRATE
              </a>
            </p>
          </CardFooter>
        </Card>
      </div>

      {step === "totp" && showQr && qrUri && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Escanea el código QR"
        >
          <Card className="max-w-sm w-full">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <QrCode className="w-6 h-6 text-accent" />
                <CardTitle className="text-xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  ESCANEA EL QR
                </CardTitle>
              </div>
              <CardDescription className="font-mono text-xs tracking-widest">
                APP AUTENTICADORA (SMART WATCH O TELÉFONO)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center rounded-md border border-border bg-background p-3">
                <QRCodeSVG value={qrUri} size={200} />
              </div>
              <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                SI YA LO ESCANEASTE ANTES, CIERRA ESTE VENTANA E INGRESA
                EL CÓDIGO DE 6 DÍGITOS.
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={closeQr} className="w-full">
                <ShieldCheck className="w-4 h-4" />
                YA LO ESCANEÉ
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
