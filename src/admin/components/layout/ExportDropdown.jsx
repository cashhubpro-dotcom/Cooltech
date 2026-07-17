import { useState, useRef, useEffect } from 'react';
import { COLORS } from '../../constants/tokens';
import PDFPreview from './PDFPreview';
const ExportDropdown = ({
  title = "Document",
  filename = "export",
  template = "generic_list",
  pdfData,
  // data object passed straight to PDFPreview → template
  printStyles = "",
  pdfOpen = false,
  onOpenPdf,
  onClosePdf,
  onExportExcel
}) => {
  const [dropOpen, setDropOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => {
      if (ref.current && !ref.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return <>
      <div ref={ref} className="ap-export-dropdown-1">
        <button onClick={() => setDropOpen(o => !o)} className="ap-export-dropdown-2">
          ⬇ Export
          <span style={{
          transform: dropOpen ? "rotate(180deg)" : "rotate(0deg)"
        }} className="ap-export-dropdown-3">▼</span>
        </button>

        {dropOpen && <div className="ap-export-dropdown-4">
            <button onClick={() => {
          setDropOpen(false);
          onOpenPdf?.();
        }} onMouseEnter={e => e.currentTarget.style.background = COLORS.brandL} onMouseLeave={e => e.currentTarget.style.background = "none"} className="ap-export-dropdown-5">
              <span className="ap-export-dropdown-6">📄</span>
              <div>
                <div>Export as PDF</div>
                <div className="ap-export-dropdown-7">Preview then download</div>
              </div>
            </button>

            <div className="ap-export-dropdown-8" />

            <button onClick={() => {
          setDropOpen(false);
          onExportExcel?.();
        }} onMouseEnter={e => e.currentTarget.style.background = "#F0FDF4"} onMouseLeave={e => e.currentTarget.style.background = "none"} className="ap-export-dropdown-9">
              <span className="ap-export-dropdown-10">📊</span>
              <div>
                <div>Export as Excel</div>
                <div className="ap-export-dropdown-11">Download .csv file</div>
              </div>
            </button>
          </div>}
      </div>

      <PDFPreview open={pdfOpen} onClose={onClosePdf} title={title} filename={filename} template={template} data={pdfData} printStyles={printStyles} />

      <style>{`@keyframes ddIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </>;
};
export default ExportDropdown;