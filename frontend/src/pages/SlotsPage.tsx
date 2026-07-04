import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Table, Button, Group, Text, Loader, Title, Stack, Breadcrumbs, Anchor, Card,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconCalendarEvent, IconArrowLeft, IconClock } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { slotsApi } from '../api/client';
import type { Slot } from '../api/types';
import { notifyError } from '../utils/notifications';

const formatTime = (iso: string) => dayjs(iso).format('HH:mm');

export function SlotsPage() {
  const { eventTypeId } = useParams<{ eventTypeId: string }>();
  const navigate = useNavigate();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<string>(dayjs().format('YYYY-MM-DD'));

  const fetchSlots = async (d: string) => {
    if (!eventTypeId) return;
    try {
      setLoading(true);
      const data = await slotsApi.list(eventTypeId, d);
      setSlots(data);
    } catch (err) {
      notifyError(err, 'Failed to load slots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSlots(date); }, [eventTypeId, date]);

  if (!eventTypeId) {
    return <Stack align="center" mt="xl"><Text c="dimmed">Event type not found.</Text></Stack>;
  }

  return (
    <>
      <Breadcrumbs mb="md">
        <Anchor
          size="sm"
          onClick={() => navigate('/event-types')}
          style={{ cursor: 'pointer' }}
        >
          Event Types
        </Anchor>
        <Text size="sm" c="dimmed">Slots</Text>
      </Breadcrumbs>
      <Group justify="space-between" mb="lg">
        <Group>
          <Button
            variant="subtle"
            size="sm"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate('/event-types')}
          >
            Back
          </Button>
          <Title order={2}>Available Slots</Title>
        </Group>
        <DatePickerInput
          value={date}
          onChange={(v) => { if (v) setDate(v); }}
          w={260}
        />
      </Group>

      {loading ? (
        <Stack align="center" mt="xl"><Loader /></Stack>
      ) : slots.length === 0 ? (
        <Card withBorder p="xl">
          <Stack align="center" gap="md">
            <IconCalendarEvent size={40} color="var(--mantine-color-gray-4)" />
            <Text c="dimmed" ta="center">
              No available slots on {dayjs(date).format('MMMM D, YYYY')}.
            </Text>
            <Text size="sm" c="dimmed">
              Make sure you have availability rules set for this day.
            </Text>
          </Stack>
        </Card>
      ) : (
        <>
          <Text size="sm" c="dimmed" mb="sm">
            {slots.length} slot{slots.length !== 1 ? 's' : ''} available on {dayjs(date).format('dddd, MMMM D, YYYY')}
          </Text>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Start</Table.Th>
                <Table.Th>End</Table.Th>
                <Table.Th>Duration</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {slots.map((slot, idx) => (
                <Table.Tr key={idx}>
                  <Table.Td>{formatTime(slot.startTime)}</Table.Td>
                  <Table.Td>{formatTime(slot.endTime)}</Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <IconClock size={14} color="var(--mantine-color-gray-5)" />
                      <Text size="sm">{dayjs(slot.endTime).diff(dayjs(slot.startTime), 'minute')} min</Text>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </>
      )}
    </>
  );
}