import { useEffect, useState } from 'react';
import {
  Table,
  Title,
  Loader,
  Stack,
  Text,
  Card,
  Badge,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { calendarApi } from '../api/client';
import type { CalendarEntry } from '../api/types';
import { notifyError } from '../utils/notifications';

export function CalendarPage() {
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([
    dayjs().startOf('month').format('YYYY-MM-DD'),
    dayjs().endOf('month').format('YYYY-MM-DD'),
  ]);
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCalendar = async (start: string, end: string) => {
    try {
      setLoading(true);
      const data = await calendarApi.view(start, end);
      setEntries(data);
    } catch (err) {
      notifyError(err, 'Failed to load calendar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const [start, end] = dateRange;
    if (!start || !end) return;
    fetchCalendar(start, end);
  }, [dateRange]);

  return (
    <Stack>
      <Title order={2} mb="md">
        Calendar
      </Title>

      <DatePickerInput
        type="range"
        label="Select date range"
        value={dateRange}
        onChange={setDateRange}
        w={320}
      />

      {loading ? (
        <Stack align="center" mt="xl">
          <Loader />
        </Stack>
      ) : entries.length === 0 ? (
        <Card withBorder p="xl">
          <Text c="dimmed" ta="center">
            No bookings in this period.
          </Text>
        </Card>
      ) : (
        entries.map((entry) => (
          <Card key={entry.date} withBorder mb="sm">
            <Title order={4} mb="sm">
              {dayjs(entry.date).format('dddd, MMMM D, YYYY')}
            </Title>
            {entry.bookings.length === 0 ? (
              <Text c="dimmed" size="sm">
                No bookings
              </Text>
            ) : (
              <Table striped withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Event</Table.Th>
                    <Table.Th>Booker</Table.Th>
                    <Table.Th>Time</Table.Th>
                    <Table.Th>Zoom</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {entry.bookings.map((b) => (
                    <Table.Tr key={b.id}>
                      <Table.Td>
                        <Text fw={500}>{b.eventType.title}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{b.booker.name}</Text>
                        <Text size="xs" c="dimmed">
                          {b.booker.email}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {dayjs(b.slot.startTime).format('HH:mm')} -{' '}
                          {dayjs(b.slot.endTime).format('HH:mm')}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          component="a"
                          href={b.zoomLink}
                          target="_blank"
                          variant="light"
                          color="blue"
                          style={{ cursor: 'pointer' }}
                        >
                          Join
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Card>
        ))
      )}
    </Stack>
  );
}