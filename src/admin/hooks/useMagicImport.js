// ─── src/hooks/useMagicImport.js ──────────────────────────────────────────────
import { useState, useCallback } from 'react';
import { quotationsApi } from '../services/api';

const VALID_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function useMagicImport({ quotations, onFilled, onViewExisting }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'uploading' | 'error'
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // If the extracted customer matches an existing quotation (by phone or name),
  // open that one instead of creating a duplicate.
  const findDuplicate = useCallback((extracted) => {
    const name = (extracted.customerName || '').trim().toLowerCase();
    const phone = (extracted.phone || '').replace(/\D/g, '');
    if (!name && !phone) return null;

    return quotations.find((q) => {
      const qName = (q.customer || '').trim().toLowerCase();
      const qPhone = (q.phone || '').replace(/\D/g, '');
      const phoneMatch = phone && qPhone && phone === qPhone;
      const nameMatch = name && qName && name === qName;
      return phoneMatch || nameMatch;
    }) || null;
  }, [quotations]);

  const processFile = useCallback(async (file) => {
    if (!file) return;

    if (!VALID_MIME_TYPES.includes(file.type)) {
      setError('Please upload a PDF, JPG, PNG, or WEBP file.');
      setStatus('error');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('File is too large. Max size is 10MB.');
      setStatus('error');
      return;
    }

    setStatus('uploading');
    setError('');

    try {
      const extracted = await quotationsApi.magicImport(file);

      const duplicate = findDuplicate(extracted);
      if (duplicate) {
        setStatus('idle');
        setPanelOpen(false);
        onViewExisting?.(duplicate.id || duplicate._id);
        return;
      }

      // Shape matches what QuotationsPage.seedEdit() expects
      // const editData = {
      //   customer: extracted.customerName,
      //   contact: extracted.contact,
      //   phone: extracted.phone,
      //   email: extracted.email,
      //   address: extracted.address,
      //   type: extracted.type,
      //   notes: extracted.notes,
      //   terms: extracted.terms,
      //   valid: extracted.validUntil,
      //   created: new Date().toLocaleDateString('en-GB'),
      // };

      const editData = {
  customer: extracted.customerName,
  contact: extracted.contact,
  phone: extracted.phone,
  email: extracted.email,
  address: extracted.address,
  type: extracted.type,
  notes: extracted.notes,
  terms: extracted.terms,
  valid: extracted.validUntil,
  taxPercent: extracted.taxPercent || '',
  fields: extracted.fields || [],
  template: 'generic',
  created: new Date().toLocaleDateString('en-GB'),
};

      const editItems = (extracted.items || []).length
        ? extracted.items.map((i) => ({ desc: i.desc, qty: i.qty, rate: i.rate }))
        : [{ desc: '', qty: '', rate: '' }];

      setStatus('idle');
      setPanelOpen(false);
      onFilled?.(editData, editItems);
    } catch (err) {
      setError(err.message || 'Could not read this file. Try a clearer scan or fill the quotation manually.');
      setStatus('error');
    }
  }, [findDuplicate, onFilled, onViewExisting]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    processFile(e.dataTransfer.files?.[0]);
  }, [processFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileSelect = useCallback((e) => {
    processFile(e.target.files?.[0]);
    e.target.value = ''; // allow re-selecting the same file
  }, [processFile]);

  return {
    panelOpen,
    setPanelOpen,
    status,
    error,
    dragActive,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleFileSelect,
  };
}