import { GameWorkspaceArticleEditor } from '@/components/admin-content/game-workspace-editors';
export default async function Page({ params }: { params: Promise<{ subdomain: string; articleId: string }> }) { const { subdomain, articleId } = await params; return <GameWorkspaceArticleEditor subdomain={decodeURIComponent(subdomain)} articleId={decodeURIComponent(articleId)} />; }
