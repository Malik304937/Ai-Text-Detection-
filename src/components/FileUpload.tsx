import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  FileCode,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { extractTextFromFile } from '../utils/fileExtractors';
import { OCRProgress } from '../types';

interface FileUploadProps {
  onTextExtracted: (text: string, title?: string, source?: 'upload_image' | 'upload_doc') => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onTextExtracted }) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<OCRProgress>({ status: '', progress: 0 });
  const [extractedText, setExtractedText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<'upload_image' | 'upload_doc'>('upload_doc');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
  const ALLOWED_EXTENSIONS = ['txt', 'md', 'pdf', 'docx', 'jpg', 'jpeg', 'png', 'webp'];

  const validateAndProcessFile = async (file: File) => {
    setErrorMessage(null);
    setExtractedText('');

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setErrorMessage(
        `Unsupported file format: .${ext}. Please upload a PDF, DOCX, TXT, or Image (JPG, PNG, WEBP).`
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(
        `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). The maximum allowed size is 25MB.`
      );
      return;
    }

    setSelectedFile(file);

    // If it's an image, create a preview
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    // Process file automatically
    setIsProcessing(true);
    setProgress({ status: 'Starting file parsing...', progress: 0.1 });

    try {
      const result = await extractTextFromFile(file, (p) => setProgress(p));
      if (!result.text || result.text.trim().length === 0) {
        setErrorMessage(
          'No readable text was found in this file. If this is a scanned PDF or low-contrast image, please verify its clarity.'
        );
        setIsProcessing(false);
        return;
      }

      setExtractedText(result.text);
      setSourceType(result.sourceType);
    } catch (err: any) {
      console.error('File extraction error:', err);
      setErrorMessage(err.message || 'Failed to extract text from the file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setExtractedText('');
    setErrorMessage(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const wordCount = extractedText.trim() ? extractedText.trim().split(/\s+/).length : 0;

  const handleProceed = () => {
    if (!extractedText.trim()) return;
    onTextExtracted(
      extractedText,
      selectedFile ? selectedFile.name : 'Uploaded File',
      sourceType
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-indigo-400" />
            File & Document Uploader
          </h2>
          <p className="text-sm text-slate-400">
            Upload PDF research papers, Word documents (DOCX), plain text (TXT), or image screenshots
          </p>
        </div>

        {selectedFile && (
          <button
            onClick={handleRemove}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 text-slate-300 hover:text-rose-400 hover:bg-rose-950/40 border border-slate-700 transition-colors w-fit"
          >
            <X className="w-3.5 h-3.5" />
            Remove File
          </button>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-4 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-rose-200">Upload Issue</p>
            <p className="mt-0.5 text-rose-300/90">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Drag & Drop Area */}
      {!selectedFile && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-5 border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
              : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/70'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.pdf,.docx,image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 mx-auto">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-white mb-2">
            Drag & drop your document or image here
          </h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-5">
            Supports PDF, DOCX, TXT, MD, JPG, PNG, and WEBP files up to 25MB.
          </p>

          <button
            type="button"
            className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all"
          >
            Browse Files
          </button>

          <div className="flex items-center justify-center gap-6 mt-8 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" /> PDF & DOCX
            </span>
            <span className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-violet-400" /> Image OCR
            </span>
            <span className="flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-emerald-400" /> TXT & MD
            </span>
          </div>
        </div>
      )}

      {/* Processing Loader */}
      {isProcessing && (
        <div className="mt-5 rounded-2xl bg-slate-950 p-8 text-center border border-indigo-500/30">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4 mx-auto" />
          <h3 className="text-lg font-bold text-white mb-1">
            {progress.status || 'Extracting text...'}
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Parsing file structure and executing OCR if necessary
          </p>
          <div className="w-full max-w-md bg-slate-800 rounded-full h-2.5 overflow-hidden mx-auto mb-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.round(progress.progress * 100)}%` }}
            />
          </div>
          <span className="text-xs font-mono text-indigo-300">
            {Math.round(progress.progress * 100)}% Complete
          </span>
        </div>
      )}

      {/* Extracted Text Review Area */}
      {selectedFile && !isProcessing && extractedText && (
        <div className="mt-5 space-y-4">
          {/* File summary badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 gap-3">
            <div className="flex items-center gap-3">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="preview"
                  className="w-12 h-12 rounded-lg object-cover border border-slate-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <FileText className="w-5 h-5" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB • {wordCount} words extracted
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Extracted
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-white flex items-center gap-1.5">
                Review & Edit Extracted Text
                <span className="text-xs font-normal text-slate-400">
                  (Make sure formatting and text flow accurately reflect your document)
                </span>
              </label>
              <span className="text-xs font-mono text-slate-400">
                {wordCount} words • {extractedText.length} characters
              </span>
            </div>

            <textarea
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              rows={9}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm leading-relaxed"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              onClick={handleRemove}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Choose Another File
            </button>

            <button
              onClick={handleProceed}
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
  );
};
