import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { easeLuxury } from '../../motion/presets.js';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { SolaraBotMascot } from './SolaraBotMascot.jsx';
import { postAiChat, streamAiChat } from '../../services/api/aiChatApi.js';
import { useBranches, useRoomsList } from '../../hooks/useCatalog.js';
import { buildConciergeCatalogDigest } from './conciergeCatalogDigest.js';
import { ConciergeMessageContent } from './ConciergeMessageContent.jsx';
import { useConciergePageBranch } from './useConciergePageBranch.js';
import {
  readConciergeMessages,
  writeConciergeMessages,
  clearConciergeMessages,
} from './conciergeSessionStorage.js';
import { buildBranchShortcuts } from './conciergeSiteRoutes.js';

const SUGGESTED_QUESTIONS_EN = [
  'Is Kep available next weekend?',
  'What are villa rates at Koh Rong?',
  'Compare Kampot and Siem Reap suites',
  'Airport transfer to Siem Reap',
];

const SUGGESTED_QUESTIONS_KM = [
  'តើសាខាកែបមានបន្ទប់ទំនេរចុងសប្តាហ៍នេះទេ?',
  'តម្លៃវីឡានៅកោះរ៉ុងប៉ុន្មាន?',
  'ប្រៀបធៀបបន្ទប់កំពត និងសៀមរាប',
  'សេវារថយន្តទៅសៀមរាប',
];

/** Multi-turn Gemini history (excludes static welcome bubble so the model focuses on real dialogue). */
function buildApiMessages(priorMessages, userText) {
  const contents = priorMessages
    .filter((msg) => msg.id !== 1)
    .filter((msg) => typeof msg.text === 'string' && msg.text.trim() !== '')
    .map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      text: msg.text.trim(),
    }));
  contents.push({ role: 'user', text: userText });
  return contents;
}

async function revealReplyProgressively(streamMsgId, text, setMessages, reduced) {
  const reply = text.trim();
  if (!reply) return;

  if (reduced || reply.length < 48) {
    setMessages((prev) => prev.map((m) => (m.id === streamMsgId ? { ...m, text: reply } : m)));
    return;
  }

  let full = '';
  const tokens = reply.split(/(\s+)/);
  for (const token of tokens) {
    full += token;
    const snapshot = full;
    setMessages((prev) => prev.map((m) => (m.id === streamMsgId ? { ...m, text: snapshot } : m)));
    await new Promise((r) => setTimeout(r, 18));
  }
}

const ASSISTANT_NAME = 'Reaksa';

const HOVER_INTRO_EN =
  "I'm Reaksa, your Solara AI assistant. Ask me anything about our resort and branches.";
const HOVER_INTRO_KM =
  'ខ្ញុំឈ្មោះ រក្សា (Reaksa) ជាជំនួយការ AI របស់ សូឡារ៉ា រីសត & ស្ប៉ា។ សូមសួរខ្ញុំអំពីព័ត៌មានរីសត និងសាខារបស់យើង។';

const WELCOME_EN = `Welcome to Solara Resort & Spa. I'm ${ASSISTANT_NAME}, your AI concierge. How may I help you plan a stay at Kampot, Kep, Siem Reap, or Koh Rong today?`;
const WELCOME_KM =
  'សូមស្វាគមន៍មកកាន់ សូឡារ៉ា រីសត & ស្ប៉ា។ ខ្ញុំឈ្មោះ រក្សា (Reaksa) ជាជំនួយការ AI របស់អ្នក។ តើខ្ញុំអាចជួយអ្នកអំពីសាខា កំពត, កែប, សៀមរាប ឬកោះរ៉ុង យ៉ាងដូចម្តេចដែរ?';

function createWelcomeMessage(language) {
  return {
    id: 1,
    sender: 'ai',
    text: language === 'km' ? WELCOME_KM : WELCOME_EN,
  };
}

function networkApology(language) {
  return language === 'km'
    ? 'សូមទោស រក្សាមិនអាចតភ្ជាប់បានបណ្តោះអាសន្ន។ សូមព្យាយាមម្តងទៀត ឬទាក់ទងផ្នែកទទួលភ្ញៀវរបស់យើង។'
    : 'Please accept my apologies—Reaksa could not reach our concierge network. Kindly try again or contact our front desk.';
}

export const GeminiAssistantWidget = () => {
  const { language } = useApp();
  const reduced = useReducedMotion();
  const { pathname } = useLocation();
  const { branches } = useBranches({ per_page: 50 }, { enabled: true });
  const { rooms } = useRoomsList({ per_page: 100 }, { enabled: true });
  const pageBranch = useConciergePageBranch(branches);

  const catalogContext = useMemo(
    () => buildConciergeCatalogDigest(branches, rooms, language),
    [branches, rooms, language],
  );

  const branchShortcuts = useMemo(
    () => buildBranchShortcuts(branches, language),
    [branches, language],
  );
  const [isOpen, setIsOpen] = useState(false);
  const [launcherHover, setLauncherHover] = useState(false);
  const [messages, setMessages] = useState(() => readConciergeMessages() ?? [createWelcomeMessage('en')]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const streamAbortRef = useRef(null);
  const activeSendRef = useRef(0);

  const headerSubtitle =
    language === 'km'
      ? 'ជំនួយការបដិសណ្ឋារកិច្ច AI · ឆ្លើយតបភ្លាមៗ'
      : 'Luxury AI Concierge · Instant replies';

  const suggestedQuestions = useMemo(
    () => (language === 'km' ? SUGGESTED_QUESTIONS_KM : SUGGESTED_QUESTIONS_EN),
    [language],
  );

  const inputPlaceholder =
    language === 'km' ? 'សួររក្សា (Reaksa) អ្វីក៏បាន...' : 'Ask Reaksa anything about your stay...';

  const closeAndNavigate = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    writeConciergeMessages(messages);
  }, [messages]);

  useEffect(() => {
    return () => {
      activeSendRef.current += 1;
      streamAbortRef.current?.abort();
    };
  }, [pathname]);

  const handleClearChat = useCallback(() => {
    streamAbortRef.current?.abort();
    activeSendRef.current += 1;
    const welcome = createWelcomeMessage(language);
    setMessages([welcome]);
    clearConciergeMessages();
    writeConciergeMessages([welcome]);
    setIsStreaming(false);
    setIsTyping(false);
    setInput('');
  }, [language]);

  // Sync welcome message on language switch if chat hasn't started
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 1) {
        return [createWelcomeMessage(language)];
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

  useEffect(() => {
    const openFromNavbar = () => setIsOpen(true);
    window.addEventListener('solara:open-concierge', openFromNavbar);
    return () => window.removeEventListener('solara:open-concierge', openFromNavbar);
  }, []);

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || isTyping || isStreaming) return;

    const userMsg = { id: Date.now(), sender: 'user', text: query };
    const streamMsgId = Date.now() + 1;
    const priorMessages = messages;
    const apiMessages = buildApiMessages(priorMessages, query);

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const emptyReplyFallback =
      language === 'km'
        ? 'ខ្ញុំរីករាយណាស់ក្នុងការជួយលោកអ្នកកក់បន្ទប់នៅ សូឡារ៉ា រីសត & ស្ប៉ា។ សូមជ្រើសរើសផ្ទាំង "ទីតាំងសាខា" ឬទាក់ទងមកកាន់ផ្នែកទទួលភ្ញៀវរបស់យើង។'
        : 'I would be delighted to assist you with booking a stay at Solara Resort & Spa. Please browse our Locations tab or contact our front desk.';

    const chatPayload = {
      messages: apiMessages,
      branchId: pageBranch.branchId ?? null,
      branchName: pageBranch.branchName ?? null,
      language,
      catalogContext,
    };

    const sendId = activeSendRef.current + 1;
    activeSendRef.current = sendId;
    streamAbortRef.current?.abort();
    const abortController = new AbortController();
    streamAbortRef.current = abortController;

    const isStaleSend = () => activeSendRef.current !== sendId;

    try {
      let proxySucceeded = false;

      setMessages((prev) => [...prev, { id: streamMsgId, sender: 'ai', text: '' }]);
      setIsTyping(false);
      setIsStreaming(true);

      try {
        let streamed = '';
        streamed = await streamAiChat(
          chatPayload,
          (snapshot) => {
            if (isStaleSend()) return;
            setMessages((prev) =>
              prev.map((m) => (m.id === streamMsgId ? { ...m, text: snapshot } : m)),
            );
          },
          { signal: abortController.signal },
        );
        if (abortController.signal.aborted || isStaleSend()) {
          return;
        }
        proxySucceeded = true;

        if (!streamed.trim()) {
          const { reply } = await postAiChat({ ...chatPayload, signal: abortController.signal });
          if (abortController.signal.aborted || isStaleSend()) {
            return;
          }
          const finalText = reply || emptyReplyFallback;
          if (!reduced && finalText.length >= 48) {
            setMessages((prev) => prev.map((m) => (m.id === streamMsgId ? { ...m, text: '' } : m)));
            await revealReplyProgressively(streamMsgId, finalText, setMessages, reduced);
          } else {
            setMessages((prev) =>
              prev.map((m) => (m.id === streamMsgId ? { ...m, text: finalText } : m)),
            );
          }
        }
      } catch (streamErr) {
        if (streamErr?.name === 'AbortError' || abortController.signal.aborted || isStaleSend()) {
          setMessages((prev) => prev.filter((m) => m.id !== streamMsgId));
          return;
        }
        const status = streamErr?.response?.status;
        if (status && status !== 503 && status !== 502) {
          setIsStreaming(false);
          setMessages((prev) => prev.filter((m) => m.id !== streamMsgId));
          throw streamErr;
        }

        try {
          const { reply } = await postAiChat({ ...chatPayload, signal: abortController.signal });
          if (abortController.signal.aborted || isStaleSend()) {
            setMessages((prev) => prev.filter((m) => m.id !== streamMsgId));
            return;
          }
          proxySucceeded = true;
          await revealReplyProgressively(
            streamMsgId,
            reply || emptyReplyFallback,
            setMessages,
            reduced,
          );
        } catch (proxyErr) {
          if (proxyErr?.name === 'AbortError' || abortController.signal.aborted || isStaleSend()) {
            setMessages((prev) => prev.filter((m) => m.id !== streamMsgId));
            return;
          }
          setIsStreaming(false);
          setMessages((prev) => prev.filter((m) => m.id !== streamMsgId));
          const proxyStatus = proxyErr?.response?.status;
          if (proxyStatus && proxyStatus !== 503 && proxyStatus !== 502) {
            throw proxyErr;
          }
        }
      }

      if (!proxySucceeded) {
        setIsTyping(true);
        // Smart fallback concierge when the API proxy is unavailable
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
      if (err?.name === 'AbortError') {
        return;
      }
      console.error('Gemini Concierge error:', err);
      const errorText = networkApology(language);

      setMessages((prev) => {
        const hasEmptyStream = prev.some((m) => m.id === streamMsgId && m.sender === 'ai');
        if (hasEmptyStream) {
          return prev.map((m) => (m.id === streamMsgId ? { ...m, text: errorText } : m));
        }
        return [...prev, { id: Date.now() + 1, sender: 'ai', text: errorText }];
      });
    } finally {
      if (activeSendRef.current === sendId) {
        setIsTyping(false);
        setIsStreaming(false);
      }
    }
  };

  return (
    <>
      {/* Floating launcher trigger */}
      <div className="fixed bottom-6 right-6 z-50 pb-[env(safe-area-inset-bottom)]">
        <AnimatePresence>
          {launcherHover && !isOpen && (
            <motion.div
              role="status"
              initial={{ opacity: 0, y: 8, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ duration: 0.2, ease: easeLuxury }}
              className="pointer-events-none absolute bottom-[calc(100%+0.65rem)] right-0 w-[min(17rem,calc(100vw-2.5rem))] rounded-2xl border border-cyan-400/35 bg-navy-950/95 px-3.5 py-2.5 text-left text-[11px] leading-snug text-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.45),0_0_24px_rgba(34,211,238,0.12)] backdrop-blur-md"
            >
              <p className="font-medium text-cyan-200/95 text-[10px] uppercase tracking-wide mb-1">
                {language === 'km' ? 'រក្សា · AI' : 'Reaksa · AI'}
              </p>
              <p>{language === 'km' ? HOVER_INTRO_KM : HOVER_INTRO_EN}</p>
              <span
                className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 border-r border-b border-cyan-400/35 bg-navy-950/95"
                aria-hidden
              />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setLauncherHover(true)}
          onMouseLeave={() => setLauncherHover(false)}
          onFocus={() => setLauncherHover(true)}
          onBlur={() => setLauncherHover(false)}
          whileHover={reduced ? undefined : { scale: 1.06 }}
          whileTap={reduced ? undefined : { scale: 0.94 }}
          className="relative flex h-[4.25rem] w-[4.25rem] sm:h-[4.5rem] sm:w-[4.5rem] cursor-pointer items-center justify-center overflow-visible rounded-full bg-gradient-to-br from-slate-800 via-slate-900 to-navy-950 text-slate-100 border-2 border-cyan-400/40 shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_28px_rgba(34,211,238,0.18)] hover:border-cyan-300/55 hover:shadow-[0_10px_36px_rgba(34,211,238,0.28)] transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          aria-label={`Open ${ASSISTANT_NAME} — Solara AI assistant`}
          aria-expanded={isOpen}
          title={language === 'km' ? HOVER_INTRO_KM : HOVER_INTRO_EN}
        >
          <span className="pointer-events-none absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-emerald-400" />
          </span>

          <span className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-b from-white/10 to-transparent ring-1 ring-white/15">
            {isOpen ? (
              <svg className="h-6 w-6 text-cyan-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <SolaraBotMascot active={launcherHover} className="scale-[0.92] sm:scale-100" />
            )}
          </span>
        </motion.button>
      </div>

      {/* Floating Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 30, scale: reduced ? 1 : 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduced ? 0 : 30, scale: reduced ? 1 : 0.95 }}
            transition={{ duration: 0.25, ease: easeLuxury }}
            className="fixed bottom-[5.25rem] sm:bottom-[5.5rem] right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 max-h-[580px] h-[80vh] bg-surface/95 border border-gold/30 rounded-2xl shadow-2xl backdrop-blur-xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-navy-950 via-navy-900 to-surface border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-navy-950/80 border border-cyan-400/35 flex items-center justify-center overflow-hidden shadow-inner">
                  <SolaraBotMascot className="scale-[0.65]" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-semibold text-text">{ASSISTANT_NAME}</h3>
                  <p className="text-[11px] text-gold-light flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {headerSubtitle}
                  </p>
                  {pageBranch.branchName && (
                    <p className="text-[10px] text-text-muted mt-0.5 truncate max-w-[12rem]">
                      {language === 'km' ? 'កំពុងមើល' : 'Browsing'}: {pageBranch.branchName}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleClearChat}
                  disabled={isTyping || isStreaming}
                  className="p-1.5 rounded-lg text-text-muted hover:text-gold hover:bg-white/5 transition-colors disabled:opacity-40"
                  aria-label={language === 'km' ? 'លុបប្រវត្តិជជែក' : 'Clear chat'}
                  title={language === 'km' ? 'លុបប្រវត្តិជជែក' : 'Clear chat'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-white/5 transition-colors"
                  aria-label={`Close ${ASSISTANT_NAME} chat`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Quick Branches Navigator Bar */}
            <div className="px-3 py-2 bg-navy-900/60 border-b border-border/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
              <span className="text-text-muted shrink-0 text-[10px] uppercase tracking-wider font-semibold">
                {language === 'km' ? 'សាខា:' : 'Branches:'}
              </span>
              {branchShortcuts.map((branch, index) => (
                <Link
                  key={branch.to}
                  to={branch.to}
                  onClick={closeAndNavigate}
                  className={`px-2 py-0.5 rounded shrink-0 transition-colors ${
                    index === 0
                      ? 'bg-surface hover:bg-gold/15 text-gold hover:text-gold-light border border-gold/20'
                      : 'bg-surface hover:bg-white/10 text-text-muted hover:text-text border border-border'
                  }`}
                >
                  {branch.label}
                </Link>
              ))}
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: reduced ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: easeLuxury }}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-gradient-to-r from-gold to-gold-light text-navy-950 font-medium rounded-br-none shadow-md'
                        : 'bg-surface-elevated text-text border border-border/80 rounded-bl-none shadow-sm'
                    }`}
                  >
                    {m.sender === 'ai' ? (
                      <ConciergeMessageContent text={m.text} />
                    ) : (
                      m.text
                    )}
                    {m.sender === 'ai' && m.id !== 1 && !m.text && isStreaming && (
                      <span className="inline-block w-1.5 h-3.5 ml-0.5 align-middle bg-gold/80 animate-pulse rounded-sm" />
                    )}
                  </div>
                </motion.div>
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
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(q)}
                  disabled={isTyping || isStreaming}
                  className="px-2.5 py-1 text-[11px] rounded-full bg-white/5 hover:bg-gold/15 text-text-muted hover:text-gold border border-border/60 hover:border-gold/30 shrink-0 whitespace-nowrap transition-colors disabled:opacity-40"
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
                placeholder={inputPlaceholder}
                className="flex-1 bg-bg/80 border border-border rounded-xl px-3 py-2 text-xs text-text placeholder-text-muted focus:outline-none focus:border-gold transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping || isStreaming}
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
