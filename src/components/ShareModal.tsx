import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Download, Share2, Sparkles, QrCode } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  bandName?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  bandName = 'COLAPSO',
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0] : '';
  const shareMessage = `🔥 ¡Vota en vivo las canciones que tocará ${bandName} en su show! Entra aquí y decide qué tema sigue: ${currentUrl} 🎸🤘`;

  useEffect(() => {
    if (isOpen && currentUrl) {
      QRCode.toDataURL(currentUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#0f172a', // Deep slate for sharp scannability
          light: '#ffffff',
        },
      })
        .then((url) => {
          setQrDataUrl(url);
        })
        .catch(console.error);
    }
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareMessage);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${bandName} - Votación de Setlist en Vivo`,
          text: `🔥 ¡Vota en vivo las canciones que tocará ${bandName} en su show! Decide qué tema sigue 🎸🤘`,
          url: currentUrl,
        });
      } catch (e) {
        // User aborted or unhandled
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `QR-Votacion-${bandName}.png`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-black font-rock text-slate-900 uppercase tracking-wide">
                Compartir con el Público
              </h3>
              <p className="text-xs text-slate-500">Muestra el QR a tus amigos para que voten</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code Presentation Box */}
        <div className="mt-5 flex flex-col items-center">
          <div className="p-3 bg-white border-2 border-emerald-500/30 rounded-2xl shadow-md ring-4 ring-emerald-50">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Código QR Votación COLAPSO"
                className="w-52 h-52 object-contain rounded-lg"
              />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs">
                Generando QR...
              </div>
            )}
          </div>

          <p className="text-xs font-semibold text-slate-600 mt-3 text-center flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Escanea con la cámara del celular para votar al instante
          </p>

          <button
            onClick={handleDownloadQr}
            className="mt-2 text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            Descargar código QR como imagen (PNG)
          </button>
        </div>

        {/* Share Message & Copy Box */}
        <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <span className="font-bold text-slate-700 block mb-1">
            Mensaje para WhatsApp / Redes Sociales:
          </span>
          <p className="text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200 select-all text-[11px] leading-relaxed">
            {shareMessage}
          </p>

          <div className="mt-3 flex gap-2">
            <button
              onClick={handleCopyLink}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                copied
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Mensaje y link copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar al portapapeles</span>
                </>
              )}
            </button>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className="py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                title="Compartir"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Compartir</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
