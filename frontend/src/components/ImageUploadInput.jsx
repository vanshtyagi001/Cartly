import React, { useState, useRef } from 'react';

// Compress & convert an image File to a base64 JPEG data URL
export function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Please select image files only (JPEG, PNG, WebP).'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1200;
          let { width, height } = img;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } catch {
          reject(new Error(`Failed to compress ${file.name}.`));
        }
      };
      img.onerror = () => reject(new Error(`Invalid image format: ${file.name}.`));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error(`Error reading ${file.name} from disk.`));
    reader.readAsDataURL(file);
  });
}

export default function ImageUploadInput({
  value,
  onChange,
  presets = [],
  label = "Product Image",
}) {
  const [mode, setMode] = useState(value && !value.startsWith('data:') ? 'url' : 'file');
  const [urlInput, setUrlInput] = useState(value && !value.startsWith('data:') ? value : '');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const processFile = async (file) => {
    if (!file) return;
    setError(null);
    setIsProcessing(true);
    try {
      const compressed = await compressImageFile(file);
      onChange(compressed);
      setUrlInput('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleUrlApply = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setError('Please enter an image URL.');
      return;
    }
    setError(null);
    onChange(trimmed);
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isDataUrl = value && value.startsWith('data:');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500">
          {label} *
        </label>
        
        {/* Mode Switcher */}
        <div className="flex border border-stone-200 bg-[#FAF9F6] p-0.5">
          <button
            type="button"
            onClick={() => { setMode('file'); setError(null); }}
            className={`px-3 py-1 text-[10px] uppercase tracking-widest font-medium transition-colors ${
              mode === 'file'
                ? 'bg-stone-900 text-white'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => { setMode('url'); setError(null); }}
            className={`px-3 py-1 text-[10px] uppercase tracking-widest font-medium transition-colors ${
              mode === 'url'
                ? 'bg-stone-900 text-white'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            From URL
          </button>
        </div>
      </div>

      {error && (
        <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 px-3 py-2">
          {error}
        </div>
      )}

      {/* Mode 1: File Upload Dropzone */}
      {mode === 'file' && !value && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-stone-900 bg-stone-100'
              : 'border-stone-200 bg-[#FAF9F6] hover:border-stone-400 hover:bg-stone-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processFile(e.target.files[0]);
              }
            }}
          />

          <div className="flex flex-col items-center justify-center gap-2">
            <svg className="w-6 h-6 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs text-stone-700 font-medium">
              {isProcessing ? 'Processing image...' : 'Click to select or drag photo here'}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-stone-400">
              JPEG, PNG, WebP up to 10MB (auto-optimized)
            </p>
          </div>
        </div>
      )}

      {/* Mode 2: From URL Input */}
      {mode === 'url' && !value && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleUrlApply();
                }
              }}
              placeholder="https://images.unsplash.com/photo-..."
              className="flex-1 bg-[#FAF9F6] border border-stone-200 px-4 py-2.5 text-stone-900 text-xs focus:border-stone-900 focus:bg-white focus:outline-none"
            />
            <button
              type="button"
              onClick={handleUrlApply}
              className="px-5 py-2.5 bg-stone-900 text-white text-[10px] uppercase tracking-widest font-medium hover:bg-black transition-colors"
            >
              Load URL
            </button>
          </div>

          {presets.length > 0 && (
            <div>
              <span className="block text-[9px] uppercase tracking-widest text-stone-400 font-semibold mb-1.5">
                Quick Sample Photos:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setUrlInput(preset.url);
                      onChange(preset.url);
                    }}
                    className="text-[10px] uppercase tracking-wider px-2.5 py-1 border border-stone-200 bg-[#FAF9F6] text-stone-600 hover:border-stone-400 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Preview Panel */}
      {value && (
        <div className="flex items-center gap-4 p-3 bg-[#FAF9F6] border border-stone-200">
          <div className="w-16 h-16 bg-white border border-stone-200 flex-shrink-0 overflow-hidden relative">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={() => setError('Image failed to render. Please check the URL or try uploading a file.')}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] uppercase tracking-widest font-semibold px-1.5 py-0.5 bg-stone-200 text-stone-800">
                {isDataUrl ? 'Uploaded File' : 'Image URL'}
              </span>
              <span className="text-[11px] text-stone-600 truncate font-mono">
                {isDataUrl ? 'Local file processed' : value}
              </span>
            </div>
            <p className="text-[10px] text-stone-400">
              Ready to publish with this item.
            </p>
          </div>

          <div className="flex flex-col gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                if (mode === 'file') {
                  fileInputRef.current?.click();
                } else {
                  handleClear();
                }
              }}
              className="text-[10px] uppercase tracking-widest text-stone-700 hover:text-stone-900 underline"
            >
              Change
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="text-[10px] uppercase tracking-widest text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>

          {/* Hidden file input for Change button in file mode */}
          {mode === 'file' && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processFile(e.target.files[0]);
                }
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
