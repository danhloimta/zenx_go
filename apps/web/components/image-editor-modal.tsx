'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Crop,
  FlipHorizontal,
  Loader2,
  RefreshCw,
  RotateCw,
  UploadCloud,
  X,
  ZoomIn,
  ZoomOut,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export type AspectRatioPreset = '1:1' | '16:9' | '9:16' | '4:3' | 'free';

interface ImageEditorModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  initialImageUrl?: string | null;
  defaultAspectRatio?: AspectRatioPreset;
  onSaved: (url: string) => void;
}

const PRESET_RATIOS: Record<AspectRatioPreset, number | null> = {
  '1:1': 1,
  '16:9': 16 / 9,
  '9:16': 9 / 16,
  '4:3': 4 / 3,
  free: null,
};

export function ImageEditorModal({
  open,
  onClose,
  title = 'Chỉnh sửa & Tải ảnh lên máy chủ',
  initialImageUrl,
  defaultAspectRatio = '16:9',
  onSaved,
}: ImageEditorModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(initialImageUrl || null);
  const [aspectPreset, setAspectPreset] = useState<AspectRatioPreset>(defaultAspectRatio);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setImageSrc(initialImageUrl || null);
      setAspectPreset(defaultAspectRatio);
      setZoom(1);
      setRotation(0);
      setFlipH(false);
      setOffset({ x: 0, y: 0 });
    }
  }, [open, initialImageUrl, defaultAspectRatio]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn định dạng ảnh hợp lệ (PNG, JPG, WebP, GIF, SVG).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Kích thước file ảnh không được vượt quá 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setZoom(1);
      setRotation(0);
      setFlipH(false);
      setOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageSrc) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart],
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setOffset({ x: 0, y: 0 });
  };

  const handleCropAndUpload = async () => {
    if (!imageSrc) return;

    try {
      setIsUploading(true);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Không thể khởi tạo canvas đồ họa');

      const targetRatio = PRESET_RATIOS[aspectPreset] ?? img.naturalWidth / img.naturalHeight;

      let outWidth = 1200;
      let outHeight = Math.round(outWidth / targetRatio);
      if (aspectPreset === '1:1') {
        outWidth = 600;
        outHeight = 600;
      } else if (aspectPreset === '9:16') {
        outWidth = 720;
        outHeight = 1280;
      }

      canvas.width = outWidth;
      canvas.height = outHeight;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, outWidth, outHeight);

      ctx.save();
      ctx.translate(outWidth / 2, outHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      if (flipH) ctx.scale(-1, 1);

      const scale = zoom;
      const baseScale = Math.max(outWidth / img.naturalWidth, outHeight / img.naturalHeight);
      const drawWidth = img.naturalWidth * baseScale * scale;
      const drawHeight = img.naturalHeight * baseScale * scale;

      const normOffsetX = (offset.x / 150) * (outWidth / 2);
      const normOffsetY = (offset.y / 150) * (outHeight / 2);

      ctx.drawImage(img, -drawWidth / 2 + normOffsetX, -drawHeight / 2 + normOffsetY, drawWidth, drawHeight);
      ctx.restore();

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Lỗi xuất file ảnh canvas'));
          },
          'image/webp',
          0.92,
        );
      });

      const result = await api.admin.content.uploadAsset(blob);
      toast.success('Đã tải ảnh lên Server Storage thành công!');
      onSaved(result.url);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Lỗi tải ảnh lên máy chủ'));
    } finally {
      setIsUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-[#E8F7EC] text-[#00873E]">
              <Crop className="size-4" />
            </span>
            <div>
              <h3 className="text-base font-black text-slate-900">{title}</h3>
              <p className="text-[11px] text-slate-400">
                Cắt cúp, phóng to/thu nhỏ, xoay và lưu trực tiếp vào máy chủ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            aria-label="Đóng cửa sổ"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!imageSrc ? (
            /* Upload Dropzone */
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-8 text-center transition hover:border-[#00873E] hover:bg-[#E8F7EC]/20 cursor-pointer"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              <span className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-md text-[#00873E] border border-slate-100">
                <UploadCloud className="size-7" />
              </span>
              <h4 className="mt-4 text-base font-bold text-slate-800">
                Kéo thả file ảnh vào đây hoặc bấm để tải lên
              </h4>
              <p className="mt-1 text-xs text-slate-400 max-w-sm">
                Hỗ trợ định dạng PNG, JPG, WebP, GIF, SVG. Dung lượng tối đa 10 MB trên mỗi tệp tin.
              </p>
              <Button type="button" size="sm" className="mt-5 bg-[#00873E] text-white hover:bg-[#007234]">
                Chọn tệp từ máy tính
              </Button>
            </div>
          ) : (
            /* Interactive Canvas Cropper */
            <div className="space-y-4">
              {/* Toolbar: Aspect Ratio Presets & Transformation */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-2.5 border border-slate-200/80">
                {/* Ratio Presets */}
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-400 mr-1.5">Tỷ lệ:</span>
                  {(['1:1', '16:9', '9:16', '4:3', 'free'] as AspectRatioPreset[]).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAspectPreset(preset)}
                      className={cn(
                        'rounded-lg px-2.5 py-1 text-xs font-bold transition',
                        aspectPreset === preset
                          ? 'bg-white text-[#00873E] shadow-xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900',
                      )}
                    >
                      {preset === 'free' ? 'Tự do' : preset}
                    </button>
                  ))}
                </div>

                {/* Transform Actions */}
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRotate}
                    className="h-8 px-2.5 text-xs text-slate-700"
                    title="Xoay 90 độ"
                  >
                    <RotateCw className="size-3.5 mr-1" />
                    Xoay
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFlipH(!flipH)}
                    className={cn('h-8 px-2.5 text-xs text-slate-700', flipH && 'bg-slate-200')}
                    title="Lật gương ngang"
                  >
                    <FlipHorizontal className="size-3.5 mr-1" />
                    Lật
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="h-8 px-2 text-xs text-slate-500"
                    title="Đặt lại vị trí"
                  >
                    <RefreshCw className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* Viewport Frame with Draggable Pan Canvas */}
              <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="relative flex h-[340px] w-full items-center justify-center overflow-hidden rounded-3xl bg-slate-900 cursor-grab active:cursor-grabbing select-none"
              >
                {/* Rule of Thirds Guide Grid */}
                <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20">
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-white" />
                  <div className="border-r border-white" />
                  <div />
                </div>

                {/* Cropping Aspect Ratio Mask */}
                <div
                  className="pointer-events-none absolute inset-4 rounded-2xl border-2 border-[#00873E] shadow-2xl ring-4 ring-black/40"
                  style={{
                    aspectRatio: PRESET_RATIOS[aspectPreset]
                      ? `${PRESET_RATIOS[aspectPreset]}`
                      : undefined,
                    maxWidth: '100%',
                    maxHeight: '100%',
                  }}
                />

                {/* Transformed Image Element */}
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Chỉnh sửa ảnh"
                  draggable={false}
                  className="pointer-events-none max-h-none max-w-none transition-transform duration-75"
                  style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${flipH ? -zoom : zoom}, ${zoom})`,
                  }}
                />
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-2.5 border border-slate-200/80">
                <ZoomOut className="size-4 text-slate-400" />
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="h-1.5 w-full appearance-none rounded-lg bg-slate-200 accent-[#00873E] cursor-pointer"
                />
                <ZoomIn className="size-4 text-slate-400" />
                <span className="text-xs font-mono font-bold text-slate-600 w-10 text-right">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <div>
            {imageSrc ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setImageSrc(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Chọn ảnh khác
              </Button>
            ) : null}
          </div>

          <div className="flex items-center gap-2.5">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isUploading}>
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCropAndUpload}
              disabled={!imageSrc || isUploading}
              className="bg-[#00873E] text-white hover:bg-[#007234] gap-1.5 font-bold shadow-xs"
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Đang lưu vào máy chủ…</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  <span>Lưu & Tải lên máy chủ</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
