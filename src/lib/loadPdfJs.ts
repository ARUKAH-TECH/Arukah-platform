// Loads Mozilla pdf.js (served from /public/vendor, Apache-2.0) in the browser
// without bundling it: a small module script puts it on window.
const BASE = "/vendor/pdfjs-6.2.108";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    __pdfjs?: any;
  }
}

let loading: Promise<any> | null = null;

export function loadPdfJs(): Promise<any> {
  if (window.__pdfjs) return Promise.resolve(window.__pdfjs);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const done = () => {
      window.removeEventListener("pdfjs-ready", done);
      if (!window.__pdfjs) return reject(new Error("The PDF reader didn't load. Check your connection and try again."));
      window.__pdfjs.GlobalWorkerOptions.workerSrc = `${BASE}/pdf.worker.min.mjs`;
      resolve(window.__pdfjs);
    };
    window.addEventListener("pdfjs-ready", done);
    const script = document.createElement("script");
    script.type = "module";
    script.textContent = `import * as p from "${BASE}/pdf.min.mjs"; window.__pdfjs = p; window.dispatchEvent(new Event("pdfjs-ready"));`;
    script.onerror = () => reject(new Error("The PDF reader didn't load."));
    document.head.appendChild(script);
    setTimeout(() => {
      if (!window.__pdfjs) {
        loading = null;
        reject(new Error("The PDF reader took too long to load. Please try again."));
      }
    }, 30000);
  });
  return loading;
}

/** Text of every page, as paragraphs, using the shared rules in bookText.ts. */
export async function extractPdfPages(
  data: ArrayBuffer,
  pageToText: (items: any[]) => string,
  onProgress?: (done: number, total: number) => void,
): Promise<string[]> {
  const pdfjs = await loadPdfJs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(pageToText(content.items));
    onProgress?.(i, doc.numPages);
  }
  return pages;
}
