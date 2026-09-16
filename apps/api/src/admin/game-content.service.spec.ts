import { GameContentService } from './game-content.service';

describe('GameContentService', () => {
  it('rejects an article that belongs to a different game before updating it', async () => {
    const prisma = { gameArticle: { findFirst: jest.fn().mockResolvedValue(null) } };
    const content = { updateArticle: jest.fn() };
    const service = new GameContentService(prisma as any, content as any);
    await expect(service.updateArticle('orion', 'article-hoalong', { expectedUpdatedAt: new Date().toISOString(), title: 'x' } as any, 'actor')).rejects.toMatchObject({ code: 'GAME_ARTICLE_NOT_FOUND' });
    expect(content.updateArticle).not.toHaveBeenCalled();
  });
});
