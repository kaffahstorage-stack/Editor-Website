import React, { useState } from "react";
import { motion } from "framer-motion";
import { Wand2, RefreshCw, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";
import UploadZone from "@/components/UploadZone";
import ChatPanel from "@/components/ChatPanel";
import ExportDialog from "@/components/ExportDialog";
import { generateImage, createProject } from "@/lib/api";

const PRESETS = [
  "Poster minimalis, monokrom, tekstur tebal",
  "Portrait sinematik cahaya sore, tone hangat",
  "Produk skincare di atas marmer, pencahayaan lembut",
  "Ilustrasi editorial retro 70an",
  "Isometric city block, warna pastel",
];

export default function ImageGen() {
  const [prompt, setPrompt] = useState("");
  const [reference, setReference] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const run = async () => {
    if (!prompt.trim()) {
      toast.error("Tulis dulu ide gambarnya");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await generateImage({
        prompt,
        reference_image_base64: reference?.base64 || null,
      });
      setResult(res);
      toast.success("Karya siap!");
      try {
        await createProject({
          title: `Gambar AI · ${prompt.slice(0, 40)}`,
          kind: "image_gen",
          thumbnail_base64: res.image_base64,
          payload: { prompt },
        });
      } catch (_) {
        /* project save is optional */
      }
    } catch (e) {
      toast.error("Gagal generate. Coba prompt lain.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 md:py-16">
      <header className="mb-10 md:mb-14">
        <div className="text-xs uppercase tracking-[0.22em] font-bold text-muted-foreground">
          Buat Gambar AI · Nano Banana
        </div>
        <h1 className="mt-3 font-display text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-tight">
          Dari ide, ke <span className="font-serif-italic font-normal">gambar</span>.
        </h1>
      </header>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] font-bold text-muted-foreground mb-2">
              Deskripsi
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              placeholder="Contoh: portrait sinematik seorang penari di jalan sepi, cahaya sore, kabut lembut…"
              data-testid="image-gen-prompt"
              className="w-full rounded-2xl border border-border bg-transparent p-4 text-sm outline-none focus:border-foreground transition-colors resize-none"
            />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(p)}
                  data-testid={`preset-${i}`}
                  className="text-[12px] px-3 py-1.5 rounded-full border border-border hover:bg-secondary transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.22em] font-bold text-muted-foreground mb-2">
              Referensi (opsional)
            </div>
            <UploadZone
              testId="image-gen-reference"
              label="Upload gambar referensi"
              hint="Untuk arahan warna, mood, gaya"
              value={reference}
              onChange={setReference}
              compact
            />
          </div>

          <button
            onClick={run}
            disabled={loading || !prompt.trim()}
            data-testid="image-gen-run"
            className="w-full h-12 rounded-full bg-foreground text-background font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 hover:scale-[1.01] active:scale-95 transition-transform"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Memproses…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Buat gambar
              </>
            )}
          </button>
        </div>

        <div className="lg:col-span-7">
          <div className="text-xs uppercase tracking-[0.22em] font-bold text-muted-foreground mb-2">
            Preview
          </div>
          <div className="relative rounded-[32px] border border-border overflow-hidden bg-secondary aspect-[4/3] flex items-center justify-center">
            {result ? (
              <motion.img
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                src={`data:${result.mime_type};base64,${result.image_base64}`}
                className="w-full h-full object-cover"
                alt="hasil"
                data-testid="image-gen-result"
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                Tulis idenya, klik buat.
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 grid place-items-center bg-background/60 backdrop-blur-sm">
                <div className="flex items-center gap-1.5">
                  <span className="dot-flash w-2 h-2 rounded-full bg-foreground" />
                  <span className="dot-flash w-2 h-2 rounded-full bg-foreground" />
                  <span className="dot-flash w-2 h-2 rounded-full bg-foreground" />
                </div>
              </div>
            )}
          </div>
          {result && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setExportOpen(true)}
                data-testid="image-gen-export"
                className="flex-1 h-11 rounded-full border border-border hover:bg-secondary text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Ekspor
              </button>
              <button
                onClick={run}
                data-testid="image-gen-regen"
                className="flex-1 h-11 rounded-full bg-foreground text-background text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Wand2 className="w-4 h-4" /> Variasi baru
              </button>
            </div>
          )}
        </div>
      </div>

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        base64={result?.image_base64}
        kind="image"
        name="vision-generation"
      />
    </div>
  );
}
