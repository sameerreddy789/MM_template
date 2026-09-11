import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { CookiesProvider } from "react-cookie";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";

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
      <GoogleOAuthProvider clientId="513838793862-gfa9g1snl74coi736ggti5nd9uglh66k.apps.googleusercontent.com">
        <HelmetProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </HelmetProvider>
      </GoogleOAuthProvider>
    </CookiesProvider>
  </React.StrictMode>
);
