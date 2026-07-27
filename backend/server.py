from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import base64
import uuid
import tempfile
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any, Dict
from datetime import datetime, timezone

from emergentintegrations.llm.chat import (
    LlmChat,
    UserMessage,
    ImageContent,
    FileContentWithMimeType,
)
from emergentintegrations.llm.openai.video_generation import OpenAIVideoGeneration

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Vision Studio API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vision-studio")


# ---------- Models ----------
class ChatRequest(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    message: str
    images_base64: List[str] = []  # optional reference images
    context: Optional[str] = None  # e.g. "photo_edit", "video_edit"


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    suggestions: List[str] = []


class ImageEditRequest(BaseModel):
    prompt: str
    source_image_base64: str
    reference_image_base64: Optional[str] = None


class ImageGenRequest(BaseModel):
    prompt: str
    reference_image_base64: Optional[str] = None


class ImageResult(BaseModel):
    image_base64: str
    mime_type: str = "image/png"
    text: Optional[str] = None


class VideoGenRequest(BaseModel):
    prompt: str
    size: str = "1280x720"
    duration: int = 4
    reference_image_base64: Optional[str] = None


class VideoJob(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "queued"  # queued | processing | completed | failed
    prompt: str
    size: str = "1280x720"
    duration: int = 4
    video_base64: Optional[str] = None
    error: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    kind: str  # "photo_edit" | "video_edit" | "image_gen" | "video_gen" | "assistant"
    thumbnail_base64: Optional[str] = None
    payload: Dict[str, Any] = {}  # arbitrary state (messages, prompts, results)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ProjectCreate(BaseModel):
    title: str
    kind: str
    thumbnail_base64: Optional[str] = None
    payload: Dict[str, Any] = {}


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    thumbnail_base64: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None


# ---------- Utilities ----------
SYSTEM_PROMPT_ASSISTANT = (
    "Kamu adalah 'Vision Studio Creative Assistant', partner kreatif pribadi seperti "
    "editor foto & video profesional. Kamu bicara santai, ramah, dan singkat (2-4 kalimat). "
    "Kamu membantu pengguna mengubah ide menjadi foto atau video tanpa memaksa mereka menulis "
    "prompt teknis. Kalau pengguna kirim gambar/video referensi, analisis dan tanyakan bagian mana "
    "yang ingin ditiru (warna, lighting, mood, style, komposisi, angle, dsb). "
    "Selalu balas dalam Bahasa Indonesia. Setelah menjawab, tawarkan 2-3 saran singkat sebagai "
    "bullet '- ...' di bawah balasan supaya user tinggal klik."
)

SYSTEM_PROMPT_PHOTO = (
    "Kamu adalah asisten kreatif untuk edit foto. Kamu memandu user langkah demi langkah "
    "dengan santai (2-3 kalimat). Fokus pada aspek yang ingin diubah: background, wajah, "
    "pakaian, warna, pencahayaan, gaya, hapus/tambah objek. Selalu balas Bahasa Indonesia. "
    "Akhiri dengan 2-3 saran singkat sebagai bullet '- ...'."
)

SYSTEM_PROMPT_VIDEO = (
    "Kamu adalah asisten kreatif untuk edit video. Bantu user memilih tindakan seperti: "
    "tambah subtitle, musik, narasi, slow-motion, percepat, ganti background, efek sinematik, "
    "color grading, hapus objek, tambah efek. Singkat, ramah, Bahasa Indonesia. "
    "Akhiri dengan 2-3 saran singkat sebagai bullet '- ...'."
)


def _get_system_prompt(context: Optional[str]) -> str:
    if context == "photo_edit":
        return SYSTEM_PROMPT_PHOTO
    if context == "video_edit":
        return SYSTEM_PROMPT_VIDEO
    return SYSTEM_PROMPT_ASSISTANT


def _parse_suggestions(reply: str) -> (str, List[str]):
    """Split trailing bullet suggestions from reply text."""
    lines = reply.strip().splitlines()
    suggestions = []
    body_lines = []
    hit_bullets = False
    for line in lines:
        stripped = line.strip()
        if stripped.startswith(("- ", "* ", "• ")):
            hit_bullets = True
            suggestions.append(stripped.lstrip("-*• ").strip())
        else:
            if hit_bullets and not stripped:
                continue
            body_lines.append(line)
    return "\n".join(body_lines).strip(), suggestions


def _write_temp_from_b64(b64: str, suffix: str = ".png") -> str:
    raw = base64.b64decode(b64)
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(raw)
    tmp.flush()
    tmp.close()
    return tmp.name


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"name": "Vision Studio API", "status": "ok"}


@api_router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Conversational AI (Gemini 3 Flash) that understands user intent + reference images."""
    try:
        chat_client = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=req.session_id,
            system_message=_get_system_prompt(req.context),
        ).with_model("gemini", "gemini-2.5-flash")

        file_contents = []
        for img_b64 in req.images_base64:
            file_contents.append(ImageContent(image_base64=img_b64))

        user_msg = UserMessage(text=req.message, file_contents=file_contents)
        reply_text = await chat_client.send_message(user_msg)
        body, suggestions = _parse_suggestions(reply_text)
        return ChatResponse(session_id=req.session_id, reply=body, suggestions=suggestions)
    except Exception as e:
        logger.exception("chat error")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/generate-image", response_model=ImageResult)
async def generate_image(req: ImageGenRequest):
    """Text-to-image (or reference-guided) generation via Gemini Nano Banana."""
    try:
        chat_client = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=str(uuid.uuid4()),
            system_message=(
                "Kamu adalah generator gambar Vision Studio. Buat satu gambar yang cocok "
                "dengan permintaan user, kualitas tinggi, komposisi baik."
            ),
        ).with_model("gemini", "gemini-2.5-flash-image")

        file_contents = []
        if req.reference_image_base64:
            file_contents.append(ImageContent(image_base64=req.reference_image_base64))

        user_msg = UserMessage(text=req.prompt, file_contents=file_contents)
        text, images = await chat_client.send_message_multimodal_response(user_msg)

        if not images:
            raise HTTPException(status_code=502, detail="No image returned by model")

        first = images[0]
        return ImageResult(
            image_base64=first["data"],
            mime_type=first.get("mime_type", "image/png"),
            text=text,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("generate-image error")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/edit-image", response_model=ImageResult)
async def edit_image(req: ImageEditRequest):
    """Edit existing image with a prompt + optional reference image (Nano Banana)."""
    try:
        chat_client = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=str(uuid.uuid4()),
            system_message=(
                "Kamu adalah image editor Vision Studio. Lakukan edit sesuai permintaan pada "
                "foto pertama. Foto berikutnya (jika ada) adalah referensi gaya/warna/mood. "
                "Kembalikan satu gambar hasil edit dengan kualitas tinggi."
            ),
        ).with_model("gemini", "gemini-2.5-flash-image")

        file_contents = [ImageContent(image_base64=req.source_image_base64)]
        if req.reference_image_base64:
            file_contents.append(ImageContent(image_base64=req.reference_image_base64))

        user_msg = UserMessage(text=req.prompt, file_contents=file_contents)
        text, images = await chat_client.send_message_multimodal_response(user_msg)

        if not images:
            raise HTTPException(status_code=502, detail="No image returned by model")

        first = images[0]
        return ImageResult(
            image_base64=first["data"],
            mime_type=first.get("mime_type", "image/png"),
            text=text,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("edit-image error")
        raise HTTPException(status_code=500, detail=str(e))


# --- Video generation (async job pattern) ---
async def _run_video_job(job_id: str, req: VideoGenRequest):
    await db.video_jobs.update_one({"id": job_id}, {"$set": {"status": "processing"}})
    try:
        generator = OpenAIVideoGeneration(api_key=EMERGENT_LLM_KEY)
        image_path = None
        if req.reference_image_base64:
            image_path = _write_temp_from_b64(req.reference_image_base64, ".png")

        # Sync call - blocks until video ready or timeout
        import asyncio
        loop = asyncio.get_event_loop()
        video_bytes = await loop.run_in_executor(
            None,
            lambda: generator.text_to_video(
                prompt=req.prompt,
                model="sora-2",
                size=req.size,
                duration=req.duration,
                image_path=image_path,
                mime_type="image/png",
                max_wait_time=540,
            ),
        )
        if not video_bytes:
            await db.video_jobs.update_one(
                {"id": job_id},
                {"$set": {"status": "failed", "error": "No video bytes returned"}},
            )
            return

        video_b64 = base64.b64encode(video_bytes).decode("utf-8")
        await db.video_jobs.update_one(
            {"id": job_id},
            {"$set": {"status": "completed", "video_base64": video_b64}},
        )
    except Exception as e:
        logger.exception("video job failed")
        await db.video_jobs.update_one(
            {"id": job_id}, {"$set": {"status": "failed", "error": str(e)}}
        )


@api_router.post("/generate-video", response_model=VideoJob)
async def generate_video(req: VideoGenRequest, background_tasks: BackgroundTasks):
    """Kick off a Sora 2 video generation job. Poll GET /api/video-jobs/{id}."""
    job = VideoJob(prompt=req.prompt, size=req.size, duration=req.duration)
    await db.video_jobs.insert_one(job.model_dump())
    background_tasks.add_task(_run_video_job, job.id, req)
    return job


@api_router.get("/video-jobs/{job_id}", response_model=VideoJob)
async def get_video_job(job_id: str):
    doc = await db.video_jobs.find_one({"id": job_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Job not found")
    return VideoJob(**doc)


# --- Projects CRUD ---
@api_router.post("/projects", response_model=Project)
async def create_project(req: ProjectCreate):
    project = Project(**req.model_dump())
    await db.projects.insert_one(project.model_dump())
    return project


@api_router.get("/projects", response_model=List[Project])
async def list_projects():
    docs = await db.projects.find({}, {"_id": 0}).sort("updated_at", -1).to_list(500)
    return [Project(**d) for d in docs]


@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    doc = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    return Project(**doc)


@api_router.patch("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, req: ProjectUpdate):
    doc = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    update = {k: v for k, v in req.model_dump().items() if v is not None}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.projects.update_one({"id": project_id}, {"$set": update})
    doc.update(update)
    return Project(**doc)


@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    r = await db.projects.delete_one({"id": project_id})
    return {"deleted": r.deleted_count}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
