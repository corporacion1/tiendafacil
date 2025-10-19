'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { testToast } from '@/components/ui/simple-toast';

export default function LoginTestPage() {
  const [email, setEmail] = useState('demo@tiendafacil.com');
  const [password, setPassword] = useState('user1234');
  const [loading, setLoading] = useState(false);
  const { login, user, token } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    console.log('🧪 [Login Test] Iniciando test de login...');
    console.log('🧪 [Login Test] Email:', email);
    console.log('🧪 [Login Test] Password:', password);
    
    try {
      await login(email, password);
      console.log('🎉 [Login Test] Login completado exitosamente');
    } catch (error) {
      console.error('💥 [Login Test] Error en login:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Test de Login</CardTitle>
          <CardDescription>
            Página de prueba para debuggear el login
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <div className="space-y-2">
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <h3 className="font-semibold text-green-800">✅ Login Exitoso</h3>
                <p className="text-sm text-green-600">Email: {user.email}</p>
                <p className="text-sm text-green-600">Rol: {user.role}</p>
                <p className="text-sm text-green-600">Token: {token ? 'Presente' : 'Ausente'}</p>
              </div>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="w-full"
              >
                Reiniciar Test
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">🧪 Tests Rápidos de Error</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEmail('usuario_inexistente@test.com');
                      setPassword('cualquier_password');
                    }}
                  >
                    Usuario Inexistente
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEmail('demo@tiendafacil.com');
                      setPassword('password_incorrecto');
                    }}
                  >
                    Contraseña Incorrecta
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEmail('');
                      setPassword('user1234');
                    }}
                  >
                    Email Vacío
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEmail('demo@tiendafacil.com');
                      setPassword('');
                    }}
                  >
                    Contraseña Vacía
                  </Button>
                </div>
              </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="demo@tiendafacil.com"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Contraseña</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="user1234"
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>
            </div>
          )}
          
          <div className="space-y-2">
            <Button 
              onClick={testToast}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              🧪 Probar Toast
            </Button>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Instrucciones:</strong></p>
              <p>1. Abre la consola del navegador (F12)</p>
              <p>2. Prueba el toast primero</p>
              <p>3. Usa los botones de test rápido o ingresa credenciales</p>
              <p>4. Haz clic en "Iniciar Sesión"</p>
              <p>5. Revisa los logs detallados en la consola</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}