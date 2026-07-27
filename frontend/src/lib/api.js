import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  headers: { "Content-Type": "application/json" },
  timeout: 120000,
});

export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result || "";
      const comma = String(result).indexOf(",");
      resolve(comma >= 0 ? String(result).slice(comma + 1) : String(result));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const chat = (payload) => api.post("/chat", payload).then((r) => r.data);
export const generateImage = (payload) =>
  api.post("/generate-image", payload).then((r) => r.data);
export const editImage = (payload) =>
  api.post("/edit-image", payload).then((r) => r.data);
export const generateVideo = (payload) =>
  api.post("/generate-video", payload).then((r) => r.data);
export const getVideoJob = (id) =>
  api.get(`/video-jobs/${id}`).then((r) => r.data);

export const listProjects = () => api.get("/projects").then((r) => r.data);
export const createProject = (payload) =>
  api.post("/projects", payload).then((r) => r.data);
export const getProject = (id) => api.get(`/projects/${id}`).then((r) => r.data);
export const updateProject = (id, payload) =>
  api.patch(`/projects/${id}`, payload).then((r) => r.data);
export const deleteProject = (id) =>
  api.delete(`/projects/${id}`).then((r) => r.data);
