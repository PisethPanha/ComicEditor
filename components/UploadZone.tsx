import React, { useCallback, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Plus } from 'lucide-react';
import { ImageFile } from '../types';

interface UploadZoneProps {
  onImagesAdded: (images: ImageFile[]) => void;
  disabled?: boolean;
  compact?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onImagesAdded, disabled, compact }) => {
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = (files: FileList) => {
    const newImages: ImageFile[] = [];
    const maxFiles = 5;
    
    // Process only up to 5 files total (handled in parent usually, but good to check batch)
    const count = Math.min(files.length, maxFiles);

    let processedCount = 0;

    for (let i = 0; i < count; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64 = result.split(',')[1];
        
        newImages.push({
          file,
          previewUrl: result,
          base64
        });

        processedCount++;
        if (processedCount === count) {
          onImagesAdded(newImages);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [disabled, onImagesAdded]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  if (compact) {
    return (
      <div 
        className={`
            relative flex items-center justify-center w-full h-24 
            border-2 border-dashed rounded-lg transition-colors cursor-pointer
            ${isDragging ? 'border-blue-500 bg-slate-800' : 'border-slate-700 bg-slate-900/50 hover:border-blue-500 hover:bg-slate-800'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
            type="file" 
            accept="image/*" 
            multiple
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={disabled}
        />
        <div className="flex flex-col items-center text-slate-400">
            <Plus className="w-6 h-6" />
            <span className="text-xs font-medium mt-1">Add Comic</span>
        </div>
      </div>
    )
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative w-full min-h-[300px] flex flex-col items-center justify-center 
        border-2 border-dashed rounded-xl transition-all duration-300
        ${isDragging 
          ? 'border-blue-500 bg-slate-800 scale-[0.99]' 
          : 'border-slate-700 bg-slate-900 hover:border-slate-600 hover:bg-slate-800/80'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <input 
        type="file" 
        accept="image/*" 
        multiple
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={disabled}
      />
      
      <div className="flex flex-col items-center space-y-4 text-center p-6">
        <div className={`p-4 rounded-full ${isDragging ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
          {isDragging ? <UploadCloud className="w-10 h-10" /> : <ImageIcon className="w-10 h-10" />}
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold text-slate-200">
            {isDragging ? 'Drop comics here' : 'Upload Comic Strips'}
          </p>
          <p className="text-sm text-slate-400">
            Up to 5 files (JPG, PNG, WEBP)
          </p>
        </div>
      </div>
    </div>
  );
};