import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppShell,
  Burger,
  Group,
  Text,
  Modal,
  TextInput,
  Button,
  Stack,
  UnstyledButton,
  Box,
  Avatar,
  Tooltip,
  ActionIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconCalendarEvent,
  IconClock,
  IconCalendarMonth,
  IconCalendarPlus,
  IconLogout,
  IconLogin,
  IconUser,
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const navItems = [
  { label: 'Event Types', path: '/event-types', icon: IconCalendarEvent },
  { label: 'Availability', path: '/availability', icon: IconClock },
  { label: 'Calendar', path: '/calendar', icon: IconCalendarMonth },
];

export function Layout() {
  const [opened, { toggle }] = useDisclosure();
  const { userId, setUserId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authModalOpened, setAuthModalOpened] = useState(false);
  const [inputUserId, setInputUserId] = useState('');

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: 275,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="lg"
      styles={{ main: { backgroundColor: 'var(--mantine-color-gray-0)' } }}
    >
      <AppShell.Header>
        <Group h="100%" px="lg" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <IconCalendarPlus
              size={24}
              color="var(--mantine-color-orange-6)"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/')}
            />
            <Text
              fw={700}
              size="lg"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/')}
            >
              Cal Fork
            </Text>
          </Group>
          <Group>
            <Tooltip label={userId ? `Logged in as ${userId}` : 'Not authenticated'}>
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => {
                  if (userId) {
                    setUserId(null);
                    return;
                  }
                  setInputUserId('');
                  setAuthModalOpened(true);
                }}
              >
                {userId ? <IconUser size={18} /> : <IconLogin size={18} />}
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar
        bg="dark.8"
        style={{ borderRight: '1px solid var(--mantine-color-dark-6)' }}
      >
        <Stack gap={2} p="md" flex={1}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <UnstyledButton
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: 'var(--mantine-radius-md)',
                  background: active
                    ? 'var(--mantine-color-dark-6)'
                    : 'transparent',
                  color: active
                    ? 'var(--mantine-color-orange-4)'
                    : 'var(--mantine-color-dark-0)',
                  borderLeft: active
                    ? '3px solid var(--mantine-color-orange-6)'
                    : '3px solid transparent',
                  fontWeight: active ? 600 : 400,
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={20} stroke={1.5} />
                <Text size="sm">{item.label}</Text>
              </UnstyledButton>
            );
          })}
        </Stack>

        <Box
          p="md"
          style={{
            borderTop: '1px solid var(--mantine-color-dark-6)',
          }}
        >
          {userId ? (
            <UnstyledButton
              onClick={() => setUserId(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: 'var(--mantine-radius-md)',
                color: 'var(--mantine-color-dark-1)',
                width: '100%',
                transition: 'background 0.15s ease',
              }}
            >
              <Avatar size="sm" radius="xl" color="orange">
                {userId.charAt(0).toUpperCase()}
              </Avatar>
              <Box style={{ flex: 1 }}>
                <Text size="sm" fw={500} c="white">
                  {userId}
                </Text>
                <Text size="xs" c="dimmed">
                  Signed in
                </Text>
              </Box>
              <IconLogout size={16} />
            </UnstyledButton>
          ) : (
            <UnstyledButton
              onClick={() => {
                setInputUserId('');
                setAuthModalOpened(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: 'var(--mantine-radius-md)',
                color: 'var(--mantine-color-dark-1)',
                width: '100%',
                transition: 'background 0.15s ease',
              }}
            >
              <IconLogin size={18} />
              <Text size="sm">Sign in</Text>
            </UnstyledButton>
          )}
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>

      <Modal
        opened={authModalOpened}
        onClose={() => setAuthModalOpened(false)}
        title="Sign in"
        centered
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
            fullWidth
          >
            Sign in
          </Button>
        </Stack>
      </Modal>
    </AppShell>
  );
}