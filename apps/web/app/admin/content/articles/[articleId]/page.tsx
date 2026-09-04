import { ArticleEditor } from '@/components/admin-content/article-editor';

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const { articleId } = await params;
  return <ArticleEditor articleId={decodeURIComponent(articleId)} />;
}
