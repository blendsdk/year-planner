import "./styles.css";

type Loader = () => Promise<{ default: () => void }>;

const LOADERS: Record<string, Loader> = {
  "html-only": () => import("./variants/html-only"),
  "html-svg": () => import("./variants/html-svg"),
  "svg-shapes": () => import("./variants/svg-shapes"),
  "full-svg-row": () => import("./variants/full-svg-row"),
};

const requested = new URLSearchParams(window.location.search).get("variant") ?? "html-only";
const loader = LOADERS[requested];
if (!loader) {
  const app = document.getElementById("app");
  if (app) app.textContent = `Unknown variant: ${requested}`;
} else {
  loader().then((module) => module.default());
}
