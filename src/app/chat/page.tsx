
"use client"

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare, HardHat } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for chat rooms
const chatRooms = [
  { id: 'general', name: 'General', icon: MessageSquare },
  { id: 'support', name: 'Soporte Técnico', icon: HardHat },
];

// Mock data for messages - will be replaced with real data from Firestore
const mockMessages = {
  general: [
    { id: 1, sender: 'Admin', text: '¡Bienvenidos al chat general!', timestamp: '10:30 AM' },
    { id: 2, sender: 'Tú', text: '¡Hola a todos!', timestamp: '10:31 AM' },
  ],
  support: [
     { id: 1, sender: 'Soporte', text: 'Hola, ¿en qué podemos ayudarte hoy?', timestamp: '11:00 AM' },
  ]
};

export default function ChatPage() {
  const [selectedRoom, setSelectedRoom] = useState(chatRooms[0]);
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;
    
    console.log(`Sending to ${selectedRoom.id}: ${newMessage}`);
    // Here we will add logic to send the message to Firestore
    
    setNewMessage("");
  };

  return (
    <Card className="h-[calc(100vh-120px)] flex flex-col">
      <CardHeader>
        <CardTitle>Centro de Comunicación</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow grid grid-cols-1 md:grid-cols-4 gap-4 h-full p-0">
        
        {/* Chat Rooms List */}
        <div className="col-span-1 border-r h-full flex flex-col">
            <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">Salas de Chat</h3>
            </div>
            <div className="flex-grow overflow-y-auto">
                {chatRooms.map(room => (
                    <div
                        key={room.id}
                        className={cn(
                            "flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50",
                            selectedRoom.id === room.id && "bg-muted"
                        )}
                        onClick={() => setSelectedRoom(room)}
                    >
                        <room.icon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{room.name}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Chat Area */}
        <div className="col-span-1 md:col-span-3 flex flex-col h-full">
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center gap-3">
                 <selectedRoom.icon className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-bold">{selectedRoom.name}</h3>
            </div>

            {/* Messages Display */}
            <div className="flex-grow p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
                <div className="flex flex-col gap-4">
                     {(mockMessages[selectedRoom.id as keyof typeof mockMessages] || []).map(msg => (
                        <div key={msg.id} className={cn("flex items-end gap-2", msg.sender === 'Tú' ? 'justify-end' : 'justify-start')}>
                           {msg.sender !== 'Tú' && (
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>{msg.sender.charAt(0)}</AvatarFallback>
                                </Avatar>
                           )}
                            <div className={cn(
                                "p-3 rounded-lg max-w-xs lg:max-w-md",
                                msg.sender === 'Tú' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            )}>
                                <p className="text-sm">{msg.text}</p>
                                <p className="text-xs text-right mt-1 opacity-70">{msg.timestamp}</p>
                            </div>
                             {msg.sender === 'Tú' && (
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>T</AvatarFallback>
                                </Avatar>
                           )}
                        </div>
                    ))}
                     <div className="text-center text-sm text-muted-foreground py-4">
                        --- Fin de los mensajes (por ahora) ---
                    </div>
                </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-background">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-grow"
                        autoComplete="off"
                    />
                    <Button type="submit" size="icon">
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
