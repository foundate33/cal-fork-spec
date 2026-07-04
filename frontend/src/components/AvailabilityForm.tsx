import { useEffect } from 'react';
import { Modal, Button, Stack, MultiSelect, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import type { AvailabilityRule, AvailabilityRuleCreate, AvailabilityRuleUpdate, WeekDay } from '../api/types';

const dayOptions = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

interface Props {
  opened: boolean;
  onClose: () => void;
  rule: AvailabilityRule | null;
  onSave: (data: AvailabilityRuleCreate | AvailabilityRuleUpdate) => Promise<void>;
}

export function AvailabilityForm({ opened, onClose, rule, onSave }: Props) {
  const form = useForm({
    initialValues: {
      daysOfWeek: [] as string[],
      startTime: '',
      endTime: '',
      timezone: 'Europe/Moscow',
    },
    validate: {
      daysOfWeek: (v) => (v.length === 0 ? 'Select at least one day' : null),
      startTime: (v) => (!v ? 'Start time is required' : null),
      endTime: (v, { startTime }) => {
        if (!v) return 'End time is required';
        if (startTime && v <= startTime) return 'End time must be after start time';
        return null;
      },
      timezone: (v) => (!v ? 'Timezone is required' : null),
    },
  });

  useEffect(() => {
    if (rule) {
      form.setValues({
        daysOfWeek: rule.daysOfWeek,
        startTime: rule.startTime,
        endTime: rule.endTime,
        timezone: rule.timezone,
      });
    } else {
      form.reset();
    }
  }, [rule, opened]);

  const handleSubmit = async (values: typeof form.values) => {
    const payload: AvailabilityRuleCreate = {
      daysOfWeek: values.daysOfWeek as WeekDay[],
      startTime: values.startTime,
      endTime: values.endTime,
      timezone: values.timezone,
    };
    await onSave(payload);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title={rule ? 'Edit Availability Rule' : 'Add Availability Rule'}>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <MultiSelect
            label="Days of Week"
            data={dayOptions}
            required
            data-autofocus
            {...form.getInputProps('daysOfWeek')}
          />
          <TextInput
            label="Start Time"
            placeholder="09:00"
            required
            {...form.getInputProps('startTime')}
          />
          <TextInput
            label="End Time"
            placeholder="17:00"
            required
            {...form.getInputProps('endTime')}
          />
          <TextInput
            label="Timezone"
            placeholder="Europe/Moscow"
            required
            {...form.getInputProps('timezone')}
          />
          <Button type="submit" fullWidth>{rule ? 'Update' : 'Add'}</Button>
        </Stack>
      </form>
    </Modal>
  );
}