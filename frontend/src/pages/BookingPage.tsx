import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Title, Text, Card, Badge, Stack, Group, Modal, TextInput, Textarea, Button, Loader, Divider, ActionIcon,
} from '@mantine/core';
import { useForm, isEmail } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconClock, IconVideo, IconCalendarPlus, IconCheck, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { bookingApi } from '../api/client';
import { ApiError } from '../api/http';
import type { BookingPage, Slot, Booking } from '../api/types';
import { notifyError } from '../utils/notifications';

const BOOKER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<BookingPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [booked, setBooked] = useState<Booking | null>(null);
  const [date, setDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [bookOpened, { open: openBook, close: closeBook }] = useDisclosure();

  const form = useForm({
    initialValues: { name: '', email: '', notes: '' },
    validate: {
      name: (v) => (!v ? 'Name is required' : null),
      email: isEmail('Invalid email'),
    },
  });

  const load = useCallback(async (d: string) => {
    if (!slug) return;
    try {
      setLoading(true);
      const data = await bookingApi.page(slug, d);
      setData(data);
    } catch (err) {
      notifyError(err, 'Failed to load page');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load(date);
  }, [load, date]);

  const handleBook = async (values: typeof form.values) => {
    if (!slug || !selectedSlot) return;
    try {
      const result = await bookingApi.book(slug, {
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        booker: { name: values.name, email: values.email, notes: values.notes || undefined },
      });
      setBooked(result);
      closeBook();
      notifications.show({ title: 'Booked!', message: 'Your meeting has been booked successfully.', color: 'green' });
    } catch (err) {
      closeBook();
      if (err instanceof ApiError && err.status === 409) {
        notifications.show({
          title: 'Slot just taken',
          message: 'Someone else booked this slot while you were filling in the form. Please choose another time.',
          color: 'orange',
        });
        load(date);
      } else {
        notifyError(err, 'Booking failed');
      }
    }
  };

  if (!slug) {
    return (
      <Card withBorder p="xl" maw={500} mx="auto" mt="xl">
        <Text c="dimmed" ta="center">No booking link specified.</Text>
      </Card>
    );
  }

  if (loading) {
    return <Stack align="center" mt="xl"><Loader /></Stack>;
  }

  if (!data) {
    return (
      <Card withBorder p="xl" maw={500} mx="auto" mt="xl">
        <Text c="dimmed" ta="center">Event type not found.</Text>
      </Card>
    );
  }

  const { eventType, slots } = data;

  return (
    <Stack maw={580} mx="auto" mt="lg">
      <Card withBorder padding="lg" radius="md">
        <Group justify="center" mb="md">
          <IconCalendarPlus
            size={36}
            color="var(--mantine-color-orange-6)"
          />
        </Group>
        <Title order={2} ta="center" mb="xs">{eventType.title}</Title>
        {eventType.description && (
          <Text c="dimmed" ta="center" size="sm" mb="md">
            {eventType.description}
          </Text>
        )}
        <Group justify="center">
          <Badge
            variant="light"
            color="orange"
            size="lg"
            leftSection={<IconClock size={14} />}
          >
            {eventType.durationMinutes} minutes
          </Badge>
        </Group>
      </Card>

      <Card withBorder padding="md" radius="md">
        <Group justify="center" gap="xl">
          <ActionIcon
            variant="subtle"
            size="lg"
            onClick={() => setDate(dayjs(date).subtract(1, 'day').format('YYYY-MM-DD'))}
          >
            <IconChevronLeft />
          </ActionIcon>
          <Text fw={600} size="lg">{dayjs(date).format('dddd, MMMM D, YYYY')}</Text>
          <ActionIcon
            variant="subtle"
            size="lg"
            onClick={() => setDate(dayjs(date).add(1, 'day').format('YYYY-MM-DD'))}
          >
            <IconChevronRight />
          </ActionIcon>
        </Group>
      </Card>

      {booked ? (
        <Card withBorder padding="lg" radius="md" style={{ backgroundColor: 'var(--mantine-color-green-0)' }}>
          <Group justify="center" mb="md">
            <IconCheck size={36} color="var(--mantine-color-green-6)" />
          </Group>
          <Title order={3} ta="center" c="green" mb="md">Meeting Confirmed!</Title>
          <Stack gap="xs" align="center">
            <Text>
              <strong>Date:</strong> {dayjs(booked.startTime).format('MMMM D, YYYY')}
            </Text>
            <Text>
              <strong>Time:</strong> {dayjs(booked.startTime).format('HH:mm')} - {dayjs(booked.endTime).format('HH:mm')} {BOOKER_TZ}
            </Text>
            <Divider my="sm" />
            <Button
              component="a"
              href={booked.zoomLink}
              target="_blank"
              variant="filled"
              color="blue"
              leftSection={<IconVideo size={18} />}
              size="md"
            >
              Join Zoom Meeting
            </Button>
          </Stack>
        </Card>
      ) : (
        <Card withBorder padding="lg" radius="md">
          <Title order={4} mb="md">Select a time slot</Title>
          {slots.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              No available slots at the moment.
            </Text>
          ) : (
            <Stack gap="sm">
              {slots.map((slot, idx) => (
                <Card
                  key={idx}
                  withBorder
                  padding="md"
                  radius="md"
                  style={{ cursor: 'pointer' }}
                  onClick={() => { setSelectedSlot(slot); form.reset(); openBook(); }}
                >
                  <Group justify="space-between">
                    <Stack gap={2}>
                      <Text fw={600}>{dayjs(slot.startTime).format('MMMM D, YYYY')}</Text>
                      <Group gap={4}>
                        <IconClock size={14} color="var(--mantine-color-gray-5)" />
                        <Text size="sm" c="dimmed">
                          {dayjs(slot.startTime).format('HH:mm')} - {dayjs(slot.endTime).format('HH:mm')} {BOOKER_TZ}
                        </Text>
                      </Group>
                    </Stack>
                    <Button variant="light" color="orange">Book</Button>
                  </Group>
                </Card>
              ))}
            </Stack>
          )}
        </Card>
      )}

      <Modal opened={bookOpened} onClose={closeBook} title="Complete Booking" centered>
        <form onSubmit={form.onSubmit(handleBook)}>
          <Stack gap="md">
            {selectedSlot && (
              <Text size="sm" c="dimmed">
                {dayjs(selectedSlot.startTime).format('MMMM D, YYYY HH:mm')} - {dayjs(selectedSlot.endTime).format('HH:mm')} {BOOKER_TZ}
              </Text>
            )}
            <TextInput label="Your Name" required data-autofocus {...form.getInputProps('name')} />
            <TextInput label="Email" required {...form.getInputProps('email')} />
            <Textarea label="Notes (optional)" {...form.getInputProps('notes')} />
            <Button type="submit" fullWidth>Confirm Booking</Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}