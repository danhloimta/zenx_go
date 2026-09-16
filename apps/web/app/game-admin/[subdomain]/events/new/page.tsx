import { GameWorkspaceEventEditor } from '@/components/admin-content/game-workspace-editors';
export default async function Page({ params }: { params: Promise<{ subdomain: string }> }) { const { subdomain } = await params; return <GameWorkspaceEventEditor subdomain={decodeURIComponent(subdomain)} />; }
