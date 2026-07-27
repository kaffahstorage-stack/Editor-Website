import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import AppShell from "@/components/AppShell";
import Home from "@/pages/Home";
import PhotoEdit from "@/pages/PhotoEdit";
import VideoEdit from "@/pages/VideoEdit";
import ImageGen from "@/pages/ImageGen";
import VideoGen from "@/pages/VideoGen";
import Assistant from "@/pages/Assistant";
import Projects from "@/pages/Projects";

function App() {
  return (
    <BrowserRouter>
      <AppShell showBack>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/photo" element={<PhotoEdit />} />
          <Route path="/video" element={<VideoEdit />} />
          <Route path="/image-gen" element={<ImageGen />} />
          <Route path="/video-gen" element={<VideoGen />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </AppShell>
      <Toaster position="top-center" />
    </BrowserRouter>
  );
}

export default App;
