import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, ExternalLink, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { listProjects, deleteProject } from "@/lib/api";

const KIND_LABEL = {
  photo_edit: "Edit Foto",
  video_edit: "Edit Video",
  image_gen: "Gambar AI",
  video_gen: "Video AI",
  assistant: "Assistant",
};

export default function Projects() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const r = await listProjects();
      setItems(r);
    } catch (_) {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    try {
      await deleteProject(id);
      setItems((prev) => prev.filter((p) => p.id !== id));
      toast.success("Project dihapus");
    } catch (err) {
      toast.error("Gagal hapus");
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 md:py-16">
      <header className="mb-10 md:mb-14">
        <div className="text-xs uppercase tracking-[0.22em] font-bold text-muted-foreground">
          Project Saya
        </div>
        <h1 className="mt-3 font-display text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-tight">
          Karya kamu, <span className="font-serif-italic font-normal">tersimpan</span>.
        </h1>
      </header>

      {loading ? (
        <div className="text-sm text-muted-foreground">Memuat…</div>
      ) : items.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-border p-10 md:p-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-secondary grid place-items-center mx-auto mb-4">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-xl font-display font-bold tracking-tight">
            Belum ada project
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Coba mulai dari <b>Edit Foto</b> atau <b>Buat Gambar AI</b>.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Link
              to="/photo"
              data-testid="empty-goto-photo"
              className="h-10 px-5 rounded-full bg-foreground text-background text-sm font-semibold flex items-center"
            >
              Edit Foto
            </Link>
            <Link
              to="/image-gen"
              data-testid="empty-goto-image"
              className="h-10 px-5 rounded-full border border-border text-sm font-semibold flex items-center"
            >
              Gambar AI
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {items.map((p) => (
            <div
              key={p.id}
              data-testid={`project-${p.id}`}
              className="group rounded-[28px] border border-border overflow-hidden lift bg-card"
            >
              <div className="aspect-[4/5] bg-secondary relative overflow-hidden">
                {p.thumbnail_base64 ? (
                  <img
                    src={`data:image/png;base64,${p.thumbnail_base64}`}
                    alt={p.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-sm text-muted-foreground">
                    {KIND_LABEL[p.kind] || p.kind}
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="text-[10px] uppercase tracking-[0.22em] font-bold text-muted-foreground">
                  {KIND_LABEL[p.kind] || p.kind}
                </div>
                <div className="mt-1 font-display font-semibold tracking-tight text-[15px] line-clamp-2 leading-snug">
                  {p.title}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(p.updated_at).toLocaleDateString("id-ID")}
                  </div>
                  <div className="flex items-center gap-1">
                    {p.thumbnail_base64 && (
                      <a
                        href={`data:image/png;base64,${p.thumbnail_base64}`}
                        download={`${p.title}.png`}
                        className="w-8 h-8 rounded-full border border-border grid place-items-center hover:bg-secondary"
                        data-testid={`open-${p.id}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => remove(p.id)}
                      data-testid={`delete-${p.id}`}
                      className="w-8 h-8 rounded-full border border-border grid place-items-center hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
