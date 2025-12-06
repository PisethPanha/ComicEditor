export interface ComicPanel {
  id: string;
  file: File;
  previewUrl: string;
  base64: string;
  script: string | null;
  isGeneratingScript: boolean;
  scriptError: string | null;
  audioUrl: string | null;
  isGeneratingAudio: boolean;
  audioError: string | null;
  voiceA: string;
  voiceB: string;
}

export interface ImageFile {
  file: File;
  previewUrl: string;
  base64: string;
}

export const AVAILABLE_VOICES = [
  { name: 'Puck', gender: 'Male', style: 'Deep, Assertive' },
  { name: 'Charon', gender: 'Male', style: 'Deep, Authoritative' },
  { name: 'Kore', gender: 'Female', style: 'Calm, Soothing' },
  { name: 'Fenrir', gender: 'Male', style: 'Deep, Growly' },
  { name: 'Aoede', gender: 'Female', style: 'High, Youthful' }, // Note: Aoede/Zephyr might vary in availability, sticking to known ones or safe defaults
  { name: 'Zephyr', gender: 'Female', style: 'Standard' },
];