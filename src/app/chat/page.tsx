
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function ChatPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chat</CardTitle>
        <CardDescription>
          Comunícate con clientes y miembros del equipo en tiempo real.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-12 border-2 border-dashed rounded-lg">
            <MessageSquare className="h-16 w-16 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Página de Chat en Construcción</h2>
            <p>¡Estamos preparando todo para que puedas chatear!</p>
            <p className="text-sm mt-1">Próximamente podrás ver aquí tus conversaciones.</p>
        </div>
      </CardContent>
    </Card>
  );
}
