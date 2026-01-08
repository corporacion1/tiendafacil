import React from 'react';

interface QuoteSignatureProps {
  showDate?: boolean;
  label?: string;
}

export function QuoteSignature({ showDate = true, label = "Firma del Cliente:" }: QuoteSignatureProps) {
  return (
    <div className="signature-box" style={{ marginTop: '32px', padding: '16px' }}>
      <p className="signature-label" style={{
        fontSize: '12px',
        marginBottom: '8px',
        color: 'rgb(107, 114, 128)'
      }}>
        {label}
      </p>
      <div className="signature-line" style={{
        borderBottom: '1px solid rgb(0, 0, 0)',
        minHeight: '48px',
        marginBottom: '8px'
      }}></div>
      {showDate && (
        <div className="date-row" style={{ display: 'flex', gap: '24px' }}>
          <div style={{ fontSize: '12px', color: 'rgb(107, 114, 128)' }}>
            Fecha: ____/____/____
          </div>
        </div>
      )}
    </div>
  );
}
