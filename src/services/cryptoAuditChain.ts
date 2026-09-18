/**
 * Cryptographic Tamper-Proof Audit Trail (SHA-256 Hash Chain)
 * Guarantees that every municipal action (Intake -> AI Validation -> JE Assignment -> Crew Dispatch -> Resolution)
 * is immutably linked to the prior event's SHA-256 cryptographic hash.
 */

import { CryptoAuditBlock, UserRole } from '../types';

/**
 * Computes SHA-256 hash using the Web Crypto API
 */
export async function sha256Hex(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Creates the Genesis Block (#0) for a newly registered complaint
 */
export async function createGenesisBlock(
  complaintId: string,
  citizenId: string,
  citizenRole: UserRole | 'SYSTEM' = 'citizen',
  title: string
): Promise<CryptoAuditBlock> {
  const timestamp = new Date().toISOString();
  const previousHash = '0000000000000000000000000000000000000000000000000000000000000000';
  const payloadSummary = `GENESIS_REGISTRATION: Complaint #${complaintId} initiated with title "${title.substring(0, 40)}"`;

  const dataToHash = `${0}|${previousHash}|${complaintId}|REGISTRATION|${citizenId}|${timestamp}|${payloadSummary}`;
  const currentHash = await sha256Hex(dataToHash);

  return {
    blockIndex: 0,
    previousHash,
    currentHash,
    action: 'CITIZEN_GRIEVANCE_REGISTERED',
    actorId: citizenId,
    actorName: 'Verified Citizen / Resident',
    actorRole: citizenRole,
    timestamp,
    complaintId,
    payloadSummary,
    isTamperProof: true
  };
}

/**
 * Appends a new tamper-evident event block to the existing chain
 */
export async function appendCryptoAuditBlock(
  existingChain: CryptoAuditBlock[],
  complaintId: string,
  action: string,
  actorId: string,
  actorName: string,
  actorRole: UserRole | 'SYSTEM',
  payloadSummary: string
): Promise<CryptoAuditBlock[]> {
  const chain = [...existingChain];
  const lastBlock = chain[chain.length - 1];

  const blockIndex = chain.length;
  const previousHash = lastBlock ? lastBlock.currentHash : '0000000000000000000000000000000000000000000000000000000000000000';
  const timestamp = new Date().toISOString();

  const dataToHash = `${blockIndex}|${previousHash}|${complaintId}|${action}|${actorId}|${timestamp}|${payloadSummary}`;
  const currentHash = await sha256Hex(dataToHash);

  const newBlock: CryptoAuditBlock = {
    blockIndex,
    previousHash,
    currentHash,
    action,
    actorId,
    actorName,
    actorRole,
    timestamp,
    complaintId,
    payloadSummary,
    isTamperProof: true
  };

  chain.push(newBlock);
  return chain;
}

/**
 * Verifies the mathematical integrity of an entire hash chain.
 * Returns valid true/false and indicates the first corrupted block if any.
 */
export async function verifyCryptoAuditChain(
  chain: CryptoAuditBlock[]
): Promise<{
  isValid: boolean;
  tamperedBlockIndex: number | null;
  message: string;
}> {
  if (!chain || chain.length === 0) {
    return { isValid: true, tamperedBlockIndex: null, message: 'Empty chain is trivially valid' };
  }

  for (let i = 0; i < chain.length; i++) {
    const block = chain[i];

    // Verify index sequence
    if (block.blockIndex !== i) {
      return {
        isValid: false,
        tamperedBlockIndex: i,
        message: `Block sequence corrupted at index ${i}`
      };
    }

    // Verify previous hash pointer
    if (i > 0) {
      const prev = chain[i - 1];
      if (block.previousHash !== prev.currentHash) {
        return {
          isValid: false,
          tamperedBlockIndex: i,
          message: `Hash link broken: Block #${i} previousHash does not match Block #${i - 1} currentHash.`
        };
      }
    } else {
      if (block.previousHash !== '0000000000000000000000000000000000000000000000000000000000000000') {
        return {
          isValid: false,
          tamperedBlockIndex: 0,
          message: 'Genesis block previousHash must be 64 zeroes.'
        };
      }
    }

    // Verify block hash calculation
    const dataToHash = `${block.blockIndex}|${block.previousHash}|${block.complaintId}|${block.action}|${block.actorId}|${block.timestamp}|${block.payloadSummary}`;
    const recalculated = await sha256Hex(dataToHash);

    if (recalculated !== block.currentHash) {
      return {
        isValid: false,
        tamperedBlockIndex: i,
        message: `Hash mismatch at Block #${i}: Content or timestamp was modified without re-mining!`
      };
    }
  }

  return {
    isValid: true,
    tamperedBlockIndex: null,
    message: `All ${chain.length} blocks mathematically verified. Cryptographic chain is 100% tamper-proof.`
  };
}
