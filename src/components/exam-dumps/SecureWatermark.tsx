import React, { useEffect } from "react";
import { getStoredUser } from "@/lib/yatris-api";

interface SecureWatermarkProps {
  buyerEmail?: string;
}

export const SecureWatermark: React.FC<SecureWatermarkProps> = ({ buyerEmail }) => {
  const user = getStoredUser();
  const displayEmail = buyerEmail || user?.email || "verified-buyer@yatricloud.com";

  // Anti-piracy listeners: prevent right-click context menu and copy shortcuts
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      if (e.clipboardData) {
        e.clipboardData.setData("text/plain", "Protected material — Yatri Cloud Practice Hub");
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+C, Cmd+C, Ctrl+P, Cmd+P, Ctrl+U, Cmd+U, F12
      if ((e.ctrlKey || e.metaKey) && ["c", "p", "u", "s"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
      if (e.key === "F12") {
        e.preventDefault();
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("copy", handleCopy);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("copy", handleCopy);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const watermarkText = `Yatri Cloud • ${displayEmail} • Confidential`;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-30 overflow-hidden select-none opacity-[0.06] dark:opacity-[0.09]"
      style={{ userSelect: "none" }}
    >
      <div className="w-[180vw] h-[180vh] -translate-x-[20vw] -translate-y-[20vh] -rotate-25 flex flex-wrap content-start gap-y-24 gap-x-20 text-[13px] font-mono tracking-widest text-foreground uppercase">
        {Array.from({ length: 60 }).map((_, i) => (
          <span key={i} className="whitespace-nowrap">
            {watermarkText}
          </span>
        ))}
      </div>
    </div>
  );
};
