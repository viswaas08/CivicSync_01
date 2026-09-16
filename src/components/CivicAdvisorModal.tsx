import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  X, 
  HelpCircle, 
  BookOpen, 
  ArrowRight,
  Scale
} from 'lucide-react';
import { askCivicAdvisor } from '../services/geminiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const CivicAdvisorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: `Hello! I am your **CivicSync Municipal Rights & Bylaw Copilot**.\n\nYou can ask me anything about:\n- **Resolution SLA Timelines** (e.g. 72-hour limits & hierarchical escalation)\n- **Municipal Bylaws** (Solid Waste Management Rules 2016, Street Vendors Act)\n- **Road Defect Liability** (Contractor DLP & IRC repair standards)\n- **Citizen Rights & RTI** (How to inspect public works and measurement books)\n\nHow can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  if (!isOpen) return null;

  const quickPrompts = [
    'What happens if my road pothole is not repaired within 72 hours?',
    'What are the rules for open garbage dumping under SWM Rules 2016?',
    'How do I file an RTI to inspect road repair contractor bills?',
    'Who is responsible for broken streetlights and dark spots?'
  ];

  const handleSend = async (questionText?: string) => {
    const q = (questionText || input).trim();
    if (!q || loading) return;

    const userMsg: Message = {
      role: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const reply = await askCivicAdvisor(q);
      const assistantMsg: Message = {
        role: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'Unable to reach the civic database right now. Please refer to the Citizen Charter or file your grievance via the Report Wizard.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-neutral-200 flex flex-col h-[640px] max-h-[90vh] overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-neutral-900 flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">CivicSync Legal & Municipal Advisor</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-400 text-neutral-950 font-mono">
                  Gemini Copilot
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Grounded in Indian Municipal Corporation Acts, SWM 2016, and Citizen Charters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-neutral-50/50 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 space-y-1 shadow-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-neutral-900 text-white rounded-br-xs'
                    : 'bg-white text-neutral-800 border border-neutral-200 rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
                <span className={`text-[10px] block mt-1 ${m.role === 'user' ? 'text-neutral-400 text-right' : 'text-neutral-400'}`}>
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-neutral-500 text-xs p-2 bg-white rounded-xl border border-neutral-200 w-fit">
              <Sparkles className="w-4 h-4 animate-spin text-amber-500" />
              <span>Consulting municipal codes & escalation guidelines...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="p-3 border-t border-neutral-100 bg-white">
          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
            Suggested Inquiries:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(p)}
                disabled={loading}
                className="text-[11px] text-neutral-700 bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1 rounded-lg transition text-left"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-neutral-200 bg-white flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a municipal question (e.g. 'Can I challenge an unverified closure?')..."
            className="flex-1 text-xs p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-hidden focus:border-neutral-900"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl transition flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
