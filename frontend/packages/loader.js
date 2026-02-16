export class PageLoader {
    constructor() {}

    async fileExists(url, type = "") {
        try {
            const res = await fetch(url, { method: "HEAD", cache: "no-cache" });
            if (!res.ok) return false;

            const ct = (res.headers.get("content-type") || "").toLowerCase();
            switch (type) {
                case "js":
                    return ct.includes("javascript");
                case "css":
                    return ct.includes("text/css");
                default:
                    return true;
            }
        } catch {
            return false;
        }
    }

    async loadPageHtml(root, base, pageName) {
        const res = await fetch(`${base}${pageName}/${pageName}.html`, { cache: "no-cache" });
        if (!res.ok) throw new Error("404");
        root.innerHTML = await res.text();
    }

    async loadPageScript(base, pageName) {
        const src = `${base}${pageName}/${pageName}.js`;
        
        if (!(await this.fileExists(src, "js"))) return;

        document.querySelectorAll("script[data-page-script]").forEach((s) => s.remove());

        const s = document.createElement("script");
        s.type = "module";
        s.src = `${src}?v=${Date.now()}`;
        s.dataset.pageScript = pageName;

        document.body.appendChild(s);
        await new Promise((r, e) => {
            s.onload = r;
            s.onerror = e;
        });
    }

    async loadPageCss(base, pageName) {
        const href = `${base}${pageName}/${pageName}.css`;
        if (!(await this.fileExists(href, "css"))) return;

        document.querySelectorAll("link[data-page-css]").forEach((l) => l.remove());

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `${href}?v=${Date.now()}`;
        link.dataset.pageCss = pageName;
        document.head.appendChild(link);

        await new Promise((r, e) => {
            link.onload = r;
            link.onerror = e;
        });
    }

    async renderPage(pageName, root) {
        const base = "/src/pages/";
        
        await this.loadPageHtml(root, base, pageName);
        await this.loadPageScript(base, pageName);
        await this.loadPageCss(base, pageName);
    }
}
