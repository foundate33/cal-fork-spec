import { notifications } from '@mantine/notifications';

export function notifyError(err: unknown, fallback: string) {
  notifications.show({
    title: 'Error',
    message: err instanceof Error ? err.message : fallback,
    color: 'red',
  });
}