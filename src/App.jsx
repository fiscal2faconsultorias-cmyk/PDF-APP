import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { motion } from "framer-motion";
import { Upload, RotateCcw, Archive } from "lucide-react";

export default function PdfReverseSaaS() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [zipUrl, setZipUrl] = useState(null);

  async function handleProcess() {
    if (!files.length) return;
    setLoading(true);
    setZipUrl(null);

    const zip = new JSZip();

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes);
      const pages = pdfDoc.getPages();

      // Só processa PDFs com exatamente 2 páginas
      if (pages.length !== 2) {
        console.warn(`Arquivo ignorado (não tem 2 páginas): ${file.name}`);
        continue;
      }

      const newPdf = await PDFDocument.create();

      const page1 = pages[0];
      const page2 = pages[1];

      const { width, height } = page1.getSize();

      // Cria UMA página com altura dobrada
      const mergedPage = newPdf.addPage([width, height * 2]);

      const [embeddedPage1, embeddedPage2] = await newPdf.embedPages([
        page1,
        page2,
      ]);

      // Página 1 em cima
      mergedPage.drawPage(embeddedPage1, {
        x: 0,
        y: height,
        width,
        height,
      });

      // Página 2 embaixo (onde fica a assinatura)
      mergedPage.drawPage(embeddedPage2, {
        x: 0,
        y: 0,
        width,
        height,
      });

      const pdfBytes = await newPdf.save();

      // Mantém exatamente o mesmo nome do arquivo
      zip.file(file.name, pdfBytes);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);

    setZipUrl(url);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-slate-900/70 backdrop-blur border border-slate-800 shadow-2xl rounded-2xl p-8 space-y-6"
      >
        <h1 className="text-3xl font-bold text-center text-white">
          PDF 2 → 1 (Assinatura)
        </h1>

        <p className="text-center text-slate-400 text-sm">
          Junta PDFs de 2 páginas em 1 única página, pronto para assinatura digital
        </p>

        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-xl p-6 cursor-pointer hover:border-blue-500 transition">
          <Upload className="w-8 h-8 text-blue-500" />
          <span className="text-slate-400 mt-2">
            Clique ou arraste seus PDFs
          </span>
          <input
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={(e) => setFiles(Array.from(e.target.files))}
          />
        </label>

        {files.length > 0 && (
          <p className="text-sm text-slate-300 text-center">
            {files.length} arquivo(s) selecionado(s)
          </p>
        )}

        <button
          onClick={handleProcess}
          disabled={loading || !files.length}
          className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-2 font-medium disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <RotateCcw className="animate-spin" /> Processando PDFs...
            </span>
          ) : (
            `Processar ${files.length} PDF(s)`
          )}
        </button>

        {zipUrl && (
          <a
            href={zipUrl}
            download="pdfs-prontos-para-assinatura.zip"
            className="flex items-center justify-center gap-2 text-green-400 hover:underline text-sm"
          >
            <Archive /> Baixar todos os PDFs (ZIP)
          </a>
        )}

        <p className="text-xs text-center text-slate-500">
          Os PDFs gerados possuem apenas 1 página física.  
          Assine normalmente pelo SERPRO sem quebrar a validade jurídica.
          <br />
          <br />
          Ass: Jordino - X = 45; Y = 479
          <br />
          Ass: Rafael - X = 131; Y = 479
        </p>
      </motion.div>
    </div>
  );
}
