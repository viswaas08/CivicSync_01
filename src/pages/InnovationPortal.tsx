import React, { useState } from 'react';
import { useCivic } from '../context/CivicContext';
import { InnovationChallenge, InnovationSolution } from '../types';
import { 
  Lightbulb, 
  Code2, 
  Rocket, 
  CheckCircle2, 
  ArrowUpRight, 
  Plus, 
  ExternalLink, 
  Award, 
  Users,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export const InnovationPortal: React.FC = () => {
  const { 
    currentUser, 
    innovationChallenges = [], 
    innovationSolutions = [], 
    submitInnovationSolution 
  } = useCivic();

  const safeChallenges = innovationChallenges || [];
  const safeSolutions = innovationSolutions || [];

  const [selectedChallenge, setSelectedChallenge] = useState<InnovationChallenge | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Form State
  const [solutionTitle, setSolutionTitle] = useState('');
  const [abstractText, setAbstractText] = useState('');
  const [techStackInput, setTechStackInput] = useState('ESP32, LoRaWAN, WebSockets, Next.js');
  const [repoUrl, setRepoUrl] = useState('https://github.com/civicsync/drain-sensor-poc');
  const [demoUrl, setDemoUrl] = useState('https://drainage-sensor-demo.web.app');
  const [costEstimate, setCostEstimate] = useState('₹1,450 per manhole sensor node');

  const handleSubmitSolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChallenge) return;

    const challengeIdentifier = selectedChallenge.challengeId || selectedChallenge.id;
    const newSolution: InnovationSolution = {
      solutionId: `sol-${Date.now()}`,
      challengeId: challengeIdentifier,
      title: solutionTitle,
      abstract: abstractText,
      authorId: currentUser.uid,
      authorName: currentUser.displayName,
      authorType: currentUser.role === 'innovator' ? 'STUDENT' : 'DEVELOPER',
      organization: currentUser.organizationName || 'PSG Tech Civic Tech Lab',
      techStack: techStackInput.split(',').map(s => s.trim()).filter(Boolean),
      githubUrl: repoUrl,
      demoUrl: demoUrl,
      estimatedCost: costEstimate,
      pipelineStage: 'TECHNICAL_REVIEW',
      votes: 1,
      createdAt: new Date().toISOString()
    };

    if (submitInnovationSolution) {
      submitInnovationSolution(newSolution);
    }
    setShowSubmitModal(false);
    setSelectedChallenge(null);
    setSolutionTitle('');
    setAbstractText('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-neutral-900 flex items-center justify-center font-bold text-xl">
            <Lightbulb className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-neutral-900">
                Civic Innovation & Engineering Hub
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Open Gov API & Hackathons
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Connecting engineering students, open-source developers, and startups with unsolved municipal pain points.
            </p>
            <span className="inline-block text-[11px] text-neutral-400 mt-1">
              Structured Pathway: Technical Review → Govt Feasibility → Pilot In-Field → City Deployment.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-neutral-500 block">Solutions in Pipeline</span>
            <span className="text-xl font-extrabold text-neutral-900">{safeSolutions.length} Prototypes</span>
          </div>
        </div>
      </div>

      {/* Structured Pipeline Guide */}
      <div className="p-4 bg-neutral-900 text-white rounded-2xl space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
          <Rocket className="w-4 h-4" />
          <span>The CivicSync Innovation Pathway</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1">
          <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[10px] text-neutral-400 block">Stage 1</span>
            <strong className="text-white">Technical Review</strong>
            <p className="text-[11px] text-neutral-400 mt-0.5">Code audit, architecture validation, and edge security.</p>
          </div>
          <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[10px] text-neutral-400 block">Stage 2</span>
            <strong className="text-white">Govt Feasibility</strong>
            <p className="text-[11px] text-neutral-400 mt-0.5">Municipal engineer sign-off & departmental suitability.</p>
          </div>
          <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[10px] text-neutral-400 block">Stage 3</span>
            <strong className="text-white">Pilot Deployment</strong>
            <p className="text-[11px] text-neutral-400 mt-0.5">Funded 30-day trial in 1 test ward with live sensor data.</p>
          </div>
          <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[10px] text-neutral-400 block">Stage 4</span>
            <strong className="text-emerald-400">City-Wide Adoption</strong>
            <p className="text-[11px] text-neutral-400 mt-0.5">Production procurement & public recognition.</p>
          </div>
        </div>
      </div>

      {/* Active Civic Challenges */}
      <div className="space-y-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
            Open Municipal RFP Challenges
          </span>
          <h2 className="text-xl font-bold text-neutral-900">
            Unsolved High-Priority Problems Seeking Prototypes
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {safeChallenges.map((ch, idx) => {
            const chId = ch.challengeId || ch.id || `chal-${idx}`;
            const targetDept = ch.targetDepartment || ch.targetLocalBody || 'Municipal Engineering';
            const bounty = ch.bountyReward || '₹50,000 Municipal Pilot';
            const criteria = ch.evaluationCriteria || ch.technicalRequirements || [];
            const count = ch.solutionsCount ?? ch.submissionsCount ?? 0;

            return (
              <div key={chId} className="p-5 rounded-2xl border border-neutral-200 bg-white shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-800">
                      {targetDept}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Bounty: {bounty}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-neutral-900">{ch.title}</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">{ch.description}</p>

                  <div className="space-y-1 pt-1 text-xs">
                    <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Evaluation Criteria:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-neutral-600 text-xs">
                      {criteria.map((crit, cIdx) => (
                        <li key={`crit-${chId}-${cIdx}`}>{crit}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-xs text-neutral-500">
                    Solutions: <strong>{count} Submitted</strong>
                  </span>

                  <button
                    onClick={() => {
                      setSelectedChallenge(ch);
                      setShowSubmitModal(true);
                    }}
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Code2 className="w-4 h-4" />
                    <span>Propose Solution</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submitted Prototypes & Solutions Gallery */}
      <div className="space-y-4 pt-4 border-t border-neutral-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Open Source Civic Tech
          </span>
          <h2 className="text-xl font-bold text-neutral-900">
            Solutions Advancing in the Municipal Pipeline
          </h2>
        </div>

        {safeSolutions.length === 0 ? (
          <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 text-neutral-500 text-xs">
            No public solutions proposed yet. Select any challenge above to propose an engineering solution.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {safeSolutions.map((sol, sIdx) => {
              const solKey = sol.solutionId || `sol-${sIdx}`;
              const techList = sol.techStack || [];
              const stageText = (sol.pipelineStage || 'TECHNICAL_REVIEW').replace(/_/g, ' ');

              return (
                <div key={solKey} className="p-5 rounded-2xl border border-neutral-200 bg-white shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      STAGE: {stageText}
                    </span>
                    <span className="text-xs font-mono text-neutral-400">
                      {sol.createdAt ? new Date(sol.createdAt).toLocaleDateString() : 'Active'}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-neutral-900">{sol.title}</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">{sol.abstract}</p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {techList.map((tech, i) => (
                      <span key={`tech-${solKey}-${i}`} className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100">
                    <span>By: <strong className="text-neutral-900">{sol.authorName}</strong> ({sol.organization})</span>
                    {sol.estimatedCost && <span className="font-medium text-emerald-700">{sol.estimatedCost}</span>}
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    {sol.githubUrl && (
                      <a 
                        href={sol.githubUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 flex items-center gap-1"
                      >
                        <span>View Repository</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {sol.demoUrl && (
                      <a 
                        href={sol.demoUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 flex items-center gap-1"
                      >
                        <span>Live Simulation</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Solution Submission Modal */}
      {showSubmitModal && selectedChallenge && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div>
                <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">
                  Challenge Proposal
                </span>
                <h3 className="font-bold text-base text-neutral-900">
                  {selectedChallenge.title}
                </h3>
              </div>
              <button 
                onClick={() => setShowSubmitModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitSolution} className="space-y-3.5 text-xs">
              <div>
                <label className="text-xs font-semibold text-neutral-800 block mb-1">
                  Solution Title
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. EdgeAI Optical Litter Detector for CCMC Compactors"
                  value={solutionTitle}
                  onChange={(e) => setSolutionTitle(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-neutral-300"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-800 block mb-1">
                  Technical Abstract & Architecture
                </label>
                <textarea 
                  rows={3}
                  required
                  placeholder="Explain your sensor choice, cloud architecture, battery autonomy, and failure recovery modes..."
                  value={abstractText}
                  onChange={(e) => setAbstractText(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-neutral-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-800 block mb-1">
                    Tech Stack (comma separated)
                  </label>
                  <input 
                    type="text" 
                    value={techStackInput}
                    onChange={(e) => setTechStackInput(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-800 block mb-1">
                    Bill of Materials / Cost
                  </label>
                  <input 
                    type="text" 
                    value={costEstimate}
                    onChange={(e) => setCostEstimate(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-neutral-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-800 block mb-1">
                    GitHub / Source Code URL
                  </label>
                  <input 
                    type="url" 
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-800 block mb-1">
                    Live Demo / Prototype URL
                  </label>
                  <input 
                    type="url" 
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-neutral-300"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 text-white font-semibold rounded-lg hover:bg-neutral-800"
                >
                  Submit for Technical Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
