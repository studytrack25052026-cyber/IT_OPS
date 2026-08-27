import React, { useState } from 'react';
import { EmailNotificationLog, SmtpConfig } from '../types';
import {
  Mail,
  Server,
  Send,
  X,
  CheckCircle2,
  Clock,
  Eye,
  FileCode,
  Sparkles,
  RefreshCw,
  Search
} from 'lucide-react';

interface SmtpConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  smtpConfig: SmtpConfig;
  onUpdateSmtpConfig: (newConfig: SmtpConfig) => void;
  emailLogs: EmailNotificationLog[];
  onClearLogs?: () => void;
}

export const SmtpConsoleModal: React.FC<SmtpConsoleModalProps> = ({
  isOpen,
  onClose,
  smtpConfig,
  onUpdateSmtpConfig,
  emailLogs,
}) => {
  const [selectedLog, setSelectedLog] = useState<EmailNotificationLog | null>(
    emailLogs.length > 0 ? emailLogs[0] : null
  );
  const [viewMode, setViewMode] = useState<'preview' | 'html'>('preview');
  const [searchQuery, setSearchQuery] = useState('');
  const [serverHostInput, setServerHostInput] = useState(smtpConfig.smtpServer);
  const [serverPortInput, setServerPortInput] = useState(smtpConfig.smtpPort.toString());
  const [fromAddressInput, setFromAddressInput] = useState(smtpConfig.fromAddress);
  const [fromNameInput, setFromNameInput] = useState(smtpConfig.fromName);
  const [showConfigEdit, setShowConfigEdit] = useState(false);
  const [testSentMsg, setTestSentMsg] = useState('');

  if (!isOpen) return null;

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSmtpConfig({
      smtpServer: serverHostInput.trim(),
      smtpPort: parseInt(serverPortInput, 10) || 25,
      fromAddress: fromAddressInput.trim(),
      fromName: fromNameInput.trim(),
    });
    setShowConfigEdit(false);
    setTestSentMsg('SMTP Relay parameters updated successfully!');
    setTimeout(() => setTestSentMsg(''), 3000);
  };

  const filteredLogs = emailLogs.filter(
    (log) =>
      log.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.changeRequestId && log.changeRequestId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/40">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                  Tanaka Enterprise Relay Engine
                </span>
                <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>SMTP ONLINE</span>
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">Automated SMTP Email Notification Outbox</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server Config Ribbon */}
        <div className="bg-slate-800 text-slate-200 px-6 py-3 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-400 font-semibold">SMTP Server:</span>
              <span className="font-mono font-bold text-cyan-300">{smtpConfig.smtpServer}:{smtpConfig.smtpPort}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400 font-semibold">From Address:</span>
              <span className="font-mono font-bold text-emerald-300">{smtpConfig.fromName} &lt;{smtpConfig.fromAddress}&gt;</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowConfigEdit(!showConfigEdit)}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg text-xs transition-colors"
            >
              {showConfigEdit ? 'Hide Config' : 'Edit Config'}
            </button>
          </div>
        </div>

        {/* Config Edit Panel */}
        {showConfigEdit && (
          <form onSubmit={handleSaveConfig} className="bg-slate-900 p-4 px-6 border-b border-slate-800 text-xs text-white space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">SMTP Server Host</label>
                <input
                  type="text"
                  required
                  value={serverHostInput}
                  onChange={(e) => setServerHostInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 font-mono text-cyan-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">SMTP Port</label>
                <input
                  type="number"
                  required
                  value={serverPortInput}
                  onChange={(e) => setServerPortInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 font-mono text-cyan-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">From Sender Address</label>
                <input
                  type="email"
                  required
                  value={fromAddressInput}
                  onChange={(e) => setFromAddressInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 font-mono text-emerald-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">From Sender Name</label>
                <input
                  type="text"
                  required
                  value={fromNameInput}
                  onChange={(e) => setFromNameInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
              >
                Save Relay Parameters
              </button>
            </div>
          </form>
        )}

        {testSentMsg && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2 text-xs font-bold text-emerald-600">
            {testSentMsg}
          </div>
        )}

        {/* Main Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          
          {/* Left Column: Outbox Log Stream (5 cols) */}
          <div className="md:col-span-5 border-r border-slate-200 flex flex-col bg-slate-50/50 overflow-hidden">
            <div className="p-3 border-b border-slate-200 space-y-2 bg-white">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter logs by subject, email, CR ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-1">
                <span>Total Sent: {emailLogs.length}</span>
                <span>Relay: 157.9.183.242:25</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Mail className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs">No email notifications match filter.</p>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const isSelected = selectedLog?.id === log.id;
                  return (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all space-y-1.5 ${
                        isSelected
                          ? 'bg-blue-50 border-blue-500 shadow-xs ring-1 ring-blue-500'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 truncate max-w-[200px]">{log.recipientName}</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          250 OK
                        </span>
                      </div>

                      <div className="font-mono text-[10px] text-blue-600 truncate">{log.recipientEmail}</div>
                      
                      <div className="font-semibold text-slate-800 line-clamp-2 leading-snug">
                        {log.subject}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                        <span>{log.triggerEvent}</span>
                        <span className="font-mono">{log.sentAt}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Email Viewer (7 cols) */}
          <div className="md:col-span-7 flex flex-col bg-slate-100/60 overflow-hidden">
            {selectedLog ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Email Metadata Ribbon */}
                <div className="p-4 bg-white border-b border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                      {selectedLog.triggerEvent}
                    </span>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => setViewMode('preview')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 ${
                          viewMode === 'preview'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Formatted HTML</span>
                      </button>
                      <button
                        onClick={() => setViewMode('html')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 ${
                          viewMode === 'html'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>Source Code</span>
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{selectedLog.subject}</h3>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono">
                    <div><strong>To:</strong> {selectedLog.recipientName} &lt;{selectedLog.recipientEmail}&gt;</div>
                    <div><strong>From:</strong> {smtpConfig.fromName} &lt;{smtpConfig.fromAddress}&gt;</div>
                    <div><strong>Relay:</strong> {selectedLog.smtpServer}:{selectedLog.smtpPort}</div>
                    <div><strong>Timestamp:</strong> {selectedLog.sentAt}</div>
                  </div>
                </div>

                {/* Email Body Rendering Area */}
                <div className="flex-1 p-4 overflow-y-auto">
                  {viewMode === 'preview' ? (
                    <iframe
                      title="HTML Email Preview"
                      srcDoc={selectedLog.bodyHtml}
                      className="w-full h-full min-h-[420px] bg-white rounded-xl border border-slate-300 shadow-inner"
                    />
                  ) : (
                    <pre className="w-full h-full min-h-[420px] bg-slate-900 text-emerald-400 p-4 rounded-xl border border-slate-800 text-[11px] font-mono overflow-auto whitespace-pre-wrap">
                      {selectedLog.bodyHtml}
                    </pre>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-slate-400 space-y-2 text-center">
                <div>
                  <Mail className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs">Select an email log from the outbox list to inspect.</p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Automated SMTP delivery active at state transitions and account provisioning.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors"
          >
            Close Outbox
          </button>
        </div>

      </div>
    </div>
  );
};
