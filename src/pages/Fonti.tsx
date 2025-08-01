import { useState } from "react";
import { FonteCard } from "@/components/FonteCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Fonte {
  id: string;
  nome: string;
  tipo: "carta" | "contanti" | "digitale";
  saldo: number;
  ubicazione?: string;
  codice?: string;
}

const mockFonti: Fonte[] = [
  { id: "1", nome: "PostePay", tipo: "carta", saldo: 250.50, codice: "****1234" },
  { id: "2", nome: "Hype", tipo: "digitale", saldo: 120.00 },
  { id: "3", nome: "Portafoglio", tipo: "contanti", saldo: 45.20, ubicazione: "Tasca destra" },
  { id: "4", nome: "Salvadanaio Camera", tipo: "contanti", saldo: 85.75, ubicazione: "Camera da letto" },
  { id: "5", nome: "Cassetto Cucina", tipo: "contanti", saldo: 15.30, ubicazione: "Primo cassetto" },
];

const Fonti = () => {
  const [fonti, setFonti] = useState<Fonte[]>(mockFonti);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFonte, setEditingFonte] = useState<Fonte | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "" as "carta" | "contanti" | "digitale" | "",
    saldo: "",
    ubicazione: "",
    codice: "",
  });

  const filteredFonti = fonti.filter(fonte =>
    fonte.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fonte.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      nome: "",
      tipo: "",
      saldo: "",
      ubicazione: "",
      codice: "",
    });
    setEditingFonte(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.tipo || !formData.saldo) {
      toast({
        title: "Errore",
        description: "Compila tutti i campi obbligatori",
        variant: "destructive",
      });
      return;
    }

    const nuovaFonte: Fonte = {
      id: editingFonte?.id || Date.now().toString(),
      nome: formData.nome,
      tipo: formData.tipo as "carta" | "contanti" | "digitale",
      saldo: parseFloat(formData.saldo),
      ubicazione: formData.ubicazione || undefined,
      codice: formData.codice || undefined,
    };

    if (editingFonte) {
      setFonti(prev => prev.map(f => f.id === editingFonte.id ? nuovaFonte : f));
      toast({
        title: "Fonte aggiornata",
        description: `${nuovaFonte.nome} è stata aggiornata con successo`,
      });
    } else {
      setFonti(prev => [...prev, nuovaFonte]);
      toast({
        title: "Fonte aggiunta",
        description: `${nuovaFonte.nome} è stata aggiunta con successo`,
      });
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (fonte: Fonte) => {
    setEditingFonte(fonte);
    setFormData({
      nome: fonte.nome,
      tipo: fonte.tipo,
      saldo: fonte.saldo.toString(),
      ubicazione: fonte.ubicazione || "",
      codice: fonte.codice || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (fonte: Fonte) => {
    setFonti(prev => prev.filter(f => f.id !== fonte.id));
    toast({
      title: "Fonte eliminata",
      description: `${fonte.nome} è stata eliminata`,
    });
  };

  const patrimonioTotale = fonti.reduce((acc, fonte) => acc + fonte.saldo, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestione Fonti</h1>
            <p className="text-muted-foreground">
              Gestisci le tue fonti di denaro e monitora i saldi
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Aggiungi Fonte
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingFonte ? "Modifica Fonte" : "Aggiungi Nuova Fonte"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="es. PostePay, Portafoglio principale..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select 
                    value={formData.tipo} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona il tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="carta">Carta</SelectItem>
                      <SelectItem value="digitale">Digitale</SelectItem>
                      <SelectItem value="contanti">Contanti</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="saldo">Saldo Iniziale *</Label>
                  <Input
                    id="saldo"
                    type="number"
                    step="0.01"
                    value={formData.saldo}
                    onChange={(e) => setFormData(prev => ({ ...prev, saldo: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <Label htmlFor="ubicazione">Ubicazione</Label>
                  <Input
                    id="ubicazione"
                    value={formData.ubicazione}
                    onChange={(e) => setFormData(prev => ({ ...prev, ubicazione: e.target.value }))}
                    placeholder="es. Camera da letto, Tasca giacca..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="codice">Codice/Numero</Label>
                  <Input
                    id="codice"
                    value={formData.codice}
                    onChange={(e) => setFormData(prev => ({ ...prev, codice: e.target.value }))}
                    placeholder="es. ****1234"
                  />
                </div>
                
                <div className="flex space-x-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingFonte ? "Aggiorna" : "Aggiungi"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Annulla
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <Card className="bg-gradient-wealth shadow-wealth text-white">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-white/80 text-sm font-medium">Patrimonio Totale</p>
              <p className="text-3xl font-bold">€ {patrimonioTotale.toFixed(2)}</p>
              <p className="text-white/70 text-sm">{fonti.length} fonti attive</p>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per nome o tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Fonti Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFonti.map((fonte) => (
            <FonteCard
              key={fonte.id}
              nome={fonte.nome}
              tipo={fonte.tipo}
              saldo={fonte.saldo}
              ubicazione={fonte.ubicazione}
              codice={fonte.codice}
              onEdit={() => handleEdit(fonte)}
              onDelete={() => handleDelete(fonte)}
            />
          ))}
        </div>

        {filteredFonti.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground text-lg">
                {searchTerm ? "Nessuna fonte trovata" : "Nessuna fonte configurata"}
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                {searchTerm ? "Prova a modificare il termine di ricerca" : "Aggiungi la tua prima fonte per iniziare"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Fonti;