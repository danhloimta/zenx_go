'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ShieldPlus, X, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/errors';
import { codefy } from '@/lib/utils';
import { toast } from 'sonner';

interface CreateRoleModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateRoleModal({ open, onClose }: CreateRoleModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scopeType, setScopeType] = useState<'PLATFORM' | 'GAME'>('PLATFORM');
  const [reason, setReason] = useState('');

  const resetForm = () => {
    setCode('');
    setName('');
    setDescription('');
    setScopeType('PLATFORM');
    setReason('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSuggestCode = () => {
    if (name.trim()) {
      setCode(codefy(name));
    }
  };

  const createMutation = useMutation({
    mutationFn: () =>
      api.admin.access.createRole({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || undefined,
        scopeType,
        reason: reason.trim(),
      }),
    onSuccess: (newRole) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'access', 'roles'] });
      toast.success(`Đã tạo vai trò "${newRole.name}" thành công!`);
      handleClose();
      if (newRole?.id) {
        router.push(`/admin/access/roles/${newRole.id}`);
      }
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Không thể tạo vai trò.')),
  });

  if (!open) return null;

  const isCodeValid = /^[A-Z][A-Z0-9_]{2,31}$/.test(code.trim().toUpperCase());
  const isNameValid = name.trim().length >= 2;
  const isReasonValid = reason.trim().length >= 3;
  const isValid = isCodeValid && isNameValid && isReasonValid;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-[#00873E]">
              <ShieldPlus className="size-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Tạo vai trò mới
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Thiết lập định danh và mục đích vai trò trước khi phân quyền.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form Fields */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (isValid && !createMutation.isPending) {
              createMutation.mutate();
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Phạm vi vai trò <span className="text-rose-500">*</span></label>
            <select value={scopeType} onChange={(e) => setScopeType(e.target.value as 'PLATFORM' | 'GAME')} className="h-9.5 w-full rounded-xl border border-slate-200 px-3 text-xs">
              <option value="PLATFORM">Toàn hệ thống (Platform)</option>
              <option value="GAME">Một hoặc nhiều game (Game)</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">Role Game chỉ có thể được gán trong phạm vi game và chỉ nhận quyền game.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên hiển thị vai trò <span className="text-rose-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Quản lý Nội dung Game, Vận hành CSKH..."
              className="h-9.5 rounded-xl text-xs"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Mã định danh (Role Code) <span className="text-rose-500">*</span>
              </label>
              {name.trim() && !code.trim() ? (
                <button
                  type="button"
                  onClick={handleSuggestCode}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00873E] hover:underline"
                >
                  <Sparkles className="size-3" />
                  Gợi ý từ tên
                </button>
              ) : null}
            </div>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CONTENT_MANAGER"
              className="h-9.5 rounded-xl text-xs font-mono uppercase"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Chữ in hoa, số và gạch dưới (3 - 32 ký tự, bắt đầu bằng chữ cái).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mô tả vai trò <span className="text-slate-400 font-normal">(không bắt buộc)</span>
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả phạm vi quyền hạn và trách nhiệm của vai trò này..."
              rows={2}
              className="rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lý do khởi tạo (Nhật ký kiểm toán) <span className="text-rose-500">*</span>
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Phân quyền quản trị cho bộ phận CSKH mới..."
              className="h-9.5 rounded-xl text-xs"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Ghi lại lý do phục vụ kiểm toán bảo mật và phân quyền hệ thống.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createMutation.isPending}
              className="h-9 rounded-xl text-xs"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={!isValid || createMutation.isPending}
              className="h-9 rounded-xl text-xs bg-[#00873E] hover:bg-[#007033] text-white font-semibold"
            >
              {createMutation.isPending ? 'Đang khởi tạo…' : 'Khởi tạo vai trò'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
