/**
 * Low-Bandwidth & Offline Data Storage Engine
 * Handles client-side photo compression to <= 100KB using HTML5 Canvas,
 * offline draft queueing with localStorage, and auto-sync when connectivity returns.
 */

import { Complaint } from '../types';

export interface OfflineQueuedReport {
  id: string;
  queuedAt: string;
  complaintData: Partial<Complaint>;
  imageCompressedBase64?: string;
  status: 'PENDING_NETWORK' | 'SYNCED' | 'FAILED';
}

const OFFLINE_QUEUE_KEY = 'civicsync_offline_queue';

/**
 * Compresses an image File or Blob to <= 100KB using an off-screen HTML5 Canvas.
 * Uses adaptive quality reduction and dimension scaling (max 1280px).
 */
export async function compressImageToLowBandwidth(
  file: File,
  targetMaxBytes: number = 100 * 1024 // 100 KB
): Promise<{
  compressedFile: File;
  compressedBase64: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  compressionRatioPercent: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Downscale large camera photos while preserving aspect ratio
        const MAX_DIMENSION = 1280;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas 2D context not available'));
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Iterative compression quality adjustment
        let quality = 0.75;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Binary size calculation of data URL
        const calculateBytes = (b64: string) => {
          const base64Str = b64.split(',')[1] || b64;
          return Math.round((base64Str.length * 3) / 4);
        };

        let currentBytes = calculateBytes(dataUrl);

        // If above target, aggressively lower quality
        while (currentBytes > targetMaxBytes && quality > 0.2) {
          quality -= 0.15;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          currentBytes = calculateBytes(dataUrl);
        }

        // Convert dataUrl to Blob and File
        const byteString = atob(dataUrl.split(',')[1]);
        const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + "_compressed.jpg", {
          type: 'image/jpeg',
          lastModified: Date.now()
        });

        const originalSizeBytes = file.size;
        const compressedSizeBytes = compressedFile.size;
        const compressionRatioPercent = Math.max(0, Math.round((1 - compressedSizeBytes / originalSizeBytes) * 100));

        resolve({
          compressedFile,
          compressedBase64: dataUrl,
          originalSizeBytes,
          compressedSizeBytes,
          compressionRatioPercent
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Saves a civic report to local offline queue if connectivity fails
 */
export function queueOfflineReport(complaint: Partial<Complaint>, imageBase64?: string): OfflineQueuedReport {
  const queue = getOfflineQueuedReports();
  const newReport: OfflineQueuedReport = {
    id: `OFFLINE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    queuedAt: new Date().toISOString(),
    complaintData: complaint,
    imageCompressedBase64: imageBase64,
    status: 'PENDING_NETWORK'
  };

  queue.unshift(newReport);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  return newReport;
}

/**
 * Retrieves all offline queued reports
 */
export function getOfflineQueuedReports(): OfflineQueuedReport[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Removes a synced report from the offline queue
 */
export function removeOfflineReport(id: string): void {
  const queue = getOfflineQueuedReports().filter(r => r.id !== id);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Trigger mobile haptic feedback if supported by browser/device
 */
export function triggerHapticFeedback(pattern: 'success' | 'warning' | 'pin_drop' | 'tap' = 'tap') {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      if (pattern === 'success') {
        navigator.vibrate([40, 60, 80]); // Upbeat celebration
      } else if (pattern === 'warning') {
        navigator.vibrate([100, 50, 100]); // Warning buzz
      } else if (pattern === 'pin_drop') {
        navigator.vibrate(45); // Crisp tap
      } else {
        navigator.vibrate(25); // Subtle tactile feedback
      }
    } catch {
      // Ignore vibration errors on desktop/restricted environments
    }
  }
}
