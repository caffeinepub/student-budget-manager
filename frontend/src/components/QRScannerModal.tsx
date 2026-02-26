import { useEffect } from 'react';
import { useQRScanner } from '../qr-code/useQRScanner';
import { Button } from '@/components/ui/button';
import { X, Camera, CameraOff, RefreshCw, SwitchCamera, Loader2 } from 'lucide-react';

interface QRScannerModalProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export default function QRScannerModal({ onScan, onClose }: QRScannerModalProps) {
  const {
    qrResults,
    isScanning,
    isActive,
    isSupported,
    error,
    isLoading,
    canStartScanning,
    startScanning,
    stopScanning,
    switchCamera,
    videoRef,
    canvasRef,
  } = useQRScanner({
    facingMode: 'environment',
    scanInterval: 150,
    maxResults: 1,
  });

  // Auto-start scanning when modal opens
  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle scan result
  useEffect(() => {
    if (qrResults.length > 0) {
      const latest = qrResults[0];
      onScan(latest.data);
    }
  }, [qrResults, onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm">
        <div>
          <h2 className="text-white font-bold text-base">Scan QR Code</h2>
          <p className="text-white/60 text-xs">Point camera at a payment QR code</p>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Camera Preview */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        {/* Video element */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          style={{ minHeight: '200px' }}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanning overlay */}
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Dimmed corners */}
            <div className="absolute inset-0 bg-black/40" />
            {/* Scan frame */}
            <div className="relative w-64 h-64">
              {/* Clear center */}
              <div className="absolute inset-0 bg-transparent" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }} />
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
              {/* Scan line animation */}
              {isScanning && (
                <div
                  className="absolute left-2 right-2 h-0.5 bg-primary opacity-80"
                  style={{
                    animation: 'scanLine 2s ease-in-out infinite',
                    top: '50%',
                  }}
                />
              )}
            </div>
            {/* Status text */}
            <div className="absolute bottom-24 left-0 right-0 flex justify-center">
              <div className="bg-black/60 backdrop-blur-sm rounded-full px-4 py-2">
                <p className="text-white text-xs font-medium">
                  {isScanning ? '🔍 Scanning...' : 'Camera ready'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && !isActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
            <Loader2 size={40} className="text-primary animate-spin mb-3" />
            <p className="text-white text-sm">Starting camera...</p>
          </div>
        )}

        {/* Not supported */}
        {isSupported === false && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 px-6 text-center">
            <CameraOff size={48} className="text-white/40 mb-4" />
            <p className="text-white font-semibold mb-2">Camera Not Supported</p>
            <p className="text-white/60 text-sm">Your browser doesn't support camera access.</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 px-6 text-center">
            <Camera size={48} className="text-red-400 mb-4" />
            <p className="text-white font-semibold mb-2">Camera Error</p>
            <p className="text-white/60 text-sm mb-4">{error.message}</p>
            <Button
              onClick={() => startScanning()}
              variant="outline"
              size="sm"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <RefreshCw size={14} className="mr-2" />
              Try Again
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-black/80 backdrop-blur-sm px-4 py-4 flex items-center justify-center gap-3">
        {!isActive && !isLoading && !error && isSupported !== false && (
          <Button
            onClick={() => startScanning()}
            disabled={!canStartScanning}
            className="flex-1 h-12 rounded-2xl font-semibold"
          >
            <Camera size={16} className="mr-2" />
            Start Camera
          </Button>
        )}
        {isActive && (
          <>
            {isMobile && (
              <Button
                onClick={() => switchCamera()}
                disabled={isLoading}
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-2xl border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                <SwitchCamera size={18} />
              </Button>
            )}
            <Button
              onClick={() => stopScanning()}
              variant="outline"
              className="flex-1 h-12 rounded-2xl border-white/20 text-white hover:bg-white/10 bg-transparent font-semibold"
            >
              <CameraOff size={16} className="mr-2" />
              Stop
            </Button>
          </>
        )}
      </div>

      <style>{`
        @keyframes scanLine {
          0% { transform: translateY(-120px); }
          50% { transform: translateY(120px); }
          100% { transform: translateY(-120px); }
        }
      `}</style>
    </div>
  );
}
