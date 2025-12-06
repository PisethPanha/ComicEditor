import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, FileText, Mic, Play, Square, Download, Music, Edit2, Save, X } from 'lucide-react';
import { Button } from './Button';
import { AVAILABLE_VOICES } from '../types';

interface ScriptDisplayProps {
  content: string;
  onContentChange: (newContent: string) => void;
  onGenerateAudio: () => void;
  audioUrl: string | null;
  isGeneratingAudio: boolean;
  voiceA: string;
  voiceB: string;
  onVoiceAChange: (voice: string) => void;
  onVoiceBChange: (voice: string) => void;
}

export const ScriptDisplay: React.FC<ScriptDisplayProps> = ({ 
  content, 
  onContentChange,
  onGenerateAudio, 
  audioUrl, 
  isGeneratingAudio,
  voiceA,
  voiceB,
  onVoiceAChange,
  onVoiceBChange
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState(content);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setEditBuffer(content);
  }, [content]);

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.onpause = () => setIsPlaying(false);
        audioRef.current.onplay = () => setIsPlaying(true);
    }
  }, [audioUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
        audioRef.current.pause();
    } else {
        audioRef.current.play();
    }
  };

  const stopPlayback = () => {
      if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setIsPlaying(false);
      }
  };

  const startEditing = () => {
      setEditBuffer(content);
      setIsEditing(true);
  };

  const saveEdit = () => {
      onContentChange(editBuffer);
      setIsEditing(false);
  };

  const cancelEdit = () => {
      setEditBuffer(content);
      setIsEditing(false);
  };

  const renderFormattedLine = (line: string, index: number) => {
    const match = line.match(/^([^:]+?)\s*:\s*(\([^)]+\))\s*(.+)$/);
    
    if (match) {
      const [, speakerRaw, voicePrompt, dialogue] = match;
      const speaker = speakerRaw.trim();
      const isSpeakerA = speaker.toLowerCase().includes('speaker a');
      const isSpeakerB = speaker.toLowerCase().includes('speaker b');
      
      let speakerClass = "text-slate-300";
      if (isSpeakerA) speakerClass = "text-rose-400";
      if (isSpeakerB) speakerClass = "text-blue-400";

      return (
        <div key={index} className="flex flex-col sm:flex-row sm:items-baseline gap-2 py-3 border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors">
          <div className="sm:w-1/4 flex flex-col shrink-0">
            <span className={`font-bold ${speakerClass}`}>{speaker}</span>
            <span className="text-xs text-slate-500 font-medium mt-0.5">{voicePrompt}</span>
          </div>
          <div className="sm:w-3/4 text-slate-300 leading-relaxed font-serif text-lg">
            {dialogue}
          </div>
        </div>
      );
    }

    if (line.trim() === '') return null;
    
    return (
        <div key={index} className="py-2 text-slate-500 italic text-sm border-b border-slate-800 last:border-0">
            {line}
        </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col border-b border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-slate-100">Script & Audio</h2>
            </div>
            <div className="flex items-center gap-2">
                {!isEditing ? (
                    <button 
                        onClick={startEditing}
                        className="flex items-center text-sm font-medium text-slate-400 hover:text-slate-100 transition-colors mr-2"
                        title="Edit Script"
                    >
                        <Edit2 className="w-4 h-4 mr-1" /> Edit
                    </button>
                ) : (
                    <div className="flex items-center gap-2 mr-2">
                        <button onClick={cancelEdit} className="p-1 hover:text-red-400 text-slate-400"><X className="w-4 h-4" /></button>
                        <button onClick={saveEdit} className="p-1 hover:text-green-400 text-slate-400"><Save className="w-4 h-4" /></button>
                    </div>
                )}
                
                <button 
                    onClick={handleCopy}
                    className="flex items-center text-sm font-medium text-slate-500 hover:text-blue-400 transition-colors"
                    title="Copy to clipboard"
                >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>
        </div>
        
        {/* Voice Controls */}
        <div className="px-6 pb-4 flex flex-wrap gap-4 items-center bg-slate-900/50">
            <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Speaker A (Female)</span>
                <select 
                    value={voiceA}
                    onChange={(e) => onVoiceAChange(e.target.value)}
                    className="bg-slate-800 text-slate-200 text-xs rounded border border-slate-700 px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                    {AVAILABLE_VOICES.map(v => (
                        <option key={v.name} value={v.name}>{v.name} ({v.gender})</option>
                    ))}
                </select>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Speaker B (Male)</span>
                <select 
                    value={voiceB}
                    onChange={(e) => onVoiceBChange(e.target.value)}
                    className="bg-slate-800 text-slate-200 text-xs rounded border border-slate-700 px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                    {AVAILABLE_VOICES.map(v => (
                        <option key={v.name} value={v.name}>{v.name} ({v.gender})</option>
                    ))}
                </select>
            </div>
            <div className="flex-1"></div>
            {!audioUrl && (
                <Button 
                    variant="primary"  
                    className="h-8 text-xs w-auto padding-[10px] px-4"
                    onClick={onGenerateAudio}
                    isLoading={isGeneratingAudio}
                    disabled={isGeneratingAudio || isEditing}
                    icon={<Mic className="w-3 h-3" />}
                >
                    {isGeneratingAudio ? 'Generating Audio...' : 'Generate Audio'}
                </Button>
            )}
        </div>
      </div>
      
      {/* Audio Player Section */}
      {audioUrl && !isEditing && (
          <div className="bg-blue-950/30 px-6 py-3 border-b border-blue-900/50 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-900/50 rounded-full shadow-sm text-blue-400 border border-blue-800">
                      <Music className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                      <span className="text-sm font-semibold text-blue-100">Audio Ready</span>
                      <span className="text-xs text-blue-400">
                          Voices: {voiceA} & {voiceB}
                      </span>
                  </div>
              </div>
              
              <div className="flex items-center gap-2">
                   <audio ref={audioRef} src={audioUrl} className="hidden" />
                   
                   <button 
                      onClick={togglePlayback}
                      className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-sm focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 focus:ring-offset-slate-900"
                   >
                       {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                   </button>
                   
                   {isPlaying && (
                       <button 
                          onClick={stopPlayback}
                          className="p-2 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors border border-slate-700"
                          title="Stop"
                       >
                           <Square className="w-3 h-3" />
                       </button>
                   )}

                   <a 
                      href={audioUrl} 
                      download="comic-script-audio.wav"
                      className="p-2 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors border border-slate-700"
                      title="Download"
                   >
                       <Download className="w-4 h-4" />
                   </a>
                   
                   {/* Regenerate button next to player */}
                    <Button 
                        variant="outline" 
                       
                        className=" p-0 ml-2 border-slate-700 bg-slate-800"
                        onClick={onGenerateAudio}
                        isLoading={isGeneratingAudio}
                        disabled={isGeneratingAudio}
                        title="Regenerate Audio"
                    >
                        Regenerate
                    </Button>
              </div>
          </div>
      )}

      {/* Script Content */}
      <div className="flex-1 overflow-hidden relative bg-slate-900">
        {isEditing ? (
            <textarea
                value={editBuffer}
                onChange={(e) => setEditBuffer(e.target.value)}
                className="w-full h-full p-6 bg-slate-900 text-slate-300 font-mono text-sm resize-none focus:outline-none focus:bg-slate-900/50"
                spellCheck={false}
                placeholder="Speaker A:(voice prompt) Dialogue..."
            />
        ) : (
            <div className="h-full overflow-y-auto p-6 custom-scrollbar space-y-1">
                {content.split('\n').map((line, i) => renderFormattedLine(line, i))}
            </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 text-center flex justify-between px-6 text-xs text-slate-500">
        {/* <span>Gemini 2.5 Flash & TTS</span> */}
        {isEditing && <span className="text-blue-400">Editing Mode - Save to generate audio</span>}
      </div>
    </div>
  );
};