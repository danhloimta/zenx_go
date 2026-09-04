import { EventEditor } from '@/components/admin-content/event-editor';

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return <EventEditor eventId={decodeURIComponent(eventId)} />;
}
