export class Router {
    #Routes = Object.create(null);

    on(path, handler) {
        this.#Routes[path] = handler;
        return this;
    }

    navigate(path, { history = "push" } = {}) {
        path = path.startsWith("/") ? path : "/" + path;
        return navigation.navigate(path, { history });
    }

    listen(onError404, { autoFire = false } = {}) {
        navigation.addEventListener("navigate", (event) => {
            const url = new URL(event.destination.url);

            event.intercept({
                handler: () => {
                    console.log(url.pathname, this.#Routes);

                    const fn = this.#Routes[url.pathname];
                    if (!fn) {
                        onError404();
                        return;
                    }
                    fn({ url });
                }
            });
        });

        if (autoFire) {
            this.navigate(location.pathname, { history: "replace" });
        }

        return this;
    }
}