import { useEffect } from 'react';
import { Modal, Button, Stack } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import type { SlotCreate } from '../api/types';
import dayjs from 'dayjs';

interface Props {
  opened: boolean;
  onClose: () => void;
  onAdd: (slots: SlotCreate[]) => Promise<void>;
}

export function SlotForm({ opened, onClose, onAdd }: Props) {
  const form = useForm<{
    startTime: Date | null;
    endTime: Date | null;
  }>({
    initialValues: {
      startTime: null,
      endTime: null,
    },
    validate: {
      startTime: (v) => (!v ? 'Start time is required' : null),
      endTime: (v, { startTime }) => {
        if (!v) return 'End time is required';
        if (startTime && dayjs(v).isBefore(startTime)) {
          return 'End time must be after start time';
        }
        return null;
      },
    },
  });

  useEffect(() => {
    if (opened) form.reset();
  }, [opened]);

  const handleSubmit = async (values: typeof form.values) => {
    if (!values.startTime || !values.endTime) return;
    await onAdd([
      {
        startTime: values.startTime.toISOString(),
        endTime: values.endTime.toISOString(),
      },
    ]);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Add Slot">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <DateTimePicker
            label="Start Time"
            required
            clearable
            {...form.getInputProps('startTime')}
          />
          <DateTimePicker
            label="End Time"
            required
            clearable
            {...form.getInputProps('endTime')}
          />
          <Button type="submit" fullWidth>
            Add Slot
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}