'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function GameArticlesPage() {
  const { subdomain } = useParams<{ subdomain: string }>(); const client = useQueryClient();
  const [open, setOpen] = useState(false); const [title, setTitle] = useState(''); const [slug, setSlug] = useState(''); const [excerpt, setExcerpt] = useState(''); const [content, setContent] = useState('');
  const context = useQuery({ queryKey: ['game-admin', 'context', subdomain], queryFn: () => api.gameAdmin.context(subdomain), retry: false });
  const articles = useQuery({ queryKey: ['game-admin', 'articles', context.data?.game.id], queryFn: () => api.gameAdmin.content.articles(context.data!.game.id), enabled: Boolean(context.data), retry: false });
  const create = useMutation({ mutationFn: () => api.gameAdmin.content.createArticle(context.data!.game.id, { title, slug, excerpt, content, category: 'ANNOUNCEMENT', status: 'PUBLISHED' }), onSuccess: () => { setOpen(false); void client.invalidateQueries({ queryKey: ['game-admin', 'articles'] }); } });
  return <><div className="mb-7 flex items-center justify-between"><div><h1 className="text-3xl font-black">Bài viết</h1><p className="mt-1 text-sm text-slate-500">Nội dung chỉ thuộc {context.data?.game.name ?? 'game hiện tại'}.</p></div><Button onClick={() => setOpen(true)}>Tạo bài viết</Button></div>{open ? <div className="mb-6 rounded-xl border bg-white p-5"><div className="grid gap-3 md:grid-cols-2"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề" /><Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug" /></div><Input className="mt-3" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Tóm tắt" /><Textarea className="mt-3 min-h-40" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Nội dung Markdown" /><div className="mt-4 flex gap-3"><Button disabled={!title || !slug || !excerpt || !content || create.isPending} onClick={() => create.mutate()}>Xuất bản</Button><Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button></div></div> : null}<div className="divide-y overflow-hidden rounded-xl border bg-white">{articles.data?.items.map((article) => <div key={article.id} className="p-4"><p className="font-semibold">{article.title}</p><p className="mt-1 text-sm text-slate-500">{article.status} · {article.slug}</p></div>)}{articles.data?.items.length === 0 ? <p className="p-6 text-sm text-slate-500">Chưa có bài viết.</p> : null}</div></>;
}
