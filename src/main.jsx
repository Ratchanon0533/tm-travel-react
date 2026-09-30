// Browser entry. Hydrates the prerendered HTML (production) or renders fresh (dev).
import "./styles/global.css"; // must come first so component styles can override it
import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.jsx";
import { langFromPath } from "./lib/paths.js";

const root = document.getElementById("root");
const lang = langFromPath(window.location.pathname);
const app = (
  <StrictMode>
    <App lang={lang} />
  </StrictMode>
);

if (root.firstElementChild) hydrateRoot(root, app); // prerendered page
else createRoot(root).render(app);
