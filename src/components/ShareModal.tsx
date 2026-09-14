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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-[#faf6ed] border-2 border-[#e2d8c3] shadow-2xl p-6 overflow-hidden text-stone-950">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#ded5c0]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 border border-red-200 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-black font-rock text-stone-950 uppercase tracking-wide">
                Compartir con el Público
              </h3>
              <p className="text-xs text-stone-600">Muestra el QR a tus amigos para que voten</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 text-stone-600 hover:text-stone-950 flex items-center justify-center border border-[#ded5c0] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code Presentation Box */}
        <div className="mt-5 flex flex-col items-center">
          <div className="p-3 bg-white border-2 border-red-600 rounded-2xl shadow-xl ring-4 ring-red-100">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Código QR Votación COLAPSO"
                className="w-52 h-52 object-contain rounded-lg"
              />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-stone-500 text-xs">
                Generando QR...
              </div>
            )}
          </div>

          <p className="text-xs font-bold text-stone-800 mt-3 text-center flex items-center gap-1.5 font-rock uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-red-600" />
            Escanea con la cámara del celular para votar al instante
          </p>

          <button
            onClick={handleDownloadQr}
            className="mt-2 text-xs text-red-700 font-bold hover:underline flex items-center gap-1 font-rock uppercase tracking-wider cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Descargar código QR como imagen (PNG)
          </button>
        </div>

        {/* Share Message & Copy Box */}
        <div className="mt-5 p-3 rounded-xl bg-white border-2 border-[#ded5c0] text-xs shadow-xs">
          <span className="font-bold text-stone-900 block mb-1 font-rock uppercase tracking-wider">
            Mensaje para WhatsApp / Redes Sociales:
          </span>
          <p className="text-stone-800 italic bg-[#faf6ed] p-2.5 rounded-lg border border-[#ded5c0] select-all text-[11px] leading-relaxed">
            {shareMessage}
          </p>

          <div className="mt-3 flex gap-2">
            <button
              onClick={handleCopyLink}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer font-rock uppercase tracking-wider ${
                copied
                  ? 'bg-red-700 text-white shadow-md'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-950/20'
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
                className="py-2.5 px-3 rounded-xl text-xs font-bold bg-[#ebe3cf] border border-[#ded5c0] text-stone-900 hover:bg-[#ded5be] transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-rock uppercase tracking-wider"
                title="Compartir"
              >
                <Share2 className="w-4 h-4 text-red-700" />
                <span className="hidden sm:inline">Compartir</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
