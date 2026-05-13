import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as PDFJS from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import { toast } from 'react-hot-toast';
import {
  ZoomIn, ZoomOut, Maximize2, Minimize2, SaveAll, RotateCcw
} from 'lucide-react';

import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
PDFJS.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const HL_COLORS = [
  { label: 'Yellow', css: '#FACC15', rgba: [250, 204, 21, 0.35] as [number, number, number, number] },
  { label: 'Red',    css: '#F87171', rgba: [248, 113, 113, 0.35] as [number, number, number, number] },
  { label: 'Green',  css: '#4ADE80', rgba: [74, 222, 128, 0.35] as [number, number, number, number] },
  { label: 'Blue',   css: '#60A5FA', rgba: [96, 165, 250, 0.35] as [number, number, number, number] },
];

interface Rect { pageNum: number; x: number; y: number; w: number; h: number; color: [number, number, number, number] }

interface Props {
  url: string;
  onSaveAnnotated: (file: File) => void;
}

/**
 * Vertically-scrollable PDF viewer with drag-to-highlight rectangles.
 * All pages render at once in a scrollable column — like the native browser viewer.
 */
const PDFAnnotationViewer: React.FC<Props> = ({ url, onSaveAnnotated }) => {
  const pdfDocRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Per-page canvas refs:  pageCanvases[pageNum] = { pdf: canvas, annot: canvas }
  const pageCanvases = useRef<Record<number, { pdf: HTMLCanvasElement; annot: HTMLCanvasElement }>>({});

  const highlights = useRef<Rect[]>([]);
  const drawing = useRef<{ active: boolean; pageNum: number; sx: number; sy: number; cx: number; cy: number }>({
    active: false, pageNum: 0, sx: 0, sy: 0, cx: 0, cy: 0,
  });

  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [hlColor, setHlColor] = useState(0);
  const [hlCount, setHlCount] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // ── Load PDF ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const doc = await PDFJS.getDocument(url).promise;
        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setLoaded(true);
      } catch (e) {
        console.error('PDF load failed:', e);
        toast.error('Could not load PDF');
      }
    })();
  }, [url]);

  // Track in-flight render tasks per page so we can cancel before re-rendering
  const renderTasks = useRef<Record<number, any>>({});

  // ── Render a single page ──────────────────────────────
  const renderPage = useCallback(async (pNum: number, sc: number) => {
    const doc = pdfDocRef.current;
    const entry = pageCanvases.current[pNum];
    if (!doc || !entry) return;

    // Cancel any in-flight render for this page
    if (renderTasks.current[pNum]) {
      try { renderTasks.current[pNum].cancel(); } catch (_) {}
      delete renderTasks.current[pNum];
    }

    const page = await doc.getPage(pNum);
    const vp = page.getViewport({ scale: sc });

    entry.pdf.width = entry.annot.width = vp.width;
    entry.pdf.height = entry.annot.height = vp.height;

    const task = page.render({ canvasContext: entry.pdf.getContext('2d')!, viewport: vp });
    renderTasks.current[pNum] = task;
    try {
      await task.promise;
      delete renderTasks.current[pNum];
      redrawAnnotations(pNum);
    } catch (e: any) {
      // Ignore cancellation errors — they're expected when we cancel a previous render
      if (e?.name !== 'RenderingCancelledException') throw e;
    }
  }, []);

  // ── Re-render all pages on scale change ───────────────
  useEffect(() => {
    if (!loaded) return;
    // Render pages sequentially to avoid overwhelming the canvas
    (async () => {
      for (let p = 1; p <= numPages; p++) {
        await renderPage(p, scale);
      }
    })();
  }, [scale, loaded, numPages, renderPage]);

  // ── Redraw highlights for one page ────────────────────
  const redrawAnnotations = (pNum: number) => {
    const entry = pageCanvases.current[pNum];
    if (!entry) return;
    const ctx = entry.annot.getContext('2d')!;
    ctx.clearRect(0, 0, entry.annot.width, entry.annot.height);
    highlights.current
      .filter(h => h.pageNum === pNum)
      .forEach(h => {
        const [r, g, b, a] = h.color;
        ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
        ctx.fillRect(h.x, h.y, h.w, h.h);
      });
  };

  // ── Mouse handlers (per page) ─────────────────────────
  const getPos = (e: React.MouseEvent, canvas: HTMLCanvasElement) => {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvas.width / r.width),
      y: (e.clientY - r.top) * (canvas.height / r.height),
    };
  };

  const onDown = (e: React.MouseEvent, pNum: number) => {
    const entry = pageCanvases.current[pNum];
    if (!entry) return;
    const pos = getPos(e, entry.annot);
    drawing.current = { active: true, pageNum: pNum, sx: pos.x, sy: pos.y, cx: pos.x, cy: pos.y };
  };

  const onMove = (e: React.MouseEvent, pNum: number) => {
    const d = drawing.current;
    if (!d.active || d.pageNum !== pNum) return;
    const entry = pageCanvases.current[pNum];
    if (!entry) return;
    const pos = getPos(e, entry.annot);
    d.cx = pos.x; d.cy = pos.y;

    redrawAnnotations(pNum);
    const ctx = entry.annot.getContext('2d')!;
    const c = HL_COLORS[hlColor].rgba;
    ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${c[3]})`;
    ctx.fillRect(
      Math.min(d.sx, d.cx), Math.min(d.sy, d.cy),
      Math.abs(d.cx - d.sx), Math.abs(d.cy - d.sy),
    );
  };

  const onUp = (pNum: number) => {
    const d = drawing.current;
    if (!d.active || d.pageNum !== pNum) return;
    d.active = false;

    const x = Math.min(d.sx, d.cx);
    const y = Math.min(d.sy, d.cy);
    const w = Math.abs(d.cx - d.sx);
    const h = Math.abs(d.cy - d.sy);

    if (w > 5 && h > 5) {
      highlights.current.push({ pageNum: pNum, x, y, w, h, color: HL_COLORS[hlColor].rgba });
      setHlCount(c => c + 1);
    }
    redrawAnnotations(pNum);
  };

  // ── Undo ──────────────────────────────────────────────
  const undo = () => {
    if (!highlights.current.length) return;
    const last = highlights.current.pop()!;
    setHlCount(c => Math.max(0, c - 1));
    redrawAnnotations(last.pageNum);
  };

  // ── Save annotated PDF (compressed) ───────────────────
  const saveAnnotated = async () => {
    if (!pdfDocRef.current) return;
    setSaving(true);
    try {
      const EX_SCALE = 1.5; // lower than before → smaller file
      const pdf = new jsPDF({ unit: 'pt', compress: true });
      let first = true;

      for (let pn = 1; pn <= numPages; pn++) {
        const page = await pdfDocRef.current.getPage(pn);
        const vp = page.getViewport({ scale: EX_SCALE });
        const tmp = document.createElement('canvas');
        tmp.width = vp.width; tmp.height = vp.height;
        const ctx = tmp.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport: vp }).promise;

        const factor = EX_SCALE / scale;
        highlights.current.filter(h => h.pageNum === pn).forEach(h => {
          const [r, g, b, a] = h.color;
          ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
          ctx.fillRect(h.x * factor, h.y * factor, h.w * factor, h.h * factor);
        });

        const imgData = tmp.toDataURL('image/jpeg', 0.7); // more compression
        const pw = pdf.internal.pageSize.getWidth();
        const ph = (tmp.height / tmp.width) * pw;
        if (!first) pdf.addPage([pw, ph]);
        else { pdf.deletePage(1); pdf.addPage([pw, ph]); }
        pdf.addImage(imgData, 'JPEG', 0, 0, pw, ph);
        first = false;
      }

      const blob = pdf.output('blob');
      const file = new File([blob], `highlighted_review.pdf`, { type: 'application/pdf' });
      onSaveAnnotated(file);
      toast.success(`Highlighted PDF (${(blob.size / 1024 / 1024).toFixed(1)} MB) attached!`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to export PDF');
    }
    setSaving(false);
  };

  // ── Fullscreen ────────────────────────────────────────
  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);
  const toggleFs = () => {
    if (!fullscreen) containerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  // ── Register canvas refs per page ─────────────────────
  const registerRef = useCallback((pNum: number, kind: 'pdf' | 'annot', el: HTMLCanvasElement | null) => {
    if (!el) return;
    if (!pageCanvases.current[pNum]) pageCanvases.current[pNum] = { pdf: null!, annot: null! };
    pageCanvases.current[pNum][kind] = el;
  }, []);

  // ── Trigger first render once refs are registered ─────
  const pagesRendered = useRef(new Set<number>());
  const onRefReady = useCallback((pNum: number) => {
    if (pagesRendered.current.has(pNum)) return;
    const entry = pageCanvases.current[pNum];
    if (entry?.pdf && entry?.annot) {
      pagesRendered.current.add(pNum);
      renderPage(pNum, scale);
    }
  }, [renderPage, scale]);

  return (
    <div ref={containerRef} className={`flex flex-col bg-gray-900 ${fullscreen ? 'fixed inset-0 z-[999]' : 'h-full rounded-2xl overflow-hidden'}`}>
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Highlight:</span>
          {HL_COLORS.map((c, i) => (
            <button key={c.label} onClick={() => setHlColor(i)} style={{ background: c.css }}
              className={`w-5 h-5 rounded-full border-2 transition-transform ${hlColor === i ? 'border-white scale-125' : 'border-gray-600'}`}
            />
          ))}
          <button onClick={undo} className="px-2 py-1 text-gray-400 hover:text-white text-[10px] font-black uppercase ml-2 flex items-center gap-1">
            <RotateCcw size={12} /> Undo
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setScale(s => Math.max(0.5, +(s - 0.2).toFixed(1)))} className="p-1.5 rounded text-gray-400 hover:bg-gray-700"><ZoomOut size={14} /></button>
          <span className="text-[10px] font-bold text-gray-400 w-10 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(3, +(s + 0.2).toFixed(1)))} className="p-1.5 rounded text-gray-400 hover:bg-gray-700"><ZoomIn size={14} /></button>
          {hlCount > 0 && (
            <button onClick={saveAnnotated} disabled={saving}
              className="ml-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-1 hover:bg-green-700 disabled:opacity-60">
              <SaveAll size={13} /> {saving ? 'Saving…' : `Save & Attach (${hlCount})`}
            </button>
          )}
          <button onClick={toggleFs} className="p-1.5 rounded text-gray-400 hover:bg-gray-700 ml-1">
            {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      <div className="px-4 py-1 bg-gray-800/60 border-b border-gray-700 text-[9px] text-gray-500 font-bold uppercase tracking-widest">
        Drag rectangles over the document to highlight issues · Scroll to navigate pages
      </div>

      {/* ── Scrollable page column ── */}
      <div ref={scrollRef} className="flex-1 overflow-auto bg-gray-900 p-4">
        <div className="flex flex-col items-center gap-4">
          {loaded && Array.from({ length: numPages }, (_, i) => i + 1).map(pNum => (
            <div key={pNum} className="relative shadow-2xl">
              <canvas
                ref={el => { registerRef(pNum, 'pdf', el); onRefReady(pNum); }}
                className="block"
              />
              <canvas
                ref={el => { registerRef(pNum, 'annot', el); onRefReady(pNum); }}
                onMouseDown={e => onDown(e, pNum)}
                onMouseMove={e => onMove(e, pNum)}
                onMouseUp={() => onUp(pNum)}
                onMouseLeave={() => onUp(pNum)}
                className="absolute inset-0 cursor-crosshair"
              />
              <div className="absolute bottom-2 right-3 text-[9px] font-bold text-gray-500 bg-gray-900/70 px-2 py-0.5 rounded">
                Page {pNum}/{numPages}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PDFAnnotationViewer;
