import { useEffect } from "react";
import { settingsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { mediaUrl } from "../utils/format";
import { applyBrandIcons } from "../utils/brandIcons";

/**
 * Keeps the admin Chrome tab title/favicon in sync with System Settings logo.
 */
export default function DocumentMeta() {
  const { data, reload } = useAsync(() => settingsApi.get(), []);
  const storeName = data?.data?.storeName || "Electronics Cart";
  const logo = data?.data?.logo;

  useEffect(() => {
    const onChange = () => reload();
    window.addEventListener("store-settings-changed", onChange);
    return () => window.removeEventListener("store-settings-changed", onChange);
  }, [reload]);

  useEffect(() => {
    document.title = `${storeName} — Admin`;
    applyBrandIcons({
      logoUrl: logo ? mediaUrl(logo) : "",
      fallback: "/favicon.svg",
      appleFallback: "/favicon.svg",
    });
  }, [storeName, logo]);

  return null;
}
