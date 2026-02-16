export class Router {
    #Routes = Object.create(null);

    on(path, handler) {
        this.#Routes[path] = handler;
        return this;
    }

    navigate(path, { history } = {}) {
        path = path.startsWith("/") ? path : "/" + path;
        
        if (!history) {
            history = window.history.length > 1 ? "push" : "replace";
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
