import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Newspaper, ArrowLeft, ImagePlus, X, Eye, Tag, MapPin, Calendar, Send } from "lucide-react";
import api from "../services/api";
import { createArticle, getCategories } from "../services/articles";
import { StateSelector } from "../components/StateSelector";

export default function UploadPage({ onBack, onPublish }: { onBack: () => void; onPublish: () => void }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    summary: "",
    body: "",
    state: "",
    categoryId: "",
  });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const currentUser = (() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) as { id: string; name: string } : null;
    } catch {
      return null;
    }
  })();

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getCategories();
        if (!cancelled) setCategories(data);
      } catch (err) {
        console.error('Error al cargar categorías:', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.summary || !form.body || !form.state || !form.categoryId) return;

    setSending(true);
    setError(null);

    try {
      const created = await createArticle({
        title: form.title,
        summary: form.summary,
        body: form.body,
        state: form.state,
        categoryId: form.categoryId,
      });
      const articleId = created.id;

      for (const file of images) {
        const formData = new FormData();
        formData.append("image", file);
        try {
          await api.post(`/articles/${articleId}/images`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch (uploadErr) {
          console.error(`Error subiendo imagen "${file.name}":`, uploadErr);
        }
      }

      setSubmitted(true);
      setTimeout(() => {
        onPublish();
        navigate(`/article/${articleId}`);
      }, 1200);
    } catch (err) {
      console.error('Error al publicar nota:', err);
      setError('No se pudo publicar la nota. Inténtalo de nuevo más tarde.');
    } finally {
      setSending(false);
    }
  };

  const incomplete = !form.title || !form.summary || !form.body || !form.state || !form.categoryId;
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
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> PERIODISTA</span>
                </label>
                <p className="w-full bg-card border border-border px-3 py-2 text-sm text-foreground">
                  {currentUser?.name || "Desconocido"}
                </p>
              </div>

              <div>
                <label className="font-mono text-xs tracking-widest block mb-1.5">
                  <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> CATEGORÍA *</span>
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => set("categoryId", e.target.value)}
                  required
                  className="w-full bg-card border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary transition font-mono"
                >
                  <option value="" disabled>Selecciona una categoría...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-mono text-xs tracking-widest block mb-1.5">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> ESTADO / ENTIDAD *</span>
                </label>
                <StateSelector value={form.state} onChange={(v) => set("state", v)} />
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

            {error && (
              <div className="bg-destructive/10 border border-destructive p-3">
                <p className="font-mono text-xs text-destructive text-center">
                  {error}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={incomplete || sending}
              className="w-full bg-accent text-accent-foreground py-4 font-mono text-sm tracking-widest hover:bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              aria-label="Publicar nota"
            >
              {sending ? (
                <>
                  <span className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                  PUBLICANDO...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  PUBLICAR NOTA
                </>
              )}
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
