import React, { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  CheckCircle2,
  Download,
  Inbox,
  Mail,
  MessageCircle,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { ConfirmModal } from '../ConfirmModal';
import { deleteLead, fetchOwnerLeads, updateLeadStatus } from '../../lib/firestoreService';
import { downloadTextFile, escapeCsvCell } from '../../lib/validation';
import { LeadRecord, LeadStatus, ProfileConfig } from '../../types/linkora';

interface AudienceLeadsPanelProps {
  uid: string;
  profile: ProfileConfig;
  onGoToBioEditor: () => void;
}

export const AudienceLeadsPanel: React.FC<AudienceLeadsPanelProps> = ({
  uid,
  profile,
  onGoToBioEditor,
}) => {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | LeadStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<LeadRecord | null>(null);

  const loadLeads = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const items = await fetchOwnerLeads(uid);
      setLeads(items);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to load visitor inquiries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLeads();
  }, [uid]);

  const counts = useMemo(() => {
    const c = { all: leads.length, new: 0, contacted: 0, archived: 0 };
    leads.forEach((l) => {
      if (l.status in c) c[l.status] += 1;
    });
    return c;
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return leads.filter((lead) => {
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
      if (!q) return true;
      return (
        lead.visitorName.toLowerCase().includes(q) ||
        lead.visitorEmail.toLowerCase().includes(q) ||
        lead.visitorPhone.toLowerCase().includes(q) ||
        lead.message.toLowerCase().includes(q)
      );
    });
  }, [leads, statusFilter, searchQuery]);

  const handleStatusChange = async (lead: LeadRecord, nextStatus: LeadStatus) => {
    setBusyId(lead.id);
    setErrorMsg('');
    try {
      await updateLeadStatus(lead.id, nextStatus);
      setLeads((prev) =>
        prev.map((item) => (item.id === lead.id ? { ...item, status: nextStatus } : item))
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update inquiry status.');
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    setErrorMsg('');
    try {
      await deleteLead(deleteTarget.id);
      setLeads((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete inquiry.');
    } finally {
      setBusyId(null);
    }
  };

  const handleExportCsv = () => {
    const headers = ['Date', 'Status', 'Name', 'Email', 'Phone', 'Message'];
    const rows = filteredLeads.map((l) => {
      const isoDate = l.createdAt?.toDate?.()?.toISOString?.() || '';
      return [
        escapeCsvCell(isoDate),
        escapeCsvCell(l.status),
        escapeCsvCell(l.visitorName),
        escapeCsvCell(l.visitorEmail),
        escapeCsvCell(l.visitorPhone),
        escapeCsvCell(l.message),
      ].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\r\n');
    downloadTextFile(
      `linkora-leads-${profile.username}-${new Date().toISOString().slice(0, 10)}.csv`,
      csvContent,
      'text/csv;charset=utf-8'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Lead Capture Status */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Audience &amp; Visitor Inquiries
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Messages submitted through your public page inquiry form are stored privately here.
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5">
            Public Form Status:{' '}
            <strong
              className={
                profile.leadCaptureEnabled
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }
            >
              {profile.leadCaptureEnabled ? 'Enabled on your bio page' : 'Currently disabled'}
            </strong>
            {' · '}
            <button
              type="button"
              onClick={onGoToBioEditor}
              className="text-indigo-600 dark:text-indigo-400 font-semibold underline cursor-pointer"
            >
              Configure Form in Bio Editor
            </button>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            disabled={filteredLeads.length === 0}
            onClick={handleExportCsv}
            className="min-h-[38px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
          <button
            type="button"
            onClick={loadLeads}
            aria-label="Refresh inquiries"
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-x-auto">
          {(
            [
              ['all', `All (${counts.all})`],
              ['new', `New (${counts.new})`],
              ['contacted', `Contacted (${counts.contacted})`],
              ['archived', `Archived (${counts.archived})`],
            ] as ['all' | LeadStatus, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatusFilter(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                statusFilter === id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, email, phone..."
            aria-label="Search inquiries"
            className="w-full min-h-[38px] pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Leads List */}
      {loading ? (
        <div className="space-y-3">
          <div className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          <div className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-10 text-center">
          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {leads.length === 0 ? 'No visitor inquiries yet' : 'No matching inquiries'}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {profile.leadCaptureEnabled
              ? 'When visitors submit your bio page contact form, their contact details and message will appear here.'
              : 'Turn on the Visitor Lead Capture Form in your Bio Page Editor so potential clients and followers can message you directly.'}
          </p>
          {!profile.leadCaptureEnabled && (
            <button
              type="button"
              onClick={onGoToBioEditor}
              className="mt-4 min-h-[38px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
            >
              Enable Lead Capture Form
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map((lead) => {
            const cleanWaDigits = lead.visitorPhone.replace(/[^0-9]/g, '');
            const dateStr = lead.createdAt?.toDate?.()
              ? lead.createdAt.toDate().toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recent';

            return (
              <div
                key={lead.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {lead.visitorName}
                      </span>
                      <span aria-hidden="true" className="text-slate-400">
                        ·
                      </span>
                      <span className="font-mono text-slate-600 dark:text-slate-300">
                        {lead.visitorEmail}
                      </span>
                      {lead.visitorPhone && (
                        <>
                          <span aria-hidden="true" className="text-slate-400">
                            ·
                          </span>
                          <span className="font-mono text-slate-600 dark:text-slate-300">
                            {lead.visitorPhone}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums">
                      <span>Received {dateStr}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`font-semibold capitalize ${
                          lead.status === 'new'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : lead.status === 'contacted'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-slate-500'
                        }`}
                      >
                        Status: {lead.status}
                      </span>
                    </div>
                  </div>

                  {/* Quick Reply & Status Controls */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <a
                      href={`mailto:${encodeURIComponent(lead.visitorEmail)}?subject=${encodeURIComponent(
                        `Re: Your message on Linkora (@${profile.username})`
                      )}`}
                      className="min-h-[34px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email</span>
                    </a>

                    {cleanWaDigits.length >= 7 && (
                      <a
                        href={`https://wa.me/${cleanWaDigits}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[34px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {lead.status !== 'contacted' && (
                      <button
                        type="button"
                        disabled={busyId === lead.id}
                        onClick={() => handleStatusChange(lead, 'contacted')}
                        className="min-h-[34px] px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900/60 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Contacted</span>
                      </button>
                    )}

                    {lead.status !== 'archived' && (
                      <button
                        type="button"
                        disabled={busyId === lead.id}
                        onClick={() => handleStatusChange(lead, 'archived')}
                        title="Archive inquiry"
                        className="min-h-[34px] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>Archive</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={busyId === lead.id}
                      onClick={() => setDeleteTarget(lead)}
                      aria-label={`Delete inquiry from ${lead.visitorName}`}
                      className="w-8 h-8 rounded-lg border border-red-200 dark:border-red-900/60 flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {lead.message && (
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 rounded-xl p-3.5 whitespace-pre-line">
                    {lead.message}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete this inquiry?"
        description={`Remove the message from "${deleteTarget?.visitorName || ''}" permanently from your inbox?`}
        confirmLabel="Delete Inquiry"
        busy={Boolean(busyId)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
