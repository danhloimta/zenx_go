'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Palette } from 'lucide-react';
import type { FeatureConfig, GamePageConfig, ThemeConfig } from '@zenx-go/api-client';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import {
  GamePresentationEditor,
  type PresentationValue,
} from '@/components/admin-content/game-presentation-editor';

export default function GamePresentationPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const client = useQueryClient();
  const [value, setValue] = useState<PresentationValue | null>(null);
  const [savedAt, setSavedAt] = useState('');

  const context = useQuery({
    queryKey: ['game-admin', 'context', subdomain],
    queryFn: () => api.gameAdmin.context(subdomain),
    retry: false,
  });

  const presentation = useQuery({
    queryKey: ['game-admin', 'presentation', context.data?.game.id],
    queryFn: () => api.gameAdmin.content.presentation(context.data!.game.id),
    enabled: Boolean(context.data),
    retry: false,
  });

  useEffect(() => {
    if (presentation.data) {
      setValue({
        themeConfig: JSON.parse(presentation.data.themeConfig) as ThemeConfig,
        featureConfig: JSON.parse(presentation.data.featureConfig) as FeatureConfig,
        pageConfig: JSON.parse(presentation.data.pageConfig) as GamePageConfig,
      });
      setSavedAt(presentation.data.updatedAt);
    }
  }, [presentation.data]);

  const save = useMutation({
    mutationFn: () =>
      api.gameAdmin.content.updatePresentation(context.data!.game.id, {
        expectedUpdatedAt: savedAt,
        ...value!,
      }),
    onSuccess: (game) => {
      setSavedAt(game.updatedAt);
      void client.invalidateQueries({
        queryKey: ['game-admin', 'presentation', context.data?.game.id],
      });
    },
  });

  if (presentation.isLoading || !value || !context.data) {
    return <p className="text-sm text-slate-500">Đang tải giao diện…</p>;
  }

  if (presentation.isError || !presentation.data) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(presentation.error, 'Không thể tải giao diện game.')}
      </p>
    );
  }

  const game = context.data.game;

  return (
    <div className="space-y-5 w-full">
      <PageHeader
        icon={Palette}
        title="Giao diện game"
        badge={
          <span className="rounded bg-emerald-100/90 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
            {game.code}
          </span>
        }
        description={`Cấu hình trực quan, màu sắc và bố cục hiển thị áp dụng cho website game ${game.name}.`}
        actions={
          <Button
            size="sm"
            disabled={save.isPending}
            onClick={() => save.mutate()}
            className="h-8 px-3.5 rounded-xl font-bold bg-[#00873E] text-white hover:bg-[#007033] shadow-xs"
          >
            {save.isPending ? 'Đang lưu…' : 'Lưu giao diện'}
          </Button>
        }
        className="border-b border-slate-100 pb-3"
      />

      {save.isError ? (
        <p className="text-sm text-red-600">
          {getErrorMessage(
            save.error,
            'Không thể lưu. Dữ liệu có thể đã được người khác cập nhật.',
          )}
        </p>
      ) : null}

      <GamePresentationEditor
        value={value}
        preset={presentation.data.themePreset}
        onChange={setValue}
      />
    </div>
  );
}
