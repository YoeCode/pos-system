import React, { useRef, useState, useCallback } from 'react';
import { useI18n } from '../../i18n/useI18n';

interface ImageSectionProps {
  isEditing: boolean;
  image: string;
  onImageChange: (image: string) => void;
}

const ImageSection: React.FC<ImageSectionProps> = ({ isEditing, image, onImageChange }) => {
  const t = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) onImageChange(result);
    };
    reader.readAsDataURL(file);
  }, [onImageChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div>
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{t.products.detail.productImage}</p>
      {isEditing ? (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) processFile(file);
            }}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-xl h-32 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer ${
              isDragging
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border text-text-muted hover:border-primary hover:text-primary'
            }`}
          >
            {image ? (
              <div className="relative w-full h-full">
                <img src={image} alt="Product" className="w-full h-full object-contain rounded-xl" loading="lazy" />
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onImageChange('');
                  }}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-xs">{t.products.detail.clickOrDrag}</p>
              </>
            )}
          </div>
        </>
      ) : image ? (
        <div className="h-32 rounded-xl overflow-hidden bg-gray-100">
          <img src={image} alt="Product" className="w-full h-full object-contain" loading="lazy" />
        </div>
      ) : (
        <div className="h-32 rounded-xl border border-border bg-gray-50 flex items-center justify-center text-text-muted">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default ImageSection;
