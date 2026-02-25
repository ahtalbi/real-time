const STORAGE_KEY = "theme";
const DEFAULT_THEME = "light";
let toggleBtn = null;

function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
}

function getInitialTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    return DEFAULT_THEME;
}

function buildThemeToggle(initialTheme) {
    const btn = document.createElement("button");
    btn.id = "theme-toggle";
    btn.type = "button";
    btn.className = "theme-toggle";
    btn.setAttribute("aria-label", "Toggle dark mode");
    btn.textContent = initialTheme === "dark" ? "🌞" : "🌚";
    return btn;
}

function ensureThemeToggle() {
    const initialTheme = getInitialTheme();
    if (toggleBtn) {
        toggleBtn.textContent = initialTheme === "dark" ? "🌞" : "🌚";
        return toggleBtn;
    }

    toggleBtn = buildThemeToggle(initialTheme);
    toggleBtn.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const nextTheme = currentTheme === "dark" ? "light" : "dark";
        setTheme(nextTheme);
        localStorage.setItem(STORAGE_KEY, nextTheme);
        toggleBtn.textContent = nextTheme === "dark" ? "🌞" : "🌚";
    });
    return toggleBtn;
}

export function mountThemeToggle(container = document.getElementById("actions")) {
    const btn = ensureThemeToggle();
    if (container) {
        btn.classList.remove("is-floating");
        container.prepend(btn);
        return;
    }
    btn.classList.add("is-floating");
    document.body.appendChild(btn);
}

export function initTheme() {
    setTheme(getInitialTheme());
    mountThemeToggle();
}
