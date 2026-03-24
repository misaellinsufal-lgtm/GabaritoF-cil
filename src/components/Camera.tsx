import React, { useRef, useEffect, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { Camera as CameraIcon, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

interface CameraProps {
  onQRCodeFound: (data: string) => void;
  onCapture: (imageDataUrl: string) => void;
  isScanningQR: boolean;
}

export function Camera({ onQRCodeFound, onCapture, isScanningQR }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true'); // required to tell iOS safari we don't want fullscreen
          await videoRef.current.play();
          setHasCamera(true);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setHasCamera(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!isScanningQR) return;

    let animationFrameId: number;
    
    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        
        if (canvas && video) {
          // Use a smaller canvas for QR scanning to improve performance
          const scanWidth = 640;
          const scanHeight = (video.videoHeight / video.videoWidth) * scanWidth;
          
          canvas.width = scanWidth;
          canvas.height = scanHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          
          if (ctx) {
            ctx.drawImage(video, 0, 0, scanWidth, scanHeight);
            const imageData = ctx.getImageData(0, 0, scanWidth, scanHeight);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            
            if (code) {
              onQRCodeFound(code.data);
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [isScanningQR, onQRCodeFound]);

  const handleCapture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(dataUrl);
      }
    }
  }, [onCapture]);

  if (hasCamera === false) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300">
        <XCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-700 text-center font-medium">Não foi possível acessar a câmera.</p>
        <p className="text-sm text-gray-500 text-center mt-2">Verifique as permissões do navegador.</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden bg-black shadow-lg">
      <video
        ref={videoRef}
        className="w-full h-auto object-cover max-h-[60vh]"
        muted
        playsInline
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Overlay UI */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
        <div className="p-4 bg-gradient-to-b from-black/60 to-transparent">
          <p className="text-white text-center font-medium drop-shadow-md">
            {isScanningQR ? "Aponte para o QR Code do gabarito" : "Alinhe a folha e capture"}
          </p>
        </div>
        
        {isScanningQR && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-white/50 rounded-lg relative">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-400"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-400"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-400"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-400"></div>
              {/* Scanning line animation */}
              <div className="absolute top-0 left-0 w-full h-0.5 bg-green-400 shadow-[0_0_8px_2px_rgba(74,222,128,0.5)] animate-[scan_2s_ease-in-out_infinite]"></div>
            </div>
          </div>
        )}

        {!isScanningQR && (
          <div className="p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center pointer-events-auto">
            <button
              onClick={handleCapture}
              className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all shadow-xl"
            >
              <div className="w-12 h-12 bg-white rounded-full border border-gray-200"></div>
            </button>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0; }
          10%, 90% { opacity: 1; }
          50% { top: 100%; }
        }
      `}</style>
    </div>
  );
}
