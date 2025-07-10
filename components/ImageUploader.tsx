import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UploadIcon, SpinnerIcon } from './Icons';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  isLoading: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onImageSelect(file);
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
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

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
        <div className="w-full h-full relative">
            <img src={preview} alt="Chart preview" className="object-contain w-full h-full rounded-md" />
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg">
                <SpinnerIcon className="w-16 h-16 text-violet-600 dark:text-violet-400" />
                <p className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-100">Analyzing Chart...</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">This may take a moment.</p>
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