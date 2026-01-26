import React from 'react';
import { Product, Store } from '@/lib/types';
import { getDisplayImageUrl } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';

interface CatalogTemplateProps {
    products: Product[];
    settings: Store | null;
    activeSymbol: string;
    activeRate: number;
}

export const CatalogTemplate = ({ products, settings, activeSymbol, activeRate }: CatalogTemplateProps) => {
    // 6 productos por página (2 col x 3 fil) para máximo espacio y legibilidad
    const itemsPerPage = 6;
    const totalPages = Math.ceil(products.length / itemsPerPage);

    const pages = Array.from({ length: totalPages }, (_, i) =>
        products.slice(i * itemsPerPage, (i + 1) * itemsPerPage)
    );

    // URL del catálogo público (ajustar según tu dominio real)
    const storeUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/catalog/${settings?.id || ''}`
        : `https://tiendafacil-pro.vercel.app/catalog/${settings?.id || ''}`;

    return (
        <div id="catalog-pdf-template" className="bg-white text-slate-900 font-sans" style={{ width: '794px', margin: '0', padding: '0' }}>
            {pages.map((pageProducts, pageIdx) => (
                <div
                    key={pageIdx}
                    className="flex flex-col bg-white"
                    style={{
                        width: '794px',
                        height: '1120px', // Exact A4
                        padding: '25px',
                        pageBreakAfter: pageIdx === totalPages - 1 ? 'avoid' : 'always',
                        pageBreakInside: 'avoid',
                        position: 'relative',
                        boxSizing: 'border-box',
                        overflow: 'hidden'
                    }}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center border-b-4 border-indigo-600 w-full mb-4 pb-3 print-header shrink-0">
                        <div className="flex items-center gap-4">
                            {settings?.logoUrl ? (
                                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-2 flex items-center justify-center overflow-hidden h-20 w-20 shrink-0">
                                    <img src={getDisplayImageUrl(settings.logoUrl)} alt="Logo" className="max-w-full max-h-full object-contain" />
                                </div>
                            ) : (
                                <div className="bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-3xl shadow-md h-20 w-20 shrink-0">
                                    {settings?.name?.charAt(0) || 'T'}
                                </div>
                            )}
                            <div className="max-w-[480px]">
                                <h1 className="text-2xl font-black text-slate-900 uppercase leading-tight mb-1">
                                    {settings?.name || 'Mi Negocio'}
                                </h1>
                                <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest leading-none">Catálogo de Productos</p>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end shrink-0">
                            <div className="px-3 py-1 bg-slate-900 rounded-md text-[10px] font-black text-white uppercase mb-1">
                                {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                            </div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase block">Página {pageIdx + 1} de {totalPages}</p>
                        </div>
                    </div>

                    {/* Grid de Productos */}
                    <div className="grid grid-cols-2 gap-4 flex-grow w-full content-start">
                        {pageProducts.map((product) => {
                            const primaryImage = (product.images && product.images.length > 0)
                                ? (product.images[0].url)
                                : product.imageUrl;

                            const imageUrl = primaryImage ? getDisplayImageUrl(primaryImage) : null;

                            return (
                                <div
                                    key={product.id}
                                    className="flex gap-3 p-3 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden w-full"
                                    style={{ height: '295px', display: 'flex', boxSizing: 'border-box', pageBreakInside: 'avoid' }}
                                >
                                    {/* Imagen */}
                                    <div className="shrink-0 bg-slate-50/50 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center relative p-2"
                                        style={{ width: '130px', height: '100%' }}>
                                        {imageUrl ? (
                                            <img src={imageUrl} alt={product.name} className="max-w-full max-h-full object-contain drop-shadow-sm mix-blend-multiply" />
                                        ) : (
                                            <div className="h-14 w-14 text-slate-200">
                                                <svg fill="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 0 002-2V6a2 0 00-2-2H6a2 0 00-2 2v12a2 0 002 2z" /></svg>
                                            </div>
                                        )}
                                        {product.status === 'promotion' && (
                                            <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-bl-lg uppercase shadow-sm">
                                                Oferta
                                            </div>
                                        )}
                                    </div>

                                    {/* Info - Estructura Flex Dinámica */}
                                    <div className="flex flex-col h-full min-w-0 flex-grow">
                                        <div className="flex-grow flex flex-col min-h-0 pb-1">
                                            {/* Name - Relaxed leading to prevent cut-off */}
                                            <h2 className="text-[15px] font-black text-slate-900 uppercase leading-[1.3] mb-2 shrink-0 pb-0.5"
                                                style={{ WebkitBoxOrient: 'vertical', WebkitLineClamp: 4, display: '-webkit-box', overflow: 'visible' }}>
                                                {product.name}
                                            </h2>
                                            {product.sku && (
                                                <p className="text-[10px] text-slate-500 font-mono font-bold leading-none mb-2 shrink-0">Ref: {product.sku}</p>
                                            )}
                                            {/* Description - Relaxed leading and padding bottom */}
                                            <div className="text-[13px] text-slate-600 italic leading-[1.4] overflow-hidden flex-grow pb-1"
                                                style={{ textOverflow: 'ellipsis' }}>
                                                <span className="line-clamp-5 block" style={{ paddingBottom: '2px' }}>
                                                    {product.description || 'Garantía de calidad.'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-2 pt-2 border-t border-slate-100 shrink-0">
                                            <p className="text-[9px] text-indigo-500 font-bold uppercase leading-none mb-0.5">Precio</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-base font-black text-indigo-700">{activeSymbol}</span>
                                                <span className="text-3xl font-black text-indigo-700 tracking-tighter leading-none pb-0.5">
                                                    {(product.price * activeRate).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer con QR */}
                    <div className="mt-auto w-full pt-3 flex justify-between items-center border-t border-slate-100 print-footer shrink-0 pb-1 overflow-visible">
                        <div className="flex gap-4 items-center">
                            {/* QR Code */}
                            <div className="bg-white p-1 rounded border border-slate-200 shadow-sm shrink-0 w-[40px] h-[40px] flex items-center justify-center">
                                <QRCodeSVG value={storeUrl} size={36} />
                            </div>

                            <div className="flex flex-col justify-center">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">{settings?.name}</p>
                                {settings?.whatsapp && <span className="text-[10px] text-green-600 font-bold flex items-center gap-1 leading-none">
                                    WhatsApp: {settings.whatsapp}
                                </span>}
                                <span className="text-[8px] text-blue-500 mt-1 underline max-w-[220px] block leading-relaxed">{storeUrl}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] text-slate-300 font-bold uppercase">Tienda Fácil Pro</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

