import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Wand2, Download, RefreshCw } from "lucide-react";
import UploadZone from "@/components/UploadZone";
import ChatPanel from "@/components/ChatPanel";
import ExportDialog from "@/components/ExportDialog";
import { editImage, createProject } from "@/lib/api";

const QUICK_ACTIONS = [
  { key: "background", label: "Background", prompt: "Ganti background menjadi lebih menarik dan bersih" },
  { key: "face", label: "Wajah", prompt: "Perhalus wajah dengan natural, jangan berlebihan" },
  { key: "clothes", label: "Pakaian", prompt: "Ganti pakaian sesuai gaya minimalis modern" },
  { key: "color", label: "Warna", prompt: "Perbaiki warna keseluruhan agar lebih hidup" },
  { key: "light", label: "Pencahayaan", prompt: "Tingkatkan pencahayaan lembut, bayangan halus" },
  { key: "style", label: "Gaya", prompt: "Ubah menjadi gaya sinematik dengan mood elegan" },
  { key: "remove", label: "Hapus objek", prompt: "Hapus objek yang mengganggu di background" },
  { key: "add", label: "Tambah objek", prompt: "Tambahkan elemen yang memperkuat komposisi" },
];

const REFERENCE_PARTS = [
  "Warna",
  "Lighting",
  "Style",
  "Angle kamera",
  "Background",
  "Komposisi",
  "Mood",
  "Efek",
];

export default function PhotoEdit() {
  const [source, setSource] = useState(null);
  const [reference, setReference] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [selectedRefParts, setSelectedRefParts] = useState([]);
  const [result, setResult] = useState(null); // {image_base64, mime_type}
  const [loading, setLoading] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const toggleRefPart = (p) => {
    setSelectedRefParts((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const buildPrompt = (extra = "") => {
    let base = extra || prompt || "Poles fotonya dengan alami dan elegan.";
    if (reference && selectedRefParts.length > 0) {
      base += `\n\nDari foto referensi, tiru bagian: ${selectedRefParts.join(", ")}.`;
    } else if (reference) {
      base += "\n\nGunakan foto referensi sebagai inspirasi mood & gaya.";
    }
    return base;
  };

  const runEdit = async (extraPrompt = "") => {
    if (!source) {
      toast.error("Upload foto dulu ya");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await editImage({
        prompt: buildPrompt(extraPrompt),
        source_image_base64: source.base64,
        reference_image_base64: reference?.base64 || null,
      });
      setResult(res);
      toast.success("Hasil siap!");
      // Auto save project
      try {
        await createProject({
          title: `Edit Foto · ${new Date().toLocaleString("id-ID")}`,
          kind: "photo_edit",
          thumbnail_base64: res.image_base64,
          payload: {
            prompt: buildPrompt(extraPrompt),
            has_reference: !!reference,
            reference_parts: selectedRefParts,
          },
        });
      } catch (_) {
        /* optional persistence */
      }
    } catch (e) {
      toast.error("Gagal memproses foto. Coba lagi ya.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 md:py-16">
      <header className="mb-10 md:mb-14">
        <div className="text-xs uppercase tracking-[0.22em] font-bold text-muted-foreground">
          Alur · Edit Foto
        </div>
        <h1 className="mt-3 font-display text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-tight">
          Foto kamu, <span className="font-serif-italic font-normal">disempurnakan</span>.
        </h1>
        <p className="mt-4 text-muted-foreground max-w-[52ch]">
          Upload foto utama, tempel referensi kalau ada, lalu ceritakan yang ingin diubah.
        </p>
      </header>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* LEFT — Inputs */}
        <div className="lg:col-span-4 space-y-4">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] font-bold text-muted-foreground mb-2">
              01 · Foto
            </div>
            <UploadZone
              testId="photo-source"
              label="Upload foto"
              hint="PNG · JPG · WEBP"
              value={source}
              onChange={setSource}
            />
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.22em] font-bold text-muted-foreground mb-2">
              02 · Referensi (opsional)
            </div>
            <UploadZone
              testId="photo-reference"
              label="Upload referensi"
              hint="Warna · lighting · mood"
              value={reference}
              onChange={setReference}
              compact
            />
            {reference && (
              <div className="mt-3">
                <div className="text-[11px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">
                  Bagian yang ingin ditiru
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {REFERENCE_PARTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => toggleRefPart(p)}
                      data-testid={`ref-part-${p}`}
                      className={`text-[12px] px-3 py-1.5 rounded-full border transition-colors ${
                        selectedRefParts.includes(p)
                          ? "bg-foreground text-background border-foreground"
                          : "border-border hover:bg-secondary"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.22em] font-bold text-muted-foreground mb-2">
              03 · Yang ingin diubah
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.key}
                  onClick={() => setPrompt(a.prompt)}
                  data-testid={`quick-${a.key}`}
                  className="text-[12px] px-3 py-1.5 rounded-full border border-border hover:bg-secondary transition-colors"
                >
                  {a.label}
                </button>
              ))}
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Bilang aja: buat langitnya sunset lembut, atau hapus orang di belakang…"
              data-testid="photo-prompt"
              className="w-full rounded-2xl border border-border bg-transparent p-4 text-sm outline-none focus:border-foreground transition-colors resize-none"
            />
            <button
              onClick={() => runEdit()}
              disabled={loading || !source}
              data-testid="photo-generate"
              className="mt-3 w-full h-12 rounded-full bg-foreground text-background font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 hover:scale-[1.01] active:scale-95 transition-transform"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Memproses…
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>

        {/* CENTER — Preview */}
        <div className="lg:col-span-5">
          <div className="text-xs uppercase tracking-[0.22em] font-bold text-muted-foreground mb-2">
            Preview
          </div>
          <div className="relative rounded-[32px] border border-border overflow-hidden bg-secondary aspect-[4/5] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.img
                  key="result"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  src={`data:${result.mime_type};base64,${result.image_base64}`}
                  alt="hasil"
                  className="w-full h-full object-cover"
                  data-testid="photo-result"
                />
              ) : source ? (
                <motion.img
                  key="src"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  src={source.previewUrl}
                  alt="source"
                  className="w-full h-full object-cover opacity-90"
                />
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-muted-foreground"
                >
                  Preview akan muncul di sini
                </motion.div>
              )}
            </AnimatePresence>
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
                data-testid="photo-export"
                className="flex-1 h-11 rounded-full border border-border hover:bg-secondary text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" /> Ekspor
              </button>
              <button
                onClick={() => runEdit()}
                data-testid="photo-regenerate"
                className="flex-1 h-11 rounded-full bg-foreground text-background text-sm font-semibold flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform"
              >
                <RefreshCw className="w-4 h-4" /> Coba variasi
              </button>
            </div>
          )}
        </div>

        {/* RIGHT — Chat */}
        <div className="lg:col-span-3">
          <ChatPanel
            context="photo_edit"
            attachedImages={[source?.base64, reference?.base64].filter(Boolean)}
            seedMessage={
              source
                ? "Foto sudah masuk. Kamu mau saya poles bagian mana dulu?"
                : "Upload fotonya dulu ya, terus kita mulai bereksperimen."
            }
            initialSuggestions={
              source
                ? ["Ganti background jadi lebih clean", "Buat pencahayaan lebih lembut", "Ubah mood jadi sinematik"]
                : []
            }
            onLatestReply={(m) => {
              // If reply contains a clear editing instruction, we could auto-run — for now, keep manual.
              if (m?.suggestions?.[0]) {
                // no-op
              }
            }}
            minHeight="620px"
          />
        </div>
      </div>

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        base64={result?.image_base64}
        kind="image"
        name="vision-photo"
      />
    </div>
  );
}
