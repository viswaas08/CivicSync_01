import React, { useState } from 'react';
import { Complaint } from '../types';
import { generateRTIDossier, RTIDossierContent } from '../services/rtiGenerator';
import { triggerHapticFeedback } from '../services/offlineStorage';
import { 
  FileText, 
  Download, 
  Printer, 
  ShieldAlert, 
  Scale, 
  Check, 
  X, 
  Copy,
  ExternalLink,
  HelpCircle
} from 'lucide-react';

interface RTIDossierModalProps {
  complaint: Complaint;
  onClose: () => void;
}

export const RTIDossierModal: React.FC<RTIDossierModalProps> = ({
  complaint,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const dossier: RTIDossierContent = generateRTIDossier(complaint);

  const handleCopy = () => {
    navigator.clipboard.writeText(dossier.fullMarkdownDraft);
    setCopied(true);
    triggerHapticFeedback('success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    triggerHapticFeedback('tap');
    window.print();
  };

  const handleDownloadText = () => {
    const blob = new Blob([dossier.fullMarkdownDraft], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `RTI_Application_${complaint.complaintId}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerHapticFeedback('success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-3xl max-w-3xl w-full my-8 max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Strip */}
        <div className="bg-neutral-900 text-white px-6 py-5 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Automated Civic RTI Dossier</h3>
                <span className="text-[10px] font-bold uppercase bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full border border-red-500/40">
                  Section 6(1) RTI Act 2005
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Statutory Citizen Charter SLA Breach Escalation to Public Information Officer (PIO)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SLA Breach Banner */}
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center justify-between gap-4 text-xs text-red-900">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>
              <strong>Statutory SLA Default:</strong> Grievance #{complaint.complaintId} has exceeded statutory Citizen Charter resolution limits by <strong>{Math.max(1, dossier.slaBreachDays)} day(s)</strong>.
            </span>
          </div>
          <span className="font-mono font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
            Dossier #{dossier.applicationId}
          </span>
        </div>

        {/* Form Content / Printable Dossier */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-neutral-800 font-sans">
          <div className="border border-neutral-200 rounded-2xl p-6 bg-neutral-50/50 space-y-4">
            <div className="text-center border-b border-neutral-200 pb-4">
              <h4 className="font-serif font-bold text-lg text-neutral-900 tracking-wide uppercase">
                Right to Information Act, 2005 — Section 6(1)
              </h4>
              <p className="text-xs text-neutral-600 mt-1">
                Formal Request for Certified Government Records & Inspection Logs
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-neutral-500 font-medium">To Public Authority:</span>
                <p className="font-bold text-neutral-900 mt-0.5">{dossier.addresseeTitle}</p>
                <p className="text-neutral-700">{dossier.publicAuthorityName}</p>
                <p className="text-neutral-600">{dossier.publicAuthorityAddress}</p>
              </div>

              <div>
                <span className="text-neutral-500 font-medium">Applicant Particulars:</span>
                <p className="font-bold text-neutral-900 mt-0.5">{dossier.applicantName}</p>
                <p className="text-neutral-700">{dossier.applicantAddress}</p>
                <p className="text-neutral-600">Grievance Ref: #{complaint.complaintId}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-200">
              <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider block mb-2">
                Mandatory Statutory Questions to Public Authority:
              </span>
              <div className="space-y-2 text-xs">
                {dossier.prescribedQuestions.map((q, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-white border border-neutral-200 flex gap-2">
                    <span className="font-bold text-neutral-500">{idx + 1}.</span>
                    <span className="text-neutral-800">{q}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-neutral-600">
              <div>
                Statutory Fee: <strong>{dossier.statutoryFeeDetails}</strong>
              </div>
              <div className="font-mono text-[11px] text-neutral-400">
                Generated {dossier.generatedDate} via CivicSync
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="bg-neutral-50 px-6 py-4 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-800 font-semibold text-xs rounded-xl border border-neutral-200 transition shadow-xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy Application Text'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadText}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-800 font-semibold text-xs rounded-xl border border-neutral-200 transition shadow-xs"
            >
              <Download className="w-4 h-4 text-neutral-600" />
              <span>Download (.MD)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-800 font-semibold text-xs rounded-xl border border-neutral-200 transition shadow-xs"
            >
              <Printer className="w-4 h-4 text-neutral-600" />
              <span>Print Dossier</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl transition"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
