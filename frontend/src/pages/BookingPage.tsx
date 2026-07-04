import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Title,
  Text,
  Card,
  Badge,
  Stack,
  Group,
  Modal,
  TextInput,
  Textarea,
  Button,
  Loader,
  Divider,
} from '@mantine/core';
import { useForm, isEmail } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { bookingApi } from '../api/client';
import type { BookingPage, Slot, Booking } from '../api/types';
import { notifyError } from '../utils/notifications';

export function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<BookingPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [booked, setBooked] = useState<Booking | null>(null);
  const [bookOpened, { open: openBook, close: closeBook }] = useDisclosure();

  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      notes: '',
    },
    validate: {
      name: (v) => (!v ? 'Name is required' : null),
      email: isEmail('Invalid email'),
    },
  });

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await bookingApi.page(slug);
        setData(data);
      } catch (err) {
        notifyError(err, 'Failed to load page');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  const handleBook = async (values: typeof form.values) => {
    if (!slug || !selectedSlot) return;
    try {
      const result = await bookingApi.book(slug, {
        slotId: selectedSlot.id,
        booker: {
          name: values.name,
          email: values.email,
          notes: values.notes || undefined,
        },
      });
      setBooked(result);
      closeBook();
      notifications.show({
        title: 'Booked!',
        message: 'Your meeting has been booked successfully.',
        color: 'green',
      });
    } catch (err) {
      notifyError(err, 'Booking failed');
    }
  };

  if (loading) {
    return (
      <Stack align="center" mt="xl">
        <Loader />
      </Stack>
    );
  }

  if (!data) {
    return (
      <Card withBorder p="xl">
        <Text c="dimmed" ta="center">
          Event type not found.
        </Text>
      </Card>
    );
  }

  const { eventType, slots } = data;
  const availableSlots = slots.filter((s) => s.status === 'available');

  return (
    <Stack maw={600} mx="auto">
      <Card withBorder p="xl">
        <Title order={2}>{eventType.title}</Title>
        {eventType.description && (
          <Text c="dimmed" mt="sm">
            {eventType.description}
          </Text>
        )}
        <Group mt="md">
          <Badge variant="light" size="lg">
            {eventType.durationMinutes} minutes
          </Badge>
        </Group>
      </Card>

      {booked ? (
        <Card withBorder p="xl" bg="green.0">
          <Title order={3} c="green">
            Meeting Confirmed!
          </Title>
          <Stack mt="md" gap="xs">
            <Text>
              <strong>Date:</strong>{' '}
              {dayjs(booked.slot.startTime).format('MMMM D, YYYY')}
            </Text>
            <Text>
              <strong>Time:</strong>{' '}
              {dayjs(booked.slot.startTime).format('HH:mm')} -{' '}
              {dayjs(booked.slot.endTime).format('HH:mm')}
            </Text>
            <Divider />
            <Badge
              component="a"
              href={booked.zoomLink}
              target="_blank"
              variant="filled"
              color="blue"
              size="lg"
              style={{ cursor: 'pointer' }}
            >
              Join Zoom Meeting
            </Badge>
          </Stack>
        </Card>
      ) : (
        <Card withBorder p="xl">
          <Title order={3} mb="md">
            Select a time slot
          </Title>

          {availableSlots.length === 0 ? (
            <Text c="dimmed">No available slots at the moment.</Text>
          ) : (
            <Stack gap="sm">
              {availableSlots.map((slot) => (
                <Card
                  key={slot.id}
                  withBorder
                  p="sm"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedSlot(slot);
                    form.reset();
                    openBook();
                  }}
                >
                  <Group justify="space-between">
                    <Stack gap={0}>
                      <Text fw={500}>
                        {dayjs(slot.startTime).format('MMMM D, YYYY')}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {dayjs(slot.startTime).format('HH:mm')} -{' '}
                        {dayjs(slot.endTime).format('HH:mm')}
                      </Text>
                    </Stack>
                    <Button variant="light">Book</Button>
                  </Group>
                </Card>
              ))}
            </Stack>
          )}
        </Card>
      )}

      <Modal
        opened={bookOpened}
        onClose={closeBook}
        title="Complete Booking"
      >
        <form onSubmit={form.onSubmit(handleBook)}>
          <Stack gap="md">
            {selectedSlot && (
              <Text size="sm" c="dimmed">
                {dayjs(selectedSlot.startTime).format('MMMM D, YYYY HH:mm')} -{' '}
                {dayjs(selectedSlot.endTime).format('HH:mm')}
              </Text>
            )}
            <TextInput
              label="Your Name"
              required
              data-autofocus
              {...form.getInputProps('name')}
            />
            <TextInput
              label="Email"
              required
              {...form.getInputProps('email')}
            />
            <Textarea
              label="Notes (optional)"
              {...form.getInputProps('notes')}
            />
            <Button type="submit" fullWidth>
              Confirm Booking
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}