'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function TestPage() {
  const { user, token, loading, logout } = useAuth();

  if (loading) {
    return <div>Cargando sesión...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>🧪 TEST DE AUTENTICACIÓN</h1>
      {user ? (
        <>
          <p>✅ Usuario: {user.name}</p>
          <p>📧 Email: {user.email}</p>
          <button onClick={logout}>Cerrar sesión</button>
        </>
      ) : (
        <p>❌ No hay usuario activo. <a href="/login">Inicia sesión</a></p>
      )}
    </div>
  );
}