import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Button, Group, Text, Loader, Card, Title, Badge, Stack, Modal,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconCalendarEvent, IconEdit, IconTrash } from '@tabler/icons-react';
import { eventTypesApi } from '../api/client';
import type { EventType, EventTypeCreate, EventTypeUpdate } from '../api/types';
import { EventTypeForm } from '../components/EventTypeForm';
import { notifyError } from '../utils/notifications';

export function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure();
  const [editing, setEditing] = useState<EventType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EventType | null>(null);
  const navigate = useNavigate();

  const fetchEventTypes = async () => {
    try {
      setLoading(true);
      const data = await eventTypesApi.list();
      setEventTypes(data);
    } catch (err) {
      notifyError(err, 'Failed to load event types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEventTypes(); }, []);

  const handleSave = async (data: EventTypeCreate | EventTypeUpdate) => {
    try {
      if (editing) {
        await eventTypesApi.update(editing.id, data as EventTypeUpdate);
      } else {
        await eventTypesApi.create(data as EventTypeCreate);
      }
      setEditing(null);
      await fetchEventTypes();
      notifications.show({ title: 'Success', message: editing ? 'Event type updated' : 'Event type created', color: 'green' });
    } catch (err) {
      notifyError(err, 'Operation failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await eventTypesApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      await fetchEventTypes();
      notifications.show({ title: 'Deleted', message: 'Event type deleted', color: 'green' });
    } catch (err) {
      notifyError(err, 'Delete failed');
    }
  };

  if (loading) {
    return <Stack align="center" mt="xl"><Loader /></Stack>;
  }

  return (
    <>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Event Types</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => { setEditing(null); openForm(); }}
        >
          Create Event Type
        </Button>
      </Group>

      {eventTypes.length === 0 ? (
        <Card withBorder p="xl">
          <Stack align="center" gap="md">
            <IconCalendarEvent size={40} color="var(--mantine-color-gray-4)" />
            <Text c="dimmed" ta="center">No event types yet. Create your first one!</Text>
          </Stack>
        </Card>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Title</Table.Th>
              <Table.Th>Duration</Table.Th>
              <Table.Th>Slug</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {eventTypes.map((et) => (
              <Table.Tr key={et.id}>
                <Table.Td>
                  <Group gap="sm">
                    <IconCalendarEvent size={18} color="var(--mantine-color-orange-6)" />
                    <div>
                      <Text fw={500}>{et.title}</Text>
                      {et.description && <Text size="xs" c="dimmed">{et.description}</Text>}
                    </div>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" color="orange">{et.durationMinutes} min</Badge>
                </Table.Td>
                <Table.Td>
                  <Badge variant="outline" color="gray">{et.slug}</Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button
                      variant="light"
                      size="xs"
                      leftSection={<IconCalendarEvent size={14} />}
                      onClick={() => navigate(`/event-types/${et.id}/slots`)}
                    >
                      Slots
                    </Button>
                    <Button
                      variant="subtle"
                      size="xs"
                      leftSection={<IconEdit size={14} />}
                      onClick={() => { setEditing(et); openForm(); }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="subtle"
                      size="xs"
                      color="red"
                      leftSection={<IconTrash size={14} />}
                      onClick={() => setDeleteTarget(et)}
                    >
                      Delete
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <EventTypeForm opened={formOpened} onClose={() => { closeForm(); setEditing(null); }} eventType={editing} onSave={handleSave} />
      <Modal opened={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete" centered>
        <Stack>
          <Text>Are you sure you want to delete "{deleteTarget?.title}"? This action cannot be undone.</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button color="red" onClick={handleDelete}>Delete</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}