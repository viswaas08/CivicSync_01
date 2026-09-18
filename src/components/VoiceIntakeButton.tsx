import React, { useState, useEffect, useRef } from 'react';
import { 
  IndicSpeechRecognizer, 
  INDIC_LANGUAGES, 
  IndicVoiceLanguage, 
  parseIndicVoiceTranscript,
  IndicVoiceResult 
} from '../services/indicVoiceEngine';
import { triggerHapticFeedback } from '../services/offlineStorage';
import { Mic, MicOff, Volume2, Sparkles, Check, Globe } from 'lucide-react';

interface VoiceIntakeButtonProps {
  onParsedResult: (result: IndicVoiceResult) => void;
}

export const VoiceIntakeButton: React.FC<VoiceIntakeButtonProps> = ({ onParsedResult }) => {
  const recognizerRef = useRef<IndicSpeechRecognizer | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState<IndicVoiceLanguage>(INDIC_LANGUAGES[0]);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [lastParsed, setLastParsed] = useState<IndicVoiceResult | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const recognizer = new IndicSpeechRecognizer();
    recognizerRef.current = recognizer;
    setIsSupported(recognizer.isSupported());
  }, []);

  const handleLanguageChange = (lang: IndicVoiceLanguage) => {
    setSelectedLang(lang);
    if (recognizerRef.current) {
      recognizerRef.current.setLanguage(lang.code);
    }
  };

  const toggleListening = () => {
    if (!recognizerRef.current) return;

    if (isListening) {
      recognizerRef.current.stopListening();
      setIsListening(false);
      triggerHapticFeedback('tap');
    } else {
      setLiveTranscript('');
      setLastParsed(null);
      setIsListening(true);
      triggerHapticFeedback('pin_drop');

      recognizerRef.current.startListening(
        (transcript: string, isFinal: boolean) => {
          setLiveTranscript(transcript);
          if (isFinal) {
            const parsed = parseIndicVoiceTranscript(transcript, selectedLang.name);
            setLastParsed(parsed);
            onParsedResult(parsed);
            setIsListening(false);
            triggerHapticFeedback('success');
          }
        },
        (err: string) => {
          console.warn('Voice recognition note:', err);
          setIsListening(false);
          // If browser mic permission or speech service is unavailable, provide a 1-click native phrase demo
          simulateIndicVoiceCapture(selectedLang);
        },
        () => {
          setIsListening(false);
        }
      );
    }
  };

  // Fallback simulator for desktop/non-WebSpeech browsers
  const simulateIndicVoiceCapture = (lang: IndicVoiceLanguage) => {
    setLiveTranscript(lang.samplePhrase);
    const parsed = parseIndicVoiceTranscript(lang.samplePhrase, lang.name);
    setLastParsed(parsed);
    onParsedResult(parsed);
    triggerHapticFeedback('success');
  };

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 text-white shadow-md border border-neutral-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold flex items-center gap-1.5">
              <span>10-Second Indic Voice Intake</span>
              <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded-full">
                AI Autofill
              </span>
            </h4>
            <p className="text-[11px] text-neutral-400">
              Speak naturally in your mother tongue — AI extracts category, urgency & landmark.
            </p>
          </div>
        </div>

        {/* Indic Language Selector Pills */}
        <div className="flex flex-wrap items-center gap-1">
          {INDIC_LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => handleLanguageChange(l)}
              className={`px-2 py-0.5 rounded-lg text-xs font-medium transition ${
                selectedLang.code === l.code
                  ? 'bg-emerald-500 text-neutral-950 font-bold shadow-xs'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
              }`}
            >
              {l.nativeName}
            </button>
          ))}
        </div>
      </div>

      {/* Main Microphone Button & Live Wave State */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-700/60">
        <button
          type="button"
          onClick={toggleListening}
          className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition shadow-lg flex-shrink-0 ${
            isListening 
              ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-500/30' 
              : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold'
          }`}
          title="Click and speak your civic problem"
        >
          {isListening ? (
            <MicOff className="w-6 h-6 animate-bounce" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </button>

        <div className="flex-1 text-center sm:text-left">
          {isListening ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                <span className="text-xs font-semibold text-red-300">Listening in {selectedLang.name}...</span>
              </div>
              <p className="text-xs text-neutral-200 font-mono italic">
                "{liveTranscript || 'Speak now: e.g. Water pipe burst near bus stand...'}"
              </p>
            </div>
          ) : lastParsed ? (
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>Parsed & Autofilled Successfully</span>
              </div>
              <p className="text-xs text-neutral-300 truncate max-w-md">
                "{lastParsed.transcript}"
              </p>
              <div className="flex flex-wrap gap-2 text-[10px] text-neutral-400 pt-0.5">
                <span>Category: <strong className="text-neutral-200">{lastParsed.detectedCategory}</strong></span>
                <span>•</span>
                <span>Urgency: <strong className="text-amber-300">{lastParsed.detectedUrgency}</strong></span>
              </div>
            </div>
          ) : (
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-neutral-200">
                Tap microphone to speak ({selectedLang.nativeName})
              </div>
              <p className="text-[11px] text-neutral-400">
                Or test with sample: "{selectedLang.samplePhrase.substring(0, 55)}..."
              </p>
              <button
                type="button"
                onClick={() => simulateIndicVoiceCapture(selectedLang)}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 inline-flex items-center gap-1 mt-0.5"
              >
                <Sparkles className="w-3 h-3" />
                <span>Test sample {selectedLang.name} audio</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
