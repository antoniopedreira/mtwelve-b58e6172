import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types";
import { toast } from "sonner";
import { Loader2, MapPin, School } from "lucide-react"; // Adicionei ícones úteis
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Adicione as props na interface
interface PipelineBoardProps {
  onClientMoveToFechado: (client: Client) => void;
  searchTerm?: string; // Novo
  nationalityFilter?: string; // Novo
}

const COLUMNS = [
  { id: "radar", title: "Radar / Prospecção", color: "bg-blue-500/10 text-blue-500" },
  { id: "contato", title: "Em Contato", color: "bg-yellow-500/10 text-yellow-500" },
  { id: "negociacao", title: "Negociação", color: "bg-purple-500/10 text-purple-500" },
  { id: "fechado", title: "Fechado / Assinado", color: "bg-green-500/10 text-green-500" },
  { id: "perdido", title: "Perdido", color: "bg-red-500/10 text-red-500" },
];

export function PipelineBoard({ onClientMoveToFechado, searchTerm = "", nationalityFilter = "" }: PipelineBoardProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  // Busca todos os clientes
  const fetchClients = async () => {
    try {
      const { data, error } = await supabase.from("clients").select("*").order("updated_at", { ascending: false });

      if (error) throw error;
      setClients(data as Client[]);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      toast.error("Erro ao carregar o pipeline.");
    } finally {
      setIsLoading(false);
    }
  };

  // Lógica de Filtro (Nome e Nacionalidade)
  const filteredClients = clients.filter((client) => {
    const matchesName = client.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesNationality = nationalityFilter
      ? client.nationality?.toLowerCase().includes(nationalityFilter.toLowerCase())
      : true;

    return matchesName && matchesNationality;
  });

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) return;

    const updatedClients = clients.map((client) => {
      if (client.id === draggableId) {
        return { ...client, stage: destination.droppableId };
      }
      return client;
    });

    setClients(updatedClients);

    const clientMoved = clients.find((c) => c.id === draggableId);
    if (clientMoved && destination.droppableId === "fechado") {
      onClientMoveToFechado(clientMoved);
    }

    try {
      const { error } = await supabase.from("clients").update({ stage: destination.droppableId }).eq("id", draggableId);

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao atualizar estágio:", error);
      toast.error("Erro ao mover card.");
      fetchClients();
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex h-[calc(100vh-220px)] overflow-x-auto gap-4 pb-4">
        {COLUMNS.map((column) => {
          // Filtra os clientes para a coluna específica usando a lista JÁ FILTRADA pelos inputs
          const columnClients = filteredClients.filter((client) => client.stage === column.id);

          return (
            <div key={column.id} className="flex-shrink-0 w-80 flex flex-col">
              <div
                className={`p-3 rounded-t-lg font-semibold flex justify-between items-center ${column.color} bg-opacity-20`}
              >
                <span>{column.title}</span>
                <Badge variant="secondary" className="bg-background/50">
                  {columnClients.length}
                </Badge>
              </div>

              <div className="bg-muted/30 flex-1 rounded-b-lg border border-t-0 border-border/50 p-2">
                <Droppable droppableId={column.id}>
                  {(provided) => (
                    <ScrollArea className="h-full">
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 min-h-[100px]">
                        {columnClients.map((client, index) => (
                          <Draggable key={client.id} draggableId={client.id} index={index}>
                            {(provided) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors bg-card"
                              >
                                <CardContent className="p-4 space-y-3">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border border-border">
                                      <AvatarImage src={client.avatar_url || ""} />
                                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                        {client.name.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <h4 className="font-semibold text-sm leading-none">{client.name}</h4>
                                      <span className="text-xs text-muted-foreground mt-1 block">
                                        {client.nationality || "Nacionalidade n/a"}
                                      </span>
                                    </div>
                                  </div>

                                  {client.school && (
                                    <div className="flex flex-col gap-1 text-xs text-muted-foreground pt-1">
                                      {client.school && (
                                        <div className="flex items-center gap-1.5">
                                          <School className="h-3 w-3" />
                                          <span className="truncate max-w-[200px]">{client.school}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </ScrollArea>
                  )}
                </Droppable>
              </div>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
