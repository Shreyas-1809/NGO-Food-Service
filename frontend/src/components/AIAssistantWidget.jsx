import React, { useState } from 'react';
import { Bot, X, Send, Sparkles, ChevronRight, MapPin, HeartHandshake } from 'lucide-react';
import { MOCK_NGOS } from '../services/mockData';
import { useNavigate } from 'react-router-dom';

const AIAssistantWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'AI',
      text: 'Hello! I am your Smart Donation Assistant. How can I help you connect resources with verified NGOs today?',
      suggestions: [
        'I have 20 kg rice to donate in Pune.',
        'Find NGOs near me',
        'What can I donate?',
        'Who needs food?'
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const navigate = useNavigate();

  const handleSend = (queryText) => {
    const text = queryText || input;
    if (!text.trim()) return;

    // User Message
    const userMsg = { sender: 'USER', text: text };
    let aiResponse = { sender: 'AI', text: '', ngos: [] };

    const lower = text.toLowerCase();

    if (lower.includes('rice') || lower.includes('food') || lower.includes('eat') || lower.includes('cook')) {
      aiResponse.text = 'Great! I found verified organizations in Pune that currently require food supplies & rice:';
      aiResponse.ngos = MOCK_NGOS.filter(n => n.currentRequirements.some(r => r.category === 'Food')).slice(0, 2);
    } else if (lower.includes('clothes') || lower.includes('jacket') || lower.includes('wear')) {
      aiResponse.text = 'Awesome! Here are verified shelters and NGOs near you accepting clothes & blankets:';
      aiResponse.ngos = MOCK_NGOS.filter(n => n.areasOfSupport.includes('Clothes & Blankets') || n.areasOfSupport.includes('Clothes')).slice(0, 2);
    } else if (lower.includes('near me') || lower.includes('location') || lower.includes('ngo') || lower.includes('pune')) {
      aiResponse.text = 'Here are verified partner NGOs actively receiving donations in Pune:';
      aiResponse.ngos = MOCK_NGOS.slice(0, 3);
    } else if (lower.includes('track') || lower.includes('status')) {
      aiResponse.text = 'You can track active donations anytime on your Dashboard or enter your Donation ID (e.g., DON-2026-00482) in the Tracking page.';
    } else if (lower.includes('what can i donate') || lower.includes('categories')) {
      aiResponse.text = 'You can donate surplus items across 7 categories: Food, Clothes, Books, Medical Supplies, Electronics, Educational Materials, and Other essential goods!';
    } else {
      aiResponse.text = `I found 2 verified NGOs nearby matching "${text}". Would you like to create a donation posting?`;
      aiResponse.ngos = MOCK_NGOS.slice(0, 2);
    }

    setMessages(prev => [...prev, userMsg, aiResponse]);
    setInput('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-[90]">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-2xl flex items-center space-x-2 group transition-all duration-300 transform hover:scale-105 border-2 border-emerald-400"
        >
          <Bot className="w-6 h-6 animate-pulse" />
          <span className="font-bold text-sm hidden sm:inline pr-1">AI Assistant</span>
          <span className="bg-emerald-800 text-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-mono uppercase">AI Powered</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-[90vw] sm:w-[380px] h-[520px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center space-x-2.5">
              <div className="bg-white/20 p-2 rounded-xl">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm flex items-center">
                  Smart NGO Assistant <Sparkles className="w-3.5 h-3.5 ml-1 text-emerald-200" />
                </h4>
                <p className="text-[11px] text-emerald-100 font-medium">Instant Matching & Resource Guidance</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-950">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.sender === 'USER' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'USER' 
                    ? 'bg-emerald-600 text-white rounded-br-none shadow-sm font-medium' 
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm rounded-bl-none'
                }`}>
                  {msg.text}
                </div>

                {/* NGO Recommendations Card preview inside chat */}
                {msg.ngos && msg.ngos.length > 0 && (
                  <div className="w-full mt-2 space-y-2">
                    {msg.ngos.map((ngo) => (
                      <div 
                        key={ngo.id}
                        className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 rounded-xl flex items-center justify-between text-xs hover:border-emerald-500 transition-colors cursor-pointer"
                        onClick={() => { setIsOpen(false); navigate(`/ngo/${ngo.id}`); }}
                      >
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white flex items-center">
                            {ngo.name} {ngo.verified && <span className="text-[10px] text-emerald-600 font-bold ml-1">✓ Verified</span>}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center mt-0.5">
                            <MapPin className="w-3 h-3 mr-0.5 text-emerald-600"/> {ngo.area}, {ngo.city} • {ngo.distanceKm} km
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-emerald-600" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Interactive Suggestion Chips */}
                {msg.suggestions && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {msg.suggestions.map((chip, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => handleSend(chip)}
                        className="bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold px-3 py-1.5 rounded-full border border-emerald-200 dark:border-slate-700 transition-all text-left"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2">
            <input
              type="text"
              placeholder="Ask AI or type 'I have rice to donate'..."
              className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs px-3.5 py-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-emerald-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={() => handleSend()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default AIAssistantWidget;
