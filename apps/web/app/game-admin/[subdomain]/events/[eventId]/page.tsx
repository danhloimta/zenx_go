import { GameWorkspaceEventEditor } from '@/components/admin-content/game-workspace-editors';
export default async function Page({ params }: { params: Promise<{ subdomain: string; eventId: string }> }) { const { subdomain, eventId } = await params; return <GameWorkspaceEventEditor subdomain={decodeURIComponent(subdomain)} eventId={decodeURIComponent(eventId)} />; }
