import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CookiesProvider } from "react-cookie";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";

// Authorized, read-only registration viewer. Isolated from the landing-page
// chrome (no preloader, door transition, music, or analytics).
const RCheck = lazy(() => import("./pages/rcheck/RCheck"));

// Prevent zooming in with cursor (Ctrl + mouse wheel / laptop touchpad pinch zoom)
if (typeof window !== "undefined") {
  window.addEventListener(
    "wheel",
    (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  window.addEventListener("keydown", (e: KeyboardEvent) => {
    if (
      e.ctrlKey &&
      (e.key === "+" ||
        e.key === "-" ||
        e.key === "=" ||
        e.key === "_" ||
        e.key === "0")
    ) {
      e.preventDefault();
    }
  });

  document.addEventListener("gesturestart", (e) => e.preventDefault());
  document.addEventListener("gesturechange", (e) => e.preventDefault());
  document.addEventListener("gestureend", (e) => e.preventDefault());
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CookiesProvider>
        <HelmetProvider>
          <BrowserRouter>
            <Routes>
              <Route
                path="/rcheck"
                element={
                  <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0f1115" }} />}>
                    <RCheck />
                  </Suspense>
                }
              />
              <Route path="/*" element={<App />} />
            </Routes>
          </BrowserRouter>
        </HelmetProvider>
    </CookiesProvider>
  </React.StrictMode>
);
