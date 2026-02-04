export class EventsManager {
    #Events = Object.create(null);
    constructor (event) {
        document.addEventListener(event, (e) => {
            if (event === "submit") e.preventDefault();
            let ele = e.target.closest("[id]");
            if (!ele) return;
            let fn = this.#Events[ele.id];
            if (!fn) return;
            fn(ele, e);
        });
    }

    RegisterEvent(id, fn) {
        this.#Events[id] = fn;
    }
}