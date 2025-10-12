
import { getStoreData } from '@/firebase/server';
import CatalogClientPage from './client-page';
import { notFound } from 'next/navigation';

export const revalidate = 60; // Revalidate data every 60 seconds

type CatalogPageProps = {
    params: {
        storeId: string;
    }
}

export default async function CatalogPage({ params }: CatalogPageProps) {
    const { storeId } = params;

    if (!storeId) {
        notFound();
    }
    
    // Fetch data on the server
    const { storeSettings, products, ads } = await getStoreData(storeId);
    
    // If the store doesn't exist (or is inactive for public view), you might want to handle it
    if (!storeSettings) {
        // You can return a notFound() or a custom "Store not available" page
        return <div className="flex items-center justify-center min-h-screen">Tienda no encontrada o no disponible.</div>;
    }

    return (
        <CatalogClientPage 
            serverStoreSettings={storeSettings}
            serverProducts={products}
            serverAds={ads}
        />
    );
}
