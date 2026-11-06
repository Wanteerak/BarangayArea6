import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import ErrorBanner from '../components/ErrorBanner';
import Modal from '../components/Modal';
import ComboSelect from '../components/ComboSelect';
import Input from '../components/Input';
import { documentRequests } from '../api';
import { config } from '../config';
import { colors, fonts, spacing } from '../theme';
import { formatDate } from '../utils/format';

const STATUS_OPTIONS = ['Pending', 'Approved', 'ReadyForPickup', 'Released', 'Rejected'];

const DOCUMENT_TYPE_LABELS = ['Barangay Clearance', 'Certificate of Indigency'];

const TIMELINE = {
  Pending: ['Pending', 'Approved', 'ReadyForPickup', 'Released'],
  Approved: ['Approved', 'ReadyForPickup', 'Released'],
  ReadyForPickup: ['ReadyForPickup', 'Released'],
  Released: ['Released'],
  Rejected: ['Rejected'],
};

export default function RequestsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [formVisible, setFormVisible] = useState(false);
  const [typeLabel, setTypeLabel] = useState(DOCUMENT_TYPE_LABELS[0]);
  const [purpose, setPurpose] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const data = await documentRequests.list({
        page: 1,
        pageSize: config.pageSize,
        sortBy: 'id',
        sortDir: 'desc',
      });
      setItems((data && data.items) || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await documentRequests.list({
        page: 1,
        pageSize: config.pageSize,
        sortBy: 'id',
        sortDir: 'desc',
      });
      setItems((data && data.items) || []);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  async function submitRequest() {
    if (!purpose.trim()) {
      setFormError('Please state the purpose of your request.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await documentRequests.create({
        documentType: typeLabel === 'Certificate of Indigency' ? 'CertificateOfIndigency' : 'BarangayClearance',
        purpose: purpose.trim(),
      });
      setFormVisible(false);
      setPurpose('');
      setTypeLabel(DOCUMENT_TYPE_LABELS[0]);
      await load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function renderItem({ item }) {
    return (
      <Card style={styles.card}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.ref}>{item.referenceNumber}</Text>
            <Text style={styles.docType}>
              {item.documentType === 'CertificateOfIndigency'
                ? 'Certificate of Indigency'
                : 'Barangay Clearance'}
            </Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        <Text style={styles.purpose} numberOfLines={2}>
          Purpose: {item.purpose}
        </Text>

        <View style={styles.timelineRow}>
          {(TIMELINE[item.status] || ['Pending']).map((step, index) => (
            <Text key={step} style={[styles.timelineStep, index === 0 ? styles.timelineActive : null]}>
              {humanize(step)}
              {index < (TIMELINE[item.status] || []).length - 1 ? '  →' : ''}
            </Text>
          ))}
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.date}>Requested {formatDate(item.createdAt)}</Text>
          {item.adminRemarks ? (
            <Text style={styles.remarks} numberOfLines={2}>
              Note: {item.adminRemarks}
            </Text>
          ) : null}
          {item.status === 'ReadyForPickup' ? (
            <Text style={styles.pickup}>
              Your document is ready! Present a valid ID at the Barangay Hall to claim it.
            </Text>
          ) : null}
        </View>
      </Card>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Document Requests</Text>
        <Text style={styles.subtitle}>Barangay clearance & certificate of indigency</Text>
      </View>

      <View style={styles.newWrap}>
        <Button title="+ New Request" onPress={() => setFormVisible(true)} />
      </View>

      {error ? <ErrorBanner message={error} onRetry={load} /> : null}

      {loading && !refreshing && items.length === 0 ? (
        <Loading label="Loading your requests…" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={items.length === 0 ? styles.emptyList : styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState
              title="No requests yet"
              message="Tap New Request to apply for a barangay clearance or certificate of indigency."
            />
          }
        />
      )}

      <Modal visible={formVisible} title="New Document Request" onClose={() => setFormVisible(false)}>
        <ComboSelect
          label="Document type"
          suggestions={DOCUMENT_TYPE_LABELS}
          value={typeLabel}
          onChange={(label) => {
            setTypeLabel(label);
            setFormError('');
          }}
          allowCustom={false}
          placeholder="Choose a document…"
          required
        />
        <Input
          label="Purpose"
          value={purpose}
          onChangeText={setPurpose}
          placeholder="e.g. Job application, scholarship, medical assistance…"
          multiline
          style={styles.purposeInput}
        />
        {formError ? <ErrorBanner message={formError} /> : null}
        <View style={styles.formActions}>
          <Button title="Cancel" variant="ghost" onPress={() => setFormVisible(false)} disabled={saving} />
          <Button title={saving ? 'Submitting…' : 'Submit request'} onPress={submitRequest} loading={saving} />
        </View>
        <Text style={styles.formNote}>
          Requests are reviewed by barangay staff. Once approved and printed, you will claim your
          document at the Barangay Hall with your reference number.
        </Text>
      </Modal>
    </SafeAreaView>
  );
}

function humanize(value) {
  if (value === 'ReadyForPickup') return 'Ready for pickup';
  return value;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  title: { fontSize: fonts.xl, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: fonts.sm, color: colors.textMuted, marginTop: 2 },
  newWrap: { paddingHorizontal: spacing.lg, marginTop: spacing.md },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  emptyList: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  card: { marginBottom: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ref: { fontSize: fonts.sm, color: colors.textMuted, fontWeight: '700' },
  docType: { fontSize: fonts.md, fontWeight: '700', color: colors.text, marginTop: 2 },
  purpose: { fontSize: fonts.sm, color: colors.textMuted, marginTop: spacing.sm },
  timelineRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  timelineStep: { fontSize: fonts.xs, color: colors.textMuted, marginRight: spacing.sm },
  timelineActive: { color: colors.primary, fontWeight: '700' },
  footerRow: { marginTop: spacing.sm },
  date: { fontSize: fonts.xs, color: colors.textMuted },
  remarks: { fontSize: fonts.xs, color: colors.text, marginTop: 4 },
  pickup: { fontSize: fonts.xs, color: colors.success, marginTop: 6, fontWeight: '700' },
  purposeInput: { minHeight: 90 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.md, gap: 8 },
  formNote: { fontSize: fonts.xs, color: colors.textMuted, marginTop: spacing.md, lineHeight: 18 },
});
