import { Router } from "../packages/router.js";

function main() {
    let app = document.body;
    function onError404() {
        app.innerText = "<h1>error</h1>"
    }
    new Router()
    .on("/", () => {app.innerText = "<h1>home</h1>"})
    .on("/login", () => {app.innerText = "<h1>login</h1>"})
    .listen(onError404)
}

main();