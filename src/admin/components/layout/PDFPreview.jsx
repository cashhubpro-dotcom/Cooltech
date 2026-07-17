import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { COLORS, FONTS } from '../../constants/tokens';
import { QuotationTemplate, InvoiceTemplate, GenericListTemplate, ContractTemplate, AMCContractPDFTemplate, ServiceJobSheetTemplate, CampaignReportTemplate, ScorecardTemplate } from './printTemplates';
const TEMPLATES = {
  quotation: QuotationTemplate,
  invoice: InvoiceTemplate,
  generic_list: GenericListTemplate,
  contract: ContractTemplate,
  amc_contract: AMCContractPDFTemplate,
  service_job_sheet: ServiceJobSheetTemplate,
  campaign_report: CampaignReportTemplate,
  scorecard: ScorecardTemplate
};
const PDFPreview = ({
  open,
  onClose,
  template,
  data,
  title = "Document",
  filename = "document",
  printStyles = ""
}) => {
  useEffect(() => {
    if (!open) return;
    const h = e => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  if (!open) return null;
  const TemplateComponent = TEMPLATES[template];
  const handlePrint = () => {
    const content = document.getElementById("pdf-preview-content")?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank", "width=900,height=700");
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${filename}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a1a;background:white;padding:48px;max-width:794px;margin:0 auto}@media print{body{padding:32px;-webkit-print-color-adjust:exact;print-color-adjust:exact}}${printStyles}</style>
</head><body>${content}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };
  return createPortal(<>
      <div onClick={onClose} className="ap-pdf-preview-1" />

      <div className="ap-pdf-preview-2">

        {/* Top bar */}
        <div className="ap-pdf-preview-3">
          <span className="ap-pdf-preview-4">📄 PDF Preview</span>
          <span className="ap-pdf-preview-5">{title}</span>
          <div className="ap-pdf-preview-6">
            <button onClick={handlePrint} className="ap-pdf-preview-7">⬇ Download PDF</button>
            <button onClick={onClose} className="ap-pdf-preview-8">✕</button>
          </div>
        </div>

        {/* Paper */}
        <div className="ap-pdf-preview-9">
          <div id="pdf-preview-content" className="ap-pdf-preview-10">
            {TemplateComponent ? <TemplateComponent data={data} /> : <div className="ap-pdf-preview-11">
                  Unknown template: "<b>{String(template)}</b>"<br />
                  Valid keys: {Object.keys(TEMPLATES).join(", ")}
                </div>}
          </div>
        </div>
      </div>
      <style>{`@keyframes pdfPop{from{opacity:0;transform:translate(-50%,-48%) scale(.97)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}`}</style>
    </>, document.body);
};
export default PDFPreview;