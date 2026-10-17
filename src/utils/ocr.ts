import { createWorker } from 'tesseract.js';
import { OCRProgress } from '../types';

let activeWorker: any = null;

export async function extractTextFromImage(
  imageSource: string | File | Blob | HTMLCanvasElement,
  onProgress?: (progress: OCRProgress) => void
): Promise<string> {
  let worker: any = null;
  try {
    onProgress?.({ status: 'Initializing OCR Engine...', progress: 0.1 });

    worker = await createWorker('eng');
    activeWorker = worker;

    onProgress?.({ status: 'Processing image & analyzing character layout...', progress: 0.3 });

    // Preprocessing if it's a canvas or blob
    let finalSource: any = imageSource;
    if (imageSource instanceof HTMLCanvasElement) {
      finalSource = imageSource.toDataURL('image/png');
    }

    const ret = await worker.recognize(finalSource);

    onProgress?.({ status: 'Finalizing text extraction...', progress: 0.95 });

    const text = ret.data.text ? ret.data.text.trim() : '';

    onProgress?.({ status: 'OCR Complete', progress: 1.0 });

    return text;
  } catch (error: any) {
    console.error('Tesseract OCR error:', error);
    throw new Error(error?.message || 'Failed to extract text from the image. Please verify image clarity and lighting.');
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (termErr) {
        // ignore termination issues
      }
      if (activeWorker === worker) {
        activeWorker = null;
      }
    }
  }
}

export async function cancelActiveOCR(): Promise<void> {
  if (activeWorker) {
    try {
      await activeWorker.terminate();
    } catch {}
    activeWorker = null;
  }
}
