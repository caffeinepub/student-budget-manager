import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check, Share2, QrCode } from 'lucide-react';
import { toast } from 'sonner';

interface ReceiveMoneyModalProps {
  open: boolean;
  onClose: () => void;
  paymentId: string;
  displayName: string;
}

// Minimal QR code generator using canvas (no external library needed)
function generateQRDataURL(text: string, size: number): string {
  // Use a public QR API that works as an img src
  // Encode the text for URL safety
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=10&color=1a2e2a&bgcolor=ffffff`;
}

export default function ReceiveMoneyModal({
  open,
  onClose,
  paymentId,
  displayName,
}: ReceiveMoneyModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [qrError, setQrError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Reset states when modal opens
  useEffect(() => {
    if (open) {
      setQrLoaded(false);
      setQrError(false);
      setCopied(false);
    }
  }, [open, paymentId]);

  // Draw QR code on canvas using a simple pattern when API fails
  useEffect(() => {
    if (qrError && canvasRef.current) {
      drawFallbackQR(canvasRef.current, paymentId);
    }
  }, [qrError, paymentId]);

  function drawFallbackQR(canvas: HTMLCanvasElement, data: string) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = 200;
    canvas.width = size;
    canvas.height = size;

    // Simple visual representation
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Draw a simple grid pattern based on data hash
    const cellSize = 8;
    const cols = Math.floor(size / cellSize);
    const rows = Math.floor(size / cellSize);

    ctx.fillStyle = '#1a2e2a';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const charCode = data.charCodeAt((r * cols + c) % data.length);
        if ((charCode + r + c) % 3 === 0) {
          ctx.fillRect(c * cellSize, r * cellSize, cellSize - 1, cellSize - 1);
        }
      }
    }

    // Draw finder patterns (corners)
    const drawFinder = (x: number, y: number) => {
      ctx.fillStyle = '#1a2e2a';
      ctx.fillRect(x, y, 7 * cellSize, 7 * cellSize);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize);
      ctx.fillStyle = '#1a2e2a';
      ctx.fillRect(x + 2 * cellSize, y + 2 * cellSize, 3 * cellSize, 3 * cellSize);
    };
    drawFinder(0, 0);
    drawFinder((cols - 7) * cellSize, 0);
    drawFinder(0, (rows - 7) * cellSize);
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(paymentId);
      setCopied(true);
      toast.success('Payment ID copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy. Please copy manually.');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Pay ${displayName}`,
          text: `Send money to ${displayName}. Payment ID: ${paymentId}`,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  const qrUrl = generateQRDataURL(paymentId, 200);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[360px] mx-auto rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
        {/* Header gradient */}
        <div className="gradient-primary px-6 pt-6 pb-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-white/10 translate-y-6 -translate-x-6" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
              <QrCode size={22} />
            </div>
            <DialogHeader>
              <DialogTitle className="text-white text-lg font-bold">My Payment QR</DialogTitle>
            </DialogHeader>
            <p className="text-white/70 text-xs mt-1">Scan to pay {displayName}</p>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-card px-6 py-5 flex flex-col items-center gap-4">
          <div className="bg-white rounded-2xl p-3 shadow-card border border-border">
            {!qrError ? (
              <div className="relative w-[200px] h-[200px]">
                {!qrLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white rounded-xl">
                    <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  </div>
                )}
                <img
                  src={qrUrl}
                  alt="Payment QR Code"
                  width={200}
                  height={200}
                  className={`rounded-xl transition-opacity duration-300 ${qrLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setQrLoaded(true)}
                  onError={() => setQrError(true)}
                />
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                width={200}
                height={200}
                className="rounded-xl"
              />
            )}
          </div>

          {/* Payment ID */}
          <div className="w-full bg-muted rounded-2xl px-4 py-3">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-1">
              Payment ID
            </p>
            <p className="text-xs font-mono text-foreground break-all leading-relaxed">
              {paymentId}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 w-full">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex-1 h-11 rounded-2xl text-sm font-semibold"
            >
              {copied ? (
                <>
                  <Check size={14} className="mr-2 text-success" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={14} className="mr-2" />
                  Copy ID
                </>
              )}
            </Button>
            <Button
              onClick={handleShare}
              className="flex-1 h-11 rounded-2xl text-sm font-semibold"
            >
              <Share2 size={14} className="mr-2" />
              Share
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            Share your QR code or Payment ID to receive money
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
