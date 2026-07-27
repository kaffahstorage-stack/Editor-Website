import React, { useState } from "react";
import UploadZone from "@/components/UploadZone";
import ChatPanel from "@/components/ChatPanel";

export default function Assistant() {
  const [image, setImage] = useState(null);

  return (
    <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-10 md:py-16">
      <header className="mb-10 md:mb-14">
        <div className="text-xs uppercase tracking-[0.22em] font-bold text-muted-foreground">
          AI Creative Assistant
        </div>
        <h1 className="mt-3 font-display text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-tight">
          Ngobrol dulu, <span className="font-serif-italic font-normal">baru berkarya</span>.
        </h1>
        <p className="mt-4 text-muted-foreground max-w-[52ch]">
          Belum yakin harus mulai dari mana? Cerita saja tentang project kamu — AI akan
          bantu memperjelas ide dan menyarankan langkah berikutnya.
        </p>
      </header>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] font-bold text-muted-foreground mb-2">
              Referensi (opsional)
            </div>
            <UploadZone
              testId="assistant-ref"
              label="Upload foto/video referensi"
              hint="Kirim gambar biar AI paham mood-nya"
              value={image}
              onChange={setImage}
              compact
            />
          </div>
          <div className="rounded-[24px] border border-border p-5 bg-secondary/50">
            <div className="text-[11px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">
              Contoh yang bisa kamu tanya
            </div>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>· &ldquo;Foto produk saya kurang menonjol, saran?&rdquo;</li>
              <li>· &ldquo;Bikin thumbnail YouTube gaya vintage&rdquo;</li>
              <li>· &ldquo;Video wedding, feel-nya harus warm & natural&rdquo;</li>
              <li>· &ldquo;Poster event musik minimalis, referensi ada&rdquo;</li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-8">
          <ChatPanel
            context="assistant"
            attachedImages={image ? [image.base64] : []}
            seedMessage="Halo! Aku Vision Studio Assistant. Cerita sedikit tentang project kamu — atau kirim referensi biar aku bisa bantu lebih spesifik."
            initialSuggestions={[
              "Bantu saya poles foto produk",
              "Ide thumbnail YouTube",
              "Saran gaya untuk video reel",
            ]}
            minHeight="600px"
          />
        </div>
      </div>
    </div>
  );
}
