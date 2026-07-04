import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppShell,
  Burger,
  Group,
  NavLink,
  Title,
  Text,
  Modal,
  TextInput,
  Button,
  Stack,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const navItems = [
  { label: 'Event Types', path: '/event-types' },
  { label: 'Availability', path: '/availability' },
  { label: 'Calendar', path: '/calendar' },
];

export function Layout() {
  const [opened, { toggle }] = useDisclosure();
  const { userId, setUserId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authModalOpened, setAuthModalOpened] = useState(false);
  const [inputUserId, setInputUserId] = useState('');

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title
              order={3}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/')}
            >
              Cal Fork
            </Title>
          </Group>
          <Group>
            <Text size="sm" c="dimmed">
              {userId ? `User: ${userId}` : 'Not authenticated'}
            </Text>
            <Button
              variant="subtle"
              size="xs"
              onClick={() => {
                if (userId) {
                  setUserId(null);
                  return;
                }
                setInputUserId('');
                setAuthModalOpened(true);
              }}
            >
              {userId ? 'Logout' : 'Login'}
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            label={item.label}
            active={location.pathname.startsWith(item.path)}
            onClick={() => navigate(item.path)}
            variant="subtle"
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>

      <Modal
        opened={authModalOpened}
        onClose={() => setAuthModalOpened(false)}
        title="Set User ID"
      >
        <Stack>
          <TextInput
            label="User ID"
            placeholder="Enter your user ID"
            value={inputUserId}
            onChange={(e) => setInputUserId(e.currentTarget.value)}
            data-autofocus
          />
          <Button
            onClick={() => {
              if (inputUserId.trim()) {
                setUserId(inputUserId.trim());
                setAuthModalOpened(false);
              }
            }}
          >
            Save
          </Button>
        </Stack>
      </Modal>
    </AppShell>
  );
}