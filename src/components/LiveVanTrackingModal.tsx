import React, { useState, useEffect } from 'react';
import { Complaint, RepairVanTelemetry } from '../types';
import { 
  initializeRepairVanTelemetry, 
  stepVanTelemetryProgress,
  validateFieldCrewGeofence 
} from '../services/telemetryEngine';
import { 
  Truck, 
  Navigation, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  PhoneCall, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Radio
} from 'lucide-react';

interface LiveVanTrackingModalProps {
  complaint: Complaint;
  onClose: () => void;
  onConfirmCheckIn?: () => void;
}

export const LiveVanTrackingModal: React.FC<LiveVanTrackingModalProps> = ({
  complaint,
  onClose,
  onConfirmCheckIn
}) => {
  // Telemetry simulation state
  const [telemetry, setTelemetry] = useState<RepairVanTelemetry>(() => {
    return complaint.activeVanTelemetry || initializeRepairVanTelemetry(complaint);
  });

  const [progress, setProgress] = useState(0.35); // Initial progress towards site
  const [isSimulatingMovement, setIsSimulatingMovement] = useState(true);

  useEffect(() => {
    if (!isSimulatingMovement) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 1.0) {
          clearInterval(interval);
          return 1.0;
        }
        const next = prev + 0.08;
        return next > 1.0 ? 1.0 : next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isSimulatingMovement]);

  useEffect(() => {
    const updated = stepVanTelemetryProgress(telemetry, progress);
    setTelemetry(updated);
  }, [progress]);

  const geofenceCheck = validateFieldCrewGeofence(
    telemetry.currentLocation.latitude,
    telemetry.currentLocation.longitude,
    telemetry.destinationLocation.latitude,
    telemetry.destinationLocation.longitude
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Strip */}
        <div className="bg-neutral-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Municipal Repair Gang Telemetry</h3>
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  <Radio className="w-3 h-3 animate-ping text-emerald-400" />
                  Live GPS
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Dispatched by Coimbatore Municipal Works Depot
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

        {/* Live Status & ETA Hero */}
        <div className="p-6 space-y-6">
          <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Vehicle & Crew Assignment
              </div>
              <h4 className="text-lg font-extrabold text-neutral-900 mt-0.5">
                {telemetry.crewName}
              </h4>
              <p className="text-xs text-neutral-600 font-mono mt-0.5">
                Vehicle: <strong>{telemetry.vehicleNumber}</strong> • Jet-Patcher Rapid Unit
              </p>
            </div>

            <div className="text-right sm:text-right">
              <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Arrival Estimate
              </div>
              <div className="text-2xl font-black text-emerald-700 flex items-center sm:justify-end gap-1">
                <Clock className="w-5 h-5" />
                <span>{telemetry.isWithinGeofence40m ? 'ARRIVED ON SITE' : `${telemetry.etaMinutes} mins`}</span>
              </div>
              <div className="text-[11px] font-semibold text-neutral-500">
                {telemetry.isWithinGeofence40m ? 'Within 40m perimeter' : `${telemetry.distanceToSiteMeters}m away from site`}
              </div>
            </div>
          </div>

          {/* Telemetry Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-700">
              <span>Depot Departure</span>
              <span className="text-amber-700 font-mono">{Math.round(progress * 100)}% Route Covered</span>
              <span>Grievance Site</span>
            </div>
            <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-emerald-600 rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>

          {/* 40-Meter Geofenced Anti-Fraud Guard */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3 transition ${
            telemetry.isWithinGeofence40m 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}>
            {telemetry.isWithinGeofence40m ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h5 className="text-xs font-bold uppercase tracking-wider">
                {telemetry.isWithinGeofence40m 
                  ? 'Geofence Verified (<= 40m Physical Radius)' 
                  : 'Geofence Lock Active (> 40m Distance)'}
              </h5>
              <p className="text-xs leading-relaxed">
                {geofenceCheck.reason}
              </p>
              {!telemetry.isWithinGeofence40m && (
                <div className="text-[11px] font-semibold text-amber-800">
                  ⚠️ Municipal rule: Field staff cannot mark "Work Started" or "Resolved" until physical coordinates lock within 40m.
                </div>
              )}
            </div>
          </div>

          {/* Fast-forward simulator control for reviewers */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-200 text-xs">
            <button
              type="button"
              onClick={() => setProgress(1.0)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline underline-offset-2 flex items-center gap-1"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Simulate instant arrival within 40m</span>
            </button>

            <a
              href={`tel:${telemetry.crewContact.split(' ')[0]}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-700 hover:text-neutral-950 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-xl transition"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
              <span>Contact Crew Supervisor</span>
            </a>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-neutral-50 px-6 py-4 border-t border-neutral-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl transition"
          >
            Close Telemetry View
          </button>
        </div>
      </div>
    </div>
  );
};
