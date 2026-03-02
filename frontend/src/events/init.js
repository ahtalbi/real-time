import { EventsManager } from "../../packages/eventsManager.js";

// var where i store the global events manager
export let GlobalEventsManager = null;
// funciton to initlize the global events so i dont make mess of add evnet listners 
export function InitGlobalEventManager() {
    GlobalEventsManager = {
        submit: new EventsManager("submit"),
        click: new EventsManager("click"),
    };
}