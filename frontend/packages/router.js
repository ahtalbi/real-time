export class Router {
    #Routes = Object.create(null);

    on(path, handler) {
        this.#Routes[path] = handler;
        return this;
    }

    navigate(path, { history = "push"} = {}) {
        path = path.startsWith("/") ? path : "/" + path;
        console.log(window.history.length);
        
        if (window.history.length <= 1) {
            history = "replace";
        }

        return navigation.navigate(path, { history });
    }

    listen(onError404) {
        navigation.addEventListener("navigate", (event) => {
            let url = new URL(event.destination.url);

            event.intercept({
                handler: () => {
                    let fn = this.#Routes[url.pathname];
                    if (!fn) {
                        onError404();
                        return;
                    }
                    fn({ url });
                }
            });
        });

        return this;
    }
}
