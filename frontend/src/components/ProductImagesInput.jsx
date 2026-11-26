import React, { useState } from 'react';
import ImageUploadInput from './ImageUploadInput';

export default function ProductImagesInput({
  img = '',
  images = [],
  onChange,
  presets = [],
  maxImages = 6,
}) {
  const [isAddingExtra, setIsAddingExtra] = useState(false);

  // Derive extra gallery images (excluding featured img)
  const extraImages = (Array.isArray(images) ? images : []).filter(
    (url) => url && url.trim() !== '' && url !== img
  );
  const totalCount = (img ? 1 : 0) + extraImages.length;

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

  const handleAddExtra = (newUrl) => {
    if (!newUrl || !newUrl.trim()) return;
    if (newUrl === img || extraImages.includes(newUrl)) {
      setIsAddingExtra(false);
      return;
    }
    emitChange(img, [...extraImages, newUrl]);
    setIsAddingExtra(false);
  };

  const handleRemoveExtra = (indexToRemove) => {
    const updated = extraImages.filter((_, idx) => idx !== indexToRemove);
    emitChange(img, updated);
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

      {/* 2. Optional Additional Gallery Images */}
      <div className="p-4 bg-white border border-stone-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-stone-700 block">
              2. Additional Product Photos (Optional)
            </span>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Add extra angles or close-ups ({totalCount}/{maxImages} total photos).
            </p>
          </div>

          {!isAddingExtra && totalCount < maxImages && (
            <button
              type="button"
              onClick={() => setIsAddingExtra(true)}
              className="text-[10px] uppercase tracking-widest font-semibold px-3.5 py-2 border border-stone-300 bg-[#FAF9F6] hover:bg-stone-900 hover:text-white hover:border-stone-900 text-stone-800 transition-colors"
            >
              + Add Gallery Image
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

        {/* Add new extra image uploader */}
        {isAddingExtra && (
          <div className="p-4 bg-[#FAF9F6] border border-stone-300 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-700">
                Upload or Link Additional Photo
              </span>
              <button
                type="button"
                onClick={() => setIsAddingExtra(false)}
                className="text-[10px] uppercase tracking-widest text-stone-500 hover:text-stone-900"
              >
                Cancel
              </button>
            </div>
            <ImageUploadInput
              value=""
              onChange={handleAddExtra}
              presets={presets}
              label={`Gallery Photo #${totalCount + 1}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
