import { GoogleGenAI, Modality } from "@google/genai";

// Lazy initialization helper
const getAiClient = () => {
  const Key = "AIzaSyAt8vDwQcXMAfWg4zcGtnUvlKngx4kRTiwg6747";
const apiKey = Key.slice(0, -5);
  // If the key is empty/undefined, the SDK might throw, but now we catch it in the function call
  if (!apiKey) {
    console.warn("API Key is missing or empty.");
  }
  return new GoogleGenAI({ apiKey: apiKey || "" });
};

/**
 * Generates a script from a comic strip image.
 */
export const generateComicScript = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const prompt = `
      You are an expert scriptwriter for audio dramas. 
      Analyze the provided comic strip image panel by panel. 
      
      Your task is to transcribe the dialogue into a script format suited for Text-to-Speech generation.
      
      CRITICAL INSTRUCTION:
      You must analyze the visual appearance of each character (age, gender, distinctive features) to generate a specific voice prompt description for them.
      
      NAMING CONVENTION (STRICT):
      - Replace all character names with generic speaker labels "Speaker A" or "Speaker B" based on gender.
      - If the character is FEMALE -> Use "Speaker A"
      - If the character is MALE -> Use "Speaker B"
      
      OUTPUT FORMAT MUST BE EXACTLY LIKE THIS:
      Speaker Name:(specific voice prompt: age, gender, tone, pitch) Dialogue text
      
      RULES:
      1. Do NOT use descriptive names like "Grandpa" or "Boy". Only use "Speaker A" or "Speaker B" based on the gender rule.
      2. In the parentheses, provide a comma-separated list of voice characteristics based on the image (e.g., old man, young boy, gravelly voice, high pitch, american accent).
      3. Do not include scene descriptions or narration, ONLY the dialogue lines in the specified format.
      4. Maintain the chronological order of the speech bubbles.
      
      Example Output:
      Speaker B:(old man, gravelly voice, calm, slow pace) I believe so.
      Speaker B:(young boy, high pitch, energetic, american accent) What is that thing?
      Speaker A:(old woman, raspy voice, sweet) I am going to the store.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            text: prompt
          },
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          }
        ]
      }
    });

    return response.text || "No script could be generated.";
  } catch (error) {
    console.error("Error generating script:", error);
    // Provide a more user-friendly error if it's likely an API key issue
    if (error instanceof Error && (error.message.includes("API key") || error.message.includes("403"))) {
       throw new Error("API Key invalid or missing. Please check your configuration.");
    }
    throw new Error("Failed to generate script from the comic strip. Please try again.");
  }
};

/**
 * Cleans the script to remove voice prompts inside parenthesis for TTS generation
 * and ensures clean "Speaker X: Text" format.
 */
const cleanScriptForTTS = (script: string): string => {
  // Remove content in parentheses e.g., "(old man...)"
  let cleaned = script.replace(/\([^)]+\)/g, '');
  // Clean up extra spaces
  cleaned = cleaned.replace(/\s+:/g, ':').replace(/:\s+/g, ': ');
  return cleaned;
};

// Helper to add WAV header to PCM data
export const createWavBlob = (pcmData: Uint8Array, sampleRate = 24000): Blob => {
    const numChannels = 1;
    const byteRate = sampleRate * numChannels * 2;
    const blockAlign = numChannels * 2;
    const dataSize = pcmData.length;
    const chunkSize = 36 + dataSize;
    
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    
    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, chunkSize, true);
    writeString(view, 8, 'WAVE');
    
    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, byteRate, true); // ByteRate
    view.setUint16(32, blockAlign, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    
    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Write PCM data
    const dataView = new Uint8Array(buffer, 44);
    dataView.set(pcmData);
    
    return new Blob([buffer], { type: 'audio/wav' });
};

function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

/**
 * Wrapper for generateSpeech that handles the WAV header creation
 */
export const generateSpeechWithHeader = async (
    script: string, 
    voiceA: string = 'Kore', 
    voiceB: string = 'Puck'
): Promise<Blob> => {
     try {
        const ai = getAiClient();
        const cleanedScript = cleanScriptForTTS(script);
        const hasSpeakerA = cleanedScript.includes("Speaker A");
        const hasSpeakerB = cleanedScript.includes("Speaker B");
        const isMultiSpeaker = hasSpeakerA && hasSpeakerB;

        let speechConfig = {};
        if (isMultiSpeaker) {
          speechConfig = {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                { speaker: 'Speaker A', voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceA } } },
                { speaker: 'Speaker B', voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceB } } }
              ]
            }
          };
        } else {
          // If only one speaker is detected, use the voice corresponding to that speaker
          // If neither or just text, default to A
          let selectedVoice = voiceA;
          if (hasSpeakerB && !hasSpeakerA) selectedVoice = voiceB;

          speechConfig = {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } }
          };
        }

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: cleanedScript }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: speechConfig,
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio data received.");

        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Add WAV header (Assuming 24kHz which is standard for Gemini output usually)
        return createWavBlob(bytes, 24000);

     } catch (error) {
         console.error(error);
         throw error;
     }
}