import React, { useState, useRef } from 'react';
import ImageUploadInput, { compressImageFile } from './ImageUploadInput';

export default function ProductImagesInput({
  img = '',
  images = [],
  onChange,
  presets = [],
  maxImages = 6,
}) {
  const [isAddingExtra, setIsAddingExtra] = useState(false);
  const [extraMode, setExtraMode] = useState('file'); // 'file' | 'url'
  const [extraUrlInput, setExtraUrlInput] = useState('');
  const [isDraggingExtra, setIsDraggingExtra] = useState(false);
  const [isProcessingMulti, setIsProcessingMulti] = useState(false);
  const [extraError, setExtraError] = useState('');
  const multiFileInputRef = useRef(null);

  // Derive extra gallery images (excluding featured img)
  const extraImages = (Array.isArray(images) ? images : []).filter(
    (url) => url && url.trim() !== '' && url !== img
  );
  const totalCount = (img ? 1 : 0) + extraImages.length;
  const remainingSlots = Math.max(0, maxImages - totalCount);

  const emitChange = (nextFeatured, nextExtras) => {
    const cleanFeatured = (nextFeatured || '').trim();
    const cleanExtras = nextExtras.filter((u) => u && u.trim() !== '' && u !== cleanFeatured);
    const combined = cleanFeatured ? [cleanFeatured, ...cleanExtras] : cleanExtras;
    onChange({
      img: cleanFeatured,
      images: combined,
    });
  };

  const handleFeaturedChange = (newUrl) => {
    emitChange(newUrl, extraImages);
  };

  const handleMultiFileSelect = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setExtraError('');

    if (remainingSlots <= 0) {
      setExtraError(`Maximum of ${maxImages} total images reached.`);
      return;
    }

    const files = Array.from(fileList).slice(0, remainingSlots);
    if (fileList.length > remainingSlots) {
      setExtraError(`Only ${remainingSlots} more image(s) allowed (max ${maxImages} total). Added the first ${remainingSlots}.`);
    }

    setIsProcessingMulti(true);
    try {
      const results = await Promise.allSettled(files.map((f) => compressImageFile(f)));
      const validUrls = [];
      const errors = [];

      for (const res of results) {
        if (res.status === 'fulfilled' && res.value) {
          if (res.value !== img && !extraImages.includes(res.value) && !validUrls.includes(res.value)) {
            validUrls.push(res.value);
          }
        } else if (res.status === 'rejected') {
          errors.push(res.reason?.message || 'Failed to process an image.');
        }
      }

      if (errors.length > 0 && validUrls.length === 0) {
        setExtraError(errors[0]);
      } else if (validUrls.length > 0) {
        emitChange(img, [...extraImages, ...validUrls]);
        if (errors.length === 0 && fileList.length <= remainingSlots) {
          setIsAddingExtra(false);
        }
      }
    } finally {
      setIsProcessingMulti(false);
      if (multiFileInputRef.current) multiFileInputRef.current.value = '';
    }
  };

  const handleAddExtraUrl = (urlToAdd) => {
    const trimmed = (urlToAdd || extraUrlInput).trim();
    if (!trimmed) {
      setExtraError('Please enter an image URL.');
      return;
    }
    if (remainingSlots <= 0) {
      setExtraError(`Maximum of ${maxImages} total images reached.`);
      return;
    }
    if (trimmed === img || extraImages.includes(trimmed)) {
      setExtraError('This image is already added to the product.');
      return;
    }
    setExtraError('');
    emitChange(img, [...extraImages, trimmed]);
    setExtraUrlInput('');
  };

  const handleRemoveExtra = (indexToRemove) => {
    const updated = extraImages.filter((_, idx) => idx !== indexToRemove);
    emitChange(img, updated);
    setExtraError('');
  };

  const handleSetAsFeatured = (indexToPromote) => {
    const promoted = extraImages[indexToPromote];
    if (!promoted) return;
    const remaining = extraImages.filter((_, idx) => idx !== indexToPromote);
    if (img) {
      remaining.unshift(img);
    }
    emitChange(promoted, remaining);
  };

  return (
    <div className="space-y-5">
      {/* 1. Compulsory Featured Image */}
      <div className="p-4 bg-[#FAF9F6] border border-stone-200 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-stone-800">
            1. Featured Image (Compulsory) *
          </span>
          <span className="text-[9px] uppercase tracking-wider font-medium px-2 py-0.5 bg-stone-900 text-white">
            Shop Thumbnail
          </span>
        </div>
        <p className="text-[11px] text-stone-500 mb-2">
          This primary image is required and appears as the thumbnail on <span className="font-mono text-stone-700">/shop</span>, in search results, and in cart previews.
        </p>

        <ImageUploadInput
          value={img}
          onChange={handleFeaturedChange}
          presets={presets}
          label="Featured Thumbnail"
        />
      </div>

      {/* 2. Optional Additional Gallery Images (Multi-upload supported) */}
      <div className="p-4 bg-white border border-stone-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-stone-700 block">
              2. Additional Product Photos (Optional)
            </span>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Select or drag multiple photos at once ({totalCount}/{maxImages} total photos).
            </p>
          </div>

          {!isAddingExtra && remainingSlots > 0 && (
            <button
              type="button"
              onClick={() => {
                setIsAddingExtra(true);
                setExtraError('');
              }}
              className="text-[10px] uppercase tracking-widest font-semibold px-3.5 py-2 border border-stone-300 bg-[#FAF9F6] hover:bg-stone-900 hover:text-white hover:border-stone-900 text-stone-800 transition-colors"
            >
              + Add Gallery Images
            </button>
          )}
        </div>

        {/* Grid of existing extra images */}
        {extraImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {extraImages.map((url, idx) => (
              <div
                key={`${url.slice(0, 30)}-${idx}`}
                className="border border-stone-200 bg-[#FAF9F6] p-2 flex flex-col gap-2"
              >
                <div className="aspect-square bg-white border border-stone-200 overflow-hidden relative">
                  <img
                    src={url}
                    alt={`Gallery ${idx + 2}`}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1.5 left-1.5 bg-white/90 text-stone-700 text-[9px] uppercase tracking-wider px-1.5 py-0.5 border border-stone-200 font-medium">
                    Photo #{idx + 2}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1 text-[9px] uppercase tracking-wider font-medium">
                  <button
                    type="button"
                    onClick={() => handleSetAsFeatured(idx)}
                    className="text-stone-700 hover:text-stone-900 underline truncate"
                    title="Promote to compulsory featured thumbnail"
                  >
                    Make Featured
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveExtra(idx)}
                    className="text-red-600 hover:text-red-800 shrink-0"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Multi-Image Uploader Panel */}
        {isAddingExtra && remainingSlots > 0 && (
          <div className="p-4 bg-[#FAF9F6] border border-stone-300 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-700">
                Add Up to {remainingSlots} More Photo{remainingSlots > 1 ? 's' : ''}
              </span>

              <div className="flex items-center gap-3">
                <div className="flex border border-stone-200 bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => { setExtraMode('file'); setExtraError(''); }}
                    className={`px-2.5 py-1 text-[9px] uppercase tracking-widest font-medium transition-colors ${
                      extraMode === 'file' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    Upload Files
                  </button>
                  <button
                    type="button"
                    onClick={() => { setExtraMode('url'); setExtraError(''); }}
                    className={`px-2.5 py-1 text-[9px] uppercase tracking-widest font-medium transition-colors ${
                      extraMode === 'url' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    From URL
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => { setIsAddingExtra(false); setExtraError(''); }}
                  className="text-[10px] uppercase tracking-widest text-stone-500 hover:text-stone-900"
                >
                  Done
                </button>
              </div>
            </div>

            {extraError && (
              <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 px-3 py-2">
                {extraError}
              </div>
            )}

            {extraMode === 'file' ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingExtra(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDraggingExtra(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingExtra(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleMultiFileSelect(e.dataTransfer.files);
                  }
                }}
                onClick={() => multiFileInputRef.current?.click()}
                className={`border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                  isDraggingExtra
                    ? 'border-stone-900 bg-stone-100'
                    : 'border-stone-200 bg-white hover:border-stone-400 hover:bg-stone-50'
                }`}
              >
                <input
                  ref={multiFileInputRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleMultiFileSelect(e.target.files);
                    }
                  }}
                />

                <div className="flex flex-col items-center justify-center gap-2">
                  <svg className="w-6 h-6 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs text-stone-700 font-medium">
                    {isProcessingMulti
                      ? 'Optimizing & adding selected images...'
                      : 'Click to select multiple photos or drag & drop them here'}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-stone-400">
                    Select multiple JPEG, PNG, WebP files at once
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={extraUrlInput}
                    onChange={(e) => {
                      setExtraUrlInput(e.target.value);
                      if (extraError) setExtraError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddExtraUrl();
                      }
                    }}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 bg-white border border-stone-200 px-4 py-2.5 text-stone-900 text-xs focus:border-stone-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddExtraUrl()}
                    className="px-5 py-2.5 bg-stone-900 text-white text-[10px] uppercase tracking-widest font-medium hover:bg-black transition-colors"
                  >
                    Add URL
                  </button>
                </div>

                {presets.length > 0 && (
                  <div>
                    <span className="block text-[9px] uppercase tracking-widest text-stone-400 font-semibold mb-1.5">
                      Quick Sample Photos (Click to add):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {presets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAddExtraUrl(preset.url)}
                          className="text-[10px] uppercase tracking-wider px-2.5 py-1 border border-stone-200 bg-white text-stone-600 hover:border-stone-400 transition-colors"
                        >
                          + {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
