import React, { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Check, Copy, Download, Share2, X } from 'lucide-react';

interface QrShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  displayName: string;
}

export const QrShareModal: React.FC<QrShareModalProps> = ({
  isOpen,
  onClose,
  username,
  displayName,
}) => {
  const [copied, setCopied] = useState(false);
  const qrWrapRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const publicUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/${username}`
      : `https://linkora.app/${username}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback copy
      const input = document.createElement('input');
      input.value = publicUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${displayName} on Linkora`,
          text: `Explore ${displayName}'s official links on Linkora`,
          url: publicUrl,
        });
        return;
      } catch {
        // User canceled or unsupported in iframe — fall back to copy
      }
    }
    await handleCopy();
  };

  const handleDownloadQr = () => {
    const canvas = qrWrapRef.current?.querySelector('canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `linkora-${username}-qr.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 id="qr-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Share Bio Page
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Share your link or download a print-ready QR code
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share dialog"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code Display */}
        <div
          ref={qrWrapRef}
          className="flex flex-col items-center justify-center p-6 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
        >
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <QRCodeCanvas
              value={publicUrl}
              size={176}
              bgColor="#FFFFFF"
              fgColor="#0F172A"
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="mt-3 text-xs font-mono text-slate-600 dark:text-slate-400 break-all text-center">
            {publicUrl}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className="min-h-[42px] px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy Link'}</span>
          </button>

          <button
            type="button"
            onClick={handleNativeShare}
            className="min-h-[42px] px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadQr}
            className="min-h-[42px] px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Save QR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
