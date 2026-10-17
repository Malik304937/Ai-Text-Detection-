import { extractTextFromImage } from './ocr';
import { OCRProgress } from '../types';

export interface FileExtractionResult {
  text: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  sourceType: 'upload_image' | 'upload_doc';
}

export async function extractTextFromFile(
  file: File,
  onProgress?: (progress: OCRProgress) => void
): Promise<FileExtractionResult> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const mimeType = file.type || '';

  // 1. Plain text files (.txt, .md, .csv, .json)
  if (
    extension === 'txt' ||
    extension === 'md' ||
    extension === 'rtf' ||
    extension === 'csv' ||
    mimeType.startsWith('text/')
  ) {
    onProgress?.({ status: 'Reading text file content...', progress: 0.5 });
    const text = await file.text();
    onProgress?.({ status: 'Done', progress: 1.0 });
    return {
      text: text.trim(),
      filename: file.name,
      fileSize: file.size,
      mimeType: file.type || 'text/plain',
      sourceType: 'upload_doc'
    };
  }

  // 2. Images (JPG, JPEG, PNG, WEBP, GIF, BMP)
  if (
    ['jpg', 'jpeg', 'png', 'webp', 'bmp'].includes(extension) ||
    mimeType.startsWith('image/')
  ) {
    onProgress?.({ status: 'Starting Optical Character Recognition (OCR)...', progress: 0.1 });
    const text = await extractTextFromImage(file, onProgress);
    return {
      text,
      filename: file.name,
      fileSize: file.size,
      mimeType: file.type || 'image/jpeg',
      sourceType: 'upload_image'
    };
  }

  // 3. Word Document (.docx) - Dynamically load mammoth
  if (extension === 'docx' || mimeType.includes('wordprocessingml')) {
    onProgress?.({ status: 'Loading DOCX parser engine...', progress: 0.2 });
    const mammoth = (await import('mammoth')).default;
    onProgress?.({ status: 'Parsing DOCX document structure...', progress: 0.6 });
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    onProgress?.({ status: 'DOCX text extracted', progress: 1.0 });
    return {
      text: result.value.trim(),
      filename: file.name,
      fileSize: file.size,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      sourceType: 'upload_doc'
    };
  }

  // 4. PDF (.pdf) - Dynamically load pdfjs-dist
  if (extension === 'pdf' || mimeType === 'application/pdf') {
    onProgress?.({ status: 'Loading PDF parsing engine...', progress: 0.15 });
    const pdfjsLib = await import('pdfjs-dist');
    
    try {
      if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      }
    } catch {}

    onProgress?.({ status: 'Reading PDF document pages...', progress: 0.3 });
    const arrayBuffer = await file.arrayBuffer();

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    let fullText = '';
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      onProgress?.({
        status: `Extracting page ${pageNum} of ${numPages}...`,
        progress: 0.3 + (pageNum / numPages) * 0.65
      });
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
      fullText += pageText + '\n\n';
    }

    onProgress?.({ status: 'PDF Extraction complete', progress: 1.0 });

    return {
      text: fullText.trim(),
      filename: file.name,
      fileSize: file.size,
      mimeType: 'application/pdf',
      sourceType: 'upload_doc'
    };
  }

  throw new Error(
    `Unsupported file format: .${extension}. Supported formats include: TXT, PDF, DOCX, JPG, PNG, WEBP.`
  );
}
