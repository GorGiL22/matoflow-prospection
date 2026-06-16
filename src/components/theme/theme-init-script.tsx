import { InlineScript } from "./inline-script";

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark")}catch(e){}})();`;

export function ThemeInitScript() {
  return <InlineScript html={THEME_INIT_SCRIPT} />;
}
