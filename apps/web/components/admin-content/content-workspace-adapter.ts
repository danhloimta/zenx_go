/** Fixed game context used by the shared CMS editors and lists. */
export type ContentWorkspaceAdapter = {
  gameId: string;
  gameName: string;
  subdomain: string;
  articlesPath: string;
  eventsPath: string;
};

export function gameContentWorkspace(gameId: string, gameName: string, subdomain: string): ContentWorkspaceAdapter {
  const base = `/game-admin/${encodeURIComponent(subdomain)}`;
  return { gameId, gameName, subdomain, articlesPath: `${base}/articles`, eventsPath: `${base}/events` };
}
