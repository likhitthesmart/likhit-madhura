"use client";

export const THEME_KEY = "madhura-theme";

/** Light is the default: only a visitor who explicitly picked dark gets dark, so
 *  the OS setting is deliberately ignored. Inlined in <head> so the class lands on
 *  <html> before first paint — otherwise someone who chose dark flashes light. */
export const themeInitScript = `try{document.documentElement.classList.toggle("dark",localStorage.getItem("${THEME_KEY}")==="dark")}catch(e){}`;

/** The rendered icon is chosen by CSS (`dark:` variants) rather than React state,
 *  so the button is correct before hydration and can't mismatch the server HTML. */
export const toggleTheme = () => {
  const dark = document.documentElement.classList.toggle("dark");
  localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
};
