// this function is to change the theme like to initlize the default theme and change it after time 
export function initTheme() {
    let saved = localStorage.getItem("theme");
    let theme = saved === "dark" ? "dark" : "light";

    document.documentElement.dataset.theme = theme;

    let btn = document.createElement("button");
    btn.textContent = theme === "dark" ? "🌞" : "🌚";
    btn.className = "theme-toggle";
    btn.onclick = () => {
        let next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        localStorage.setItem("theme", next);
        btn.textContent = next === "dark" ? "🌞" : "🌚";
    };

    document.body.prepend(btn);
}