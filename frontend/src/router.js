import { Router } from "../packages/router.js";

export let ClientRouter = Object.create(null);

async function fileExists(url) {
    try {
        let res = await fetch(url, { cache: "no-cache" });
        return res.ok;
    } catch {
        return false;
    }
}

function loadCSSOnce(href) {
    if (document.querySelector(`link[href="${href}"]`)) return;

    let link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
}

async function loadPageScript(src) {
    let old = document.querySelector('script[data-page]');
    if (old) old.remove();

    let s = document.createElement("script");
    s.type = "module";
    s.src = src;
    s.src = `${src}?v=${Date.now()}`;

    s.dataset.page = "true";
    document.body.appendChild(s);

    await new Promise((r, e) => {
        s.onload = r;
        s.onerror = e;
    });
}

async function renderPage(pageName, root) {
    let base = `/pages/${pageName}/${pageName}`;

    let html = await fetch(base + ".html", { cache: "no-cache" });
    if (!html.ok) throw new Error("404");

    root.innerHTML = "";
    root.innerHTML = await html.text();

    if (await fileExists(base + ".css")) {
        loadCSSOnce(base + ".css");
    }

    if (await fileExists(base + ".js")) {
        await loadPageScript(base + ".js");
    }
}


export async function HandleRoutes() {
    let app = document.getElementById("app") ?? document.body;

    let on404 = () => {
        renderPage("error", app).catch(() => {
            app.innerHTML = "<h1>404</h1>";
        });
    };

    ClientRouter = new Router()
        .on("/", () => renderPage("home", app).catch(on404))
        .on("/login", () => renderPage("login", app).catch(on404))
        .on("/register", () => renderPage("register", app).catch(on404))
        .on("/messages", () => renderPage("messages", app).catch(on404))
        .listen(on404);

    await fetch("http://localhost:3000/hassession")
        .then(res => res.json())
        .then(res => {
            let path = window.location.pathname;
            console.log(path);
            
            if (res.success) {if (path !== "/messages") {ClientRouter.navigate("/")} else {ClientRouter.navigate("/messages")}}
            else if (res.error && path !== "/register") ClientRouter.navigate("/login")
            else ClientRouter.navigate("/register")
        })
}
