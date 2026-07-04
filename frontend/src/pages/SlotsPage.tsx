import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Group,
  Text,
  Loader,
  Title,
  Badge,
  Stack,
  Breadcrumbs,
  Anchor,
  Modal,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { slotsApi } from '../api/client';
import type { Slot, SlotCreate } from '../api/types';
import { SlotForm } from '../components/SlotForm';
import { notifyError } from '../utils/notifications';

const formatTime = (iso: string) => dayjs(iso).format('MMM D, YYYY HH:mm');

export function SlotsPage() {
  const { eventTypeId } = useParams<{ eventTypeId: string }>();
  const navigate = useNavigate();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure();
  const [deleteTarget, setDeleteTarget] = useState<Slot | null>(null);

  const fetchSlots = async () => {
    if (!eventTypeId) return;
    try {
      setLoading(true);
      const data = await slotsApi.list(eventTypeId);
      setSlots(data);
    } catch (err) {
      notifyError(err, 'Failed to load slots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [eventTypeId]);

  const handleAdd = async (newSlots: SlotCreate[]) => {
    if (!eventTypeId) return;
    try {
      await slotsApi.add(eventTypeId, newSlots);
      await fetchSlots();
      notifications.show({
        title: 'Success',
        message: 'Slot added',
        color: 'green',
      });
    } catch (err) {
      notifyError(err, 'Failed to add slot');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !eventTypeId) return;
    try {
      await slotsApi.delete(eventTypeId, deleteTarget.id);
      setDeleteTarget(null);
      await fetchSlots();
      notifications.show({
        title: 'Deleted',
        message: 'Slot deleted',
        color: 'green',
      });
    } catch (err) {
      notifyError(err, 'Delete failed');
    }
  };

  if (!eventTypeId) {
    return (
      <Stack align="center" mt="xl">
        <Text c="dimmed">Event type not found.</Text>
      </Stack>
    );
  }

  if (loading) {
    return (
      <Stack align="center" mt="xl">
        <Loader />
      </Stack>
    );
  }

  return (
    <>
      <Breadcrumbs mb="md">
        <Anchor size="sm" onClick={() => navigate('/event-types')}>
          Event Types
        </Anchor>
        <Text size="sm">Slots</Text>
      </Breadcrumbs>

      <Group justify="space-between" mb="md">
        <Title order={2}>Slots</Title>
        <Button onClick={openForm}>Add Slot</Button>
      </Group>

      {slots.length === 0 ? (
        <Stack align="center" mt="xl">
          <Text c="dimmed">No slots added yet.</Text>
        </Stack>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Start</Table.Th>
              <Table.Th>End</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {slots.map((slot) => (
              <Table.Tr key={slot.id}>
                <Table.Td>{formatTime(slot.startTime)}</Table.Td>
                <Table.Td>{formatTime(slot.endTime)}</Table.Td>
                <Table.Td>
                  <Badge color={slot.status === 'available' ? 'green' : 'red'}>
                    {slot.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Button
                    variant="subtle"
                    size="xs"
                    color="red"
                    onClick={() => setDeleteTarget(slot)}
                  >
                    Delete
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <SlotForm
        opened={formOpened}
        onClose={closeForm}
        onAdd={handleAdd}
      />

      <Modal
        opened={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Delete"
      >
        <Stack>
          <Text>Are you sure you want to delete this slot?</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDelete}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}