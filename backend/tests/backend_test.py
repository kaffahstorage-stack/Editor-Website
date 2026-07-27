"""Backend tests for Vision Studio API."""
import os
import base64
import time
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")).rstrip("/")
API = f"{BASE_URL}/api"

# 1x1 transparent PNG
TINY_PNG_B64 = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
)


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Root ----------
class TestRoot:
    def test_root(self, client):
        r = client.get(f"{API}/", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert data.get("name") == "Vision Studio API"
        assert data.get("status") == "ok"


# ---------- Chat ----------
class TestChat:
    def test_chat_assistant(self, client):
        r = client.post(
            f"{API}/chat",
            json={"session_id": "test-sess-1", "message": "Halo, aku mau bikin foto keren untuk instagram", "context": "assistant"},
            timeout=90,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["session_id"] == "test-sess-1"
        assert isinstance(data["reply"], str) and len(data["reply"]) > 0
        assert isinstance(data["suggestions"], list)

    def test_chat_photo_edit_with_image(self, client):
        r = client.post(
            f"{API}/chat",
            json={
                "session_id": "test-sess-2",
                "message": "Bagaimana cara mengubah background foto ini menjadi pantai?",
                "context": "photo_edit",
                "images_base64": [TINY_PNG_B64],
            },
            timeout=120,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert len(data["reply"]) > 0


# ---------- Image gen/edit ----------
class TestImage:
    def test_generate_image(self, client):
        r = client.post(
            f"{API}/generate-image",
            json={"prompt": "A tiny red apple on white background, minimal"},
            timeout=180,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["image_base64"]
        # Ensure it's valid base64
        raw = base64.b64decode(data["image_base64"])
        assert len(raw) > 100

    def test_edit_image(self, client):
        r = client.post(
            f"{API}/edit-image",
            json={"prompt": "Make it look sunset colored", "source_image_base64": TINY_PNG_B64},
            timeout=180,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["image_base64"]


# ---------- Projects CRUD ----------
class TestProjects:
    created_ids = []

    def test_create_list_get_update_delete(self, client):
        # CREATE
        payload = {
            "title": "TEST_project_1",
            "kind": "photo_edit",
            "thumbnail_base64": TINY_PNG_B64,
            "payload": {"messages": [], "note": "hello"},
        }
        r = client.post(f"{API}/projects", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        proj = r.json()
        pid = proj["id"]
        TestProjects.created_ids.append(pid)
        assert proj["title"] == "TEST_project_1"
        assert proj["kind"] == "photo_edit"

        # LIST
        r = client.get(f"{API}/projects", timeout=30)
        assert r.status_code == 200
        ids = [p["id"] for p in r.json()]
        assert pid in ids

        # GET
        r = client.get(f"{API}/projects/{pid}", timeout=30)
        assert r.status_code == 200
        assert r.json()["title"] == "TEST_project_1"

        # PATCH
        r = client.patch(
            f"{API}/projects/{pid}",
            json={"title": "TEST_project_1_updated", "payload": {"note": "updated"}},
            timeout=30,
        )
        assert r.status_code == 200
        assert r.json()["title"] == "TEST_project_1_updated"

        # GET verify persistence
        r = client.get(f"{API}/projects/{pid}", timeout=30)
        assert r.json()["title"] == "TEST_project_1_updated"
        assert r.json()["payload"]["note"] == "updated"

        # DELETE
        r = client.delete(f"{API}/projects/{pid}", timeout=30)
        assert r.status_code == 200
        assert r.json()["deleted"] == 1

        # Verify gone
        r = client.get(f"{API}/projects/{pid}", timeout=30)
        assert r.status_code == 404

    def test_get_nonexistent_project(self, client):
        r = client.get(f"{API}/projects/does-not-exist-xyz", timeout=30)
        assert r.status_code == 404


# ---------- Video (kickoff + status only) ----------
class TestVideo:
    def test_video_kickoff_and_status(self, client):
        r = client.post(
            f"{API}/generate-video",
            json={"prompt": "A cat walking", "size": "1280x720", "duration": 4},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        job = r.json()
        assert job["id"]
        assert job["status"] in ("queued", "processing", "completed", "failed")

        # Poll once quickly
        time.sleep(2)
        r = client.get(f"{API}/video-jobs/{job['id']}", timeout=30)
        assert r.status_code == 200
        assert r.json()["status"] in ("queued", "processing", "completed", "failed")

    def test_video_job_not_found(self, client):
        r = client.get(f"{API}/video-jobs/nonexistent-job-id", timeout=30)
        assert r.status_code == 404
