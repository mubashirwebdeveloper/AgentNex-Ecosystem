import { useEffect } from "react";

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function usePageMeta(title: string, description: string) {
  useEffect(() => {
    const full = title.includes("AGENTNEX") ? title : `${title} | AGENTNEX`;
    document.title = full;
    setMeta("name", "description", description);
    setMeta("property", "og:title", full);
    setMeta("property", "og:description", description);
    setMeta("name", "twitter:title", full);
    setMeta("name", "twitter:description", description);
  }, [title, description]);
}
