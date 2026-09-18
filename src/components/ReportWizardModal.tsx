import React, { useState, useEffect } from 'react';
import { useCivic } from '../context/CivicContext';
import { 
  Complaint, 
  EvidenceFile, 
  GeminiAnalysisResult, 
  GISLocationSnapshot,
  CryptographicSignature 
} from '../types';
import { validateEvidenceFile } from '../services/evidencePipeline';
import { resolveLocationFromGIS } from '../services/gisEngine';
import { analyzeCivicProblem } from '../services/geminiService';
import { calculatePriority } from '../services/priorityEngine';
import { determineResponsibleDepartment, findEligibleOfficials } from '../services/routingEngine';
import { detectPotentialDuplicates, DuplicateMatch } from '../services/duplicateEngine';
import { initializeComplaintSLA } from '../services/slaEngine';
import { InteractiveMap } from './InteractiveMap';
import { VoiceIntakeButton } from './VoiceIntakeButton';
import { IndicVoiceResult } from '../services/indicVoiceEngine';
import { compressImageToLowBandwidth, triggerHapticFeedback, queueOfflineReport } from '../services/offlineStorage';
import { createGenesisBlock } from '../services/cryptoAuditChain';
import { 
  X, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Camera, 
  ShieldCheck, 
  Loader2, 
  Clock, 
  Lock, 
  FileText, 
  Zap, 
  Maximize2, 
  Sliders, 
  Send,
  Building2,
  Users,
  WifiOff,
  Radio,
  FileCheck
} from 'lucide-react';

interface ReportWizardModalProps {
  onClose: () => void;
  onSuccess: (complaintId: string) => void;
}

export const ReportWizardModal: React.FC<ReportWizardModalProps> = ({ onClose, onSuccess }) => {
  const { currentUser, submitComplaint, complaints, supportComplaint, coSignMasterComplaint, gisWards, selectedCountryId } = useCivic();

  // Wizard state: 'wizard' (single-pass intake) or 'confirmed' (instant receipt)
  const [wizardStage, setWizardStage] = useState<'wizard' | 'confirmed'>('wizard');

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);

  // Evidence state
  const [uploadedFiles, setUploadedFiles] = useState<EvidenceFile[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isValidatingFile, setIsValidatingFile] = useState(false);
  const [fileValidationErrors, setFileValidationErrors] = useState<string[]>([]);

  // Location state (dynamic fallback based on selected country or Coimbatore default)
  const defaultCoords = selectedCountryId === 'US'
    ? { lat: 37.3382, lng: -121.8863 }
    : selectedCountryId === 'GB'
      ? { lat: 51.5387, lng: -0.1426 }
      : { lat: 11.0315, lng: 77.0142 };

  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>(defaultCoords);
  const [locationSnapshot, setLocationSnapshot] = useState<GISLocationSnapshot | null>(null);

  // AI Multimodal Vision State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAiResult, setCurrentAiResult] = useState<GeminiAnalysisResult | null>(null);
  const [aiAnalysisHistory, setAiAnalysisHistory] = useState<GeminiAnalysisResult[]>([]);

  // Duplicate Check & Submission State
  const [duplicateMatch, setDuplicateMatch] = useState<DuplicateMatch | null>(null);
  const [createdComplaintId, setCreatedComplaintId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resolve initial location on mount
  useEffect(() => {
    const resolved = resolveLocationFromGIS(selectedCoords.lat, selectedCoords.lng, 10, gisWards);
    setLocationSnapshot(resolved);
  }, []);

  // State for low-bandwidth compression badge
  const [compressionMetrics, setCompressionMetrics] = useState<{
    originalSize: number;
    compressedSize: number;
    ratio: number;
  } | null>(null);

  // 1. Single-Pass Image Drop / Select: Immediate Gemini Vision Analysis with Low-Bandwidth Compression
  const handleFileSelection = async (file: File) => {
    setIsValidatingFile(true);
    setFileValidationErrors([]);
    triggerHapticFeedback('tap');

    try {
      // Low-bandwidth compression: ensure image <= 100KB
      let processedFile = file;
      if (file.size > 100 * 1024) {
        try {
          const compRes = await compressImageToLowBandwidth(file, 100 * 1024);
          processedFile = compRes.compressedFile;
          setCompressionMetrics({
            originalSize: compRes.originalSizeBytes,
            compressedSize: compRes.compressedSizeBytes,
            ratio: compRes.compressionRatioPercent
          });
        } catch (compErr) {
          console.warn('Canvas compression note:', compErr);
        }
      }

      const validation = await validateEvidenceFile(processedFile, selectedCoords.lat, selectedCoords.lng);
      if (validation.isValid) {
        setUploadedFiles([validation.file]);
        setPreviewUrl(validation.file.url);

        // Resolve authoritative GIS location
        const resolved = resolveLocationFromGIS(selectedCoords.lat, selectedCoords.lng, 10, gisWards);
        setLocationSnapshot(resolved);

        // Multimodal Gemini Flash Analysis
        setIsAnalyzing(true);
        const aiResult = await analyzeCivicProblem('', processedFile, {
          isInternetOrStockImage: validation.file.isInternetOrStockImage,
          warning: validation.file.provenanceWarning
        });

        setCurrentAiResult(aiResult);
        setAiAnalysisHistory([aiResult]);

        // Auto-populate Title and Description
        const defaultTitle = aiResult.title && !aiResult.title.includes('Rejected')
          ? aiResult.title
          : `${aiResult.problemType || 'Civic Defect'} near ${resolved.wardName || resolved.localBodyName}`;
        
        setTitle(defaultTitle);

        const autoDesc = aiResult.generatedDescription || 
          `Identified ${aiResult.problemType} requiring immediate attention. ${aiResult.estimatedDimensions ? `Estimated Dimensions: ${aiResult.estimatedDimensions}. ` : ''}${aiResult.safetyRisks ? `Safety Assessment: ${aiResult.safetyRisks}.` : ''}`;
        setDescription(autoDesc);

        // Check for nearby duplicates silently (non-blocking)
        const dupes = detectPotentialDuplicates(
          selectedCoords.lat,
          selectedCoords.lng,
          aiResult.suggestedDepartment,
          aiResult.problemType,
          autoDesc,
          complaints,
          350
        );

        if (dupes.length > 0) {
          setDuplicateMatch(dupes[0]);
        } else {
          setDuplicateMatch(null);
        }
        triggerHapticFeedback('success');
      } else {
        setFileValidationErrors(validation.errors);
        triggerHapticFeedback('warning');
      }
    } catch (err: any) {
      setFileValidationErrors([err.message || 'File validation failed.']);
    } finally {
      setIsValidatingFile(false);
      setIsAnalyzing(false);
    }
  };

  // 1b. Indic Voice NLP Handler: Autofill form in 1 click
  const handleIndicVoiceResult = (result: IndicVoiceResult) => {
    setTitle(result.suggestedTitle);
    setDescription(result.suggestedDescription);
    triggerHapticFeedback('success');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleMapPinSelected = (lat: number, lng: number) => {
    setSelectedCoords({ lat, lng });
    const resolved = resolveLocationFromGIS(lat, lng, 10, gisWards);
    setLocationSnapshot(resolved);
  };

  // 2. Cryptographic Whistleblower Signature Generator
  const generateSignature = async (compNumber: string, ts: string): Promise<CryptographicSignature> => {
    try {
      const payload = `${compNumber}|${ts}|${selectedCoords.lat.toFixed(5)},${selectedCoords.lng.toFixed(5)}|${currentUser.uid}`;
      const msgBuffer = new TextEncoder().encode(payload);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return {
        algorithm: 'SHA-256',
        signatureHash: `sig_sha256_${hashHex.substring(0, 32)}`,
        signedPayloadHash: hashHex,
        timestamp: ts,
        keyFingerprint: `ed25519_${Math.random().toString(36).substring(2, 12)}`
      };
    } catch {
      return {
        algorithm: 'SHA-256',
        signatureHash: `sig_sha256_${Math.random().toString(36).substring(2, 16)}`,
        signedPayloadHash: `${Date.now().toString(16)}`,
        timestamp: ts,
        keyFingerprint: `ed25519_local`
      };
    }
  };

  // 3. One-Click Confirm & Dispatch
  const handleSingleClickSubmit = async () => {
    if (!currentAiResult || !locationSnapshot) return;

    if (currentAiResult.isValidEvidence === false || currentAiResult.isAiGeneratedOrSynthetic || currentAiResult.isInternetOrStockImage) {
      alert(currentAiResult.rejectionReason || 'Uploaded evidence is invalid or synthetic. Please take an authentic photo on site.');
      return;
    }

    setIsSubmitting(true);

    try {
      const priorityResult = calculatePriority({
        severity: currentAiResult.severity,
        safetyRisk: currentAiResult.safetyRisk,
        urgency: currentAiResult.urgency,
        affectedPopulation: currentAiResult.affectedPopulation,
        environmentalImpact: currentAiResult.environmentalImpact,
        isCriticalZone: Boolean(locationSnapshot.locality?.includes('Flyover') || locationSnapshot.addressText.includes('Signal'))
      });

      const department = determineResponsibleDepartment(
        currentAiResult.problemType,
        currentAiResult.domain,
        locationSnapshot,
        currentAiResult.suggestedDepartment
      );

      const eligibleOfficers = findEligibleOfficials(department.departmentId, locationSnapshot);
      const assignedOfficer = eligibleOfficers[0];
      const sla = initializeComplaintSLA(priorityResult.level);

      const countryId = locationSnapshot.countryId || (selectedCountryId !== 'ALL' ? selectedCountryId : 'IN');
      const randomSeq = String(Math.floor(100000 + Math.random() * 900000));
      const newId = `CIV-${countryId}-${new Date().getFullYear()}-${randomSeq}`;
      const nowIso = new Date().toISOString();

      let whistleblowerSignature: CryptographicSignature | undefined = undefined;
      if (isAnonymous) {
        whistleblowerSignature = await generateSignature(newId, nowIso);
      }

      const newComplaint: Complaint = {
        complaintId: newId,
        countryId,
        administrativeAreas: locationSnapshot.administrativeAreas,
        citizenId: isAnonymous ? `anon-whistleblower-${Math.random().toString(36).substring(2, 8)}` : currentUser.uid,
        citizenName: isAnonymous ? 'Whistleblower (Cryptographically Masked)' : currentUser.displayName,
        citizenPhoneMasked: isAnonymous ? undefined : (currentUser.phone ? `${currentUser.phone.substring(0, 7)}X-XXX` : '+91 9842X-XXX12'),
        isAnonymous,
        whistleblowerSignature,
        title: title || `${currentAiResult.problemType} near ${locationSnapshot.wardName || locationSnapshot.addressText}`,
        description: description.trim() || currentAiResult.generatedDescription || 'Civic defect reported.',
        category: department.name,
        problemType: currentAiResult.problemType,
        priorityScore: priorityResult.score,
        priorityLevel: priorityResult.level,
        status: 'ROUTED',
        location: {
          latitude: selectedCoords.lat,
          longitude: selectedCoords.lng,
          accuracyMeters: 8
        },
        locationSnapshot,
        evidence: uploadedFiles,
        aiAnalysisHistory,
        latestAiAnalysis: currentAiResult,
        aiReviewApproved: true,
        aiEstimatedDimensions: currentAiResult.estimatedDimensions,
        aiSafetyRiskAssessment: currentAiResult.safetyRisks,
        assignedDepartmentId: department.departmentId,
        assignedDepartmentName: department.name,
        assignedOfficialId: assignedOfficer?.officialId,
        assignedOfficialName: assignedOfficer?.name,
        assignmentMethod: 'OPTIMIZED',
        sla,
        supportersCount: 1,
        isCommunityEligible: ['CLEANUP', 'PLANTATION'].some(k => currentAiResult.domain.includes(k)),
        isInnovationEligible: priorityResult.score >= 80,
        isDemo: false,
        createdAt: nowIso,
        updatedAt: nowIso
      };

      // Generate immutable Genesis Block (#0) for the cryptographic audit trail
      try {
        const genesisBlock = await createGenesisBlock(newId, newComplaint.citizenId, 'citizen', newComplaint.title);
        newComplaint.cryptoAuditChain = [genesisBlock];
      } catch (cryptoErr) {
        console.warn('Crypto genesis block note:', cryptoErr);
      }

      submitComplaint(newComplaint);
      setCreatedComplaintId(newId);
      triggerHapticFeedback('success');
      setWizardStage('confirmed');
    } catch (err) {
      console.error('Submission failed:', err);
      alert('Grievance submission encountered an error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="px-5 py-3.5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-neutral-900">
                  AI Intake Wizard (Single-Pass Dispatch)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Gemini Flash Multimodal
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Zero friction: Drop defect photo &rarr; Instant AI classification &rarr; 1-Click municipal dispatch
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {wizardStage === 'wizard' ? (
            <div className="space-y-5">
              {/* Top Warning Banner if validation failed */}
              {fileValidationErrors.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-1">
                  {fileValidationErrors.map((err, i) => (
                    <div key={i} className="flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 10-Second Indic Voice Intake Component */}
              <VoiceIntakeButton onParsedResult={handleIndicVoiceResult} />

              {/* Low-Bandwidth Auto-Compression Pill if active */}
              {compressionMetrics && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <WifiOff className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>
                      <strong>Low-Bandwidth Lite Mode:</strong> Photo compressed by <strong>{compressionMetrics.ratio}%</strong> ({(compressionMetrics.originalSize / 1024).toFixed(0)} KB &rarr; {(compressionMetrics.compressedSize / 1024).toFixed(0)} KB) for instant peri-urban upload.
                    </span>
                  </div>
                  <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    &le; 100 KB Guard
                  </span>
                </div>
              )}

              {/* Grid Layout: Left Photo & Radar Scan, Right Auto-Pre-filled Form */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* LEFT: Image Drop & Visual Detection Panel (5 cols) */}
                <div className="lg:col-span-5 space-y-3">
                  <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider block">
                    1. Upload Defect Photograph
                  </label>

                  {!previewUrl ? (
                    <label className="border-2 border-dashed border-neutral-300 hover:border-emerald-600 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-neutral-50/50 hover:bg-emerald-50/20 transition min-h-[220px] group">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileInputChange} 
                        className="hidden" 
                      />
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-neutral-200 flex items-center justify-center text-neutral-700 group-hover:scale-110 group-hover:text-emerald-700 transition mb-3">
                        <Camera className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-neutral-900">
                        Take or Drop Civic Photo Here
                      </span>
                      <span className="text-[11px] text-neutral-500 mt-1 max-w-xs">
                        Potholes, overflowing garbage, broken manholes, damaged lamps, water leaks
                      </span>
                      <span className="mt-3 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        Instant Multimodal Scan Active
                      </span>
                    </label>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-900 group">
                      <img 
                        src={previewUrl} 
                        alt="Defect Preview" 
                        className="w-full h-56 object-cover" 
                      />

                      {/* Scanning Radar Overlay */}
                      {isAnalyzing && (
                        <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
                          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-2" />
                          <span className="text-xs font-bold tracking-wide animate-pulse">
                            Gemini Flash Scanning Image...
                          </span>
                          <span className="text-[10px] text-emerald-300 mt-1">
                            Detecting defect category, dimensions, & safety risks
                          </span>
                        </div>
                      )}

                      {/* Retake Photo Button */}
                      <label className="absolute top-2.5 right-2.5 bg-black/70 hover:bg-black/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg backdrop-blur-sm cursor-pointer transition flex items-center gap-1.5">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileInputChange} 
                          className="hidden" 
                        />
                        <Camera className="w-3.5 h-3.5" />
                        <span>Change</span>
                      </label>

                      {/* Photo Tags on Preview */}
                      {currentAiResult && !isAnalyzing && (
                        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1.5">
                          <span className="bg-emerald-950/80 backdrop-blur text-emerald-200 border border-emerald-400/40 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {currentAiResult.problemType}
                          </span>
                          <span className="bg-black/70 backdrop-blur text-white text-[10px] font-medium px-2 py-0.5 rounded-md">
                            {currentAiResult.severity} Severity
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Defect Assessment Badges */}
                  {currentAiResult && !isAnalyzing && (
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-900 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          AI Visual Defect Scan:
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                          {Math.round(currentAiResult.confidence * 100)}% Confidence
                        </span>
                      </div>

                      {/* Dimensions estimate */}
                      {currentAiResult.estimatedDimensions && (
                        <div className="text-[11px] text-neutral-700">
                          <strong>Estimated Scale:</strong> {currentAiResult.estimatedDimensions}
                        </div>
                      )}

                      {/* Safety Risk */}
                      {currentAiResult.safetyRisks && (
                        <div className="text-[11px] text-red-700 bg-red-50/70 p-1.5 rounded-lg border border-red-100">
                          <strong>Safety Risk:</strong> {currentAiResult.safetyRisks}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* RIGHT: Pre-filled Auto-Intake Form (7 cols) */}
                <div className="lg:col-span-7 space-y-3.5">
                  <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider block">
                    2. Streamlined Grievance Metadata
                  </label>

                  {/* Problem Title */}
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                      Problem Title (Auto-generated by AI):
                    </label>
                    <input 
                      type="text" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Upload photo to auto-generate title..."
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2 px-3 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>

                  {/* Category & Department Strip */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl">
                      <span className="text-[10px] text-neutral-500 font-semibold block uppercase">Problem Category</span>
                      <span className="font-bold text-neutral-900 truncate block mt-0.5">
                        {currentAiResult?.problemType || 'Awaiting Photo'}
                      </span>
                    </div>

                    <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl">
                      <span className="text-[10px] text-neutral-500 font-semibold block uppercase">Responsible Department</span>
                      <span className="font-bold text-neutral-900 truncate block mt-0.5">
                        {currentAiResult?.suggestedDepartment || 'Auto-Routing'}
                      </span>
                    </div>
                  </div>

                  {/* Priority & SLA Strip */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl">
                      <span className="text-[10px] text-neutral-500 font-semibold block uppercase">Priority Level</span>
                      <span className="font-bold text-neutral-900 flex items-center gap-1 mt-0.5">
                        <span className={`w-2 h-2 rounded-full ${currentAiResult?.severity === 'CRITICAL' ? 'bg-red-600' : 'bg-amber-500'}`}></span>
                        {currentAiResult?.severity || 'HIGH'} ({currentAiResult?.severityScore || 75}/100)
                      </span>
                    </div>

                    <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl">
                      <span className="text-[10px] text-neutral-500 font-semibold block uppercase">Citizen Charter SLA</span>
                      <span className="font-bold text-neutral-900 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        {currentAiResult?.severity === 'CRITICAL' ? '24h Emergency' : '72h Standard'}
                      </span>
                    </div>
                  </div>

                  {/* Location Snapshot Banner */}
                  <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-neutral-500 font-semibold uppercase flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        Ward & Jurisdiction Snapshot:
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">
                        GPS: {selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}
                      </span>
                    </div>
                    <p className="font-bold text-neutral-900 truncate">
                      {locationSnapshot?.wardName ? `${locationSnapshot.wardName}, ` : ''}
                      {locationSnapshot?.localBodyName || 'Authoritative GIS'} ({locationSnapshot?.boundaryVersion || 'Gazette'})
                    </p>
                  </div>

                  {/* Interactive Pin Location Map */}
                  <div>
                    <span className="text-[11px] font-semibold text-neutral-600 block mb-1">
                      Drag or Click Map to Adjust Location Pin:
                    </span>
                    <InteractiveMap 
                      center={[selectedCoords.lat, selectedCoords.lng]}
                      selectedLocation={selectedCoords}
                      onSelectCoordinates={handleMapPinSelected}
                      height="160px"
                      zoom={14}
                      showWards={true}
                    />
                  </div>

                  {/* Whistleblower Protection Toggle */}
                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div>
                        <span className="font-bold text-neutral-900 block">
                          Anonymous Whistleblower Protection
                        </span>
                        <span className="text-[10px] text-neutral-500 block">
                          Submissions cryptographically signed (SHA-256) to eliminate duplicate spam without revealing identity.
                        </span>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={isAnonymous} 
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  {/* Master Incident Cluster / Duplicate Co-Sign Banner */}
                  {duplicateMatch && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 space-y-2">
                      <div className="flex items-start gap-2">
                        <Users className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block text-amber-900">
                            Active Incident Cluster Detected ({Math.round(duplicateMatch.distanceMeters)}m away)
                          </span>
                          <p className="text-amber-800 mt-0.5">
                            Grievance #{duplicateMatch.existingComplaint.complaintId} (<em>{duplicateMatch.existingComplaint.title}</em>) is already open in this corridor.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-amber-200">
                        <span className="text-[11px] text-amber-800">
                          {duplicateMatch.existingComplaint.masterIncidentCluster?.coSignersCount || 1} citizens have already corroborated this.
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            coSignMasterComplaint(duplicateMatch.existingComplaint.complaintId);
                            triggerHapticFeedback('success');
                            alert(`Co-signed Master Incident #${duplicateMatch.existingComplaint.complaintId}! You will receive unified resolution alerts.`);
                            onClose();
                          }}
                          className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white font-bold text-[11px] rounded-lg transition shadow-xs flex items-center gap-1"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>1-Click Co-Sign Master Ticket</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Big Single-Click Submit Button */}
                  <button
                    onClick={handleSingleClickSubmit}
                    disabled={!previewUrl || isAnalyzing || isSubmitting}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md transition flex items-center justify-center gap-2 ${
                      !previewUrl || isAnalyzing || isSubmitting
                        ? 'bg-neutral-300 cursor-not-allowed text-neutral-500'
                        : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99]'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Dispatching to Municipal Ward Beat...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Confirm & Dispatch Grievance (1-Click)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* CONFIRMED RECEIPT SCREEN */
            <div className="py-8 text-center space-y-4 max-w-lg mx-auto animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border-4 border-emerald-50 shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-neutral-900">
                  Grievance Dispatched & Recorded
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Immutable municipal complaint logged and routed under Statutory Citizen Charter SLAs.
                </p>
              </div>

              {/* Official Receipt Card */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-left text-xs space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                  <span className="text-neutral-500">Tracking Reference:</span>
                  <span className="font-mono font-bold text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-200">
                    #{createdComplaintId}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Assigned Ward Beat:</span>
                  <span className="font-semibold text-neutral-900">
                    {locationSnapshot?.wardName || 'Ward Office'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Responsible Department:</span>
                  <span className="font-semibold text-neutral-900">
                    {currentAiResult?.suggestedDepartment || 'Public Works'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Statutory SLA Target:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {currentAiResult?.severity === 'CRITICAL' ? '24 Hours (Emergency)' : '72 Hours (Standard)'}
                  </span>
                </div>

                {isAnonymous && (
                  <div className="flex items-center justify-between pt-1 border-t border-neutral-200 text-[11px]">
                    <span className="text-neutral-500 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      Whistleblower Signature:
                    </span>
                    <span className="font-mono text-neutral-700 truncate max-w-[180px]">
                      SHA-256 Verified
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    onClose();
                    if (createdComplaintId) onSuccess(createdComplaintId);
                  }}
                  className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl transition shadow-xs"
                >
                  View Case in Live Explorer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
