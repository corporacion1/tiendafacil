import React from 'react';
import { Product, Store } from '@/lib/types';
import { getDisplayImageUrl } from '@/lib/utils';

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

    return (
        <div id="catalog-pdf-template" className="bg-white text-slate-900 font-sans" style={{ width: '215.9mm', margin: '0' }}>
            {pages.map((pageProducts, pageIdx) => (
                <div
                    key={pageIdx}
                    className="flex flex-col bg-white"
                    style={{
                        height: '279mm',
                        width: '215.9mm',
                        padding: '12mm',
                        pageBreakAfter: pageIdx === totalPages - 1 ? 'avoid' : 'always',
                        overflow: 'hidden',
                        position: 'relative',
                        boxSizing: 'border-box',
                        border: 'none'
                    }}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-indigo-600 relative z-10 w-full" style={{ height: '30mm' }}>
                        <div className="flex items-center gap-4">
                            {settings?.logoUrl ? (
                                <div className="h-16 w-16 bg-white rounded-xl shadow-sm border border-slate-100 p-1 flex items-center justify-center overflow-hidden">
                                    <img src={getDisplayImageUrl(settings.logoUrl)} alt="Logo" className="max-w-full max-h-full object-contain" />
                                </div>
                            ) : (
                                <div className="h-16 w-16 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-3xl shadow-md">
                                    {settings?.name?.charAt(0) || 'T'}
                                </div>
                            )}
                            <div className="max-w-[120mm]">
                                <h1 className="text-xl font-black text-slate-900 uppercase leading-tight">
                                    {settings?.name || 'Mi Negocio'}
                                </h1>
                                <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest leading-none mt-1">Catálogo Ilustrado</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="inline-block px-3 py-1 bg-slate-900 rounded text-[9px] font-black text-white uppercase mb-1">
                                {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                            </div>
                            <p className="text-[8px] text-slate-400 font-bold uppercase block">Versión Impresa</p>
                        </div>
                    </div>

                    {/* Contenedor de Grid */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-6 flex-grow relative z-10" style={{ height: '210mm' }}>
                        {pageProducts.map((product) => {
                            const primaryImage = (product.images && product.images.length > 0)
                                ? (product.images[0].url)
                                : product.imageUrl;

                            const imageUrl = primaryImage ? getDisplayImageUrl(primaryImage) : null;

                            return (
                                <div
                                    key={product.id}
                                    className="flex gap-4 p-3 rounded-2xl border border-slate-200 bg-white shadow-sm"
                                    style={{ minHeight: '66mm', display: 'flex', boxSizing: 'border-box' }}
                                >
                                    {/* Imagen */}
                                    <div className="relative w-32 h-32 shrink-0 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center">
                                        {imageUrl ? (
                                            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="h-10 w-10 text-slate-200">
                                                <svg fill="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 0 002-2V6a2 0 00-2-2H6a2 0 00-2 2v12a2 0 002 2z" /></svg>
                                            </div>
                                        )}
                                        {product.status === 'promotion' && (
                                            <div className="absolute top-0 right-0 bg-rose-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-bl-lg">OFERTA</div>
                                        )}
                                    </div>

                                    {/* Información - Sin overflow:hidden ni maxHeight restrictivos para evitar truncado en PDF */}
                                    <div className="flex flex-col justify-between py-1 min-w-0 flex-grow" style={{ height: 'auto' }}>
                                        <div>
                                            <h2 className="text-[13px] font-black text-slate-900 uppercase leading-normal mb-1">
                                                {product.name}
                                            </h2>
                                            {product.sku && (
                                                <p className="text-[9px] text-slate-400 font-mono font-bold mb-1">SKU: {product.sku}</p>
                                            )}
                                            <div className="text-[10px] text-slate-500 italic leading-normal">
                                                {product.description || 'Producto de alta calidad disponible para entrega inmediata. Garantía de satisfacción total.'}
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-2 border-t border-slate-50">
                                            <p className="text-[8px] text-indigo-500 font-black uppercase leading-none mb-1">Precio Unitario</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-[10px] font-black text-indigo-700">{activeSymbol}</span>
                                                <span className="text-2xl font-black text-indigo-700 tracking-tighter leading-none">
                                                    {(product.price * activeRate).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center relative z-10 w-full" style={{ height: '15mm' }}>
                        <div className="flex gap-4 items-center">
                            <p className="text-[9px] font-black text-slate-900 uppercase">{settings?.name}</p>
                            <span className="h-3 w-px bg-slate-200"></span>
                            {settings?.phone && <p className="text-[8px] text-slate-500 font-medium">Tél: {settings.phone}</p>}
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-slate-900">
                                {pageIdx + 1} / {totalPages}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
