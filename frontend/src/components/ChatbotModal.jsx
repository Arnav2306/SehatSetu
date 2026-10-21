import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { triageSymptomsApi } from '../config/api';
import {
  SparklesIcon,
  XIcon,
  SendIcon,
  AlertTriangleIcon,
  RefreshIcon,
  StethoscopeIcon,
  HospitalIcon,
  MapPinIcon,
} from './Icons';

export default function ChatbotModal({
  isOpen,
  onClose,
  onBookDoctor,
  onFilterSpecialty,
}) {
  const { language, setLanguage, t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize or reset greeting when opened or cleared
  const resetConversation = () => {
    setMessages([
      {
        id: 'init-1',
        role: 'assistant',
        content: t('chat.greeting'),
      },
    ]);
    setErrorInfo(null);
  };

  useEffect(() => {
    if (messages.length === 0 && isOpen) {
      resetConversation();
    }
  }, [isOpen]);

  // Keep greeting language updated if it's the only message and language changes
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 'init-1') {
      setMessages([
        {
          id: 'init-1',
          role: 'assistant',
          content: t('chat.greeting'),
        },
      ]);
    }
  }, [language, t]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSend = async (customText = null) => {
    const textToSend = typeof customText === 'string' ? customText : inputValue;
    if (!textToSend.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);
    setErrorInfo(null);

    // Format messages for the backend (excluding initial static greeting from triage payload if desired, or send all)
    const triagePayload = newMessages
      .filter((m) => m.id !== 'init-1')
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const result = await triageSymptomsApi({
        messages: triagePayload.length > 0 ? triagePayload : [{ role: 'user', content: textToSend }],
        language,
      });

      const aiResponse = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: result.reply,
        isEmergency: result.isEmergency,
        emergencyGuidance: result.emergencyGuidance,
        recommendedCategory: result.recommendedCategory,
        explanation: result.explanation,
        followUpQuestion: result.followUpQuestion,
        disclaimer: result.disclaimer,
        matchingDoctors: result.matchingDoctors || [],
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (err) {
      console.error('AI Triage error:', err);
      const isNotConfigured = err.code === 'AI_NOT_CONFIGURED' || err.status === 503;
      setErrorInfo({
        isNotConfigured,
        message:
          language === 'hi' && err.messageHi
            ? err.messageHi
            : isNotConfigured
            ? t('chat.notConfigured')
            : err.message || 'Unable to connect to AI Care Guide service.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-chat-title"
      className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[440px] sm:h-[620px] max-h-screen sm:max-h-[85vh] bg-white rounded-none sm:rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white p-4 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-teal-200 ring-1 ring-white/20">
            <SparklesIcon className="w-5 h-5 text-teal-300" />
          </div>
          <div>
            <h2 id="ai-chat-title" className="text-sm font-bold tracking-tight leading-tight">
              {t('chat.title')}
            </h2>
            <p className="text-[10px] text-teal-200 font-medium">
              {t('chat.subtitle')}
            </p>
          </div>
        </div>

        {/* Header Controls: Language Toggle, Reset, Close */}
        <div className="flex items-center gap-2">
          {/* Synchronized Language Switcher */}
          <div className="flex items-center bg-white/15 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                language === 'en' ? 'bg-white text-teal-900 shadow-xs' : 'text-teal-100 hover:text-white'
              }`}
              title="Switch to English"
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                language === 'hi' ? 'bg-white text-teal-900 shadow-xs' : 'text-teal-100 hover:text-white'
              }`}
              title="हिंदी में बदलें"
            >
              हिन्दी
            </button>
          </div>

          {/* Reset / New Chat */}
          <button
            onClick={resetConversation}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={t('chat.clear')}
          >
            <RefreshIcon className="w-4 h-4" />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={t('chat.close')}
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Triage Disclaimer Banner */}
      <div className="bg-amber-50 border-b border-amber-200/80 px-3.5 py-1.5 flex items-start gap-2 text-[11px] text-amber-900 shrink-0">
        <span className="font-bold text-amber-700 shrink-0">ℹ</span>
        <p className="leading-tight text-amber-800">{t('chat.disclaimer')}</p>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* Bubble */}
            <div
              className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs ${
                msg.role === 'user'
                  ? 'bg-teal-600 text-white rounded-br-xs'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
              }`}
            >
              {/* Emergency Banner inside AI response if detected */}
              {msg.isEmergency && (
                <div className="mb-3 p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-rose-800 text-[11px] uppercase tracking-wide">
                    <AlertTriangleIcon className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{t('chat.emergencyWarning')}</span>
                  </div>
                  <p className="text-xs font-semibold text-rose-950">
                    {msg.emergencyGuidance || t('chat.emergencyInstruction')}
                  </p>
                </div>
              )}

              {/* Main text content */}
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* Follow-up question if highlighted */}
              {msg.followUpQuestion && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 text-slate-700 font-medium italic">
                  ❓ {msg.followUpQuestion}
                </div>
              )}

              {/* Specialist Recommendation Card */}
              {msg.recommendedCategory && (
                <div className="mt-3 p-3 bg-teal-50/80 border border-teal-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider">
                      {t('chat.recommendedSpecialist')}
                    </span>
                    <span className="bg-teal-600 text-white font-bold text-[11px] px-2.5 py-0.5 rounded-full shadow-xs">
                      {t(`specialty.${msg.recommendedCategory}`, msg.recommendedCategory)}
                    </span>
                  </div>

                  {msg.explanation && (
                    <p className="text-[11px] text-teal-950 leading-relaxed">
                      <strong className="text-teal-900 font-semibold">{t('chat.whyThisSpecialist')}</strong>{' '}
                      {msg.explanation}
                    </p>
                  )}

                  {/* Matching Live Doctors from MongoDB */}
                  {msg.matchingDoctors && msg.matchingDoctors.length > 0 && (
                    <div className="pt-2 border-t border-teal-200/60 space-y-1.5">
                      <span className="text-[10px] font-semibold text-teal-900 block">
                        {t('chat.matchingDoctorsInIndore')}
                      </span>
                      <div className="space-y-1.5">
                        {msg.matchingDoctors.map((doc) => (
                          <div
                            key={doc._id || doc.id}
                            className="bg-white p-2.5 rounded-lg border border-teal-100 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-900 truncate">{doc.name}</p>
                              <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                                <HospitalIcon className="w-3 h-3 text-slate-400 shrink-0" />
                                {doc.hospital?.name || doc.locality || 'Indore'} • ₹{doc.consultationFee ?? 0}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                if (onBookDoctor) onBookDoctor(doc);
                              }}
                              className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold rounded-md shadow-xs shrink-0 cursor-pointer transition-colors"
                            >
                              {t('chat.bookAppointment')}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* View all in directory button */}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onFilterSpecialty) onFilterSpecialty(msg.recommendedCategory);
                    }}
                    className="w-full text-center py-1.5 bg-teal-100 hover:bg-teal-200 text-teal-900 font-semibold text-[11px] rounded-lg transition-colors cursor-pointer"
                  >
                    🔍 {t('chat.viewAllSpecialists')} ({t(`specialty.${msg.recommendedCategory}`, msg.recommendedCategory)})
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Spinner Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl rounded-bl-xs text-xs text-slate-600 max-w-[80%] shadow-xs">
            <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
            <span className="font-medium animate-pulse">{t('chat.analyzing')}</span>
          </div>
        )}

        {/* Error / AI Missing Banner */}
        {errorInfo && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangleIcon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-rose-950">
                  {errorInfo.isNotConfigured ? 'AI Care Guide Setup Notice' : 'Service Notice'}
                </p>
                <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed">
                  {errorInfo.message}
                </p>
              </div>
            </div>
            {!errorInfo.isNotConfigured && (
              <button
                type="button"
                onClick={() => handleSend(messages[messages.length - 1]?.content)}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px] rounded-md transition-colors cursor-pointer"
              >
                {t('chat.retry')}
              </button>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-white border-t border-slate-200 shrink-0">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={t('chat.inputPlaceholder')}
            className="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={isLoading || !inputValue.trim()}
            className="p-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-lg transition-colors cursor-pointer shrink-0"
            title={t('chat.send')}
          >
            <SendIcon className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 text-center mt-1.5">
          {language === 'hi'
            ? 'हिंदी, English या Hinglish में लक्षण लिखें'
            : 'Describe symptoms in English, Hindi, or Hinglish'}
        </p>
      </div>
    </div>
  );
}
