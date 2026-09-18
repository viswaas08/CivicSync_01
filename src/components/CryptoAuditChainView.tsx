import React, { useState, useEffect } from 'react';
import { CryptoAuditBlock } from '../types';
import { verifyCryptoAuditChain } from '../services/cryptoAuditChain';
import { ShieldCheck, ShieldAlert, Lock, CheckCircle2, Copy, Check, Hash, Calendar, User } from 'lucide-react';
import { triggerHapticFeedback } from '../services/offlineStorage';

interface CryptoAuditChainViewProps {
  chain?: CryptoAuditBlock[];
  complaintId: string;
}

export const CryptoAuditChainView: React.FC<CryptoAuditChainViewProps> = ({
  chain = [],
  complaintId
}) => {
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    tamperedBlockIndex: number | null;
    message: string;
  }>({ isValid: true, tamperedBlockIndex: null, message: 'Verifying cryptographic blocks...' });

  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    verifyCryptoAuditChain(chain).then((res) => {
      if (isMounted) setVerificationResult(res);
    });
    return () => { isMounted = false; };
  }, [chain]);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    triggerHapticFeedback('tap');
    setTimeout(() => setCopiedHash(null), 1500);
  };

  return (
    <div className="space-y-4">
      {/* Integrity Seal Banner */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
        verificationResult.isValid
          ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
          : 'bg-red-50 border-red-300 text-red-950'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            verificationResult.isValid ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {verificationResult.isValid ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold">
                {verificationResult.isValid ? 'SHA-256 Tamper-Proof Audit Chain: 100% Intact' : 'Integrity Alert: Chain Corrupted'}
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold">
                {chain.length} Block(s) Sealed
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-0.5">
              {verificationResult.message}
            </p>
          </div>
        </div>
      </div>

      {/* Block Sequence Explorer */}
      <div className="relative border-l-2 border-neutral-200 ml-4 pl-6 space-y-6 py-2">
        {chain.map((block, idx) => (
          <div key={block.blockIndex} className="relative group">
            {/* Block Node Dot */}
            <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-neutral-900 border-4 border-white shadow-xs" />

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 hover:border-neutral-400 transition space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-neutral-900 bg-neutral-200 px-2 py-0.5 rounded">
                    Block #{block.blockIndex}
                  </span>
                  <span className="font-bold text-neutral-800">
                    {block.action.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-neutral-500 font-mono text-[11px]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(block.timestamp).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <p className="text-xs text-neutral-700">
                {block.payloadSummary}
              </p>

              <div className="flex items-center gap-2 text-[11px] text-neutral-500 pt-1">
                <User className="w-3 h-3 text-neutral-400" />
                <span>Actor: <strong>{block.actorName}</strong> ({block.actorRole})</span>
              </div>

              {/* Cryptographic Hash Bar */}
              <div className="pt-2 border-t border-neutral-200 grid grid-cols-1 gap-1 font-mono text-[10px]">
                <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-neutral-200">
                  <span className="text-neutral-400">Current SHA-256:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-800 truncate max-w-[220px] sm:max-w-xs">{block.currentHash}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyHash(block.currentHash)}
                      className="text-neutral-400 hover:text-neutral-800"
                      title="Copy full SHA-256 hash"
                    >
                      {copiedHash === block.currentHash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {idx > 0 && (
                  <div className="flex items-center justify-between text-neutral-400 px-1 text-[9px]">
                    <span>Linked to Prev Block #{idx - 1}:</span>
                    <span className="truncate max-w-[200px]">{block.previousHash.substring(0, 24)}...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
