
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
          <CardDescription>
            Aquí podrás configurar todos los aspectos de tu aplicación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>La página de configuración se ha cargado correctamente. Ahora podemos reconstruir la funcionalidad.</p>
        </CardContent>
      </Card>
    </div>
  );
}
