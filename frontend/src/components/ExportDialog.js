import React, { useState } from "react";
import { Download, X } from "lucide-react";

const IMAGE_FORMATS = ["PNG", "JPG", "WEBP"];
const VIDEO_FORMATS = ["MP4", "GIF"];

const mimeFor = (fmt) => {
  switch (fmt) {
    case "PNG":
      return "image/png";
    case "JPG":
      return "image/jpeg";
    case "WEBP":
      return "image/webp";
    case "MP4":
      return "video/mp4";
    case "GIF":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
};

async function convertImage(base64, targetMime) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d");
      if (targetMime === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, c.width, c.height);
      }
      ctx.drawImage(img, 0, 0);
      c.toBlob((b) => resolve(b), targetMime, 0.95);
    };
    img.src = `data:image/png;base64,${base64}`;
  });
}

function b64ToBlob(b64, mime) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export default function ExportDialog({ open, onClose, base64, kind = "image", name = "vision-studio" }) {
  const [busy, setBusy] = useState(false);
  if (!open) return null;
  const formats = kind === "video" ? VIDEO_FORMATS : IMAGE_FORMATS;

  const doExport = async (fmt) => {
    setBusy(true);
    let blob;
    if (kind === "image" && fmt !== "PNG") {
      blob = await convertImage(base64, mimeFor(fmt));
    } else {
      blob = b64ToBlob(base64, mimeFor(fmt));
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.${fmt.toLowerCase()}`;
    a.click();
    URL.revokeObjectURL(url);
    setBusy(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      data-testid="export-dialog"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[32px] bg-background border border-border p-8 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full border border-border grid place-items-center"
          data-testid="export-close"
        >
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-2xl font-display font-bold tracking-tight">Ekspor karya</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Pilih format yang kamu butuhkan.
        </p>
        <div className="grid grid-cols-3 gap-3 mt-6">
          {formats.map((f) => (
            <button
              key={f}
              disabled={busy}
              onClick={() => doExport(f)}
              data-testid={`export-${f.toLowerCase()}`}
              className="rounded-2xl border border-border py-4 hover:bg-secondary flex flex-col items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-semibold">{f}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
