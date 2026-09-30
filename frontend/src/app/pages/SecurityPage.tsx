import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck, Shield, KeyRound, RefreshCw, Copy, Check, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
  getTotpStatus,
  setupTotp,
  verifyTotpSetup,
  disableTotp,
  regenerateBackupCodes,
  type TotpSetupResponse,
} from "../services/totp";

type Step = "loading" | "idle" | "setup" | "verify" | "backup" | "active";

function copyToClipboard(text: string) {
  navigator.clipboard?.writeText(text);
}

export default function SecurityPage() {
  const [step, setStep] = useState<Step>("loading");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [setup, setSetup] = useState<TotpSetupResponse | null>(null);
  const [enabledAt, setEnabledAt] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const res = await getTotpStatus();
      if (res.data.totpEnabled) {
        setEnabledAt(res.data.totpEnabledAt);
        setStep("active");
      } else {
        setStep("idle");
      }
    } catch {
      setError("No se pudo cargar el estado de seguridad.");
      setStep("idle");
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleSetup = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await setupTotp();
      setSetup(res.data);
      setStep("setup");
    } catch (err: any) {
      setError(err.response?.data?.message || "No se pudo generar el código de configuración.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(code)) {
      setError("El código debe tener 6 dígitos.");
      return;
    }
    setLoading(true);
    try {
      const res = await verifyTotpSetup(code);
      setBackupCodes(res.data.backupCodes);
      setStep("backup");
    } catch (err: any) {
      setError(err.response?.data?.message || "Código incorrecto. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await regenerateBackupCodes();
      setBackupCodes(res.data.backupCodes);
      setStep("backup");
    } catch (err: any) {
      setError(err.response?.data?.message || "No se pudieron regenerar los códigos.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password) {
      setError("Confirma tu contraseña para desactivar el 2FA.");
      return;
    }
    setLoading(true);
    try {
      await disableTotp(password);
      setPassword("");
      setSetup(null);
      setBackupCodes([]);
      setStep("idle");
    } catch (err: any) {
      setError(err.response?.data?.message || "No se pudo desactivar el 2FA.");
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    copyToClipboard(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              {step === "active" ? (
                <ShieldCheck className="w-6 h-6 text-accent" />
              ) : (
                <Shield className="w-6 h-6 text-accent" />
              )}
              <CardTitle className="text-3xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                SEGURIDAD
              </CardTitle>
            </div>
            <CardDescription className="font-mono text-xs tracking-widest">
              AUTENTICACIÓN EN DOS PASOS (TOTP)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "loading" && (
              <p className="font-mono text-xs text-muted-foreground">CARGANDO...</p>
            )}

            {step === "idle" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Activa la autenticación en dos pasos: además de tu contraseña,
                  ingresarás un código de 6 dígitos generado por una app
                  autenticadora (Aegis, Authy, o cualquier app TOTP de tu
                  smart watch).
                </p>
                {error && (
                  <p className="font-mono text-xs text-accent" role="alert">{error}</p>
                )}
                <Button onClick={handleSetup} disabled={loading}>
                  <Shield className="w-4 h-4" />
                  {loading ? "GENERANDO..." : "ACTIVAR 2FA"}
                </Button>
              </div>
            )}

            {step === "setup" && setup && (
              <div className="space-y-4">
                <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                  ESCANEA EL CÓDIGO QR CON TU APP AUTENTICADORA (SMART WATCH O TELÉFONO).
                </p>
                <div className="flex justify-center">
                  <QRCodeSVG value={setup.otpauthUri} size={220} />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs tracking-widest text-muted-foreground">
                    SECRETO (SI NO PUEDES ESCANEAR)
                  </label>
                  <Input
                    value={setup.secret}
                    readOnly
                    className="font-mono"
                    onFocus={(e) => e.target.select()}
                  />
                </div>
                {error && (
                  <p className="font-mono text-xs text-accent" role="alert">{error}</p>
                )}
                <Button onClick={() => setStep("verify")} className="w-full">
                  TENGO EL CÓDIGO
                </Button>
              </div>
            )}

            {step === "verify" && (
              <form onSubmit={handleVerify} className="space-y-4" noValidate>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                  INGRESA EL CÓDIGO DE 6 DÍGITOS QUE MUESTRA TU APP AUTENTICADORA.
                </p>
                <div className="space-y-2">
                  <label className="font-mono text-xs tracking-widest text-muted-foreground">
                    CÓDIGO TOTP
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    minLength={6}
                    maxLength={6}
                    className="font-mono text-center text-2xl tracking-[0.5em]"
                  />
                </div>
                {error && (
                  <p className="font-mono text-xs text-accent" role="alert">{error}</p>
                )}
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "VERIFICANDO..." : "ACTIVAR 2FA"}
                </Button>
              </form>
            )}

            {step === "backup" && (
              <div className="space-y-4">
                <div className="flex items-start gap-2 rounded-md border border-accent/40 bg-accent/10 p-3">
                  <AlertTriangle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                    GUARDA ESTOS 10 CÓDIGOS DE RESPALDO EN UN LUGAR SEGURO.
                    SE MUESTRAN UNA SOLA VEZ Y CADA UNO SIRVE UNA SOLA VEZ.
                  </p>
                </div>
                <ul className="grid grid-cols-2 gap-2">
                  {backupCodes.map((c) => (
                    <li key={c}>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(c)}
                        className="w-full font-mono text-sm text-center rounded-md border border-border bg-background hover:bg-accent/10 transition-colors py-1.5"
                        aria-label={`Copiar código de respaldo ${c}`}
                      >
                        {c}
                      </button>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" onClick={copyAll} className="w-full">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "COPIADO" : "COPIAR TODOS"}
                </Button>
                <Button onClick={() => setStep("active")} className="w-full">
                  LISTO
                </Button>
              </div>
            )}

            {step === "active" && (
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-accent" />
                  <p className="font-mono text-xs text-muted-foreground">
                    2FA ACTIVO{enabledAt ? ` DESDE ${new Date(enabledAt).toLocaleDateString()}` : ""}
                  </p>
                </div>
                <div className="space-y-2">
                  <Button variant="outline" onClick={handleRegenerate} disabled={loading}>
                    <RefreshCw className="w-4 h-4" />
                    REGENERAR CÓDIGOS DE RESPALDO
                  </Button>
                </div>
                <form onSubmit={handleDisable} className="space-y-2" noValidate>
                  <label className="font-mono text-xs tracking-widest text-muted-foreground">
                    CONFIRMA TU CONTRASEÑA PARA DESACTIVAR
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <Button type="submit" variant="destructive" disabled={loading}>
                    <KeyRound className="w-4 h-4" />
                    DESACTIVAR 2FA
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <p className="font-mono text-xs text-muted-foreground text-center">
              El token pendiente de 2FA nunca se guarda en el navegador.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
