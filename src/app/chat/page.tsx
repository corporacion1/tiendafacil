
"use client"

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare, HardHat } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, Timestamp, doc, setDoc } from "firebase/firestore";
import type { ChatMessage } from "@/lib/types";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

// Static data for chat rooms
const chatRooms = [
  { id: 'general', name: 'General', icon: MessageSquare },
  { id: 'support', name: 'Soporte Técnico', icon: HardHat },
];

export default function ChatPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedRoom, setSelectedRoom] = useState(chatRooms[0]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Memoize the query to prevent re-renders, and wait for user and firestore.
  const messagesQuery = useMemoFirebase(() => {
    // CRITICAL: We must wait for auth to resolve and a user to be present.
    if (!firestore || isUserLoading || !user) return null;
    return query(collection(firestore, "chats", selectedRoom.id, "messages"), orderBy("timestamp", "asc"));
  }, [firestore, selectedRoom.id, user, isUserLoading]);

  const { data: messages, isLoading } = useCollection<ChatMessage>(messagesQuery);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Ensure chat rooms exist in Firestore, only after user is authenticated
  useEffect(() => {
    if (!firestore || isUserLoading || !user) return; // Wait for both firestore and user
    const ensureRooms = async () => {
        console.log("User authenticated, ensuring chat rooms exist in Firestore.");
        for (const room of chatRooms) {
            const roomRef = doc(firestore, 'chats', room.id);
            // Use setDoc with merge to create without overwriting if it exists
            await setDoc(roomRef, { name: room.name }, { merge: true });
        }
    };
    ensureRooms();
  }, [firestore, user, isUserLoading]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !user || !firestore) return;

    const messagesColRef = collection(firestore, "chats", selectedRoom.id, "messages");
    const messageData = {
      text: newMessage,
      senderId: user.uid,
      senderName: user.displayName || user.email || "Usuario Anónimo",
      timestamp: serverTimestamp(),
    };
    
    setNewMessage("");

    try {
        await addDoc(messagesColRef, messageData);
    } catch (error: any) {
        console.error("Error sending message: ", error);
        toast({
            variant: "destructive",
            title: "Error al enviar mensaje",
            description: error.message || "No se pudo enviar el mensaje debido a un error de permisos.",
        });
    }
  };

  const formatTimestamp = (timestamp: Timestamp | string | null | undefined) => {
    if (!timestamp) return "";
    if (timestamp instanceof Timestamp) {
      return format(timestamp.toDate(), "HH:mm");
    }
    // Fallback for locally created optimistic updates, though serverTimestamp is preferred
    if (typeof timestamp === 'string') {
        try {
            return format(new Date(timestamp), "HH:mm");
        } catch {
            return "";
        }
    }
    return "";
  }

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
                     {isLoading && <p className="text-center text-muted-foreground">Cargando mensajes...</p>}
                     {!isLoading && messages && messages.map(msg => (
                        <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === user?.uid ? 'justify-end' : 'justify-start')}>
                           {msg.senderId !== user?.uid && (
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
                                </Avatar>
                           )}
                            <div className={cn(
                                "p-3 rounded-lg max-w-xs lg:max-w-md",
                                msg.senderId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            )}>
                                <p className="text-sm">{msg.text}</p>
                                <p className="text-xs text-right mt-1 opacity-70">{formatTimestamp(msg.timestamp)}</p>
                            </div>
                             {msg.senderId === user?.uid && (
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

            {/* Message Input */}
            <div className="p-4 border-t bg-background">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={user ? "Escribe un mensaje..." : "Inicia sesión para chatear"}
                        className="flex-grow"
                        autoComplete="off"
                        disabled={!user}
                    />
                    <Button type="submit" size="icon" disabled={!user || newMessage.trim() === ''}>
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
