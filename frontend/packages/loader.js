export class PageLoader {
    constructor() {}

    async fileExists(url) {
        try {
            let res = await fetch(url, { cache: "no-cache" });
            return res.ok;
        } catch {
            return false;
        }
    }

    async loadPageScript(src) {
        let old = document.querySelector('script[data-page-script="1"]');
        if (old) old.remove();

        let s = document.createElement("script");
        s.type = "module";
        s.src = `${src}?v=${Date.now()}`;

        document.body.appendChild(s);
        await new Promise((r, e) => {
            s.onload = r;
            s.onerror = e;
        });
    }

    async renderPage(pageName, root) {
        let base = `/pages/${pageName}/${pageName}`;
    
        let html = await fetch(base + ".html", { cache: "no-cache" });
        if (!html.ok) throw new Error("404");
        
        root.innerHTML = "";
        root.innerHTML = await html.text();
    
        if (await this.fileExists(base + ".js")) {
            await this.loadPageScript(base + ".js");
        }
    }
}
