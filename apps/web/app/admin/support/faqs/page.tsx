'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Edit3, Plus, Save, X } from 'lucide-react';
import type { SupportAdminCategory, SupportAdminFaq } from '@zenx-go/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupportAdminFaqs } from '@/hooks/use-support';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { supportStatusClass, supportStatusLabel } from '@/lib/support';
import { SupportMarkdown } from '@/components/support-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

type Editor = { kind: 'category' | 'faq'; id?: string } | null;

export default function SupportAdminFaqsPage() {
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [editor, setEditor] = useState<Editor>(null);
  const query = useSupportAdminFaqs({});
  const categories = query.data?.categories ?? [];
  const category = categories.find((item) => item.id === selectedCategoryId) ?? categories[0];
  useEffect(() => {
    if (!selectedCategoryId && categories[0]) setSelectedCategoryId(categories[0].id);
  }, [categories, selectedCategoryId]);
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'support', 'faqs'] });
  };
  const categoryCreate = useMutation({
    mutationFn: (input: CategoryCreate) => api.admin.support.createCategory(input),
    onSuccess: () => {
      toast.success('Đã tạo danh mục FAQ.');
      setEditor(null);
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const categoryUpdate = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CategoryUpdate }) =>
      api.admin.support.updateCategory(id, input),
    onSuccess: () => {
      toast.success('Đã cập nhật danh mục FAQ.');
      setEditor(null);
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const faqCreate = useMutation({
    mutationFn: (input: FaqCreate) => api.admin.support.createFaq(input),
    onSuccess: () => {
      toast.success('Đã tạo FAQ.');
      setEditor(null);
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const faqUpdate = useMutation({
    mutationFn: ({ id, input }: { id: string; input: FaqUpdate }) =>
      api.admin.support.updateFaq(id, input),
    onSuccess: () => {
      toast.success('Đã cập nhật FAQ.');
      setEditor(null);
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const editingCategory =
    editor?.kind === 'category' ? categories.find((item) => item.id === editor.id) : undefined;
  const editingFaq =
    editor?.kind === 'faq' ? category?.faqs.find((item) => item.id === editor.id) : undefined;
  const pending =
    categoryCreate.isPending ||
    categoryUpdate.isPending ||
    faqCreate.isPending ||
    faqUpdate.isPending;
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-[#00873E]">Support Operations</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Quản lý FAQ</h2>
          <p className="mt-1 text-sm text-slate-500">
            Nội dung Markdown giới hạn, có preview an toàn trước khi lưu.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditor({ kind: 'category' })}>
            <Plus className="size-4" /> Danh mục
          </Button>
          <Button size="sm" onClick={() => setEditor({ kind: 'faq' })} disabled={!category}>
            <Plus className="size-4" /> FAQ mới
          </Button>
        </div>
      </div>
      {query.isLoading ? (
        <Skeleton className="h-[560px] rounded-2xl" />
      ) : query.isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
          Không thể tải FAQ.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <BookOpen className="size-4 text-[#00873E]" />
              <h3 className="font-black text-slate-900">Danh mục</h3>
            </div>
            <div className="mt-3 space-y-1">
              {categories.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedCategoryId(item.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${item.id === category?.id ? 'bg-emerald-50 font-bold text-[#00873E]' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className="truncate">{item.name}</span>
                  <span className="text-[10px] text-slate-400">{item.faqs.length}</span>
                </button>
              ))}
              {!categories.length ? (
                <p className="p-4 text-center text-xs text-slate-500">Chưa có danh mục.</p>
              ) : null}
            </div>
          </section>
          <section className="space-y-4">
            {category ? (
              <>
                <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-900">{category.name}</h3>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${supportStatusClass(category.status)}`}
                      >
                        {supportStatusLabel(category.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {category.code} · {category.faqs.length} câu hỏi
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditor({ kind: 'category', id: category.id })}
                  >
                    <Edit3 className="size-4" /> Sửa danh mục
                  </Button>
                </div>
                {category.faqs.length ? (
                  category.faqs.map((faq) => (
                    <FaqCard
                      key={faq.id}
                      faq={faq}
                      onEdit={() => setEditor({ kind: 'faq', id: faq.id })}
                    />
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
                    Chưa có FAQ trong danh mục này.
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
                Chọn hoặc tạo một danh mục để bắt đầu.
              </div>
            )}
          </section>
        </div>
      )}
      {editor ? (
        <EditorDialog
          kind={editor.kind}
          category={category}
          faq={editingFaq}
          editingCategory={editingCategory}
          pending={pending}
          onClose={() => setEditor(null)}
          onCreateCategory={(input) => categoryCreate.mutate(input)}
          onUpdateCategory={(id, input) => categoryUpdate.mutate({ id, input })}
          onCreateFaq={(input) => faqCreate.mutate(input)}
          onUpdateFaq={(id, input) => faqUpdate.mutate({ id, input })}
        />
      ) : null}
    </div>
  );
}

type CategoryCreate = {
  code: string;
  name: string;
  status?: 'ACTIVE' | 'INACTIVE';
  sortOrder?: number;
};
type CategoryUpdate = {
  expectedUpdatedAt: string;
  name?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  sortOrder?: number;
};
type FaqCreate = {
  categoryId: string;
  question: string;
  answer: string;
  status?: 'ACTIVE' | 'INACTIVE';
  sortOrder?: number;
};
type FaqUpdate = {
  expectedUpdatedAt: string;
  question?: string;
  answer?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  sortOrder?: number;
};

function FaqCard({ faq, onEdit }: { faq: SupportAdminFaq; onEdit: () => void }) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-bold text-slate-900">{faq.question}</h4>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${supportStatusClass(faq.status)}`}
            >
              {supportStatusLabel(faq.status)}
            </span>
          </div>
          <div className="mt-3 text-sm leading-6 text-slate-600">
            <SupportMarkdown>{faq.answer}</SupportMarkdown>
          </div>
          <p className="mt-3 text-[10px] text-slate-400">
            Thứ tự {faq.sortOrder} · Cập nhật {new Date(faq.updatedAt).toLocaleString('vi-VN')}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Sửa FAQ">
          <Edit3 className="size-4" />
        </Button>
      </div>
    </article>
  );
}

function EditorDialog({
  kind,
  category,
  faq,
  editingCategory,
  pending,
  onClose,
  onCreateCategory,
  onUpdateCategory,
  onCreateFaq,
  onUpdateFaq,
}: {
  kind: 'category' | 'faq';
  category?: SupportAdminCategory;
  faq?: SupportAdminFaq;
  editingCategory?: SupportAdminCategory;
  pending: boolean;
  onClose: () => void;
  onCreateCategory: (input: CategoryCreate) => void;
  onUpdateCategory: (id: string, input: CategoryUpdate) => void;
  onCreateFaq: (input: FaqCreate) => void;
  onUpdateFaq: (id: string, input: FaqUpdate) => void;
}) {
  const [code, setCode] = useState(editingCategory?.code ?? '');
  const [name, setName] = useState(editingCategory?.name ?? '');
  const [question, setQuestion] = useState(faq?.question ?? '');
  const [answer, setAnswer] = useState(faq?.answer ?? '');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(
    kind === 'category' ? (editingCategory?.status ?? 'ACTIVE') : (faq?.status ?? 'ACTIVE'),
  );
  const [sortOrder, setSortOrder] = useState(
    String(kind === 'category' ? (editingCategory?.sortOrder ?? 0) : (faq?.sortOrder ?? 0)),
  );
  const isEdit = Boolean(kind === 'category' ? editingCategory : faq);
  const submit = () => {
    if (kind === 'category') {
      if (name.trim().length < 2) return;
      if (editingCategory)
        onUpdateCategory(editingCategory.id, {
          expectedUpdatedAt: editingCategory.updatedAt,
          name: name.trim(),
          status,
          sortOrder: Number(sortOrder) || 0,
        });
      else if (code.trim())
        onCreateCategory({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          status,
          sortOrder: Number(sortOrder) || 0,
        });
    } else if (category && question.trim() && answer.trim()) {
      if (faq)
        onUpdateFaq(faq.id, {
          expectedUpdatedAt: faq.updatedAt,
          question: question.trim(),
          answer,
          status,
          sortOrder: Number(sortOrder) || 0,
        });
      else
        onCreateFaq({
          categoryId: category.id,
          question: question.trim(),
          answer,
          status,
          sortOrder: Number(sortOrder) || 0,
        });
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              {kind === 'category'
                ? isEdit
                  ? 'Sửa danh mục'
                  : 'Tạo danh mục'
                : isEdit
                  ? 'Sửa FAQ'
                  : 'Tạo FAQ'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">Cập nhật trực tiếp nội dung hỗ trợ.</p>
          </div>
          <button
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {kind === 'category' ? (
            <div className="space-y-4">
              <Field label="Mã danh mục">
                <Input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  disabled={isEdit}
                  placeholder="ACCOUNT"
                />
              </Field>
              <Field label="Tên danh mục">
                <Input value={name} onChange={(event) => setName(event.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Trạng thái">
                  <Select
                    value={status}
                    onChange={(event) => setStatus(event.target.value as 'ACTIVE' | 'INACTIVE')}
                  >
                    <option value="ACTIVE">Đang hiển thị</option>
                    <option value="INACTIVE">Tạm ẩn</option>
                  </Select>
                </Field>
                <Field label="Thứ tự">
                  <Input
                    type="number"
                    value={sortOrder}
                    onChange={(event) => setSortOrder(event.target.value)}
                  />
                </Field>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Field label="Câu hỏi">
                <Input value={question} onChange={(event) => setQuestion(event.target.value)} />
              </Field>
              <Field label="Trạng thái">
                <Select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as 'ACTIVE' | 'INACTIVE')}
                >
                  <option value="ACTIVE">Đang hiển thị</option>
                  <option value="INACTIVE">Tạm ẩn</option>
                </Select>
              </Field>
              <Field label="Thứ tự">
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                />
              </Field>
            </div>
          )}
          <div className="space-y-4">
            {kind === 'faq' ? (
              <>
                <Field label="Nội dung Markdown">
                  <Textarea
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    className="min-h-48"
                    placeholder="Có thể dùng **in đậm**, *in nghiêng*, danh sách và [liên kết](https://example.com)."
                  />
                  <p className="text-[11px] text-slate-400">
                    Không dùng HTML, ảnh, heading, table hoặc link ngoài http/https.
                  </p>
                </Field>
                <div>
                  <p className="text-xs font-bold text-slate-700">Preview</p>
                  <div className="mt-2 min-h-24 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    <SupportMarkdown>{answer || 'Chưa có nội dung.'}</SupportMarkdown>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={submit}
            disabled={
              pending ||
              (kind === 'category'
                ? name.trim().length < 2 || (!isEdit && !code.trim())
                : !question.trim() || !answer.trim())
            }
          >
            <Save className="size-4" />
            {pending ? 'Đang lưu…' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block space-y-2 ${className}`}>
      <span className="text-xs font-bold text-slate-700">{label}</span>
      {children}
    </label>
  );
}
