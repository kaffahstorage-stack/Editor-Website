import React, { useState } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import UploadZone from "@/components/UploadZone";
import ChatPanel from "@/components/ChatPanel";

const QUICK_ACTIONS = [
  "Tambah subtitle",
  "Tambah musik",
  "Tambah narasi",
  "Slow motion",
  "Percepat video",
  "Ganti background",
  "Efek sinematik",
  "Color grading",
  "Hapus objek",
  "Tambah efek",
];

const REFERENCE_PARTS = [
  "Warna",
  "Lighting",
  "Style",
  "Angle kamera",
  "Mood",
  "Animasi",
  "Transisi",
];

export default function VideoEdit() {
  const [source, setSource] = useState(null);
  const [reference, setReference] = useState(null);
  const [selectedRefParts, setSelectedRefParts] = useState([]);

  const toggleRefPart = (p) =>
    setSelectedRefParts((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 md:py-16">
      <header className="mb-10 md:mb-14">
        <div className="text-xs uppercase tracking-[0.22em] font-bold text-muted-foreground">
          Alur · Edit Video
        </div>
        <h1 className="mt-3 font-display text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-tight">
          Video kamu, <span className="font-serif-italic font-normal">bergaya sinema</span>.
        </h1>
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary/40 text-[11px] uppercase tracking-[0.22em] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Preview experience · rendering video via AI segera hadir
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] font-bold text-muted-foreground mb-2">
              01 · Video
            </div>
            <UploadZone
              testId="video-source"
              label="Upload video"
              hint="MP4 · MOV · WEBM"
              accept="video/*"
              value={source}
              onChange={setSource}
            />
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.22em] font-bold text-muted-foreground mb-2">
              02 · Referensi (opsional)
            </div>
            <UploadZone
              testId="video-reference"
              label="Upload video / foto referensi"
              hint="Untuk mood, warna, transisi"
              accept="video/*,image/*"
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
                      data-testid={`vref-part-${p}`}
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
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map((a) => (
                <div
                  key={a}
                  className="text-[12px] px-3 py-1.5 rounded-full border border-border text-muted-foreground"
                >
                  {a}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="text-xs uppercase tracking-[0.22em] font-bold text-muted-foreground mb-2">
            Preview
          </div>
          <div className="relative rounded-[32px] border border-border overflow-hidden bg-black aspect-video flex items-center justify-center">
            {source ? (
              <motion.video
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={source.previewUrl}
                controls
                autoPlay
                muted
                loop
                className="w-full h-full"
                data-testid="video-preview"
              />
            ) : (
              <div className="text-white/60 flex items-center gap-2 text-sm">
                <Play className="w-4 h-4" /> Video akan tampil di sini
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          <ChatPanel
            context="video_edit"
            attachedImages={[]}
            seedMessage={
              source
                ? "Video sudah masuk. Cerita saya bagian mana yang mau kita polish."
                : "Upload videonya dulu, lalu kita ngobrol tentang gaya yang kamu mau."
            }
            initialSuggestions={
              source
                ? ["Buat lebih sinematik", "Tambah color grading warm", "Slow motion di detik ke-2"]
                : []
            }
            minHeight="620px"
          />
        </div>
      </div>
    </div>
  );
}
