'use client';

import { useState } from 'react';
import { Crop, ExternalLink, Image as ImageIcon, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageEditorModal, type AspectRatioPreset } from '@/components/image-editor-modal';
import { mediaUrl } from '@/lib/utils';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  hint?: string;
  aspectRatio?: AspectRatioPreset;
  modalTitle?: string;
}

export function ImageUploadField({
  label,
  value,
  onChange,
  placeholder = '/images/... hoặc /uploads/... hoặc https://...',
  hint,
  aspectRatio = '16:9',
  modalTitle,
}: ImageUploadFieldProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const displayUrl = mediaUrl(value) || value;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700">{label}</label>
        <div className="flex items-center gap-2">
          {value ? (
            <a
              href={displayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00873E] hover:underline"
            >
              <span>Xem ảnh gốc</span>
              <ExternalLink className="size-3" />
            </a>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Live Thumbnail Preview */}
        <div className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 shadow-2xs">
          {value && !imgError ? (
            <img
              src={displayUrl}
              alt={label}
              className="size-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <ImageIcon className="size-4.5 text-slate-400" />
          )}
        </div>

        {/* URL Input */}
        <div className="relative flex-1">
          <Input
            value={value}
            onChange={(e) => {
              setImgError(false);
              onChange(e.target.value);
            }}
            placeholder={placeholder}
            className="pr-8 text-xs font-mono"
          />
          {value ? (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              title="Xóa đường dẫn"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        {/* Upload & Crop Action Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setEditorOpen(true)}
          className="shrink-0 gap-1.5 border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:border-[#00873E] hover:bg-[#E8F7EC]/30 hover:text-[#00873E] transition shadow-2xs"
        >
          {value ? <Crop className="size-3.5" /> : <Upload className="size-3.5" />}
          <span>{value ? 'Sửa ảnh' : 'Tải & Cắt'}</span>
        </Button>
      </div>

      {hint ? <p className="text-[11px] text-slate-400">{hint}</p> : null}

      {/* Interactive Editor Modal */}
      <ImageEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={modalTitle || `Tải & Chỉnh sửa ${label}`}
        initialImageUrl={value ? displayUrl : null}
        defaultAspectRatio={aspectRatio}
        onSaved={(newUrl) => {
          setImgError(false);
          onChange(newUrl);
        }}
      />
    </div>
  );
}
