
"use client"

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare, HardHat } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase";
import type { ChatMessage } from "@/lib/types";
import { format, subMinutes } from "date-fns";

const chatRooms = [
  { id: 'general', name: 'General', icon: MessageSquare },
  { id: 'support', name: 'Soporte Técnico', icon: HardHat },
];

const mockMessages: { [key: string]: ChatMessage[] } = {
    general: [
        { id: 'msg-g1', chatId: 'general', senderId: 'other-user-1', senderName: 'Alice', text: '¡Hola a todos! ¿Cómo va la semana?', timestamp: subMinutes(new Date(), 10).toISOString() },
        { id: 'msg-g2', chatId: 'general', senderId: 'demo-user-id', senderName: 'Usuario Demo', text: '¡Hola Alice! Todo bien por aquí, preparando todo para el fin de semana.', timestamp: subMinutes(new Date(), 8).toISOString() },
        { id: 'msg-g3', chatId: 'general', senderId: 'other-user-2', senderName: 'Bob', text: 'Genial, ¿alguien tiene planes interesantes?', timestamp: subMinutes(new Date(), 5).toISOString() },
    ],
    support: [
        { id: 'msg-s1', chatId: 'support', senderId: 'other-user-3', senderName: 'Carlos', text: 'Buenos días, tengo un problema con la impresora de tickets.', timestamp: subMinutes(new Date(), 15).toISOString() },
    ]
}

export default function ChatPage() {
  const { user } = useUser();

  const [selectedRoom, setSelectedRoom] = useState(chatRooms[0]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages[selectedRoom.id]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
        setMessages(mockMessages[selectedRoom.id]);
        setIsLoading(false);
    }, 300);
  }, [selectedRoom]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !user) return;

    const messageData: ChatMessage = {
      id: `msg-${Date.now()}`,
      chatId: selectedRoom.id,
      text: newMessage,
      senderId: user.uid,
      senderName: user.displayName || user.email || "Usuario Anónimo",
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, messageData]);
    mockMessages[selectedRoom.id].push(messageData); // Persist in mock data
    setNewMessage("");
  };

  const formatTimestamp = (timestamp: string | null | undefined) => {
    if (!timestamp) return "";
    try {
        return format(new Date(timestamp), "HH:mm");
    } catch {
        return "";
    }
  }

  return (
    <Card className="h-[calc(100vh-120px)] flex flex-col">
      <CardHeader>
        <CardTitle>Centro de Comunicación</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow grid grid-cols-1 md:grid-cols-4 gap-4 h-full p-0">
        
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

        <div className="col-span-1 md:col-span-3 flex flex-col h-full">
            <div className="p-4 border-b flex items-center gap-3">
                 <selectedRoom.icon className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-bold">{selectedRoom.name}</h3>
            </div>

            <div className="flex-grow p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
                <div className="flex flex-col gap-4">
                     {isLoading && <p className="text-center text-muted-foreground">Cargando...</p>}
                     {!isLoading && messages.map(msg => (
                        <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === user?.uid ? 'justify-end' : 'justify-start')}>
                           {msg.senderId !== user?.uid && (
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>{msg.senderName ? msg.senderName.charAt(0) : 'U'}</AvatarFallback>
                                </Avatar>
                           )}
                            <div className={cn(
                                "p-3 rounded-lg max-w-xs lg:max-w-md",
                                msg.senderId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            )}>
                                <p className="text-sm">{msg.text}</p>
                                <p className="text-xs text-right mt-1 opacity-70">{formatTimestamp(msg.timestamp)}</p>
                            </div>
                             {msg.senderId === user?.uid && user && (
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>{user.displayName ? user.displayName.charAt(0) : 'T'}</AvatarFallback>
                                </Avatar>
                           )}
                        </div>
                    ))}
                     {!isLoading && messages?.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground py-4">
                            Aún no hay mensajes en esta sala. ¡Sé el primero!
                        </div>
                     )}
                     <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="p-4 border-t bg-background">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={"Escribe un mensaje..."}
                        className="flex-grow"
                        autoComplete="off"
                    />
                    <Button type="submit" size="icon" disabled={newMessage.trim() === ''}>
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
