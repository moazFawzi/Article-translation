import { useMemo, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { motion } from 'motion/react';
import {
  BookOpen,
  Brain,
  FileQuestion,
  FolderPlus,
  LayoutDashboard,
  Loader2,
  Plus,
  Sparkles,
  Upload,
  Download,
} from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type Task = { id: string; title: string; done: boolean };
type SubjectFolder = { id: string; name: string; tasks: Task[] };
type Flashcard = { id: string; question: string; answer: string };

export default function App() {
  const [activePhase, setActivePhase] = useState<1 | 2 | 3 | 4>(1);

  // Phase 1 state
  const [subjects, setSubjects] = useState<SubjectFolder[]>([]);
  const [subjectName, setSubjectName] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [taskTitle, setTaskTitle] = useState('');

  // Phase 2 state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [revealedCardId, setRevealedCardId] = useState<string | null>(null);

  // Phase 3 state
  const [mindMapLoading, setMindMapLoading] = useState(false);
  const [mindMapText, setMindMapText] = useState('');
  const [mindMapError, setMindMapError] = useState<string | null>(null);

  // Phase 4 state
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizText, setQuizText] = useState('');
  const [quizError, setQuizError] = useState<string | null>(null);

  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id === selectedSubjectId),
    [subjects, selectedSubjectId],
  );

  const addSubject = () => {
    if (!subjectName.trim()) return;
    const newSubject: SubjectFolder = {
      id: crypto.randomUUID(),
      name: subjectName.trim(),
      tasks: [],
    };
    setSubjects((prev) => [...prev, newSubject]);
    setSelectedSubjectId(newSubject.id);
    setSubjectName('');
  };

  const addTask = () => {
    if (!selectedSubjectId || !taskTitle.trim()) return;
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === selectedSubjectId
          ? {
              ...subject,
              tasks: [
                ...subject.tasks,
                { id: crypto.randomUUID(), title: taskTitle.trim(), done: false },
              ],
            }
          : subject,
      ),
    );
    setTaskTitle('');
  };

  const toggleTask = (subjectId: string, taskId: string) => {
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === subjectId
          ? {
              ...subject,
              tasks: subject.tasks.map((task) =>
                task.id === taskId ? { ...task, done: !task.done } : task,
              ),
            }
          : subject,
      ),
    );
  };

  const addFlashcard = () => {
    if (!question.trim() || !answer.trim()) return;
    setFlashcards((prev) => [
      ...prev,
      { id: crypto.randomUUID(), question: question.trim(), answer: answer.trim() },
    ]);
    setQuestion('');
    setAnswer('');
  };

  const readFileAsBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result?.toString();
        if (!result) return reject(new Error('تعذر قراءة الملف.'));
        resolve(result.split(',')[1]);
      };
      reader.onerror = () => reject(new Error('فشل في قراءة الملف.'));
      reader.readAsDataURL(file);
    });

  const generateFromPdf = async (
    file: File,
    mode: 'mindmap' | 'quiz',
  ) => {
    const base64 = await readFileAsBase64(file);
    const prompt =
      mode === 'mindmap'
        ? `حوّل ملف PDF كامل إلى خريطة ذهنية احترافية باللغة العربية بصيغة Markdown منظمة جداً.
- لا تختصر المحتوى بشكل مخل.
- استخرج كل الأفكار الأساسية والفرعية والمفاهيم المهمة.
- استخدم بنية هرمية واضحة (عنوان رئيسي > محاور > نقاط فرعية عميقة).
- أضف أمثلة/تعريفات مهمة من الملف عندما تكون موجودة.
- في النهاية أضف قسم "ملخص شامل" يغطي كل النقاط.`
        : `حوّل ملف PDF كامل إلى بنك أسئلة احترافي باللغة العربية.
- أنشئ 20 سؤال اختيار من متعدد على الأقل (A/B/C/D).
- الأسئلة تكون متنوعة بين الفهم، التحليل، التطبيق.
- أضف الإجابة الصحيحة مع تفسير مختصر بعد كل سؤال.
- لا تعتمد على كلمتين من الملف فقط، بل غطِّ المحتوى بشكل واسع.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [
        {
          inlineData: { mimeType: 'application/pdf', data: base64 },
        },
        { text: prompt },
      ],
    });

    return response.text ?? '';
  };

  const onMindMapUpload = async (file: File | null) => {
    if (!file) return;
    setMindMapLoading(true);
    setMindMapError(null);
    setMindMapText('');
    try {
      const text = await generateFromPdf(file, 'mindmap');
      if (!text.trim()) throw new Error('لم يتم إنتاج خريطة ذهنية.');
      setMindMapText(text);
    } catch (error: any) {
      setMindMapError(error.message ?? 'حدث خطأ أثناء تحويل الملف.');
    } finally {
      setMindMapLoading(false);
    }
  };

  const onQuizUpload = async (file: File | null) => {
    if (!file) return;
    setQuizLoading(true);
    setQuizError(null);
    setQuizText('');
    try {
      const text = await generateFromPdf(file, 'quiz');
      if (!text.trim()) throw new Error('لم يتم إنتاج الأسئلة.');
      setQuizText(text);
    } catch (error: any) {
      setQuizError(error.message ?? 'حدث خطأ أثناء توليد الأسئلة.');
    } finally {
      setQuizLoading(false);
    }
  };

  const downloadAsPngNote = () => {
    alert('لتحويل الخريطة إلى PNG بدقة عالية: انسخ المحتوى واعرضه في أداة رسم خرائط ذهنية مثل Excalidraw أو Canva ثم قم بالتصدير PNG.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" dir="rtl">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <LayoutDashboard className="h-5 w-5 text-cyan-400" />
            منصة الدراسة الذكية
          </h1>
          <span className="text-sm text-slate-400">تصميم احترافي • 4 مراحل</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 grid gap-3 sm:grid-cols-4">
          {[
            { id: 1 as const, label: 'المرحلة 1', icon: BookOpen },
            { id: 2 as const, label: 'المرحلة 2', icon: Brain },
            { id: 3 as const, label: 'المرحلة 3', icon: Sparkles },
            { id: 4 as const, label: 'المرحلة 4', icon: FileQuestion },
          ].map((phase) => (
            <button
              key={phase.id}
              onClick={() => setActivePhase(phase.id)}
              className={`rounded-xl border p-4 text-right transition ${
                activePhase === phase.id
                  ? 'border-cyan-400 bg-cyan-400/10'
                  : 'border-slate-800 bg-slate-900 hover:border-slate-600'
              }`}
            >
              <phase.icon className="mb-2 h-5 w-5 text-cyan-400" />
              <p className="font-semibold">{phase.label}</p>
            </button>
          ))}
        </div>

        {activePhase === 1 && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h2 className="text-2xl font-bold">إدارة المهام حسب المادة</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <h3 className="mb-3 flex items-center gap-2 font-semibold"><FolderPlus className="h-4 w-4" /> إنشاء مجلد مادة</h3>
                <div className="flex gap-2">
                  <input value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="مثال: الفيزياء" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
                  <button onClick={addSubject} className="rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950"><Plus /></button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <h3 className="mb-3 font-semibold">إضافة مهمة للمادة</h3>
                <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
                  <option value="">اختر المادة</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="مثال: حل واجب الفصل الثالث" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
                  <button onClick={addTask} className="rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950">إضافة</button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h3 className="mb-4 font-semibold">قائمة المهام</h3>
              {!selectedSubject ? <p className="text-slate-400">اختر مادة لعرض المهام.</p> : (
                <ul className="space-y-2">
                  {selectedSubject.tasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 rounded-lg border border-slate-700 p-3">
                      <input type="checkbox" checked={t.done} onChange={() => toggleTask(selectedSubject.id, t.id)} />
                      <span className={t.done ? 'line-through text-slate-500' : ''}>{t.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.section>
        )}

        {activePhase === 2 && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">الفلاش كاردز</h2>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="grid gap-2 md:grid-cols-2">
                <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="السؤال" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
                <input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="الإجابة" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
              </div>
              <button onClick={addFlashcard} className="mt-3 rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950">إضافة كارت</button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {flashcards.map((card) => (
                <button key={card.id} onClick={() => setRevealedCardId(revealedCardId === card.id ? null : card.id)} className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-right">
                  <p className="font-semibold text-cyan-300">س: {card.question}</p>
                  {revealedCardId === card.id && <p className="mt-2 text-slate-200">ج: {card.answer}</p>}
                </button>
              ))}
            </div>
          </section>
        )}

        {activePhase === 3 && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">تحويل PDF إلى خريطة ذهنية احترافية</h2>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-600 bg-slate-900 p-4">
              <Upload className="h-5 w-5 text-cyan-400" /> ارفع ملف PDF
              <input type="file" accept="application/pdf" className="hidden" onChange={(e) => onMindMapUpload(e.target.files?.[0] ?? null)} />
            </label>
            {mindMapLoading && <p className="flex items-center gap-2 text-cyan-300"><Loader2 className="h-4 w-4 animate-spin" />جاري إنشاء الخريطة...</p>}
            {mindMapError && <p className="text-red-400">{mindMapError}</p>}
            {mindMapText && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 whitespace-pre-wrap">
                <button onClick={downloadAsPngNote} className="mb-4 flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950"><Download className="h-4 w-4" />تحميل PNG</button>
                {mindMapText}
              </div>
            )}
          </section>
        )}

        {activePhase === 4 && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">تحويل PDF إلى أسئلة اختيار من متعدد</h2>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-600 bg-slate-900 p-4">
              <Upload className="h-5 w-5 text-cyan-400" /> ارفع ملف PDF
              <input type="file" accept="application/pdf" className="hidden" onChange={(e) => onQuizUpload(e.target.files?.[0] ?? null)} />
            </label>
            {quizLoading && <p className="flex items-center gap-2 text-cyan-300"><Loader2 className="h-4 w-4 animate-spin" />جاري إنشاء الأسئلة...</p>}
            {quizError && <p className="text-red-400">{quizError}</p>}
            {quizText && <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 whitespace-pre-wrap">{quizText}</div>}
          </section>
        )}
      </main>
    </div>
  );
}
