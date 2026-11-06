import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { documentRequests } from '../api/endpoints';
import usePagedList from '../hooks/usePagedList';
import { errorMessage, formatDate, formatDateTime, humanize } from '../utils/format';
import logoUrl from '../assets/logo.png';

const INITIAL_FILTERS = { status: '', type: '' };

const STATUSES = ['Pending', 'Approved', 'ReadyForPickup', 'Released', 'Rejected'];
const TYPES = ['BarangayClearance', 'CertificateOfIndigency'];
const TYPE_LABELS = {
  BarangayClearance: 'Barangay Clearance',
  CertificateOfIndigency: 'Certificate of Indigency',
};

/** Which follow-up state each status allows (mirrors the backend rules). */
const NEXT_STATUSES = {
  Pending: ['Approved', 'Rejected'],
  Approved: ['ReadyForPickup'],
  ReadyForPickup: ['Released'],
  Released: [],
  Rejected: [],
};

export default function DocumentRequests() {
  const { isAdmin, isHeadAdmin } = useAuth();
  const toast = useToast();

  const list = usePagedList(documentRequests.list, { initialFilters: INITIAL_FILTERS });

  const [detail, setDetail] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: 'Approved', remarks: '' });
  const [statusBusy, setStatusBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  function openStatusModal(row) {
    const options = NEXT_STATUSES[row.status] || [];
    setStatusTarget(row);
    setStatusForm({ status: options[0] || row.status, remarks: '' });
  }

  async function submitStatus(event) {
    event.preventDefault();
    if (!statusTarget) return;
    setStatusBusy(true);
    try {
      await documentRequests.setStatus(statusTarget.id, {
        status: statusForm.status,
        remarks: statusForm.remarks,
      });
      toast.success(`${statusTarget.referenceNumber} marked ${humanize(statusForm.status)}.`);
      setStatusTarget(null);
      list.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setStatusBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await documentRequests.remove(deleteTarget.id);
      toast.success(`${deleteTarget.referenceNumber} deleted.`);
      setDeleteTarget(null);
      list.reloadAfterDelete();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeleteBusy(false);
    }
  }

  function printRequest(row) {
    const href = window.location.href;
    const sealSrc = new URL(logoUrl, href).href;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => iframe.remove(), 2000);
      }, 400);
    };
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(buildPrintableHtml(row, sealSrc));
    doc.close();
  }

  const columns = [
    { key: 'ref', header: 'Ref #', render: (row) => <strong>{row.referenceNumber}</strong> },
    {
      key: 'type',
      header: 'Document',
      render: (row) => TYPE_LABELS[row.documentType] || humanize(row.documentType),
    },
    {
      key: 'resident',
      header: 'Resident',
      render: (row) => (
        <span className="cell-stack">
          <strong>{row.residentName || '—'}</strong>
          <small>{row.residentContact || ''}</small>
        </span>
      ),
    },
    { key: 'purpose', header: 'Purpose', render: (row) => <span className="cell-truncate">{row.purpose || '—'}</span> },
    { key: 'createdAt', header: 'Requested', render: (row) => formatDate(row.createdAt) },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => {
        const canProcess = NEXT_STATUSES[row.status]?.length > 0;
        return (
          <div className="row-actions">
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setDetail(row)}>
              View
            </button>
            {isAdmin && row.status !== 'Released' && row.status !== 'Rejected' ? (
              <button type="button" className="btn btn-sm btn-primary" onClick={() => printRequest(row)}>
                Print
              </button>
            ) : null}
            {isAdmin && canProcess ? (
              <button type="button" className="btn btn-sm btn-primary" onClick={() => openStatusModal(row)}>
                {row.status === 'Pending' ? 'Review' : 'Update'}
              </button>
            ) : null}
            {isHeadAdmin ? (
              <button type="button" className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(row)}>
                Delete
              </button>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Document Requests"
        subtitle="Process barangay clearance and certificate of indigency requests."
        actions={
          <button type="button" className="btn btn-ghost" onClick={list.reload} disabled={list.loading}>
            {list.loading ? 'Refreshing…' : 'Refresh'}
          </button>
        }
      />

      <SearchBar
        search={list.search}
        onSearchChange={list.setSearch}
        onSubmit={list.submitSearch}
        onReset={list.reset}
        initialFilters={INITIAL_FILTERS}
        placeholder="Search by reference number, resident or purpose…"
        loading={list.loading}
      >
        <label className="filter">
          <span>Status</span>
          <select value={list.filters.status} onChange={(event) => list.setFilter('status', event.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {humanize(status)}
              </option>
            ))}
          </select>
        </label>
        <label className="filter">
          <span>Document</span>
          <select value={list.filters.type} onChange={(event) => list.setFilter('type', event.target.value)}>
            <option value="">All documents</option>
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>
      </SearchBar>

      {list.error ? (
        <div className="error-banner">
          <span>{list.error}</span>
          <button type="button" className="btn btn-sm btn-ghost" onClick={list.reload}>
            Retry
          </button>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        rows={list.items}
        loading={list.loading}
        emptyTitle="No document requests"
        emptyMessage="No requests match the current search or filters."
      />

      <Pagination
        page={list.page}
        totalPages={list.meta.totalPages}
        totalItems={list.meta.totalItems}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
        onPageSizeChange={(size) => {
          list.setPageSize(size);
          list.setPage(1);
        }}
        disabled={list.loading}
      />

      <Modal open={Boolean(detail)} title={detail ? detail.referenceNumber : ''} onClose={() => setDetail(null)} size="lg">
        {detail ? (
          <>
            <dl className="detail-list">
              <dt>Document</dt>
              <dd>{TYPE_LABELS[detail.documentType] || humanize(detail.documentType)}</dd>
              <dt>Status</dt>
              <dd>
                <StatusBadge status={detail.status} />
              </dd>
              <dt>Resident</dt>
              <dd>{detail.residentName || '—'}</dd>
              <dt>Address</dt>
              <dd>{detail.residentAddress || '—'}</dd>
              <dt>Contact number</dt>
              <dd>{detail.residentContact || '—'}</dd>
              <dt>Purpose</dt>
              <dd className="comment-body">{detail.purpose || '—'}</dd>
              <dt>Requested at</dt>
              <dd>{formatDateTime(detail.createdAt)}</dd>
              <dt>Processed by</dt>
              <dd>{detail.processedByName || 'Not yet processed'}</dd>
              <dt>Processed at</dt>
              <dd>{detail.processedAt ? formatDateTime(detail.processedAt) : '—'}</dd>
              <dt>Released at</dt>
              <dd>{detail.releasedAt ? formatDateTime(detail.releasedAt) : '—'}</dd>
              <dt>Staff remarks</dt>
              <dd className="comment-body">{detail.adminRemarks || '—'}</dd>
            </dl>
          </>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(statusTarget)}
        title={statusTarget ? `Process ${statusTarget.referenceNumber}` : ''}
        onClose={() => setStatusTarget(null)}
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setStatusTarget(null)} disabled={statusBusy}>
              Cancel
            </button>
            <button type="submit" form="document-status-form" className="btn btn-primary" disabled={statusBusy}>
              {statusBusy ? 'Saving…' : 'Save update'}
            </button>
          </>
        }
      >
        <form id="document-status-form" onSubmit={submitStatus}>
          <FormField label="Status" htmlFor="dr-status" required>
            <select
              id="dr-status"
              value={statusForm.status}
              onChange={(event) => setStatusForm((prev) => ({ ...prev, status: event.target.value }))}
            >
              {(NEXT_STATUSES[statusTarget?.status] || STATUSES).map((status) => (
                <option key={status} value={status}>
                  {humanize(status)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Remarks"
            htmlFor="dr-remarks"
            hint={statusForm.status === 'Rejected' ? 'Required — state the reason for rejection.' : 'Optional note for the resident.'}
          >
            <textarea
              id="dr-remarks"
              rows={4}
              value={statusForm.remarks}
              onChange={(event) => setStatusForm((prev) => ({ ...prev, remarks: event.target.value }))}
            />
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete document request"
        message={deleteTarget ? `Delete ${deleteTarget.referenceNumber}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
        busy={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Printable certificate (clearance / indigency)                       */
/* ------------------------------------------------------------------ */

function buildPrintableHtml(row, sealSrc) {
  const title = TYPE_LABELS[row.documentType] || 'Barangay Document';
  const today = new Date();
  const dateIssued = formatDate(today.toISOString());
  const name = (row.residentName || '—').toUpperCase().split(' ').join(' ');
  const body = row.documentType === 'CertificateOfIndigency'
    ? indigencyBody(name, row)
    : clearanceBody(name, row);

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page { size: A4 portrait; margin: 18mm 16mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', Georgia, serif;
      color: #1a1a1a;
      margin: 0;
    }
    .doc { display: flex; flex-direction: column; min-height: 250mm; }
    .letterhead { text-align: center; margin-bottom: 28px; }
    .letterhead .seal { width: 110px; height: 110px; object-fit: contain; margin: 6px auto 10px; display: block; }
    .republic { font-size: 13px; letter-spacing: 1px; margin: 0; }
    .barangay { font-size: 20px; font-weight: 700; margin: 2px 0 0; text-transform: uppercase; }
    .municipality { font-size: 13px; margin: 0; }
    .title { text-align: center; font-size: 26px; font-weight: 700; letter-spacing: 3px; margin: 30px 0 8px; }
    .ref { text-align: center; font-size: 13px; margin: 0 0 24px; color: #444; }
    .body { font-size: 15px; line-height: 1.9; text-align: justify; }
    .body b.name { letter-spacing: 1px; text-transform: uppercase; }
    .sign-area { margin-top: 60px; display: flex; justify-content: flex-end; }
    .sign { text-align: center; min-width: 240px; }
    .sign .name-line { border-top: 1px solid #000; margin-top: 46px; padding-top: 6px; font-weight: 700; }
    .sign .role { font-size: 13px; margin-top: 2px; }
    .note { margin-top: 34px; font-size: 12.5px; color: #333; border-top: 1px dashed #999; padding-top: 8px; }
    .stamp { margin-top: 10px; font-size: 13px; }
  </style>
</head>
<body>
  <div class="doc">
    <header class="letterhead">
      <p class="republic">REPUBLIC OF THE PHILIPPINES</p>
      <p class="municipality"><b>PROVINCE OF RIZAL</b></p>
      <p class="municipality"><b>MUNICIPALITY OF RODRIGUEZ</b></p>
      <p class="barangay">BARANGAY SAN JOSE</p>
      <img class="seal" src="${logoUrl}" alt="Barangay seal" />
    </header>

    <h1 class="title">${title.toUpperCase()}</h1>
    <p class="ref">Ref. No. ${row.referenceNumber}</p>

    ${body}

    <div class="sign-area">
      <div class="sign">
        <div class="name-line">${row.processedByName || 'HON. PUNONG BARANGAY'}</div>
        <div class="role">Punong Barangay</div>
      </div>
    </div>

    <p class="note">
      Issued ${dateIssued} at the Barangay Hall of Barangay San Jose, Rodriguez, Rizal.
      This document is valid for six (6) months from the date of issuance.
      Ref. No. ${row.referenceNumber} &middot; Claimed by the resident upon presentation of a valid ID.
    </p>
    <p class="stamp"><b>Status:</b> ${humanize(row.status)} &nbsp;&nbsp; <b>Purpose:</b> ${row.purpose}</p>
  </div>
</body>
</html>`;
}

function clearanceBody(name, row) {
  return `<div class="body">
    <p>To whom it may concern:</p>
    <p>
      This is to certify that <b class="name">${name}</b>,
      of legal age, is a resident of <b>Barangay San Jose, Rodriguez, Rizal</b>,
      and is personally known to be of good moral character and has no derogatory
      record filed in this barangay as of this issuance.
    </p>
    <p>
      This certification is issued upon the request of the above-named person
      for <b>${row.purpose}</b> and for whatever legal purpose it may serve.
    </p>
  </div>`;
}

function indigencyBody(name, row) {
  return `<div class="body">
    <p>To whom it may concern:</p>
    <p>
      This is to certify that <b class="name">${name}</b>
      is a resident of <b>Barangay San Jose, Rodriguez, Rizal</b> and belongs to an
      indigent family as certified by the barangay tanod and the office of the
      Punong Barangay.
    </p>
    <p>
      This certification is issued upon the request of the above-named person
      for <b>${row.purpose}</b> and for whatever legal purpose it may serve.
    </p>
  </div>`;
}
