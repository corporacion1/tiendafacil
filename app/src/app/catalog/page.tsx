
import CatalogClientPage from './client-page';
import { notFound } from 'next/navigation';
import { defaultStore, mockProducts, mockAds } from '@/lib/data';

// This makes the page static by default, but allows for revalidation.
// It will fetch data at build time and then re-fetch periodically.
export const revalidate = 60; // Revalidate data every 60 seconds

type CatalogPageProps = {
    params: {
        storeId?: string; // Made optional
    }
}

export default async function CatalogPage({ params }: CatalogPageProps) {
    // Since this is the main catalog page, we always use default data for now.
    const storeId = params.storeId || 'default';
    
    // Using local data instead of fetching from Firebase server
    // This simulates fetching data for a specific store
    const storeSettings = { ...defaultStore, id: storeId };
    const products = mockProducts.map(p => ({ ...p, storeId, createdAt: new Date().toISOString() }));
    const ads = mockAds.map(ad => ({ ...ad, createdAt: new Date().toISOString() }));

    return (
        <CatalogClientPage 
            serverStoreSettings={storeSettings}
            serverProducts={products}
            serverAds={ads}
        />
    );
}
