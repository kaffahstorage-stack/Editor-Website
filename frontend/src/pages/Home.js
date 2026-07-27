import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Camera,
  Film,
  Palette,
  Video,
  MessageSquareText,
  FolderOpen,
  ArrowUpRight,
} from "lucide-react";

const IMG_PHOTO =
  "https://images.unsplash.com/photo-1765383563504-63f95cab942c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MTJ8MHwxfHNlYXJjaHwzfHxjcmVhdGl2ZSUyMHBob3RvZ3JhcGh5JTIwc3R1ZGlvfGVufDB8fHx8MTc4NTEyMDQ3NXww&ixlib=rb-4.1.0&q=85";
const IMG_VIDEO =
  "https://images.unsplash.com/photo-1594394489098-74ac04c0fc2e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzR8MHwxfHNlYXJjaHwyfHxjaW5lbWF0aWMlMjB2aWRlbyUyMHJlY29yZGluZ3xlbnwwfHx8fDE3ODUxMjA0NzV8MA&ixlib=rb-4.1.0&q=85";
const IMG_AI =
  "https://images.unsplash.com/photo-1583591900414-7031eb309cb6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzN8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwYWJzdHJhY3QlMjBhcnQlMjB3aGl0ZXxlbnwwfHx8fDE3ODUxMjA0NzV8MA&ixlib=rb-4.1.0&q=85";

const cards = [
  {
    to: "/photo",
    title: "Edit Foto",
    tag: "Photo",
    desc: "Ubah background, cahaya, gaya, atau hapus objek — cukup ngobrol.",
    icon: Camera,
    span: "md:col-span-4 md:row-span-2",
    image: IMG_PHOTO,
    kind: "image",
    testid: "card-photo",
  },
  {
    to: "/video",
    title: "Edit Video",
    tag: "Video",
    desc: "Subtitle, musik, color grading, efek sinematik dalam sekali percakapan.",
    icon: Film,
    span: "md:col-span-4",
    image: IMG_VIDEO,
    kind: "image",
    testid: "card-video",
  },
  {
    to: "/image-gen",
    title: "Buat Gambar AI",
    tag: "Create",
    desc: "Nano Banana. Deskripsikan atau lampirkan referensi.",
    icon: Palette,
    span: "md:col-span-4",
    image: IMG_AI,
    kind: "image",
    testid: "card-image-gen",
  },
  {
    to: "/video-gen",
    title: "Buat Video AI",
    tag: "Cinema",
    desc: "Sora 2 · dari teks jadi klip sinematik.",
    icon: Video,
    span: "md:col-span-5",
    image: null,
    kind: "dark",
    testid: "card-video-gen",
  },
  {
    to: "/assistant",
    title: "Creative Assistant",
    tag: "Talk to AI",
    desc: "Belum yakin harus apa? Cerita saja, AI bantu rapikan idenya.",
    icon: MessageSquareText,
    span: "md:col-span-4",
    image: null,
    kind: "light",
    testid: "card-assistant",
  },
  {
    to: "/projects",
    title: "Project Saya",
    tag: "Library",
    desc: "Semua karya tersimpan otomatis. Lanjutkan kapan saja.",
    icon: FolderOpen,
    span: "md:col-span-3",
    image: null,
    kind: "outline",
    testid: "card-projects",
  },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

function BentoCard({ card }) {
  const Icon = card.icon;
  const isDark = card.kind === "dark";
  const isImage = card.kind === "image";
  const isOutline = card.kind === "outline";

  return (
    <motion.div variants={item} className={`relative ${card.span}`}>
      <Link
        to={card.to}
        data-testid={card.testid}
        className={`group relative block h-full rounded-[32px] overflow-hidden lift border ${
          isDark
            ? "bg-foreground text-background border-transparent"
            : isOutline
            ? "bg-transparent border-border"
            : "bg-secondary border-transparent"
        }`}
        style={{ minHeight: card.span.includes("row-span-2") ? 440 : 220 }}
      >
        {isImage && card.image && (
          <>
            <img
              src={card.image}
              alt={card.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </>
        )}
        {isDark && (
          <>
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/[0.06] blur-3xl" />
            <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/[0.04] blur-3xl" />
          </>
        )}

        <div className={`relative h-full flex flex-col justify-between p-7 md:p-9 ${isImage ? "text-white" : ""}`}>
          <div className="flex items-start justify-between">
            <div
              className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.22em] font-bold border ${
                isImage
                  ? "border-white/40 text-white"
                  : isDark
                  ? "border-white/30 text-background"
                  : "border-foreground/15 text-muted-foreground"
              }`}
            >
              {card.tag}
            </div>
            <div
              className={`w-9 h-9 rounded-2xl grid place-items-center transition-transform group-hover:rotate-[8deg] ${
                isImage
                  ? "bg-white/15 backdrop-blur-md text-white"
                  : isDark
                  ? "bg-white/10 text-background"
                  : "bg-background text-foreground border border-border"
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>
          </div>

          <div>
            <h3
              className={`font-display font-bold tracking-tight ${
                card.span.includes("row-span-2")
                  ? "text-3xl md:text-4xl"
                  : "text-2xl md:text-[28px]"
              }`}
            >
              {card.title}
            </h3>
            <p
              className={`mt-2 text-[13px] md:text-sm leading-relaxed max-w-[38ch] ${
                isImage
                  ? "text-white/80"
                  : isDark
                  ? "text-background/70"
                  : "text-muted-foreground"
              }`}
            >
              {card.desc}
            </p>
            <div className="mt-5 inline-flex items-center gap-1 text-xs font-semibold">
              <span>Mulai</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Home() {
  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-16 md:pt-24 pb-24">
      {/* Hero */}
      <section className="relative">
        <div className="absolute -z-0 top-10 -left-40 w-[560px] h-[560px] blob bg-neutral-200 dark:bg-neutral-800 opacity-40" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-[1000px]"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-background/60 backdrop-blur-md text-[11px] uppercase tracking-[0.22em] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live · Gemini 3 · Nano Banana · Sora 2
          </div>
          <h1
            data-testid="hero-title"
            className="mt-6 font-display text-5xl sm:text-6xl md:text-7xl lg:text-[92px] font-black tracking-tighter leading-[0.95]"
          >
            Apa yang ingin kamu <br />
            <span className="font-serif-italic font-normal">buat hari ini?</span>
          </h1>
          <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-[52ch] leading-relaxed">
            Vision Studio adalah partner kreatif pribadimu. Ceritakan idenya, kirim
            referensi — biar AI yang mengurus prompt rumitnya.
          </p>
        </motion.div>
      </section>

      {/* Bento grid */}
      <motion.section
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mt-14 md:mt-20 grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6 auto-rows-[220px]"
      >
        {cards.map((c) => (
          <BentoCard key={c.to} card={c} />
        ))}
      </motion.section>

      {/* Micro pitch */}
      <section className="mt-24 md:mt-32 grid md:grid-cols-3 gap-8">
        {[
          {
            k: "01",
            t: "Ngobrol, bukan ngeprompt",
            d: "Cukup bilang \"buat lebih terang\" atau \"seperti film\". AI ngerti.",
          },
          {
            k: "02",
            t: "Kirim referensi",
            d: "Tempel foto/video referensi, AI analisis warna, mood, dan angle.",
          },
          {
            k: "03",
            t: "Simpan & lanjutkan",
            d: "Semua project otomatis tersimpan. Ekspor ke PNG · JPG · MP4.",
          },
        ].map((s) => (
          <div key={s.k} className="border-t border-border pt-6">
            <div className="text-xs uppercase tracking-[0.22em] font-bold text-muted-foreground">
              {s.k}
            </div>
            <div className="mt-3 text-xl font-display font-bold tracking-tight">
              {s.t}
            </div>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {s.d}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
