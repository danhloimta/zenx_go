import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sự kiện',
  description: 'Theo dõi các sự kiện, quà tặng và hoạt động mới nhất trong hệ sinh thái ZENX GO.',
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
