import React, { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Check, Code2, Copy, CreditCard, Download, Share2, X } from 'lucide-react';

interface QrShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  displayName: string;
}

const QR_COLOR_SWATCHES = [
  { id: 'slate', label: 'Obsidian', hex: '#0F172A' },
  { id: 'indigo', label: 'Indigo', hex: '#4338CA' },
  { id: 'emerald', label: 'Emerald', hex: '#065F46' },
  { id: 'rose', label: 'Rosewood', hex: '#9D174D' },
  { id: 'amber', label: 'Bronze', hex: '#92400E' },
];

export const QrShareModal: React.FC<QrShareModalProps> = ({
  isOpen,
  onClose,
  username,
  displayName,
}) => {
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [qrColor, setQrColor] = useState('#0F172A');
  const qrWrapRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const publicUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/${username}`
      : `https://linkora.app/${username}`;

  const safeDisplayName = (displayName || username || 'Creator').replace(/[<>"']/g, '');
  const embedSnippet = `<a href="${publicUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:10px;background:#0F172A;color:#FFFFFF;font-family:sans-serif;font-size:14px;font-weight:600;text-decoration:none;">${safeDisplayName} · Official Links</a>`;

  const copyText = async (text: string, setFlag: (val: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setFlag(true);
      setTimeout(() => setFlag(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setFlag(true);
      setTimeout(() => setFlag(false), 2000);
    }
  };

  const handleCopy = () => copyText(publicUrl, setCopied);
  const handleCopyEmbed = () => copyText(embedSnippet, setEmbedCopied);

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
        // Fall back to copy
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

  const handleDownloadShareCard = () => {
    const qrCanvas = qrWrapRef.current?.querySelector('canvas');
    if (!qrCanvas) return;

    const card = document.createElement('canvas');
    card.width = 720;
    card.height = 920;
    const ctx = card.getContext('2d');
    if (!ctx) return;

    // Background card canvas
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, card.width, card.height);

    // Subtle inner white card
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(60, 70, 600, 780, 32);
    ctx.fill();

    // Accent bar at top of inner card
    ctx.fillStyle = qrColor;
    ctx.beginPath();
    ctx.roundRect(60, 70, 600, 14, [32, 32, 0, 0]);
    ctx.fill();

    // Creator Name
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 38px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(safeDisplayName.slice(0, 28), 360, 175);

    // Handle
    ctx.fillStyle = '#475569';
    ctx.font = '600 22px monospace';
    ctx.fillText(`@${username}`, 360, 218);

    // QR Code centered
    ctx.drawImage(qrCanvas, 180, 270, 360, 360);

    // Scan CTA & URL
    ctx.fillStyle = '#0F172A';
    ctx.font = '600 20px sans-serif';
    ctx.fillText('Scan to open all official links', 360, 695);

    ctx.fillStyle = '#64748B';
    ctx.font = '500 16px monospace';
    ctx.fillText(publicUrl.replace(/^https?:\/\//, '').slice(0, 46), 360, 735);

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('LINKORA', 360, 810);

    const link = document.createElement('a');
    link.download = `linkora-${username}-card.png`;
    link.href = card.toDataURL('image/png');
    link.click();
  };

  const whatsappShareHref = `https://wa.me/?text=${encodeURIComponent(
    `${displayName || username} — Official Links: ${publicUrl}`
  )}`;
  const xShareHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `Check out ${displayName || username}'s official page:`
  )}&url=${encodeURIComponent(publicUrl)}`;
  const linkedInShareHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    publicUrl
  )}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs overflow-y-auto"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl my-auto">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 id="qr-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
              QR & Share Studio
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customize your QR code, export a print-ready business card, or copy an embed badge
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share dialog"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code Display + Color Picker */}
        <div
          ref={qrWrapRef}
          className="flex flex-col items-center justify-center p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
        >
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <QRCodeCanvas
              value={publicUrl}
              size={180}
              bgColor="#FFFFFF"
              fgColor={qrColor}
              level="H"
              includeMargin={false}
            />
          </div>
          <p className="mt-3 text-xs font-mono text-slate-600 dark:text-slate-400 break-all text-center">
            {publicUrl}
          </p>

          {/* QR Swatches */}
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mr-1">
              QR Ink:
            </span>
            {QR_COLOR_SWATCHES.map((swatch) => {
              const active = qrColor === swatch.hex;
              return (
                <button
                  key={swatch.id}
                  type="button"
                  onClick={() => setQrColor(swatch.hex)}
                  aria-label={`Set QR ink color to ${swatch.label}`}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-500'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {swatch.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Actions */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="min-h-[40px] px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy URL'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadQr}
            className="min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>QR PNG</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadShareCard}
            className="min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Share Card</span>
          </button>

          <button
            type="button"
            onClick={handleNativeShare}
            className="min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>

        {/* Social Share Row & Website Embed Snippet */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Post to:</span>
            <a
              href={whatsappShareHref}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors whitespace-nowrap"
            >
              WhatsApp
            </a>
            <a
              href={xShareHref}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors whitespace-nowrap"
            >
              X / Post
            </a>
            <a
              href={linkedInShareHref}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors whitespace-nowrap"
            >
              LinkedIn
            </a>
          </div>

          <button
            type="button"
            onClick={handleCopyEmbed}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            {embedCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Code2 className="w-3.5 h-3.5" />}
            <span>{embedCopied ? 'HTML Copied' : 'Copy HTML Badge'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
