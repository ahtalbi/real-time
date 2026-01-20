import { Router } from "../packages/router.js";

async function fileExists(url) {
  try {
    const res = await fetch(url, { cache: "no-cache" });
    return res.ok;
  } catch {
    return false;
  }
}

function loadCSSOnce(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

async function loadPageScript(src) {
  const old = document.querySelector('script[data-page]');
  if (old) old.remove();

  const s = document.createElement("script");
  s.type = "module";
  s.src = src;
  s.dataset.page = "true";
  document.body.appendChild(s);

  await new Promise((r, e) => {
    s.onload = r;
    s.onerror = e;
  });
}

async function renderPage(pageName, root) {
  const base = `/pages/${pageName}/${pageName}`;

  const html = await fetch(base + ".html", { cache: "no-cache" });
  if (!html.ok) throw new Error("404");

  root.innerHTML = await html.text();

  if (await fileExists(base + ".css")) {
    loadCSSOnce(base + ".css");
  }

  if (await fileExists(base + ".js")) {
    await loadPageScript(base + ".js");
  }
}

function main() {
  const app = document.getElementById("app") ?? document.body;

  const on404 = () => {
    renderPage("error", app).catch(() => {
      app.innerHTML = "<h1>404</h1>";
    });
  };

  new Router()
    .on("/", () => renderPage("home", app).catch(on404))
    .on("/login", () => renderPage("login", app).catch(on404))
    .on("/register", () => renderPage("register", app).catch(on404))
    .listen(on404);
}

main();
