import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

export default function AnamnesisForm() {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [clientData, setClientData] = useState<any>(null);

    const [formData, setFormData] = useState({
        birth_date: "",
        discovery_source: "",
        diabetes: false,
        hepatitis: false,
        pregnancy: false,
        bleeding_disorders: false,
        keloids: false,
        allergies: "",
        medications: "",
        emergency_contact: "",
        agreed_to_terms: false
    });

    useEffect(() => {
        const fetchClient = async () => {
            if (!clientId) return;

            try {
                // First check if an anamnesis already exists
                const { data: existingData } = await supabase
                    .from("nx_anamnesis")
                    .select("id")
                    .eq("client_id", clientId)
                    .single();

                if (existingData) {
                    setSuccess(true);
                    setLoading(false);
                    return;
                }

                // Fetch client basic info to show on the page
                const { data: client, error } = await supabase
                    .from("nx_clients")
                    .select("id, name, user_id")
                    .eq("id", clientId)
                    .single();

                if (error || !client) {
                    setErrorMsg("Cliente não encontrado ou link inválido.");
                } else {
                    setClientData(client);
                }
            } catch (err) {
                console.error("Error fetching client:", err);
                setErrorMsg("Erro ao carregar os dados.");
            } finally {
                setLoading(false);
            }
        };

        fetchClient();
    }, [clientId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.agreed_to_terms) {
            alert("Você preisa ler e concordar com os termos de serviço para continuar.");
            return;
        }

        if (!formData.birth_date || !formData.discovery_source) {
            alert("Por favor, preencha sua data de nascimento e nos conte como conheceu nosso trabalho.");
            return;
        }

        try {
            setSubmitting(true);

            // Calculate age from birth date
            const birthDate = new Date(formData.birth_date);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            // 1. Update client age
            const { error: clientError } = await supabase
                .from('nx_clients')
                .update({ age: age })
                .eq('id', clientData.id);

            if (clientError) throw clientError;

            const medicalHistory = {
                diabetes: formData.diabetes,
                hepatitis: formData.hepatitis,
                pregnancy: formData.pregnancy,
                bleeding_disorders: formData.bleeding_disorders,
                keloids: formData.keloids,
            };

            const { error } = await supabase
                .from("nx_anamnesis")
                .insert({
                    client_id: clientData.id,
                    user_id: clientData.user_id, // Link to the tatuador
                    medical_history: medicalHistory,
                    allergies: formData.allergies,
                    medications: formData.medications,
                    emergency_contact: formData.emergency_contact,
                    discovery_source: formData.discovery_source,
                    birth_date: formData.birth_date,
                    has_contract_signed: true,
                    signed_at: new Date().toISOString()
                });

            if (error) throw error;

            setSuccess(true);
        } catch (err: any) {
            console.error("Error saving anamnesis:", err);
            alert("Erro ao salvar o formulário: " + (err.message || "Tente novamente."));
        } finally {
            setSubmitting(false);
        }
    };

    const handleCheckboxChange = (field: keyof typeof formData) => {
        setFormData(prev => ({ ...prev, [field]: !prev[field] }));
    };

    if (loading) {
        return (
            <div className="flex-1 w-full min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent animate-spin rounded-full"></div>
                <p className="mt-4 text-muted-foreground font-medium">Carregando formulário...</p>
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className="flex-1 w-full min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="bg-destructive/10 text-destructive p-6 rounded-xl max-w-md w-full text-center border border-destructive/20 shadow-lg">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Ops! Alguma coisa deu errado.</h2>
                    <p className="text-sm">{errorMsg}</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex-1 w-full min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="bg-card text-foreground p-8 rounded-2xl max-w-md w-full text-center border shadow-xl">
                    <div className="h-20 w-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="h-10 w-10 text-success" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Formulário Concluído!</h2>
                    <p className="text-muted-foreground mb-8">
                        Sua ficha de anamnese e contrato foram preenchidos com sucesso e já estão no sistema do estúdio.
                    </p>
                    <p className="text-sm font-semibold opacity-70">
                        Muito obrigado, e até a sua sessão!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 w-full min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto space-y-8">

                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Ficha de Anamnese & Contrato</h1>
                    <p className="text-muted-foreground">Preencha com atenção para a sua própria segurança durante o procedimento.</p>
                </div>

                <div className="bg-card border shadow-xl rounded-2xl overflow-hidden text-left">
                    <div className="p-6 bg-accent/20 border-b">
                        <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-1">Cliente</p>
                        <p className="font-bold text-lg">{clientData?.name}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-10">

                        {/* Secção Geral */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold border-b pb-2">1. Informações Pessoais</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="birth_date" className="font-bold">Data de Nascimento</Label>
                                    <Input
                                        id="birth_date"
                                        type="date"
                                        value={formData.birth_date}
                                        onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                                        className="bg-accent/10"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="discovery_source" className="font-bold">Como conheceu meu trabalho?</Label>
                                    <Input
                                        id="discovery_source"
                                        placeholder="Ex: Instagram, indicação de amigo..."
                                        value={formData.discovery_source}
                                        onChange={(e) => setFormData({ ...formData, discovery_source: e.target.value })}
                                        className="bg-accent/10"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Secção Clínica */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold border-b pb-2">2. Histórico Clínico</h3>
                            <p className="text-sm text-muted-foreground mb-4">Marque apenas o que se aplicar a você:</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { id: "diabetes", label: "Diabetes" },
                                    { id: "hepatitis", label: "Hepatite" },
                                    { id: "pregnancy", label: "Gestante ou Lactante" },
                                    { id: "bleeding_disorders", label: "Problemas de Coagulação" },
                                    { id: "keloids", label: "Tendência a Queloide" }
                                ].map((item) => (
                                    <label key={item.id} className="flex items-start gap-3 p-3 rounded-lg border border-accent/30 hover:bg-accent/10 cursor-pointer transition-colors">
                                        <Checkbox
                                            id={item.id}
                                            checked={formData[item.id as keyof typeof formData] as boolean}
                                            onCheckedChange={() => handleCheckboxChange(item.id as keyof typeof formData)}
                                            className="mt-0.5"
                                        />
                                        <span className="text-sm font-medium leading-none">{item.label}</span>
                                    </label>
                                ))}
                            </div>

                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="allergies" className="font-bold">Alergias (Medicamentos, cosméticos, pigmentos, etc)</Label>
                                    <Textarea
                                        id="allergies"
                                        placeholder="Se não tiver, deixe em branco"
                                        value={formData.allergies}
                                        onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                                        className="bg-accent/10 resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="medications" className="font-bold">Uso contínuo de medicamentos?</Label>
                                    <Textarea
                                        id="medications"
                                        placeholder="Quais? (Se não usar, deixe em branco)"
                                        value={formData.medications}
                                        onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                                        className="bg-accent/10 resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="emergency_contact" className="font-bold">Contato de Emergência (Nome e Telefone)</Label>
                                    <Input
                                        id="emergency_contact"
                                        placeholder="Ex: Maria (11) 99999-9999"
                                        value={formData.emergency_contact}
                                        onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                                        className="bg-accent/10"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Secção Contrato */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold border-b pb-2">3. Termos de Serviço e Contrato</h3>

                            <div className="bg-accent/10 p-4 rounded-lg text-sm text-muted-foreground h-48 overflow-y-auto space-y-4 border border-accent/20">
                                <p>
                                    <strong>1. DECLARAÇÃO DE SAÚDE:</strong> Declaro sob minha responsabilidade que as informações de saúde acima são verdadeiras. Isento o profissional de qualquer responsabilidade caso tenha omitido informações vitais sobre minha saúde.
                                </p>
                                <p>
                                    <strong>2. PROCEDIMENTO:</strong> Estou ciente de que a tatuagem é um procedimento definitivo e irreversível. Autorizo o profissional a realizar a arte escolhida e previamente aprovada por mim em estêncil/desenho.
                                </p>
                                <p>
                                    <strong>3. CUIDADOS PÓS-TATUAGEM:</strong> Comprometo-me a seguir rigorosamente os cuidados de cicatrização instruídos pelo tatuador (limpeza, pomada, não arrancar cascas, evitar sol, praia, piscina e alimentos remosos). O não cumprimento isenta o tatuador de garantir o retoque gratuito em caso de falha de cicatrização causada por maus cuidados.
                                </p>
                                <p>
                                    <strong>4. DIREITOS DE IMAGEM:</strong> Autorizo, de forma gratuita, o uso de fotografias ou vídeos da tatuagem realizada para fins de portfólio e divulgação nas redes sociais do tatuador.
                                </p>
                            </div>

                            <label className="flex items-start gap-4 p-4 rounded-xl border-2 border-primary/20 bg-primary/5 cursor-pointer">
                                <Checkbox
                                    id="agreed_to_terms"
                                    checked={formData.agreed_to_terms}
                                    onCheckedChange={() => handleCheckboxChange('agreed_to_terms')}
                                    className="mt-1 h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                />
                                <div className="space-y-1 leading-none">
                                    <span className="text-base font-bold text-foreground">Li e concordo com os termos de serviço</span>
                                    <p className="text-xs text-muted-foreground">Esta caixa vale como uma assinatura digital, validando meu consentimento com as regras e cuidados apresentados acima.</p>
                                </div>
                            </label>

                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-lg font-bold shadow-xl"
                            disabled={submitting || !formData.agreed_to_terms}
                        >
                            {submitting ? "Enviando..." : "Confirmar e Enviar Ficha"}
                        </Button>

                    </form>
                </div>
            </div>
        </div>
    );
}
