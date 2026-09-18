/**
 * Indic Voice Engine (10-Second Voice-First Reporting)
 * Powered by Web Speech API (with Tamil, Hindi, Kannada, Telugu, English models)
 * and intelligent contextual civic extraction.
 */

export interface IndicVoiceResult {
  transcript: string;
  language: string;
  detectedCategory: string;
  detectedProblemType: string;
  detectedUrgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'IMMEDIATE';
  extractedLandmark: string;
  suggestedTitle: string;
  suggestedDescription: string;
}

export interface IndicVoiceLanguage {
  code: string;
  bcp47: string;
  name: string;
  nativeName: string;
  samplePhrase: string;
}

export const INDIC_LANGUAGES: IndicVoiceLanguage[] = [
  {
    code: 'ta',
    bcp47: 'ta-IN',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    samplePhrase: 'பேக்கரிக்கு எதிரே உள்ள பேருந்து நிறுத்தம் அருகே குடிநீர் குழாய் உடைந்து சாலையில் தண்ணீர் பெருக்கெடுத்து ஓடுகிறது.'
  },
  {
    code: 'hi',
    bcp47: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    samplePhrase: 'बेकरी के सामने बस स्टॉप के पास पानी की पाइपलाइन फट गई है और सड़क पर जलभराव हो गया है।'
  },
  {
    code: 'kn',
    bcp47: 'kn-IN',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    samplePhrase: 'ಬೇಕರಿ ಎದುರಿನ ಬಸ್ ನಿಲ್ದಾಣದ ಬಳಿ ನೀರಿನ ಪೈಪ್ ಒಡೆದು ರಸ್ತೆಯಲ್ಲಿ ನೀರು ಹರಿಯುತ್ತಿದೆ.'
  },
  {
    code: 'te',
    bcp47: 'te-IN',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    samplePhrase: 'బేకరీ ఎదురుగా ఉన్న బస్ స్టాప్ వద్ద నీటి పైపు పగిలి రోడ్డుపై నీరు ప్రవహిస్తోంది.'
  },
  {
    code: 'en',
    bcp47: 'en-IN',
    name: 'Indian English',
    nativeName: 'English (IN)',
    samplePhrase: 'A water pipe burst near the bus stop opposite the bakery, flooding the road.'
  }
];

// Keywords mapping for civic problem categorization
const KEYWORD_MAP: Record<string, { category: string; problemType: string; urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'IMMEDIATE' }> = {
  // Water pipeline bursts / leaks
  'burst': { category: 'Water Supply & Underground Drainage', problemType: 'Water Pipeline Burst', urgency: 'HIGH' },
  'leak': { category: 'Water Supply & Underground Drainage', problemType: 'Drinking Water Leakage', urgency: 'MEDIUM' },
  'குழாய்': { category: 'Water Supply & Underground Drainage', problemType: 'Water Pipeline Burst', urgency: 'HIGH' },
  'தண்ணீர்': { category: 'Water Supply & Underground Drainage', problemType: 'Drinking Water Leakage', urgency: 'MEDIUM' },
  'पाइप': { category: 'Water Supply & Underground Drainage', problemType: 'Water Pipeline Burst', urgency: 'HIGH' },
  'पानी': { category: 'Water Supply & Underground Drainage', problemType: 'Water Pipeline Burst', urgency: 'HIGH' },
  'నీటి': { category: 'Water Supply & Underground Drainage', problemType: 'Water Pipeline Burst', urgency: 'HIGH' },
  'ನೀರಿನ': { category: 'Water Supply & Underground Drainage', problemType: 'Water Pipeline Burst', urgency: 'HIGH' },

  // Potholes & road damage
  'pothole': { category: 'Roads, Bridges & Infrastructure', problemType: 'Asphalt Pothole', urgency: 'HIGH' },
  'crater': { category: 'Roads, Bridges & Infrastructure', problemType: 'Dangerous Road Cave-In', urgency: 'IMMEDIATE' },
  'குழி': { category: 'Roads, Bridges & Infrastructure', problemType: 'Asphalt Pothole', urgency: 'HIGH' },
  'சாலை': { category: 'Roads, Bridges & Infrastructure', problemType: 'Damaged Road Surface', urgency: 'MEDIUM' },
  'गड्ढा': { category: 'Roads, Bridges & Infrastructure', problemType: 'Asphalt Pothole', urgency: 'HIGH' },
  'सड़क': { category: 'Roads, Bridges & Infrastructure', problemType: 'Damaged Road Surface', urgency: 'MEDIUM' },
  'గుంత': { category: 'Roads, Bridges & Infrastructure', problemType: 'Asphalt Pothole', urgency: 'HIGH' },
  'ಗುಂಡಿ': { category: 'Roads, Bridges & Infrastructure', problemType: 'Asphalt Pothole', urgency: 'HIGH' },

  // Open Manholes & Sewage
  'manhole': { category: 'Water Supply & Underground Drainage', problemType: 'Open Hazardous Manhole', urgency: 'IMMEDIATE' },
  'sewage': { category: 'Water Supply & Underground Drainage', problemType: 'Sewage Overflow', urgency: 'HIGH' },
  'சாக்கடை': { category: 'Water Supply & Underground Drainage', problemType: 'Sewage Overflow', urgency: 'HIGH' },
  'மழைநீர்': { category: 'Water Supply & Underground Drainage', problemType: 'Stormwater Drain Blockage', urgency: 'HIGH' },
  'सीवर': { category: 'Water Supply & Underground Drainage', problemType: 'Sewage Overflow', urgency: 'HIGH' },
  'मैनहोल': { category: 'Water Supply & Underground Drainage', problemType: 'Open Hazardous Manhole', urgency: 'IMMEDIATE' },

  // Garbage & Waste
  'garbage': { category: 'Solid Waste Management & Sanitation', problemType: 'Garbage Accumulation', urgency: 'MEDIUM' },
  'waste': { category: 'Solid Waste Management & Sanitation', problemType: 'Garbage Dump Overflow', urgency: 'MEDIUM' },
  'குப்பை': { category: 'Solid Waste Management & Sanitation', problemType: 'Garbage Accumulation', urgency: 'MEDIUM' },
  'கழிவு': { category: 'Solid Waste Management & Sanitation', problemType: 'Unsegregated Waste Pile', urgency: 'MEDIUM' },
  'कचरा': { category: 'Solid Waste Management & Sanitation', problemType: 'Garbage Accumulation', urgency: 'MEDIUM' },
  'చెత్త': { category: 'Solid Waste Management & Sanitation', problemType: 'Garbage Accumulation', urgency: 'MEDIUM' },
  'ಕಸ': { category: 'Solid Waste Management & Sanitation', problemType: 'Garbage Accumulation', urgency: 'MEDIUM' },

  // Streetlights & Electrical
  'streetlight': { category: 'Street Lighting & Electrical Infrastructure', problemType: 'Broken Streetlight', urgency: 'MEDIUM' },
  'dark': { category: 'Street Lighting & Electrical Infrastructure', problemType: 'Dark Spot', urgency: 'MEDIUM' },
  'விளக்கு': { category: 'Street Lighting & Electrical Infrastructure', problemType: 'Broken Streetlight', urgency: 'MEDIUM' },
  'மின்சாரம்': { category: 'Street Lighting & Electrical Infrastructure', problemType: 'Hanging Live Wire', urgency: 'IMMEDIATE' },
  'स्ट्रीट लाइट': { category: 'Street Lighting & Electrical Infrastructure', problemType: 'Broken Streetlight', urgency: 'MEDIUM' },
  'बिजली': { category: 'Street Lighting & Electrical Infrastructure', problemType: 'Hanging Live Wire', urgency: 'IMMEDIATE' }
};

/**
 * Extracts landmark phrases from speech text
 */
function extractLandmarkFromText(text: string): string {
  const landmarkPatterns = [
    /near\s+([^,.]+)/i,
    /opposite\s+([^,.]+)/i,
    /next to\s+([^,.]+)/i,
    /behind\s+([^,.]+)/i,
    /அருகே\s+([^,.]+)/i,
    /எதிரே\s+([^,.]+)/i,
    /के पास\s+([^,.]+)/i,
    /के सामने\s+([^,.]+)/i,
    /ಬಳಿ\s+([^,.]+)/i,
    /వద్ద\s+([^,.]+)/i
  ];

  for (const pattern of landmarkPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[0].trim();
    }
  }

  return 'Local street landmark reported via citizen voice';
}

/**
 * Parses Indic voice transcript into structured civic issue fields
 */
export function parseIndicVoiceTranscript(transcript: string, langCode: string): IndicVoiceResult {
  const lower = transcript.toLowerCase();
  
  let detectedCategory = 'Public Works & Civil Infrastructure';
  let detectedProblemType = 'Civic Defect';
  let detectedUrgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'IMMEDIATE' = 'MEDIUM';

  // Find matching keyword
  for (const [kw, def] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(kw.toLowerCase())) {
      detectedCategory = def.category;
      detectedProblemType = def.problemType;
      detectedUrgency = def.urgency;
      break;
    }
  }

  const extractedLandmark = extractLandmarkFromText(transcript);
  
  // Format clean Title and Description
  const suggestedTitle = `${detectedProblemType} (${extractedLandmark || 'Reported Issue'})`;
  const suggestedDescription = `[Voice Intake (${langCode.toUpperCase()})]: "${transcript}"\n\nIdentified Problem: ${detectedProblemType}\nLocation Reference: ${extractedLandmark}\nUrgency: ${detectedUrgency}`;

  return {
    transcript,
    language: langCode,
    detectedCategory,
    detectedProblemType,
    detectedUrgency,
    extractedLandmark,
    suggestedTitle,
    suggestedDescription
  };
}

/**
 * Indic Voice Recorder Controller with Web Speech API
 */
export class IndicSpeechRecognizer {
  private recognition: any = null;
  private isListening: boolean = false;
  private currentLanguage: IndicVoiceLanguage = INDIC_LANGUAGES[0];

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
    }
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }

  public setLanguage(langCode: string) {
    const found = INDIC_LANGUAGES.find(l => l.code === langCode || l.bcp47 === langCode);
    if (found) {
      this.currentLanguage = found;
      if (this.recognition) {
        this.recognition.lang = found.bcp47;
      }
    }
  }

  public getCurrentLanguage(): IndicVoiceLanguage {
    return this.currentLanguage;
  }

  public startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ) {
    if (!this.recognition) {
      onError('Speech recognition not supported in this browser. Using simulation fallback.');
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
    }

    this.recognition.lang = this.currentLanguage.bcp47;

    this.recognition.onstart = () => {
      this.isListening = true;
      if ('vibrate' in navigator) {
        navigator.vibrate(50); // Haptic feedback on mic start
      }
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        if ('vibrate' in navigator) {
          navigator.vibrate([30, 40, 30]); // Haptic feedback on speech capture
        }
        onResult(finalTranscript, true);
      } else {
        onResult(interimTranscript, false);
      }
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      onError(event.error || 'Microphone error');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    try {
      this.recognition.start();
    } catch (e: any) {
      onError(e.message || 'Failed to start recognition');
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}
