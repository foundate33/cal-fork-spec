import { useEffect, useState } from 'react';
import {
  Table, Button, Group, Text, Loader, Title, Badge, Stack, Modal, Card,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
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
      notifications.show({
        title: 'Success',
        message: editing ? 'Rule updated' : 'Rule created',
        color: 'green',
      });
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
      <Group justify="space-between" mb="md">
        <Title order={2}>Availability</Title>
        <Button onClick={() => { setEditing(null); openForm(); }}>Add Rule</Button>
      </Group>

      {rules.length === 0 ? (
        <Card withBorder p="xl">
          <Text c="dimmed" ta="center">
            No availability rules yet. Add your first rule to define when you're available.
          </Text>
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
                  {rule.daysOfWeek.map((d) => dayLabels[d] || d).join(', ')}
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" color="blue">
                    {rule.startTime} - {rule.endTime}
                  </Badge>
                </Table.Td>
                <Table.Td><Text size="sm">{rule.timezone}</Text></Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button variant="subtle" size="xs" onClick={() => { setEditing(rule); openForm(); }}>
                      Edit
                    </Button>
                    <Button variant="subtle" size="xs" color="red" onClick={() => setDeleteTarget(rule)}>
                      Delete
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <AvailabilityForm
        opened={formOpened}
        onClose={() => { closeForm(); setEditing(null); }}
        rule={editing}
        onSave={handleSave}
      />

      <Modal opened={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete">
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