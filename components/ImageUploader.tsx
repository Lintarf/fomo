import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UploadIcon, SpinnerIcon } from './Icons';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  isLoading: boolean;
  isTradingMode?: boolean; // NEW PROP
  preview?: string | null; // NEW PROP
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, isLoading, isTradingMode = true, preview }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File terlalu besar. Maksimal 10MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const result = reader.result as string;
          onImageSelect(file);
        } catch (error) {
          console.error('Error processing image file:', error);
          alert('Gagal memproses file gambar. Silakan coba file lain.');
        }
      };
      reader.onerror = () => {
        console.error('Error reading image file');
        alert('Gagal membaca file gambar. Silakan coba file lain.');
      };
      reader.readAsDataURL(file);
    } else {
      alert('File harus berupa gambar (PNG, JPEG, atau WebP).');
    }
  }, [onImageSelect]);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const handlePaste = useCallback((event: ClipboardEvent) => {
    if (isLoading || !inputRef.current) return;

    const items = event.clipboardData?.items;
    if (!items) return;

    const imageFile = Array.from(items).find(item => item.kind === 'file' && item.type.startsWith('image/'))?.getAsFile();
    
    if (imageFile) {
        event.preventDefault();
        handleFile(imageFile);
    }
  }, [isLoading, handleFile]);

  useEffect(() => {
    if (!isTradingMode) return;
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste, isTradingMode]);

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`relative flex items-center justify-center w-full h-96 p-4 border-2 border-dashed rounded-lg transition-colors duration-200 ${
        dragActive 
        ? 'border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-900/20' 
        : `border-slate-300 dark:border-slate-600 ${!preview && 'bg-white dark:bg-slate-800'}`
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleChange}
        disabled={isLoading}
      />
      {preview ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={preview}
            className={isLoading ? "w-full h-full object-contain blur-sm opacity-70 transition-all" : "w-full h-full object-contain transition-all"}
            alt="Chart Preview"
            style={{ maxHeight: 320, maxWidth: '100%' }}
          />
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/60 z-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500 mb-2" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">Analyzing Chart...</span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center">
          <UploadIcon className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" />
          <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">Upload Chart Image</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Drag &amp; drop, paste from clipboard, or click to browse</p>
          <button
            type="button"
            onClick={onButtonClick}
            disabled={isLoading}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:bg-slate-400"
          >
            <UploadIcon className="-ml-1 mr-2 h-5 w-5" />
            Select Image
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;