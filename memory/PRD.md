# Vision Studio — PRD

## Original problem statement
Build **Vision Studio**, a modern Creative AI Studio (not a Photoshop/CapCut clone).
Users describe intent in natural conversation and/or send reference photo/video; AI figures out the prompt.
Priorities: Apple-like premium look, white background dominant, light/dark, PWA, tons of subtle animation.

## User personas
- Content creators (IG, YouTube) who don't want to write long prompts.
- Small biz owners wanting product / brand imagery quickly.
- Designers / marketers who use reference boards.

## Architecture
- Backend: FastAPI (Python), MongoDB (motor), emergentintegrations (Emergent Universal LLM Key).
- Frontend: React + Tailwind + framer-motion + shadcn/ui + sonner (toast).
- AI:
  - Chat / intent: Gemini 2.5 Flash via emergent proxy.
  - Image gen / edit: Gemini Nano Banana (`gemini-2.5-flash-image-preview`).
  - Video gen: Sora 2 (`OpenAIVideoGeneration`).
- Storage: base64 in Mongo for MVP; migrate to object storage later.

## Core requirements (static)
- Home: hero + Bento grid with 6 actions.
- Edit Foto flow: upload → optional reference → chat + quick actions → AI edit → preview → export.
- Edit Video flow: UI complete; AI editing pipeline coming in P1.
- Image Gen (Nano Banana).
- Video Gen (Sora 2 async job pattern).
- Creative Assistant (open chat, multimodal).
- Projects library (auto-save + delete).
- Export PNG/JPG/WEBP for images, MP4/GIF for video.
- Light + Dark mode, PWA manifest, responsive.

## Implemented — 2026-02-27
- Full backend endpoints: /chat, /generate-image, /edit-image, /generate-video, /video-jobs/{id}, /projects CRUD.
- Frontend routes: /, /photo, /video, /image-gen, /video-gen, /assistant, /projects.
- Theme toggle (localStorage), PWA manifest, custom fonts (Cabinet Grotesk + Manrope + Instrument Serif).
- Bento grid on home, chat panel (Apple Messages style), upload dropzone, export dialog.
- Reference-part chip selector for photo & video edits.
- Auto-save project after successful generation.

## Backlog (prioritized)
- P0: None (MVP complete).
- P1: Real video editing pipeline (currently UI-only; needs a video edit backend). Object storage for large media instead of base64. Multi-image reference boards.
- P2: AI Voice, Music, Storyboard, Script, Avatar, Animation, 3D, Presenter (future features per spec).
- P2: Project detail page (currently just thumbnail card + download).

## Next tasks
- Wire video-edit page to a real backend once video edit model is chosen.
- Move base64 media to object storage.
- Add share URL for projects.
