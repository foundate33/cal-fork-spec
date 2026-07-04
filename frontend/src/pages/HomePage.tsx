import { Title, Text, Button, Group, Stack } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function HomePage() {
  const { userId } = useAuth();
  const navigate = useNavigate();

  return (
    <Stack align="center" mt="xl" gap="lg">
      <Title order={1}>Cal Fork</Title>
      <Text c="dimmed" size="lg" ta="center" maw={500}>
        Simple scheduling for everyone. Create event types, manage your
        calendar, and share booking links with your clients.
      </Text>
      {userId ? (
        <Group>
          <Button onClick={() => navigate('/event-types')}>
            Event Types
          </Button>
          <Button variant="light" onClick={() => navigate('/calendar')}>
            Calendar
          </Button>
        </Group>
      ) : (
        <Text c="dimmed">
          Set your User ID in the header to get started.
        </Text>
      )}
    </Stack>
  );
}