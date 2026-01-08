import React from 'react';

interface QuoteWatermarkProps {
  logoUrl: string;
  opacity?: number;
}

export function QuoteWatermark({ logoUrl, opacity = 0.05 }: QuoteWatermarkProps) {
  return (
    <div className="watermark" style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%) rotate(-30deg)',
      opacity,
      width: '60%',
      height: 'auto',
      zIndex: 0,
      pointerEvents: 'none',
      filter: 'grayscale(100%)',
    }}>
      {logoUrl ? (
        <img src={logoUrl} alt="" style={{ width: '100%', height: 'auto', display: 'block', margin: '0 auto' }} />
      ) : null}
    </div>
  );
}
