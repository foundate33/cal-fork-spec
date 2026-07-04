import { Title, Text, Button, Group, Stack, Card, SimpleGrid, Container } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconCalendarEvent, IconClock, IconCalendarMonth, IconCalendarPlus } from '@tabler/icons-react';

const features = [
  {
    icon: IconCalendarEvent,
    title: 'Event Types',
    description: 'Create meeting templates with custom duration, description, and Zoom links.',
    path: '/event-types',
  },
  {
    icon: IconClock,
    title: 'Availability',
    description: 'Define recurring weekly schedules so bookers know when you\'re free.',
    path: '/availability',
  },
  {
    icon: IconCalendarMonth,
    title: 'Calendar',
    description: 'View all your upcoming bookings in one place, grouped by date.',
    path: '/calendar',
  },
];

export function HomePage() {
  const { userId } = useAuth();
  const navigate = useNavigate();

  return (
    <Container size="lg">
      <Stack align="center" mt={60} mb={60} gap="lg">
        <IconCalendarPlus
          size={48}
          color="var(--mantine-color-orange-6)"
        />
        <Title order={1} ta="center" fw={900} style={{ fontSize: '2.5rem', lineHeight: 1.2 }}>
          Simple scheduling
          <br />
          for everyone
        </Title>
        <Text c="dimmed" size="lg" ta="center" maw={540}>
          Create event types, manage your availability, and share booking links
          with your clients. No sign-up friction — just your User ID and you're
          ready to go.
        </Text>
        {userId ? (
          <Group>
            <Button
              size="md"
              leftSection={<IconCalendarEvent size={18} />}
              onClick={() => navigate('/event-types')}
            >
              Event Types
            </Button>
            <Button
              size="md"
              variant="light"
              leftSection={<IconCalendarMonth size={18} />}
              onClick={() => navigate('/calendar')}
            >
              Calendar
            </Button>
          </Group>
        ) : (
          <Stack align="center" gap="xs">
            <Text size="sm" c="dimmed">
              Click <strong>Sign in</strong> in the sidebar to get started.
            </Text>
          </Stack>
        )}
      </Stack>

      {userId && (
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb={60}>
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card
                key={f.title}
                padding="lg"
                radius="md"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(f.path)}
              >
                <Icon
                  size={28}
                  color="var(--mantine-color-orange-6)"
                  style={{ marginBottom: 12 }}
                />
                <Text fw={600} mb="xs">
                  {f.title}
                </Text>
                <Text size="sm" c="dimmed">
                  {f.description}
                </Text>
              </Card>
            );
          })}
        </SimpleGrid>
      )}
    </Container>
  );
}