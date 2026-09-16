import React from 'react';
import { ShieldCheck, MapPin, Radio, HeartHandshake, Lightbulb, ExternalLink } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-neutral-950 text-neutral-400 border-t border-neutral-800 text-sm mt-20">
      {/* Primary Brand & Purpose Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Col 1: Platform Identity */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5 text-white font-bold text-lg">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Radio className="w-4 h-4 text-emerald-400" />
              </div>
              <span>CivicSync</span>
              <span className="text-[10px] font-mono tracking-widest uppercase bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
                National Stack
              </span>
            </div>
            <p className="text-neutral-300 font-medium text-base tracking-wide">
              SEE A PROBLEM. REPORT IT. TRACK IT. SOLVE IT.
            </p>
            <p className="text-neutral-400 text-xs leading-relaxed max-w-md">
              CivicSync eliminates traditional municipal ambiguity by synthesizing authoritative GIS point-in-polygon resolution, multimodal Gemini intelligence, deterministic routing, and open public transparency.
            </p>

            <div className="pt-2 flex items-center gap-3 text-xs text-neutral-300">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Public Progress. Private Identity.
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                EPSG:4326 GIS Validated
              </span>
            </div>
          </div>

          {/* Col 2: Actor Portals */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Civic Actors</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('citizen')} className="hover:text-white transition">
                  Citizen Reporting Portal
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('government')} className="hover:text-white transition">
                  Government Operations
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('community')} className="hover:text-white transition">
                  Verified NGOs & Volunteers
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('innovation')} className="hover:text-white transition">
                  Student & Developer Challenges
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('admin')} className="hover:text-white transition">
                  National GIS & Hierarchy Admin
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Public Transparency */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Public Systems</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('live-relay')} className="hover:text-white transition">
                  Live Civic Event Relay
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('problems')} className="hover:text-white transition">
                  Public Problem Explorer
                </button>
              </li>
              <li>
                <span className="text-neutral-500">72-Hour Default SLA Engine</span>
              </li>
              <li>
                <span className="text-neutral-500">Deterministic Priority Matrix</span>
              </li>
              <li>
                <span className="text-neutral-500">Workload Allocation & OR-Tools</span>
              </li>
            </ul>
          </div>

          {/* Col 4: National Jurisdiction */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Active Coverage</h4>
            <div className="space-y-2 text-xs text-neutral-400">
              <p className="text-neutral-300 font-medium">Coimbatore City Municipal Corp (CCMC)</p>
              <p className="text-[11px] text-neutral-500">100 Wards Published • Gazetted 2024</p>
              
              <p className="text-neutral-300 font-medium pt-1">Greater Chennai Corp (GCC)</p>
              <p className="text-[11px] text-neutral-500">200 Wards • Zone Delimitation v3.0</p>
              
              <p className="text-neutral-300 font-medium pt-1">Bruhat Bengaluru (BBMP)</p>
              <p className="text-[11px] text-neutral-500">243 Wards • Ingestion Pipeline</p>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Security Notice */}
        <div className="mt-12 pt-6 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-300 gap-4">
          <p>© 2026 CivicSync Initiative. Open Civic Problem Resolution Architecture.</p>
          <div className="flex items-center gap-6">
            <span className="text-neutral-300">No Private PII Exogenous Leakage Guaranteed</span>
            <span className="text-neutral-300">MongoDB 2dsphere $geoIntersects</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
