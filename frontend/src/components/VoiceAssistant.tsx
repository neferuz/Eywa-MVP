"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Mic, X, Send, Volume2, VolumeX, Type } from "lucide-react";
import { chatWithAIAssistant, type AIAssistantMessage, textToSpeech } from "@/lib/api";
import toast from "react-hot-toast";

// Компонент анимации волн для записи
const WaveAnimation = () => {
  return (
    <div className="flex items-center justify-center gap-1">
      <div className="w-1 h-6 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: "0s" }}></div>
      <div className="w-1 h-8 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: "0.1s" }}></div>
      <div className="w-1 h-10 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
      <div className="w-1 h-8 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: "0.3s" }}></div>
      <div className="w-1 h-6 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
    </div>
  );
};

interface VoiceAssistantProps {
  className?: string;
}

export default function VoiceAssistant({ className }: VoiceAssistantProps) {
  const pathname = usePathname();
  const isLoginPage = pathname?.startsWith("/login");
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<AIAssistantMessage[]>([]);
  const [textInput, setTextInput] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Инициализация Web Speech API
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Speech Recognition (STT)
      const SpeechRecognition = 
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "ru-RU";
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onstart = () => {
          setIsListening(true);
        };
        
        recognition.onresult = async (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setTextInput(transcript);
          await handleSendMessage(transcript);
        };
        
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
          if (event.error === "not-allowed") {
            toast.error("Разрешите доступ к микрофону в настройках браузера");
          } else {
            toast.error("Ошибка распознавания речи");
          }
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current = recognition;
      } else {
        console.warn("Speech Recognition API не поддерживается в этом браузере");
      }
      
      // Speech Synthesis (TTS)
      if ("speechSynthesis" in window) {
        synthesisRef.current = window.speechSynthesis;
        
        // Загружаем голоса (нужно для некоторых браузеров)
        const loadVoices = () => {
          const voices = window.speechSynthesis.getVoices();
          console.log("Available voices:", voices.map(v => `${v.name} (${v.lang})`));
        };
        
        // Загружаем голоса сразу и при их загрузке
        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = loadVoices;
        }
      }
    }
  }, []);

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Error starting recognition:", error);
        toast.error("Не удалось начать запись");
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speak = async (text: string) => {
    if (!voiceEnabled) return;
    
    // Останавливаем предыдущее озвучивание
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
    }
    
    // Сначала пробуем ElevenLabs
    try {
      setIsSpeaking(true);
      
      const audioBlob = await textToSpeech(text);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };
      
      audio.onerror = (error) => {
        console.error("Audio playback error:", error);
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        
        // Fallback на Web Speech API
        fallbackToWebSpeech(text);
      };
      
      await audio.play();
      return; // Успешно воспроизвели через ElevenLabs
      
    } catch (error: any) {
      // Проверяем, если это ошибка 503 (сервис не настроен), сразу используем fallback
      const errorMessage = error?.message || "";
      if (errorMessage.includes("503") || errorMessage.includes("не настроен")) {
        console.log("ElevenLabs не настроен, используем Web Speech API");
        fallbackToWebSpeech(text);
        return;
      }
      
      console.error("ElevenLabs TTS error:", error);
      // Fallback на Web Speech API при других ошибках
      fallbackToWebSpeech(text);
    }
  };
  
  const fallbackToWebSpeech = (text: string) => {
    if (!synthesisRef.current) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ru-RU";
    utterance.rate = 0.85;
    utterance.pitch = 1.1;
    utterance.volume = 1.0;
    
    // Выбираем лучший русский голос
    const voices = synthesisRef.current.getVoices();
    const russianVoices = voices.filter(voice => 
      voice.lang.startsWith("ru") || 
      voice.name.toLowerCase().includes("russian") ||
      voice.name.toLowerCase().includes("русск")
    );
    
    let preferredVoice = russianVoices.find(voice => {
      const name = voice.name.toLowerCase();
      return (
        name.includes("yandex") ||
        name.includes("google") ||
        name.includes("microsoft") ||
        name.includes("premium") ||
        name.includes("natural") ||
        name.includes("neural")
      );
    }) || (russianVoices.length > 1 ? russianVoices[1] : russianVoices[0]);
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    utterance.onerror = (error) => {
      console.error("Speech synthesis error:", error);
      setIsSpeaking(false);
    };
    
    synthesisRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
    }
    setIsSpeaking(false);
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || textInput.trim();
    if (!text) return;

    // Добавляем сообщение пользователя
    const userMessage: AIAssistantMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setTextInput("");
    setIsProcessing(true);
    stopListening();

    try {
      // Подготавливаем историю разговора для API
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await chatWithAIAssistant({
        message: text,
        conversation_history: conversationHistory,
      });

      // Добавляем ответ ассистента
      const assistantMessage: AIAssistantMessage = {
        role: "assistant",
        content: response.message,
        timestamp: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      
      // Озвучиваем ответ
      if (voiceEnabled) {
        await speak(response.message);
      }
    } catch (error) {
      console.error("Error chatting with AI:", error);
      toast.error("Ошибка при обращении к AI ассистенту");
      
      const errorMessage: AIAssistantMessage = {
        role: "assistant",
        content: "Извините, произошла ошибка. Попробуйте еще раз.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };


  const clearMessages = () => {
    setMessages([]);
    stopSpeaking();
  };

  // Не показываем на странице логина
  if (isLoginPage) {
    return null;
  }

  return (
    <>
      {/* Плавающая кнопка */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110 flex items-center justify-center"
          aria-label="Открыть AI ассистента"
        >
          {isListening ? <WaveAnimation /> : <Mic className="w-6 h-6" />}
        </button>
      )}

      {/* Окно ассистента */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col border border-gray-200">
          {/* Заголовок */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <h3 className="font-semibold">AI Помощник</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className="p-1.5 hover:bg-blue-800 rounded transition-colors"
                aria-label={voiceEnabled ? "Отключить голос" : "Включить голос"}
              >
                {voiceEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  stopListening();
                  stopSpeaking();
                }}
                className="p-1.5 hover:bg-blue-800 rounded transition-colors"
                aria-label="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* История сообщений */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <Mic className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm">
                  Привет! Я AI-помощник CRM. Задайте вопрос голосом или текстом.
                </p>
                <p className="text-xs mt-2 text-gray-400">
                  Например: "Сколько клиентов в базе?" или "Какая выручка за сегодня?"
                </p>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-800 border border-gray-200"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Поле ввода */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            {/* Переключатель режима ввода */}
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => {
                  stopListening();
                  setTextInput("");
                }}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  !isListening
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-gray-100 text-gray-600 border border-gray-300"
                }`}
              >
                <Type className="w-3 h-3 inline mr-1" />
                Печатать
              </button>
              <button
                onClick={() => {
                  if (!isListening) {
                    startListening();
                  } else {
                    stopListening();
                  }
                }}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isListening
                    ? "bg-red-100 text-red-700 border border-red-300"
                    : "bg-gray-100 text-gray-600 border border-gray-300"
                }`}
              >
                <Mic className="w-3 h-3 inline mr-1" />
                Голос
              </button>
            </div>

            <div className="flex gap-2">
              {isListening ? (
                <div className="flex-1 flex items-center justify-center px-4 py-3 bg-red-50 border-2 border-red-300 rounded-lg">
                  <div className="flex items-center gap-3">
                    <WaveAnimation />
                    <span className="text-sm text-red-700 font-medium">Слушаю...</span>
                  </div>
                </div>
              ) : (
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Введите вопрос или нажмите кнопку 'Голос' для записи..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none min-h-[60px] max-h-[120px]"
                  disabled={isProcessing}
                  rows={2}
                />
              )}
              
              {!isListening && (
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isProcessing || !textInput.trim()}
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end"
                  aria-label="Отправить"
                >
                  <Send className="w-5 h-5" />
                </button>
              )}
              
              {isListening && (
                <button
                  onClick={() => stopListening()}
                  className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  aria-label="Остановить запись"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="mt-2 text-xs text-gray-500 hover:text-gray-700"
              >
                Очистить историю
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Типы для Web Speech API
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

