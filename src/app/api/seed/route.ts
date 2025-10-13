
import { NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';

// This is a simplified version of the server-side seed logic.
// In a real app, you would use environment variables for service account keys.

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

if (!getApps().length) {
    if (serviceAccount) {
        initializeApp({
            credential: credential.cert(serviceAccount),
        });
    } else {
        // Fallback for environments without the service account env var
        initializeApp();
    }
}

const db = getFirestore();

async function seedDatabase(storeId: string) {
    // This is a placeholder for your actual seeding logic from `src/lib/data.ts`.
    // In a real scenario, you'd import your mock data and create documents.
    const batch = db.batch();
    
    // Example: create a store document
    const storeRef = db.collection('stores').doc(storeId);
    batch.set(storeRef, {
        id: storeId,
        name: "Tienda Facil DEMO (Sembrada)",
        ownerId: "SUPER_ADMIN_UID_PLACEHOLDER", // Replace with actual super admin UID
        businessType: "Tecnologia",
        status: 'active',
        useDemoData: true,
        createdAt: new Date().toISOString(),
    });

    // You would repeat this for products, customers, etc., using your mock data.
    
    await batch.commit();
}


export async function POST(request: Request) {
  try {
    const { storeId } = await request.json();
    if (!storeId) {
      return NextResponse.json({ message: 'storeId is required' }, { status: 400 });
    }

    // In a real app, you would import and run your full seeding logic here.
    // For this example, we'll call a simplified version.
    await seedDatabase(storeId);

    return NextResponse.json({ message: 'Database seeded successfully' }, { status: 200 });
  } catch (error) {
    console.error('API Seed Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
