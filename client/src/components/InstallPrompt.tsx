import React, { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <div className="fixed bottom-4 left-1/2 z-[150] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-xl border border-[#e5e8f0] bg-white p-3 shadow-lg">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-950 text-gold-400">
        <Download size={16} />
      </div>
      <div className="flex-1 text-xs text-gray-700">
        <div className="font-medium text-navy-950">Install Dhaftharu</div>
        <div className="text-gray-500">Add to your home screen for quick access.</div>
      </div>
      <button onClick={handleInstall} className="rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-800">
        Install
      </button>
      <button onClick={() => setDismissed(true)} className="text-gray-400 hover:text-gray-600">
        <X size={16} />
      </button>
    </div>
  );
}
