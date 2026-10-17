import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Play,
  Square,
  RefreshCw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
  SwitchCamera,
  FileText,
  HelpCircle,
  Eye,
  Loader2
} from 'lucide-react';
import { extractTextFromImage, cancelActiveOCR } from '../utils/ocr';
import { OCRProgress } from '../types';

interface CameraScannerProps {
  onTextExtracted: (text: string, title?: string) => void;
}

type CameraState = 'idle' | 'streaming' | 'captured' | 'scanning_ocr';

export const CameraScanner: React.FC<CameraScannerProps> = ({ onTextExtracted }) => {
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState<OCRProgress>({ status: '', progress: 0 });
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [isEditableReview, setIsEditableReview] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (cameraState === 'streaming') {
      setCameraState('idle');
    }
  }, [cameraState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      cancelActiveOCR();
    };
  }, [stopCamera]);

  // Enumerate devices to check if multiple cameras exist
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const videoDevs = devices.filter((d) => d.kind === 'videoinput');
          setAvailableDevices(videoDevs);
        })
        .catch(() => {});
    }
  }, []);

  // Start Camera
  const startCamera = async (targetFacing = facingMode) => {
    setErrorMessage(null);
    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Your browser does not support camera access via MediaDevices API.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setCameraState('streaming');
    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage(
          'Camera permission was denied. Please click the camera/lock icon in your browser address bar to allow camera access.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera hardware was detected on this device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setErrorMessage('Camera is currently in use by another application or browser tab.');
      } else {
        setErrorMessage(err.message || 'Unable to access the camera.');
      }
      setCameraState('idle');
    }
  };

  // Flip front/back camera
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (cameraState === 'streaming') {
      startCamera(nextMode);
    }
  };

  // Capture Photo
  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImageUrl(dataUrl);

    // Pause video stream or leave track running for quick retake
    setCameraState('captured');
    setErrorMessage(null);
  };

  // Retake Photo
  const retakePhoto = () => {
    setCapturedImageUrl(null);
    setExtractedText('');
    setIsEditableReview(false);
    setErrorMessage(null);
    setCameraState('streaming');
    if (videoRef.current && mediaStreamRef.current) {
      videoRef.current.play().catch(() => {});
    } else {
      startCamera();
    }
  };

  // Scan Text from Captured Photo
  const scanText = async () => {
    if (!capturedImageUrl && !canvasRef.current) return;

    setCameraState('scanning_ocr');
    setErrorMessage(null);
    setOcrProgress({ status: 'Starting Optical Character Recognition...', progress: 0.1 });

    try {
      const source = canvasRef.current || capturedImageUrl!;
      const text = await extractTextFromImage(source, (progress) => {
        setOcrProgress(progress);
      });

      if (!text || text.trim().length === 0) {
        setErrorMessage(
          'No readable text could be recognized. The photo might be blurry, underexposed, or the font may be indistinct. Please retake with better lighting.'
        );
        setCameraState('captured');
        return;
      }

      setExtractedText(text);
      setIsEditableReview(true);
      setCameraState('captured');
      // Stop the hardware camera now to save battery and privacy
      stopCamera();
    } catch (err: any) {
      setErrorMessage(err.message || 'OCR extraction failed. Please try capturing again.');
      setCameraState('captured');
    }
  };

  // Handle final submission to analysis
  const handleProceedToAnalysis = () => {
    if (!extractedText.trim()) {
      setErrorMessage('Please ensure there is text to analyze.');
      return;
    }
    onTextExtracted(extractedText, 'Live Camera Capture');
  };

  const wordCount = extractedText.trim() ? extractedText.trim().split(/\s+/).length : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-400" />
            Live Camera Optical Scanner
          </h2>
          <p className="text-sm text-slate-400">
            Scan physical printed pages, books, essays, or display screens with instant OCR
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {cameraState === 'idle' && (
            <button
              onClick={() => startCamera()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-600/25 transition-all active:scale-95"
            >
              <Play className="w-4 h-4" />
              Start Camera
            </button>
          )}

          {cameraState === 'streaming' && (
            <>
              {availableDevices.length > 1 && (
                <button
                  onClick={toggleFacingMode}
                  title="Switch camera"
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  <SwitchCamera className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={capturePhoto}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                <Camera className="w-4 h-4" />
                Capture Photo
              </button>

              <button
                onClick={stopCamera}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl font-medium text-sm bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700 transition-colors"
              >
                <Square className="w-4 h-4" />
                Stop Camera
              </button>
            </>
          )}

          {cameraState === 'captured' && (
            <>
              <button
                onClick={retakePhoto}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retake Photo
              </button>

              {!isEditableReview && (
                <button
                  onClick={scanText}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-md shadow-indigo-600/25 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Scan Text
                </button>
              )}

              <button
                onClick={stopCamera}
                className="px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-200"
              >
                Close Camera
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mt-4 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-rose-200">Camera or Scanning Notice</p>
            <p className="mt-0.5 text-rose-300/90">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <div className="mt-5">
        {cameraState === 'idle' && (
          <div className="border-2 border-dashed border-slate-800 rounded-2xl p-8 sm:p-12 text-center bg-slate-950/40 flex flex-col items-center justify-center min-h-[340px]">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Live Camera Text Scanner</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              Grant camera access to aim at books, printouts, or screens. Take a still snapshot, extract text cleanly with OCR, correct any words, and run forensic stylometric detection.
            </p>
            <button
              onClick={() => startCamera()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <Play className="w-4 h-4" />
              Launch Camera Scanner
            </button>
            <p className="text-xs text-slate-400 mt-4">
              Camera frames are processed in-browser. Zero continuous frame uploads.
            </p>
          </div>
        )}

        {/* Live Streaming Video */}
        <div className={`relative rounded-2xl overflow-hidden bg-black ${cameraState === 'streaming' ? 'block' : 'hidden'}`}>
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-auto max-h-[520px] object-contain mx-auto"
          />

          {/* Alignment Target Frame Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
            <div className="w-full max-w-xl h-3/4 border-2 border-indigo-400/60 rounded-xl relative shadow-2xl">
              <div className="absolute top-2 left-2 px-2.5 py-1 rounded bg-black/70 text-[11px] font-mono text-indigo-300">
                ALIGN DOCUMENT HERE
              </div>
              {/* Corner accents */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-indigo-400" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-indigo-400" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-indigo-400" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-indigo-400" />
            </div>
          </div>

          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
            <button
              onClick={capturePhoto}
              className="px-6 py-3 rounded-xl bg-white text-slate-900 font-bold text-sm shadow-xl hover:bg-slate-100 flex items-center gap-2 active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4 text-indigo-600" />
              Capture Still Image
            </button>
          </div>
        </div>

        {/* OCR Scanning Progress Screen */}
        {cameraState === 'scanning_ocr' && (
          <div className="rounded-2xl bg-slate-950 p-8 sm:p-12 text-center border border-indigo-500/30 flex flex-col items-center justify-center min-h-[340px]">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Analyzing Image Characters...</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
              {ocrProgress.status || 'Extracting readable text with high-precision neural OCR...'}
            </p>
            <div className="w-full max-w-md bg-slate-800 rounded-full h-2.5 overflow-hidden mb-2">
              <div
                className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.round(ocrProgress.progress * 100)}%` }}
              />
            </div>
            <span className="text-xs font-mono text-indigo-300">
              {Math.round(ocrProgress.progress * 100)}% Complete
            </span>
          </div>
        )}

        {/* Captured Still Preview & OCR Review Flow */}
        {cameraState === 'captured' && capturedImageUrl && !isEditableReview && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="rounded-xl overflow-hidden border border-slate-700 bg-black flex items-center justify-center">
              <img
                src={capturedImageUrl}
                alt="Captured still"
                className="max-h-[380px] w-auto object-contain"
              />
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Image Captured Successfully
                </h4>
                <p className="text-xs text-slate-400">
                  Verify that text is sharp and readable. If it is blurry or angled poorly, click Retake Photo.
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={scanText}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Scan Text with OCR
                </button>

                <button
                  onClick={retakePhoto}
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retake Photo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Editable OCR Text Review */}
        {isEditableReview && (
          <div className="mt-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-bold text-white">Extracted Text Review</span>
                <span className="text-xs text-slate-400">
                  (Correct any OCR typos before forensic analysis)
                </span>
              </div>
              <div className="text-xs font-mono text-slate-400">
                {wordCount} words • {extractedText.length} characters
              </div>
            </div>

            <textarea
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              rows={8}
              placeholder="Extracted text will appear here. Edit or correct any words before scanning..."
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm leading-relaxed"
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                onClick={retakePhoto}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Discard & Rescan
              </button>

              <button
                onClick={handleProceedToAnalysis}
                disabled={wordCount === 0}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Proceed to AI Detection ({wordCount} words)
              </button>
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
