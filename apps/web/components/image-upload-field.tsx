'use client';

import { useState } from 'react';
import { Crop, ExternalLink, Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  hint,
  aspectRatio = '16:9',
  modalTitle,
}: ImageUploadFieldProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const displayUrl = mediaUrl(value) || value;
  const hasImage = Boolean(value && !imgError);

  const aspectClass =
    aspectRatio === '16:9'
      ? 'aspect-[16/9]'
      : aspectRatio === '1:1'
      ? 'aspect-square max-w-[180px] mx-auto'
      : aspectRatio === '9:16'
      ? 'aspect-[9/16] max-w-[180px] mx-auto'
      : 'min-h-[140px] max-h-[220px]';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700">{label}</label>
        {hasImage ? (
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

      {/* Image Preview & Actions Area */}
      {hasImage ? (
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-2xs">
          {/* Image Container with Aspect Ratio */}
          <div className={`relative w-full overflow-hidden bg-slate-900/5 ${aspectClass}`}>
            <img
              src={displayUrl}
              alt={label}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              onError={() => setImgError(true)}
            />
          </div>

          {/* Action Overlay / Bottom Bar */}
          <div className="flex items-center justify-between border-t border-slate-200/80 bg-white p-2.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate min-w-0">
              <ImageIcon className="size-3.5 shrink-0 text-emerald-600" />
              <span className="truncate font-medium text-slate-700">Ảnh đã tải lên</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditorOpen(true)}
                className="h-8 gap-1.5 border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:border-[#00873E] hover:text-[#00873E]"
              >
                <Crop className="size-3.5" />
                <span>Sửa ảnh</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange('')}
                className="h-8 px-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                title="Xóa ảnh"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State Dropzone */
        <button
          type="button"
          onClick={() => setEditorOpen(true)}
          className={`group flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-4 text-center hover:border-[#00873E] hover:bg-[#E8F7EC]/20 transition-all cursor-pointer ${aspectClass}`}
        >
          <div className="flex size-11 items-center justify-center rounded-xl bg-white text-slate-400 shadow-2xs group-hover:bg-[#00873E] group-hover:text-white transition-all">
            <Upload className="size-5" />
          </div>
          <span className="mt-2.5 text-xs font-bold text-slate-700 group-hover:text-[#00873E] transition-colors">
            Tải lên & cắt ảnh ({aspectRatio})
          </span>
          <span className="mt-0.5 text-[11px] text-slate-400">
            Hỗ trợ PNG, JPG, WebP. Tối đa 5MB.
          </span>
        </button>
      )}

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
