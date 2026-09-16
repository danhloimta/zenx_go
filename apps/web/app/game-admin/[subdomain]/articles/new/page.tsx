import { GameWorkspaceArticleEditor } from '@/components/admin-content/game-workspace-editors';
export default async function Page({ params }: { params: Promise<{ subdomain: string }> }) { const { subdomain } = await params; return <GameWorkspaceArticleEditor subdomain={decodeURIComponent(subdomain)} />; }
