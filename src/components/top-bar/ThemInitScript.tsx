// app/components/ThemeInitScript.tsx
export default function ThemeInitScript() {
  const code = `
(function() {
  try {
    const theme = localStorage.getItem("theme") || 
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "cupcake");
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (_) {}
})();
  `;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
