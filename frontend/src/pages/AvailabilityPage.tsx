import { useEffect, useState } from 'react';
import {
  Table, Button, Group, Text, Loader, Title, Badge, Stack, Modal, Card,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconClock, IconEdit, IconTrash } from '@tabler/icons-react';
import { availabilityApi } from '../api/client';
import type { AvailabilityRule, AvailabilityRuleCreate, AvailabilityRuleUpdate, WeekDay } from '../api/types';
import { AvailabilityForm } from '../components/AvailabilityForm';
import { notifyError } from '../utils/notifications';

const dayLabels: Record<WeekDay, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

export function AvailabilityPage() {
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure();
  const [editing, setEditing] = useState<AvailabilityRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AvailabilityRule | null>(null);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const data = await availabilityApi.list();
      setRules(data);
    } catch (err) {
      notifyError(err, 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRules(); }, []);

  const handleSave = async (data: AvailabilityRuleCreate | AvailabilityRuleUpdate) => {
    try {
      if (editing) {
        await availabilityApi.update(editing.id, data as AvailabilityRuleUpdate);
      } else {
        await availabilityApi.create(data as AvailabilityRuleCreate);
      }
      setEditing(null);
      await fetchRules();
      notifications.show({ title: 'Success', message: editing ? 'Rule updated' : 'Rule created', color: 'green' });
    } catch (err) {
      notifyError(err, 'Operation failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await availabilityApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      await fetchRules();
      notifications.show({ title: 'Deleted', message: 'Rule deleted', color: 'green' });
    } catch (err) {
      notifyError(err, 'Delete failed');
    }
  };

  if (loading) {
    return <Stack align="center" mt="xl"><Loader /></Stack>;
  }

  return (
    <>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Availability</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => { setEditing(null); openForm(); }}
        >
          Add Rule
        </Button>
      </Group>

      {rules.length === 0 ? (
        <Card withBorder p="xl">
          <Stack align="center" gap="md">
            <IconClock size={40} color="var(--mantine-color-gray-4)" />
            <Text c="dimmed" ta="center">
              No availability rules yet. Add your first rule to define when you're available.
            </Text>
          </Stack>
        </Card>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Days</Table.Th>
              <Table.Th>Time</Table.Th>
              <Table.Th>Timezone</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rules.map((rule) => (
              <Table.Tr key={rule.id}>
                <Table.Td>
                  <Group gap={4}>
                    {rule.daysOfWeek.map((d) => (
                      <Badge key={d} variant="light" color="orange" size="sm">
                        {dayLabels[d] || d}
                      </Badge>
                    ))}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Badge variant="outline" color="blue">
                    {rule.startTime} - {rule.endTime}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">{rule.timezone}</Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button
                      variant="subtle"
                      size="xs"
                      leftSection={<IconEdit size={14} />}
                      onClick={() => { setEditing(rule); openForm(); }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="subtle"
                      size="xs"
                      color="red"
                      leftSection={<IconTrash size={14} />}
                      onClick={() => setDeleteTarget(rule)}
                    >
                      Delete
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <AvailabilityForm opened={formOpened} onClose={() => { closeForm(); setEditing(null); }} rule={editing} onSave={handleSave} />
      <Modal opened={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete" centered>
        <Stack>
          <Text>Are you sure you want to delete this availability rule?</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button color="red" onClick={handleDelete}>Delete</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}