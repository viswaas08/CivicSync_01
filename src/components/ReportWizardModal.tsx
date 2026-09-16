import React, { useState } from 'react';
import { useCivic } from '../context/CivicContext';
import { 
  Complaint, 
  EvidenceFile, 
  GeminiAnalysisResult, 
  GISLocationSnapshot 
} from '../types';
import { validateEvidenceFile } from '../services/evidencePipeline';
import { resolveLocationFromGIS } from '../services/gisEngine';
import { analyzeCivicProblem } from '../services/geminiService';
import { calculatePriority } from '../services/priorityEngine';
import { determineResponsibleDepartment, findEligibleOfficials } from '../services/routingEngine';
import { detectPotentialDuplicates, DuplicateMatch } from '../services/duplicateEngine';
import { initializeComplaintSLA } from '../services/slaEngine';
import { InteractiveMap } from './InteractiveMap';
import { 
  X, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Camera, 
  ChevronRight, 
  ChevronLeft, 
  ShieldCheck, 
  Loader2,
  Layers,
  Edit3
} from 'lucide-react';

interface ReportWizardModalProps {
  onClose: () => void;
  onSuccess: (complaintId: string) => void;
}

type WizardStep = 'evidence' | 'review_and_location' | 'duplicates' | 'confirmed';

export const ReportWizardModal: React.FC<ReportWizardModalProps> = ({ onClose, onSuccess }) => {
  const { currentUser, submitComplaint, complaints, supportComplaint, gisWards, selectedCountryId } = useCivic();

  const [step, setStep] = useState<WizardStep>('evidence');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Evidence state
  const [uploadedFiles, setUploadedFiles] = useState<EvidenceFile[]>([]);
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [isValidatingFile, setIsValidatingFile] = useState(false);
  const [fileValidationErrors, setFileValidationErrors] = useState<string[]>([]);
  const [fileValidationWarnings, setFileValidationWarnings] = useState<string[]>([]);

  // Location state (Coimbatore default, dynamically adaptable)
  const defaultCoords = selectedCountryId === 'US'
    ? { lat: 37.3382, lng: -121.8863 }
    : selectedCountryId === 'GB'
      ? { lat: 51.5387, lng: -0.1426 }
      : { lat: 11.0315, lng: 77.0142 };

  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>(defaultCoords);
  const [locationSnapshot, setLocationSnapshot] = useState<GISLocationSnapshot | null>(null);

  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAiResult, setCurrentAiResult] = useState<GeminiAnalysisResult | null>(null);
  const [aiAnalysisHistory, setAiAnalysisHistory] = useState<GeminiAnalysisResult[]>([]);

  // Duplicates State
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [createdComplaintId, setCreatedComplaintId] = useState<string | null>(null);

  // 1. Handle File Selection and Immediate Gemini Flash Multimodal Analysis
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    setIsValidatingFile(true);
    setFileValidationErrors([]);
    setFileValidationWarnings([]);

    try {
      const validation = await validateEvidenceFile(file, selectedCoords.lat, selectedCoords.lng);
      if (validation.isValid) {
        setUploadedFiles([validation.file]);
        setRawFiles([file]);

        // Resolve location
        const resolved = resolveLocationFromGIS(selectedCoords.lat, selectedCoords.lng, 10, gisWards);
        setLocationSnapshot(resolved);

        // Immediately trigger Gemini Flash analysis on the uploaded image
        setIsAnalyzing(true);
        const aiResult = await analyzeCivicProblem('', file);

        setCurrentAiResult(aiResult);
        setAiAnalysisHistory([aiResult]);
        
        // Auto-populate title and comprehensive description from AI analysis
        setTitle(aiResult.title || `${aiResult.problemType} near ${resolved.wardName || 'Ward'}`);
        setDescription(aiResult.generatedDescription || aiResult.explanation || '');

        setIsAnalyzing(false);
        setStep('review_and_location');
      } else {
        setFileValidationErrors(validation.errors);
      }
      setFileValidationWarnings(validation.warnings);
    } catch (err) {
      setFileValidationErrors(['File processing encountered an error. Please select a valid JPEG or PNG image.']);
    } finally {
      setIsValidatingFile(false);
      setIsAnalyzing(false);
    }
  };

  const handleMapPinSelected = (lat: number, lng: number) => {
    setSelectedCoords({ lat, lng });
    const resolved = resolveLocationFromGIS(lat, lng, 10, gisWards);
    setLocationSnapshot(resolved);
  };

  // 2. Validate and Dispatch Complaint
  const handleSubmitReport = () => {
    if (!description.trim() || !locationSnapshot || !currentAiResult) return;

    // Check for potential duplicate complaints within 350m
    const foundDuplicates = detectPotentialDuplicates(
      selectedCoords.lat,
      selectedCoords.lng,
      currentAiResult.suggestedDepartment,
      currentAiResult.problemType,
      description,
      complaints,
      350
    );

    if (foundDuplicates.length > 0) {
      setDuplicates(foundDuplicates);
      setStep('duplicates');
    } else {
      finalizeSubmission();
    }
  };

  // 3. Finalize Deterministic Routing, SLA, and Dispatch
  const finalizeSubmission = () => {
    if (!currentAiResult || !locationSnapshot) return;

    const priorityResult = calculatePriority({
      severity: currentAiResult.severity,
      safetyRisk: currentAiResult.safetyRisk,
      urgency: currentAiResult.urgency,
      affectedPopulation: currentAiResult.affectedPopulation,
      environmentalImpact: currentAiResult.environmentalImpact,
      isCriticalZone: locationSnapshot.locality?.includes('Flyover') || locationSnapshot.addressText.includes('Signal')
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

    const newComplaint: Complaint = {
      complaintId: newId,
      countryId,
      administrativeAreas: locationSnapshot.administrativeAreas,
      citizenId: currentUser.uid,
      citizenName: currentUser.displayName,
      citizenPhoneMasked: currentUser.phone ? `${currentUser.phone.substring(0, 7)}X-XXX` : '+91 9842X-XXX12',
      title: title || `${currentAiResult.problemType} near ${locationSnapshot.wardName || locationSnapshot.addressText}`,
      description: description.trim(),
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    submitComplaint(newComplaint);
    setCreatedComplaintId(newId);
    setStep('confirmed');
  };

  const handleSupportExistingDuplicate = (dupComplaintId: string) => {
    supportComplaint(dupComplaintId);
    onSuccess(dupComplaintId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold tracking-wider text-emerald-600 uppercase">
              Gemini Flash Vision Pipeline
            </span>
            <h2 className="text-lg font-bold text-neutral-900">Report a Civic Problem</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="px-6 py-2 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between text-xs font-medium text-neutral-500">
          <div className={`flex items-center gap-1.5 ${step === 'evidence' ? 'text-neutral-900 font-bold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'evidence' ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-800'}`}>1</span>
            <span>Upload Photo</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
          <div className={`flex items-center gap-1.5 ${step === 'review_and_location' ? 'text-neutral-900 font-bold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'review_and_location' ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-800'}`}>2</span>
            <span>Review & Location</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
          <div className={`flex items-center gap-1.5 ${step === 'confirmed' ? 'text-emerald-600 font-bold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'confirmed' ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-800'}`}>3</span>
            <span>Dispatch</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-sm">
          {/* STEP 1: PHOTO EVIDENCE UPLOAD & AUTOMATIC VISION ANALYSIS */}
          {step === 'evidence' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-neutral-900">Upload Defect Photo Evidence</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
                  Take or upload a clear photo of the civic defect. Gemini Flash will automatically analyze the visual image and generate the report details for you.
                </p>
              </div>

              {/* Upload Box */}
              <div className="border-2 border-dashed border-neutral-300 hover:border-emerald-500 rounded-2xl p-8 text-center bg-neutral-50/70 transition cursor-pointer relative group">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isValidatingFile || isAnalyzing}
                  className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                
                {isAnalyzing ? (
                  <div className="space-y-3 py-4">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
                    <p className="text-xs font-bold text-neutral-800">
                      Analyzing photo with Gemini Flash Vision...
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Detecting surface defect, estimating risk score, and drafting description.
                    </p>
                  </div>
                ) : (
                  <>
                    <Camera className="w-10 h-10 text-neutral-400 group-hover:text-emerald-600 mx-auto mb-2 transition" />
                    <p className="text-xs font-semibold text-neutral-800">
                      {isValidatingFile ? 'Validating image...' : 'Click to select photo or drag and drop here'}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Supports JPEG, PNG, WebP. High resolution images supported.
                    </p>
                  </>
                )}
              </div>

              {/* Errors & Warnings */}
              {fileValidationErrors.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs space-y-1">
                  {fileValidationErrors.map((err, i) => <p key={i}>{err}</p>)}
                </div>
              )}
              {fileValidationWarnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs space-y-1">
                  {fileValidationWarnings.map((w, i) => <p key={i}>Notice: {w}</p>)}
                </div>
              )}

              {/* Privacy Guarantee Note */}
              <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl flex items-start gap-2.5 text-xs text-neutral-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Private Citizen Identity:</strong> Your mobile number and personal identity remain confidential. Municipal engineering dispatches reference the verified geo-coordinates and visual defect.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: STREAMLINED REVIEW & LOCATION CONFIRMATION */}
          {step === 'review_and_location' && currentAiResult && locationSnapshot && (
            <div className="space-y-4 animate-in fade-in">
              {/* AI Vision Detection Summary Card */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs text-neutral-900 uppercase tracking-wider">
                      Gemini Flash Vision Analysis
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    Confidence: {(currentAiResult.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="flex gap-3.5 items-start bg-white p-3 rounded-xl border border-neutral-200">
                  {uploadedFiles[0] && (
                    <img 
                      src={uploadedFiles[0].url} 
                      alt="Evidence" 
                      className="w-20 h-20 rounded-lg object-cover border border-neutral-200 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-neutral-900">
                        {currentAiResult.problemType}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        currentAiResult.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                        currentAiResult.severity === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {currentAiResult.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 truncate">
                      Department: <strong className="text-neutral-800">{currentAiResult.suggestedDepartment}</strong>
                    </p>
                    <p className="text-[11px] text-neutral-500 italic line-clamp-2">
                      "{currentAiResult.explanation}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Editable Report Details (Pre-filled by AI) */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    Report Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-neutral-700">
                      Problem Description (Generated by AI based on photo)
                    </label>
                    <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                      <Edit3 className="w-3 h-3" /> Editable
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Problem description..."
                    className="w-full p-3 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 leading-relaxed"
                  />
                </div>
              </div>

              {/* GIS Map & Location Confirmation */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Location & GIS Ward</span>
                  </span>
                  <span className="text-[11px] font-mono text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                    {selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}
                  </span>
                </div>

                <InteractiveMap
                  center={[selectedCoords.lat, selectedCoords.lng]}
                  zoom={14}
                  height="180px"
                  selectedLocation={selectedCoords}
                  onSelectCoordinates={handleMapPinSelected}
                  wards={gisWards}
                  showWards={true}
                />

                {/* Ward Snapshot Badge */}
                <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Resolved Ward</span>
                    <strong className="text-neutral-900 font-bold">
                      {locationSnapshot.wardName || 'Ward 12 (Peelamedu)'}
                    </strong>
                    <span className="text-[11px] text-neutral-600 block">
                      {locationSnapshot.localBodyName}, {locationSnapshot.districtName}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {locationSnapshot.locationStatus}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('evidence')}
                  className="flex items-center gap-1.5 px-3.5 py-2 border border-neutral-300 text-neutral-700 font-semibold text-xs rounded-xl hover:bg-neutral-50 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Change Photo</span>
                </button>

                <button
                  type="button"
                  disabled={!description.trim()}
                  onClick={handleSubmitReport}
                  className="flex items-center gap-2 px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition shadow-xs"
                >
                  <span>Submit Complaint</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </div>
          )}

          {/* STEP: DUPLICATE DETECTION */}
          {step === 'duplicates' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-xs text-amber-900">
                    Similar Problem Already Reported Nearby ({duplicates.length})
                  </h3>
                  <p className="text-xs text-amber-800/80 mt-0.5">
                    An existing report for this defect is already active within 350 meters. You can upvote it to increase its priority or file an independent ticket.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {duplicates.map((dup) => (
                  <div key={dup.existingComplaint.complaintId} className="p-3.5 rounded-xl border border-neutral-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-neutral-800">
                        {dup.existingComplaint.complaintId}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {dup.distanceMeters}m away
                      </span>
                    </div>
                    <p className="text-xs text-neutral-700">{dup.existingComplaint.title}</p>
                    <button
                      type="button"
                      onClick={() => handleSupportExistingDuplicate(dup.existingComplaint.complaintId)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition"
                    >
                      Upvote & Support Existing Report
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('review_and_location')}
                  className="px-3.5 py-2 border border-neutral-300 text-neutral-700 font-semibold text-xs rounded-xl hover:bg-neutral-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={finalizeSubmission}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl"
                >
                  Submit as Separate Report
                </button>
              </div>
            </div>
          )}

          {/* STEP: DISPATCH CONFIRMATION */}
          {step === 'confirmed' && (
            <div className="py-8 text-center space-y-4 animate-in fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-neutral-900">
                  Complaint Dispatched Successfully!
                </h3>
                <p className="text-xs font-mono font-bold text-emerald-700">
                  Ticket ID: {createdComplaintId}
                </p>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
                  Routed to responsible municipal department with authoritative GIS ward coordinates and SLA timer active.
                </p>
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    if (createdComplaintId) onSuccess(createdComplaintId);
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl transition"
                >
                  View in Progress Tracker
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
