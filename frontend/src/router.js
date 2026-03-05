import { PageLoader } from "../packages/loader.js";
import { Router } from "../packages/router.js";

// variable global to use the router package
export let ClientRouter = new Router();
// this funcitone where we initlize and handler the routing of the front end
export async function HandleRoutes() {
    let app = document.getElementById("app");
    let loader = new PageLoader();
    let on404 = () => {
        loader.renderPage("error", app).catch(() => {
            app.innerHTML = "<h1>404</h1>";
        });
    };

    let routes = {
        "/": { "auth": true, "handler": () => loader.renderPage("home", app) },
        "/login": { "auth": false, "handler": () => loader.renderPage("login", app) },
        "/register": { "auth": false, "handler": () => loader.renderPage("register", app) },
        "/messages": { "auth": true, "handler": () => loader.renderPage("messages", app) },
    };

    for (let route in routes) {
        ClientRouter.on(route, routes[route].handler);
    }
    ClientRouter.listen(on404);

    fetch("http://localhost:3000/hassession")
        .then(res => res.json())
        .then(async res => {
            let path = window.location.pathname;

            let route = routes[path];
            if (!route) { on404(); return };
            
            if (res.success && !route.auth) ClientRouter.navigate("/");
            else if (res.error && route.auth) ClientRouter.navigate("/login");
            else route.handler();
        })
}
