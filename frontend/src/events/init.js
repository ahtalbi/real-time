import { EventsManager } from "../../packages/eventsManager.js";

export let GlobalEventsManager = null;
export function InitGlobalEventManager() {
    GlobalEventsManager = {
        submit: new EventsManager("submit"),
        click: new EventsManager("click"),
    };
}