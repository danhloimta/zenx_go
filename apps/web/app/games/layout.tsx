import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Khám phá game',
  description: 'Khám phá các game trong hệ sinh thái ZENX GO.',
};

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
