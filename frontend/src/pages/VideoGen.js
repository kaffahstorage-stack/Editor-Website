import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Play, RefreshCw, Download, Sparkles } from "lucide-react";
import UploadZone from "@/components/UploadZone";
import ExportDialog from "@/components/ExportDialog";
import { generateVideo, getVideoJob, createProject } from "@/lib/api";

const SIZES = [
  { key: "1280x720", label: "Landscape · 720p" },
  { key: "1024x1792", label: "Portrait · Reels" },
  { key: "1024x1024", label: "Square" },
];

const DURATIONS = [4, 8, 12];

export default function VideoGen() {
  const [prompt, setPrompt] = useState("");
  const [reference, setReference] = useState(null);
  const [size, setSize] = useState("1280x720");
  const [duration, setDuration] = useState(4);
  const [job, setJob] = useState(null);
  const [running, setRunning] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => () => clearInterval(pollRef.current), []);

  const start = async () => {
    if (!prompt.trim()) {
      toast.error("Tulis dulu deskripsi video");
      return;
    }
    setRunning(true);
    setJob(null);
    try {
      const created = await generateVideo({
        prompt,
        size,
        duration,
        reference_image_base64: reference?.base64 || null,
      });
      setJob(created);
      pollRef.current = setInterval(async () => {
        try {
          const j = await getVideoJob(created.id);
          setJob(j);
          if (j.status === "completed" || j.status === "failed") {
            clearInterval(pollRef.current);
            setRunning(false);
            if (j.status === "completed") {
              toast.success("Video selesai!");
              try {
                await createProject({
                  title: `Video AI · ${prompt.slice(0, 40)}`,
                  kind: "video_gen",
                  payload: {
                    prompt,
                    size,
                    duration,
                  },
                });
              } catch (err) {
                /* optional persistence */
              }
            } else {
              toast.error(`Video gagal: ${j.error || "unknown"}`);
            }
          }
        } catch (err) {
          /* poll ignore transient errors */
        }
      }, 6000);
    } catch (e) {
      setRunning(false);
      toast.error("Gagal memulai video.");
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 md:py-16">
      <header className="mb-10 md:mb-14">
        <div className="text-xs uppercase tracking-[0.22em] font-bold text-muted-foreground">
          Buat Video AI · Sora 2
        </div>
        <h1 className="mt-3 font-display text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-tight">
          Ide → <span className="font-serif-italic font-normal">klip sinematik</span>.
        </h1>
        <p className="mt-4 text-sm text-muted-foreground max-w-[52ch]">
          Proses render bisa memakan 1–3 menit. Kamu boleh santai — kami akan
          notify saat selesai.
        </p>
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
              placeholder="Contoh: kamera lambat mengelilingi cangkir kopi di kafe hujan, pencahayaan hangat…"
              data-testid="video-gen-prompt"
              className="w-full rounded-2xl border border-border bg-transparent p-4 text-sm outline-none focus:border-foreground transition-colors resize-none"
            />
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.22em] font-bold text-muted-foreground mb-2">
              Referensi (opsional)
            </div>
            <UploadZone
              testId="video-gen-reference"
              label="Upload gambar referensi"
              hint="Untuk gaya, mood, tone"
              value={reference}
              onChange={setReference}
              compact
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">
                Ukuran
              </div>
              <div className="space-y-1.5">
                {SIZES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSize(s.key)}
                    data-testid={`size-${s.key}`}
                    className={`w-full text-left text-[13px] px-3 py-2 rounded-xl border transition-colors ${
                      size === s.key
                        ? "bg-foreground text-background border-foreground"
                        : "border-border hover:bg-secondary"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">
                Durasi
              </div>
              <div className="flex gap-1.5">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    data-testid={`duration-${d}`}
                    className={`flex-1 text-[13px] py-2 rounded-xl border transition-colors ${
                      duration === d
                        ? "bg-foreground text-background border-foreground"
                        : "border-border hover:bg-secondary"
                    }`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={start}
            disabled={running || !prompt.trim()}
            data-testid="video-gen-run"
            className="w-full h-12 rounded-full bg-foreground text-background font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 hover:scale-[1.01] active:scale-95 transition-transform"
          >
            {running ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Sedang render…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Buat video
              </>
            )}
          </button>
        </div>

        <div className="lg:col-span-7">
          <div className="text-xs uppercase tracking-[0.22em] font-bold text-muted-foreground mb-2">
            Hasil
          </div>
          <div className="relative rounded-[32px] border border-border overflow-hidden bg-black aspect-video flex items-center justify-center">
            {job?.status === "completed" && job.video_base64 ? (
              <motion.video
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                controls
                autoPlay
                loop
                src={`data:video/mp4;base64,${job.video_base64}`}
                className="w-full h-full"
                data-testid="video-gen-result"
              />
            ) : (
              <div className="text-center text-white/60 px-8">
                {running ? (
                  <div>
                    <div className="flex items-center justify-center gap-1.5 mb-3">
                      <span className="dot-flash w-2 h-2 rounded-full bg-white" />
                      <span className="dot-flash w-2 h-2 rounded-full bg-white" />
                      <span className="dot-flash w-2 h-2 rounded-full bg-white" />
                    </div>
                    <div className="text-sm">
                      Status: <b>{job?.status || "queued"}</b> · biasanya 1–3 menit
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-sm">
                    <Play className="w-6 h-6" />
                    Preview video akan muncul di sini
                  </div>
                )}
              </div>
            )}
          </div>
          {job?.status === "completed" && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setExportOpen(true)}
                data-testid="video-gen-export"
                className="flex-1 h-11 rounded-full border border-border hover:bg-secondary text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Ekspor
              </button>
            </div>
          )}
        </div>
      </div>

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        base64={job?.video_base64}
        kind="video"
        name="vision-video"
      />
    </div>
  );
}
