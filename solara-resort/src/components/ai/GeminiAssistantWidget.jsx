import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { GoogleGenAI } from '@google/genai';

const SYSTEM_INSTRUCTION = `You are "Solara Concierge", the official AI Luxury Assistant for Solara Resort & Spa.
Our brand is unified under "Solara Resort & Spa" with 4 signature Cambodian branches:
1. Siem Reap Branch: Angkor Wat sanctuary, cultural retreat, private saltwater pool villas, traditional Khmer spa treatments, serene lotus ponds. (Route: /branches/solara-siem-reap)
2. Kampot Branch: Tranquil riverside & Bokor mountain views, private pool villas, organic farm-to-table dining, sunset river cruises. (Route: /branches/solara-kampot)
3. Kep Branch: Coastal retreat overlooking the Gulf of Thailand, famous for ocean breezes, pepper crab gourmet dining, and Kep National Park trails. (Route: /branches/solara-kep)
4. Koh Rong Branch: Island sanctuary with turquoise waters, private beach villas, overwater spa, snorkeling, and pristine white sands. (Route: /branches/solara-koh-rong)

Standard check-in is 14:00 (2:00 PM) and check-out is 12:00 (12:00 PM) across all branches.
Complimentary breakfast, airport/ferry transfers upon request, and high-speed Wi-Fi are provided.
Tone: Warm, sophisticated, welcoming, attentive, and helpful.
Keep responses concise (2-4 sentences or short bullet points) and guide guests toward booking at our branches.`;

const SUGGESTED_QUESTIONS = [
  'Which branch is best for quiet relaxation?',
  'What is the difference between Kampot & Kep?',
  'What are your check-in and check-out times?',
  'How do I book a private pool villa?',
];

import { useApp } from '../../context/AppContext.jsx';

export const GeminiAssistantWidget = () => {
  const { language } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Welcome to Solara Resort & Spa. I am your personal concierge. How may I assist your stay across our Kampot, Kep, Siem Reap, or Koh Rong branches today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // Sync welcome message on language switch if chat hasn't started
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 1) {
        return [
          {
            id: 1,
            sender: 'ai',
            text:
              language === 'km'
                ? 'សូមស្វាគមន៍មកកាន់ សូឡារ៉ា រីសត & ស្ប៉ា (Solara Resort & Spa)។ ខ្ញុំជាជំនួយការ AI Concierge ផ្ទាល់ខ្លួនរបស់អ្នក។ តើខ្ញុំអាចជួយសម្រួលព័ត៌មានអំពីសាខារបស់យើងនៅ កំពត, កែប, សៀមរាប ឬកោះរ៉ុង ជូនលោកអ្នកយ៉ាងដូចម្តេចដែរ?'
                : 'Welcome to Solara Resort & Spa. I am your personal concierge. How may I assist your stay across our Kampot, Kep, Siem Reap, or Koh Rong branches today?',
          },
        ];
      }
      return prev;
    });
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || isTyping) return;

    const userMsg = { id: Date.now(), sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const khmerPrefix =
          language === 'km'
            ? "You are Solara Resort's AI Concierge. The guest is communicating in Khmer. Please provide warm, helpful, and natural responses in fluent Khmer (ភាសាខ្មែរ) with polite hospitality tone.\n\n"
            : "";

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [{ text: `${khmerPrefix}${SYSTEM_INSTRUCTION}\n\nGuest says: ${query}` }],
            },
          ],
        });

        const reply =
          response.text ||
          (language === 'km'
            ? 'ខ្ញុំរីករាយណាស់ក្នុងការជួយលោកអ្នកកក់បន្ទប់នៅ សូឡារ៉ា រីសត & ស្ប៉ា។ សូមជ្រើសរើសផ្ទាំង "ទីតាំងសាខា" ឬទាក់ទងមកកាន់ផ្នែកទទួលភ្ញៀវរបស់យើង។'
            : 'I would be delighted to assist you with booking a stay at Solara Resort & Spa. Please browse our Locations tab or contact our front desk.');
        setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'ai', text: reply }]);
      } else {
        // Smart fallback concierge when VITE_GEMINI_API_KEY is not set
        await new Promise((r) => setTimeout(r, 600));
        let reply = '';
        const lower = query.toLowerCase();

        if (
          lower.includes('check-in') ||
          lower.includes('checkin') ||
          lower.includes('time') ||
          lower.includes('checkout') ||
          query.includes('ម៉ោង') ||
          query.includes('ចូល') ||
          query.includes('ចេញ')
        ) {
          reply =
            language === 'km'
              ? 'នៅគ្រប់សាខារបស់ សូឡារ៉ា រីសត & ស្ប៉ា ម៉ោងចូលស្នាក់នៅ (Check-in) គឺចាប់ពីម៉ោង ១៤:០០ (២:០០ រសៀល) និងម៉ោងចាកចេញ (Check-out) គឺត្រឹមម៉ោង ១២:០០ (១២:០០ ថ្ងៃត្រង់)។ លោកអ្នកក៏អាចស្នើសុំចូលស្នាក់នៅមុនម៉ោងបានផងដែរ។'
              : 'Across all Solara Resort & Spa branches, standard check-in time is 14:00 (2:00 PM) and check-out is 12:00 (12:00 PM). Early check-in can be requested during booking.';
        } else if (lower.includes('kampot') || query.includes('កំពត')) {
          reply =
            language === 'km'
              ? 'សាខា សូឡារ៉ា កំពត ស្ថិតនៅតាមបណ្តោយដងព្រែកដ៏ស្ងប់ស្ងាត់ មានទេសភាពភ្នំបូកគោ វីឡាអាងហែលទឹកឯកជន និងភោជនីយដ្ឋានអាហារសរីរាង្គ។ លោកអ្នកអាចមើលបន្ទប់ទំនេរនៅទំព័រ "ទីតាំងសាខា > កំពត"។'
              : 'Our Solara Kampot Branch sits along the tranquil river with panoramic views of Bokor Mountain, luxury pool villas, and farm-to-table dining. You can explore available rooms under Our Locations > Kampot.';
        } else if (lower.includes('kep') || query.includes('កែប')) {
          reply =
            language === 'km'
              ? 'សាខា សូឡារ៉ា កែប ស្ថិតនៅក្បែរឆ្នេរសមុទ្រ ទទួលខ្យល់អាកាសបរិសុទ្ធ ម្ហូបអាហារសមុទ្រស្រស់ៗ និងផ្លូវដើរកម្សាន្តធម្មជាតិនៃឧទ្យានជាតិកែប។'
              : 'Solara Kep Branch is perched near the coast with refreshing ocean breezes, lush gardens, fresh seafood dining, and serene hill trails.';
        } else if (lower.includes('siem reap') || lower.includes('angkor') || query.includes('សៀមរាប')) {
          reply =
            language === 'km'
              ? 'សាខា សូឡារ៉ា សៀមរាប ជារីសតបែបបេតិកភណ្ឌវប្បធម៌ខ្មែរ ជិតប្រាសាទអង្គរវត្ត មានអាងហែលទឹកទឹកប្រៃ និងស្ប៉ាបែបប្រណីតខ្មែរ។'
              : 'Solara Siem Reap Branch is an authentic heritage sanctuary minutes from Angkor Wat, featuring traditional Khmer architecture, saltwater pools, and luxury wellness suites.';
        } else if (lower.includes('koh rong') || lower.includes('island') || lower.includes('beach') || query.includes('កោះរ៉ុង')) {
          reply =
            language === 'km'
              ? 'សាខា សូឡារ៉ា កោះរ៉ុង ផ្តល់ជូននូវបទពិសោធន៍កោះទេសចរណ៍ដ៏ស្រស់ស្អាត ឆ្នេរខ្សាច់សក្បុស ទឹកសមុទ្រថ្លាឈ្វេង និងវីឡាជាប់ឆ្នេរឯកជន។'
              : 'Solara Koh Rong Branch offers an exclusive island getaway with pristine white-sand beaches, crystal waters, and secluded oceanfront villas.';
        } else if (lower.includes('pool') || lower.includes('villa') || query.includes('អាងហែលទឹក') || query.includes('វីឡា')) {
          reply =
            language === 'km'
              ? 'យើងមាន វីឡាអាងហែលទឹកឯកជន (Private Pool Villas) នៅសាខាកំពត សៀមរាប និងកោះរ៉ុង។ លោកអ្នកអាចជ្រើសរើសសាខាក្នុងប្រអប់កក់បន្ទប់ដើម្បីពិនិត្យតម្លៃ និងភាពទំនេរ!'
              : 'We feature exclusive Private Pool Villas at our Kampot, Siem Reap, and Koh Rong branches. Select any branch in our booking widget to view live availability!';
        } else {
          reply =
            language === 'km'
              ? 'សូមអរគុណសម្រាប់ការសាកសួរព័ត៌មានពី សូឡារ៉ា រីសត & ស្ប៉ា។ យើងខ្ញុំមានសាខា ៤ កន្លែងគឺ កំពត កែប សៀមរាប និងកោះរ៉ុង។ លោកអ្នកអាចចុច "ទីតាំងសាខា" ខាងលើ ឬប្រើរបារកក់បន្ទប់ដើម្បីជ្រើសរើសកាលបរិច្ឆេទស្នាក់នៅ។'
              : `Thank you for inquiring with Solara Resort & Spa. We invite you to explore our branches in Kampot, Kep, Siem Reap, and Koh Rong. Select "Our Locations" above or use our search bar to reserve your sanctuary.`;
        }

        setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'ai', text: reply }]);
      }
    } catch (err) {
      console.error('Gemini Concierge error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text:
            language === 'km'
              ? 'សាខារបស់យើងនៅ កំពត កែប សៀមរាប និងកោះរ៉ុង រីករាយស្វាគមន៍លោកអ្នកជានិច្ច។ លោកអ្នកអាចមើលបន្ទប់ ឬពិនិត្យភាពទំនេរតាមរយៈប្រអប់កក់បន្ទប់ខាងលើ។'
              : 'Our branches in Kampot, Kep, Siem Reap, and Koh Rong are ready to welcome you. You may browse our rooms directly or check availability via the booking bar above.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating launcher trigger */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-navy-900 to-navy-800 text-gold-light border border-gold/40 rounded-full shadow-2xl backdrop-blur-md group hover:border-gold transition-colors"
          aria-label="Open Solara AI Concierge"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-gold"></span>
          </span>

          <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold border border-gold/30">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2L14.4 7.2L20 8L16 12.3L17.2 18L12 15L6.8 18L8 12.3L4 8L9.6 7.2L12 2Z" />
            </svg>
          </div>

          <div className="text-left hidden sm:block pr-1">
            <p className="text-xs font-serif uppercase tracking-wider text-gold font-bold">Solara Concierge</p>
            <p className="text-[10px] text-text-muted">Ask our AI Assistant</p>
          </div>
        </motion.button>
      </div>

      {/* Floating Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 max-h-[580px] h-[80vh] bg-surface/95 border border-gold/30 rounded-2xl shadow-2xl backdrop-blur-xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-navy-950 via-navy-900 to-surface border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold shadow-inner">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2L14.4 7.2L20 8L16 12.3L17.2 18L12 15L6.8 18L8 12.3L4 8L9.6 7.2L12 2Z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-serif text-sm font-semibold text-text">Solara AI Concierge</h3>
                  <p className="text-[11px] text-gold-light flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Online • Solara Resort & Spa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-white/5 transition-colors"
                aria-label="Close Concierge"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quick Branches Navigator Bar */}
            <div className="px-3 py-2 bg-navy-900/60 border-b border-border/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
              <span className="text-text-muted shrink-0 text-[10px] uppercase tracking-wider font-semibold">Branches:</span>
              <Link
                to="/branches"
                onClick={() => setIsOpen(false)}
                className="px-2 py-0.5 rounded bg-surface hover:bg-gold/15 text-gold hover:text-gold-light border border-gold/20 shrink-0 transition-colors"
              >
                All Branches
              </Link>
              <Link
                to="/branches"
                onClick={() => setIsOpen(false)}
                className="px-2 py-0.5 rounded bg-surface hover:bg-white/10 text-text-muted hover:text-text border border-border shrink-0 transition-colors"
              >
                Kampot
              </Link>
              <Link
                to="/branches"
                onClick={() => setIsOpen(false)}
                className="px-2 py-0.5 rounded bg-surface hover:bg-white/10 text-text-muted hover:text-text border border-border shrink-0 transition-colors"
              >
                Kep
              </Link>
              <Link
                to="/branches"
                onClick={() => setIsOpen(false)}
                className="px-2 py-0.5 rounded bg-surface hover:bg-white/10 text-text-muted hover:text-text border border-border shrink-0 transition-colors"
              >
                Siem Reap
              </Link>
              <Link
                to="/branches"
                onClick={() => setIsOpen(false)}
                className="px-2 py-0.5 rounded bg-surface hover:bg-white/10 text-text-muted hover:text-text border border-border shrink-0 transition-colors"
              >
                Koh Rong
              </Link>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-gradient-to-r from-gold to-gold-light text-navy-950 font-medium rounded-br-none shadow-md'
                        : 'bg-surface-elevated text-text border border-border/80 rounded-bl-none shadow-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-surface-elevated border border-border/80 rounded-2xl rounded-bl-none px-4 py-2.5 flex items-center gap-1.5 text-gold">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested prompts */}
            <div className="px-3 pt-2 pb-1 bg-surface/80 border-t border-border/40 overflow-x-auto no-scrollbar flex gap-1.5">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(q)}
                  className="px-2.5 py-1 text-[11px] rounded-full bg-white/5 hover:bg-gold/15 text-text-muted hover:text-gold border border-border/60 hover:border-gold/30 shrink-0 whitespace-nowrap transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 bg-surface-elevated border-t border-border flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about branches, villas, check-in..."
                className="flex-1 bg-bg/80 border border-border rounded-xl px-3 py-2 text-xs text-text placeholder-text-muted focus:outline-none focus:border-gold transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="p-2 rounded-xl bg-gold hover:bg-gold-light disabled:opacity-40 text-navy-950 font-bold transition-all"
                aria-label="Send message"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
