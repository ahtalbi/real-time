const STORAGE_KEY = "theme";
const DEFAULT_THEME = "light";

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
    btn.textContent = initialTheme === "dark" ? "Light mode" : "Dark mode";
    return btn;
}

export function initTheme() {
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    
    if (document.getElementById("theme-toggle")) return;
    
    const toggleBtn = buildThemeToggle(initialTheme);
    toggleBtn.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const nextTheme = currentTheme === "dark" ? "light" : "dark";
        setTheme(nextTheme);
        localStorage.setItem(STORAGE_KEY, nextTheme);
        toggleBtn.textContent = nextTheme === "dark" ? "Light mode" : "Dark mode";
    });
    
    document.body.appendChild(toggleBtn);
}
