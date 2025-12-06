import React, { useState } from 'react';
import { Sparkles, MessageSquarePlus, AlertCircle, X } from 'lucide-react';
import { UploadZone } from './components/UploadZone';
import { ScriptDisplay } from './components/ScriptDisplay';
import { Button } from './components/Button';
import { ImageFile, ComicPanel } from './types';
import { generateComicScript, generateSpeechWithHeader } from './services/geminiService';

const App: React.FC = () => {
  const [panels, setPanels] = useState<ComicPanel[]>([]);
  const [activePanelId, setActivePanelId] = useState<string | null>(null);

  const activePanel = panels.find(p => p.id === activePanelId) || null;

  const handleImagesAdded = (images: ImageFile[]) => {
    // Limit total panels to 5
    const slotsRemaining = 5 - panels.length;
    if (slotsRemaining <= 0) return;

    const newPanels: ComicPanel[] = images.slice(0, slotsRemaining).map(img => ({
      id: Math.random().toString(36).substr(2, 9),
      file: img.file,
      previewUrl: img.previewUrl,
      base64: img.base64,
      script: null,
      isGeneratingScript: false,
      scriptError: null,
      audioUrl: null,
      isGeneratingAudio: false,
      audioError: null,
      voiceA: 'Kore', // Default Female
      voiceB: 'Puck', // Default Male
    }));

    setPanels(prev => [...prev, ...newPanels]);
    
    // Auto-select the first new panel if none selected
    if (!activePanelId && newPanels.length > 0) {
      setActivePanelId(newPanels[0].id);
    }
  };

  const removePanel = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPanels(prev => prev.filter(p => p.id !== id));
    if (activePanelId === id) {
      setActivePanelId(null);
    }
  };

  const updatePanel = (id: string, updates: Partial<ComicPanel>) => {
    setPanels(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleGenerateScript = async () => {
    if (!activePanel) return;

    updatePanel(activePanel.id, { isGeneratingScript: true, scriptError: null });

    try {
      const script = await generateComicScript(activePanel.base64, activePanel.file.type);
      updatePanel(activePanel.id, {
        isGeneratingScript: false,
        script: script,
      });
    } catch (err) {
      updatePanel(activePanel.id, {
        isGeneratingScript: false,
        scriptError: err instanceof Error ? err.message : 'An unexpected error occurred',
      });
    }
  };

  const handleGenerateAudio = async () => {
    if (!activePanel || !activePanel.script) return;

    updatePanel(activePanel.id, { isGeneratingAudio: true, audioError: null });

    try {
      // Pass selected voices
      const blob = await generateSpeechWithHeader(
          activePanel.script, 
          activePanel.voiceA, 
          activePanel.voiceB
      );
      const url = URL.createObjectURL(blob);
      updatePanel(activePanel.id, {
        isGeneratingAudio: false,
        audioUrl: url,
      });
    } catch (err) {
      updatePanel(activePanel.id, {
        isGeneratingAudio: false,
        audioError: err instanceof Error ? err.message : 'Failed to generate audio',
      });
    }
  };

  const handleScriptChange = (newContent: string) => {
      if (!activePanel) return;
      // Invalidate audio if script changes
      updatePanel(activePanel.id, { 
          script: newContent,
          audioUrl: null 
      });
  };

  const handleVoiceAChange = (voice: string) => {
      if (!activePanel) return;
      updatePanel(activePanel.id, { voiceA: voice });
  };

  const handleVoiceBChange = (voice: string) => {
      if (!activePanel) return;
      updatePanel(activePanel.id, { voiceB: voice });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100 selection:bg-blue-500/30">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg shadow-blue-900/20 shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">ComicScribe AI</h1>
          </div>
          <div className="text-sm text-slate-400 hidden sm:block font-medium">
            Powered by yorn pisethpanha
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Intro (Only show if no panels) */}
        {panels.length === 0 && (
            <div className="mb-8 text-center max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl mb-4">
                Turn Comics into Audio Dramas
            </h2>
            <p className="text-lg text-slate-400">
                Upload up to 5 comic strips. AI will transcribe dialogue, assign voices, and generate audio.
            </p>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start h-full">
          
          {/* Left Column: List & Active Image Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-6 flex flex-col">
            
            {/* 1. Upload Area (If empty or compact) */}
            {panels.length < 5 && (
                 <div className="bg-slate-900 p-1 rounded-2xl shadow-sm border border-slate-800">
                    <UploadZone 
                        onImagesAdded={handleImagesAdded} 
                        disabled={panels.length >= 5}
                        compact={panels.length > 0}
                    />
                </div>
            )}

            {/* 2. Panel List (Thumbnails) */}
            {panels.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar snap-x">
                    {panels.map(panel => (
                        <div 
                            key={panel.id}
                            onClick={() => setActivePanelId(panel.id)}
                            className={`
                                relative flex-shrink-0 w-20 h-20 rounded-lg cursor-pointer overflow-hidden border-2 transition-all snap-start
                                ${activePanelId === panel.id ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-700 opacity-60 hover:opacity-100'}
                            `}
                        >
                            <img src={panel.previewUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                            <button 
                                onClick={(e) => removePanel(panel.id, e)}
                                className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                            {panel.script && <div className="absolute bottom-0 right-0 p-1"><div className="w-2 h-2 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></div></div>}
                        </div>
                    ))}
                </div>
            )}

            {/* 3. Active Image Preview */}
            {activePanel ? (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="relative w-full bg-slate-900 rounded-xl overflow-hidden shadow-xl border border-slate-800 group max-h-[500px] flex items-center justify-center">
                        <img 
                        src={activePanel.previewUrl} 
                        alt="Comic Preview" 
                        className="max-w-full max-h-[500px] object-contain"
                        />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                         <Button 
                            onClick={handleGenerateScript}
                            isLoading={activePanel.isGeneratingScript}
                            disabled={activePanel.isGeneratingScript}
                            variant="primary"
                            className="w-full text-lg py-3 px-6 shadow-lg shadow-blue-900/30"
                            icon={<MessageSquarePlus className="w-5 h-5" />}
                        >
                            {activePanel.isGeneratingScript ? 'Analyzing...' : activePanel.script ? 'Regenerate Script' : 'Generate Script'}
                        </Button>
                        {activePanel.scriptError && (
                            <p className="text-sm text-red-400 bg-red-950/30 p-2 rounded border border-red-900/50">{activePanel.scriptError}</p>
                        )}
                    </div>
                </div>
            ) : (
                panels.length > 0 && <div className="text-center text-slate-500 py-10">Select a panel to view</div>
            )}
          </div>

          {/* Right Column: Result (Script & Audio) (7 cols) */}
          <div className="lg:col-span-7 h-full min-h-[500px] lg:h-[calc(100vh-140px)] flex flex-col sticky top-24">
            {activePanel && activePanel.script ? (
              <ScriptDisplay 
                content={activePanel.script} 
                onContentChange={handleScriptChange}
                onGenerateAudio={handleGenerateAudio}
                audioUrl={activePanel.audioUrl}
                isGeneratingAudio={activePanel.isGeneratingAudio}
                voiceA={activePanel.voiceA}
                voiceB={activePanel.voiceB}
                onVoiceAChange={handleVoiceAChange}
                onVoiceBChange={handleVoiceBChange}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-slate-900 rounded-xl border border-slate-800 border-dashed p-12 text-center text-slate-500 shadow-sm">
                <div className="bg-slate-800 p-4 rounded-full mb-4">
                    <FileTextPlaceholder />
                </div>
                <p className="text-lg font-medium text-slate-300">
                    {activePanel ? "Ready to generate" : "No comic selected"}
                </p>
                <p className="text-sm mt-2 max-w-xs mx-auto text-slate-500">
                  {activePanel 
                    ? "Click 'Generate Script' to analyze the characters and dialogue." 
                    : "Upload a comic strip to get started."}
                </p>
              </div>
            )}
            {activePanel && activePanel.audioError && (
                 <div className="mt-4 bg-red-950/30 border-l-4 border-red-500 p-4 rounded-r-lg">
                    <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-red-300">{activePanel.audioError}</p>
                    </div>
                    </div>
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const FileTextPlaceholder = () => (
  <svg className="w-12 h-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export default App;