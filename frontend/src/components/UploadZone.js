import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, X, Image as ImageIcon, Film } from "lucide-react";
import { fileToBase64 } from "@/lib/api";

export default function UploadZone({
  label = "Tarik & lepas atau klik untuk unggah",
  hint = "PNG · JPG · WEBP · MP4",
  accept = "image/*",
  value,
  onChange,
  testId = "upload-zone",
  compact = false,
}) {
  const inputRef = useRef(null);
  const [hover, setHover] = useState(false);

  const handleFiles = async (files) => {
    if (!files || !files[0]) return;
    const f = files[0];
    const b64 = await fileToBase64(f);
    const isVideo = f.type.startsWith("video/");
    onChange?.({
      file: f,
      base64: b64,
      mime: f.type,
      previewUrl: URL.createObjectURL(f),
      isVideo,
      name: f.name,
    });
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange?.(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div
      data-testid={testId}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`relative cursor-pointer rounded-[28px] border border-dashed transition-all overflow-hidden ${
        hover ? "border-foreground bg-secondary" : "border-border bg-secondary/40"
      } ${compact ? "p-5" : "p-8 md:p-10"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        data-testid={`${testId}-input`}
      />

      {value ? (
        <div className="relative flex items-center gap-4">
          {value.isVideo ? (
            <video
              src={value.previewUrl}
              className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover bg-black"
              muted
              loop
              autoPlay
              playsInline
            />
          ) : (
            <img
              src={value.previewUrl}
              alt="preview"
              className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{value.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {value.isVideo ? "Video siap" : "Foto siap"} · klik untuk ganti
            </div>
          </div>
          <button
            onClick={clear}
            data-testid={`${testId}-clear`}
            className="w-8 h-8 rounded-full border border-border grid place-items-center hover:bg-background"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center gap-3">
          <motion.div
            animate={{ y: hover ? -4 : 0 }}
            transition={{ duration: 0.25 }}
            className="w-12 h-12 rounded-2xl bg-background border border-border grid place-items-center"
          >
            {accept.includes("video") ? (
              <Film className="w-5 h-5" />
            ) : accept.includes("image") ? (
              <ImageIcon className="w-5 h-5" />
            ) : (
              <UploadCloud className="w-5 h-5" />
            )}
          </motion.div>
          <div>
            <div className="text-sm font-semibold">{label}</div>
            <div className="text-xs text-muted-foreground mt-1">{hint}</div>
          </div>
        </div>
      )}
    </div>
  );
}
