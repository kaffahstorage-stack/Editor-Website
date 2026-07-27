import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Moon, Sun, Sparkles, ArrowLeft } from "lucide-react";
import { useTheme } from "@/lib/theme";

export default function AppShell({ children, showBack = false }) {
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="App min-h-full bg-background text-foreground grain-overlay relative">
      <header
        data-testid="app-header"
        className="sticky top-0 z-40 glass"
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <Link
            to="/"
            data-testid="brand-link"
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-2xl bg-foreground text-background grid place-items-center">
              <Sparkles className="w-4 h-4" strokeWidth={2.4} />
            </div>
            <div className="leading-tight">
              <div className="font-display text-[15px] font-bold tracking-tight">
                Vision Studio
              </div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                creative ai partner
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {showBack && !isHome && (
              <Link
                to="/"
                data-testid="back-home-btn"
                className="hidden sm:flex items-center gap-1.5 px-4 h-9 rounded-full text-sm border border-border hover:bg-secondary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Beranda
              </Link>
            )}
            <button
              onClick={toggle}
              data-testid="theme-toggle"
              aria-label="Toggle theme"
              className="w-9 h-9 rounded-full border border-border grid place-items-center hover:bg-secondary transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10"
      >
        {children}
      </motion.main>

      <footer className="border-t border-border mt-24">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground uppercase tracking-[0.22em]">
            © Vision Studio · Ide → Foto & Video
          </div>
          <div className="text-xs text-muted-foreground">
            Dibuat untuk kreator. Bertenaga Gemini 3, Nano Banana & Sora 2.
          </div>
        </div>
      </footer>
    </div>
  );
}
