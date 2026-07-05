import { useEffect } from 'react';
import { Modal, TextInput, NumberInput, Button, Stack, Textarea, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import type { EventType, EventTypeCreate, EventTypeUpdate, AvailabilityRule } from '../api/types';

interface Props {
  opened: boolean;
  onClose: () => void;
  eventType: EventType | null;
  availabilityRules: AvailabilityRule[];
  onSave: (data: EventTypeCreate | EventTypeUpdate) => Promise<void>;
}

export function EventTypeForm({ opened, onClose, eventType, availabilityRules, onSave }: Props) {
  const form = useForm({
    initialValues: {
      title: '',
      description: '',
      durationMinutes: 30,
      zoomLink: '',
      slug: '',
      availabilityRuleId: '',
    },
    validate: {
      title: (v) => (!v ? 'Title is required' : null),
      durationMinutes: (v) => (v < 1 ? 'Must be at least 1 minute' : null),
      zoomLink: (v) => (!v ? 'Zoom link is required' : null),
      availabilityRuleId: (v) => (!v ? 'Availability rule is required' : null),
    },
  });

  useEffect(() => {
    if (eventType) {
      form.setValues({
        title: eventType.title,
        description: eventType.description || '',
        durationMinutes: eventType.durationMinutes,
        zoomLink: eventType.zoomLink,
        slug: eventType.slug,
        availabilityRuleId: eventType.availabilityRuleId,
      });
    } else {
      form.reset();
    }
  }, [eventType, opened]);

  const handleSubmit = async (values: typeof form.values) => {
    await onSave(values);
    onClose();
  };

  const ruleOptions = availabilityRules.map((r) => ({
    value: r.id,
    label: `${r.daysOfWeek.join(', ')} ${r.startTime}-${r.endTime}`,
  }));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={eventType ? 'Edit Event Type' : 'Create Event Type'}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Title"
            placeholder="Meeting title"
            required
            data-autofocus
            {...form.getInputProps('title')}
          />
          <Textarea
            label="Description"
            placeholder="Optional description"
            {...form.getInputProps('description')}
          />
          <NumberInput
            label="Duration (minutes)"
            required
            min={1}
            {...form.getInputProps('durationMinutes')}
          />
          <TextInput
            label="Zoom Link"
            placeholder="https://zoom.us/j/..."
            required
            {...form.getInputProps('zoomLink')}
          />
          {!eventType && (
            <TextInput
              label="Custom slug (optional)"
              placeholder="my-meeting"
              {...form.getInputProps('slug')}
            />
          )}
          <Select
            label="Availability Rule"
            placeholder={availabilityRules.length === 0 ? 'No rules — create one first' : 'Select a rule'}
            data={ruleOptions}
            required
            disabled={availabilityRules.length === 0}
            {...form.getInputProps('availabilityRuleId')}
          />
          <Button type="submit" fullWidth>
            {eventType ? 'Update' : 'Create'}
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}