/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { Languages, Link, Send, Loader2, AlertCircle, Copy, Check, ArrowRight } from 'lucide-react';
import Markdown from 'react-markdown';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [url, setUrl] = useState('');
  const [translation, setTranslation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    // Basic URL validation
    try {
      new URL(url);
    } catch (err) {
      setError('الرجاء إدخال رابط صحيح (URL)');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTranslation('');

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `قم بترجمة **كامل** محتوى المقال الموجود في هذا الرابط ترجمة كاملة وشاملة إلى اللغة العربية: ${url}. 
        **تحذير هام جداً:** لا تقم باختصار النص أو تلخيصه أو حذف أي جزء منه أبداً. يجب ترجمة كل فقرة وكل جملة وكل كلمة موجودة في المقال الأصلي دون أي نقص، مهما كان طول المقال. 
        حافظ على التنسيق الأصلي (عناوين، فقرات، قوائم) باستخدام Markdown بشكل احترافي.`,
        config: {
          tools: [{ urlContext: {} }],
          systemInstruction: "أنت مترجم محترف فائق الدقة والأمانة. مهمتك هي ترجمة المقالات ترجمة كاملة (Full Translation) من البداية إلى النهاية دون حذف أي جزء أو تلخيص أي فقرة. يجب أن تكون الترجمة مطابقة تماماً للمحتوى الأصلي من حيث الطول والتفاصيل، مع صياغتها بأسلوب عربي بليغ وسلس. يمنع منعاً باتاً التلخيص أو الاختصار.",
        },
      });

      const text = response.text;
      if (text) {
        setTranslation(text);
        // Scroll to result after a short delay to allow rendering
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        throw new Error('لم يتم استلام أي محتوى من الذكاء الاصطناعي.');
      }
    } catch (err: any) {
      console.error('Translation error:', err);
      setError(err.message || 'حدث خطأ أثناء محاولة ترجمة المقال. يرجى التأكد من أن الرابط متاح للعامة.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(translation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#1a1a1a] font-sans selection:bg-indigo-100" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Languages className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">مترجم المقالات الذكي</h1>
          </div>
          <div className="text-sm text-gray-500 font-medium hidden sm:block">
            ترجمة دقيقة مدعومة بالذكاء الاصطناعي
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold text-gray-900 mb-4 leading-tight"
          >
            ترجم أي مقال بضغطة واحدة
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            ضع رابط المقال الطويل وسنقوم بترجمته لك بدقة احترافية مع الحفاظ على التنسيق الأصلي.
          </motion.p>
        </div>

        {/* Input Form */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-12"
        >
          <form onSubmit={handleTranslate} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Link className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="أدخل رابط المقال هنا (مثال: https://example.com/article)"
                className="block w-full pr-12 pl-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-lg"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                isLoading || !url.trim() 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  جاري التحليل والترجمة...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 rotate-180" />
                  ابدأ الترجمة الآن
                </>
              )}
            </button>
          </form>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700"
            >
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {translation && (
            <motion.div 
              ref={resultRef}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden"
            >
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-700 font-bold">
                  <Languages className="w-5 h-5 text-indigo-600" />
                  المقال المترجم
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      تم النسخ
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      نسخ النص
                    </>
                  )}
                </button>
              </div>
              <div className="p-8 prose prose-indigo max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-indigo-600">
                <div className="markdown-body">
                  <Markdown>{translation}</Markdown>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features/Info */}
        {!translation && !isLoading && (
          <div className="grid sm:grid-cols-3 gap-6 mt-12">
            {[
              { title: 'ترجمة سياقية', desc: 'لا نكتفي بالترجمة الحرفية، بل نفهم المعنى الحقيقي للمقال.' },
              { title: 'دعم المقالات الطويلة', desc: 'يمكننا معالجة المقالات والتقارير الطويلة جداً بكفاءة.' },
              { title: 'تنسيق ذكي', desc: 'نحافظ على العناوين والفقرات والقوائم كما هي في الأصل.' }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + (i * 0.1) }}
                className="bg-white p-6 rounded-xl border border-gray-100 text-center"
              >
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowRight className="w-5 h-5 text-indigo-600 rotate-180" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-400 text-sm border-t border-gray-100 mt-12">
        &copy; {new Date().getFullYear()} مترجم المقالات الذكي. جميع الحقوق محفوظة.
      </footer>
    </div>
  );
}
