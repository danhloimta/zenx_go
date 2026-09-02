import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tin tức',
  description: 'Tin tức, development update và thông báo mới nhất từ các thế giới ZENX GO.',
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
