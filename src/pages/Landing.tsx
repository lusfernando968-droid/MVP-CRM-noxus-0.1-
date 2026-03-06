import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, CheckCircle2, ChevronRight, DollarSign, FileText, Star, Zap, Check, LayoutDashboard, Users, ShieldCheck, Image as ImageIcon, HelpCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";

export default function Landing() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("agenda");

    // Auto-play para as Tabs de tour do sistema
    useEffect(() => {
        const tabs = ["agenda", "anamnese", "financeiro", "clientes"];
        const interval = setInterval(() => {
            setActiveTab((current) => {
                const currentIndex = tabs.indexOf(current);
                const nextIndex = (currentIndex + 1) % tabs.length;
                return tabs[nextIndex];
            });
        }, 5000); // Muda a cada 5 segundos

        return () => clearInterval(interval);
    }, []);

    const handleStart = () => {
        navigate("/auth");
    };

    const handleWhatsApp = () => {
        window.open("https://api.whatsapp.com/send?phone=YOUR_PHONE_NUMBER&text=Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20o%20Noxus%20Gest%C3%A3o%20para%20Tatuadores.", "_blank");
    };

    return (
        <div className="min-h-screen w-full bg-[#050505] text-slate-50 font-sans overflow-x-hidden selection:bg-primary/30">

            {/* Navbar Minimalista */}
            <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 flex items-center justify-center">
                            <img src="/logo-app-noxus.png" alt="Noxus Logo" className="h-full w-auto object-contain filter drop-shadow-md" />
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
                        <a href="#features" className="hover:text-white transition-colors">Recursos</a>
                        <a href="#testimonials" className="hover:text-white transition-colors">Depoimentos</a>
                        <a href="#pricing" className="hover:text-white transition-colors">Planos</a>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" className="hidden md:flex text-slate-300 hover:text-white hover:bg-white/5" onClick={handleStart}>
                            Entrar
                        </Button>
                        <Button className="bg-gradient-to-r from-primary to-blue-600 hover:to-primary text-white font-semibold rounded-full px-6 shadow-lg shadow-primary/25 border border-primary/20 transition-all border-t-blue-400/50" onClick={handleStart}>
                            Começar Agora
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 md:pt-52 md:pb-32 px-6">
                <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[130px] opacity-70 pointer-events-none" />
                <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[100px] opacity-50 pointer-events-none" />

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-semibold text-primary mb-8 shadow-xl shadow-primary/10 backdrop-blur-md"
                    >
                        <span className="flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_12px_rgba(var(--primary),1)]" />
                        O sistema definitivo para Tatuadores Profissionais
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] text-white"
                    >
                        Sua arte merece uma <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-300 drop-shadow-sm">
                            gestão à altura.
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed font-light"
                    >
                        Diga adeus à bagunça no WhatsApp e planilhas confusas. Controle sua agenda, financeiro e fichas de anamnese em um único lugar, bonito e absurdamente rápido.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col items-center justify-center gap-6"
                    >
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                            <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full bg-gradient-to-r from-primary to-blue-600 shadow-2xl shadow-primary/30 group hover:scale-[1.03] transition-all border border-t-blue-400/50 text-white" onClick={handleStart}>
                                Testar Sistema <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full bg-white/5 border-white/10 hover:bg-white/10 hover:text-white" onClick={handleWhatsApp}>
                                Falar com Vendas
                            </Button>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-slate-400 mt-4 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className={`h-8 w-8 rounded-full border-2 border-[#050505] bg-zinc-800 flex items-center justify-center z-[${5 - i}] overflow-hidden`}>
                                        <UserAvatarPlaceholder index={i} />
                                    </div>
                                ))}
                            </div>
                            <p>
                                <span className="text-amber-400 font-bold flex items-center gap-1 inline-flex"><Star className="h-3 w-3 fill-amber-400" /> 5.0</span>
                                <span className="mx-2">•</span>
                                Junte-se a <strong>+120 tatuadores</strong> de ponta
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Dashboard Mockup Showcase */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.5 }}
                    className="max-w-6xl mx-auto mt-24 relative"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[rgba(5,5,5,0.4)] to-transparent z-10 h-full w-full pointer-events-none" />
                    <div className="absolute inset-x-20 -inset-y-5 bg-gradient-to-b from-primary/40 via-blue-600/10 to-transparent blur-3xl opacity-60 z-0 rounded-full"></div>
                    <div className="relative rounded-2xl md:rounded-[2rem] border border-white/10 overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.6)] bg-card z-10">
                        {/* Fake Mac Toolbar */}
                        <div className="h-10 bg-[#0f0f11] border-b border-white/5 flex items-center px-4 gap-2">
                            <div className="flex gap-2">
                                <div className="h-3 w-3 rounded-full bg-red-500/80 shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
                                <div className="h-3 w-3 rounded-full bg-amber-500/80 shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
                                <div className="h-3 w-3 rounded-full bg-green-500/80 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                            </div>
                            <div className="mx-auto bg-white/5 px-32 py-1 rounded-md text-[10px] text-slate-500 font-mono flex items-center gap-1 border border-white/5">
                                <LockIcon className="h-3 w-3" /> app.noxusgestao.com
                            </div>
                        </div>
                        <img src="/dashboard-preview.webp" alt="Interface do Noxus" className="w-full object-cover opacity-90 h-[400px] md:h-auto md:max-h-[750px] object-top rounded-b-2xl md:rounded-b-[2rem]" onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?q=80&w=2000&auto=format&fit=crop";
                            e.currentTarget.className = "w-full object-cover opacity-40 h-[400px] md:h-auto md:max-h-[750px] object-top rounded-b-2xl md:rounded-b-[2rem]";
                        }} />
                    </div>
                </motion.div>
            </section>

            {/* App Tour Section (Tabs) */}
            <section className="py-24 px-6 relative z-10 overflow-hidden">
                <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none -translate-y-1/2" />

                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-primary font-semibold tracking-wider uppercase text-sm mb-2 block">Por dentro do sistema</span>
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Uma visão <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">360º</span> do seu estúdio.</h2>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">Tudo que você precisa em uma interface desenhada para ser rápida e invisível. Focamos no software para você focar na arte.</p>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-4 md:p-8 backdrop-blur-sm">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col md:flex-row gap-8">
                            <TabsList className="flex flex-col h-auto w-full md:w-80 bg-transparent gap-2 p-0">
                                <TabsTrigger value="agenda" className="w-full justify-start p-4 h-auto text-left rounded-2xl data-[state=active]:bg-primary/10 data-[state=active]:border-primary/20 border border-transparent data-[state=active]:text-primary transition-all">
                                    <div className="flex flex-col gap-1 w-full">
                                        <div className="flex items-center gap-2 font-bold text-lg">
                                            <Calendar className="h-5 w-5" />
                                            Agenda Inteligente
                                        </div>
                                        <span className="text-sm font-normal text-slate-400 whitespace-normal text-left">Visualize sessões e horários livres rapidamente.</span>
                                    </div>
                                </TabsTrigger>
                                <TabsTrigger value="anamnese" className="w-full justify-start p-4 h-auto text-left rounded-2xl data-[state=active]:bg-primary/10 data-[state=active]:border-primary/20 border border-transparent data-[state=active]:text-primary transition-all">
                                    <div className="flex flex-col gap-1 w-full">
                                        <div className="flex items-center gap-2 font-bold text-lg">
                                            <FileText className="h-5 w-5" />
                                            Ficha de Anamnese
                                        </div>
                                        <span className="text-sm font-normal text-slate-400 whitespace-normal text-left">Fichas digitais assinadas e salvas automaticamente no perfil do cliente.</span>
                                    </div>
                                </TabsTrigger>
                                <TabsTrigger value="financeiro" className="w-full justify-start p-4 h-auto text-left rounded-2xl data-[state=active]:bg-primary/10 data-[state=active]:border-primary/20 border border-transparent data-[state=active]:text-primary transition-all">
                                    <div className="flex flex-col gap-1 w-full">
                                        <div className="flex items-center gap-2 font-bold text-lg">
                                            <DollarSign className="h-5 w-5" />
                                            Controle Financeiro
                                        </div>
                                        <span className="text-sm font-normal text-slate-400 whitespace-normal text-left">Saiba o quanto de dinheiro entra e sai, de forma visual.</span>
                                    </div>
                                </TabsTrigger>
                                <TabsTrigger value="clientes" className="w-full justify-start p-4 h-auto text-left rounded-2xl data-[state=active]:bg-primary/10 data-[state=active]:border-primary/20 border border-transparent data-[state=active]:text-primary transition-all">
                                    <div className="flex flex-col gap-1 w-full">
                                        <div className="flex items-center gap-2 font-bold text-lg">
                                            <Users className="h-5 w-5" />
                                            Gestão de Clientes
                                        </div>
                                        <span className="text-sm font-normal text-slate-400 whitespace-normal text-left">Histórico completo: tatuagens antigas, informações médicas e próximos retornos.</span>
                                    </div>
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex-1 w-full relative min-h-[400px]">
                                {[
                                    { id: "agenda", image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2000&auto=format&fit=crop", text: "Visão diária e mensal da sua agenda, com bloqueio de horários e alertas." },
                                    { id: "anamnese", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2000&auto=format&fit=crop", text: "Envie o link personalizado pelo WhatsApp antes do cliente chegar no estúdio." },
                                    { id: "financeiro", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2000&auto=format&fit=crop", text: "Painel com métricas detalhadas: Receitas, Despesas e Lucro real." },
                                    { id: "clientes", image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2000&auto=format&fit=crop", text: "CRM completo feito sob medida para tatuadores." }
                                ].map((tab) => (
                                    <TabsContent key={tab.id} value={tab.id} className="w-full h-full mt-0 outline-none animate-in fade-in zoom-in-95 duration-500">
                                        <div className="relative rounded-2xl border border-white/10 overflow-hidden shadow-2xl bg-zinc-900 group">
                                            <img src={tab.image} alt={tab.id} className="w-full h-full md:h-[500px] object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

                                            {/* Subtitle tooltip inside image */}
                                            <div className="absolute bottom-6 left-6 right-6 bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-xl flex items-center gap-4">
                                                <div className="h-10 w-10 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                                    <LayoutDashboard className="h-5 w-5" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-200">{tab.text}</p>
                                            </div>
                                        </div>
                                    </TabsContent>
                                ))}
                            </div>
                        </Tabs>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 px-6 bg-zinc-950/50 border-y border-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Tudo que seu estúdio precisa.</h2>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">Feito exclusivamente para as dores do tatuador. Sem recursos inúteis, apenas o que bota dinheiro no seu bolso.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<FileText className="h-6 w-6 text-blue-400" />}
                            title="Anamnese Digital Clicável"
                            description="Esqueça papéis e PDFs chatos. Envie um link exclusivo onde o cliente assina digitalmente os termos antes da sessão."
                        />
                        <FeatureCard
                            icon={<DollarSign className="h-6 w-6 text-emerald-400" />}
                            title="Financeiro Transparente"
                            description="Saiba exatamente o quanto faturou no mês, o que tem a receber e de onde vem a maior parte do seu lucro."
                        />
                        <FeatureCard
                            icon={<Calendar className="h-6 w-6 text-purple-400" />}
                            title="Agenda Conectada"
                            description="Marque suas sessões, acompanhe retornos e veja de forma visual quem é o próximo que vai deitar na maca."
                        />
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 px-6 relative">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-16">
                        <span className="text-primary font-semibold tracking-wider uppercase text-sm mb-2 block">Investimento</span>
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Planos que cabem no bolso.</h2>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">Escolha o plano ideal e pare de perder dinheiro com desorganização.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <PricingCard
                            title="Plano Mensal"
                            price="R$ 49"
                            interval="/mês"
                            description="Perfeito para tatuadores independentes que buscam organização total."
                            features={[
                                "Agenda Integrada",
                                "Fichas de Anamnese ilimitadas",
                                "Controle financeiro básico",
                                "Cadastro de clientes"
                            ]}
                            buttonText="Assinar Mensal"
                            onSubscribe={handleWhatsApp}
                        />

                        <PricingCard
                            title="Plano Anual"
                            price="R$ 39"
                            interval="/mês"
                            description="Maior economia. Pago anualmente em cota única de R$ 468."
                            features={[
                                "Tudo do plano mensal",
                                "Suporte prioritário via WhatsApp",
                                "Acesso à comunidade exclusiva",
                                "2 meses grátis garantidos"
                            ]}
                            highlighted={true}
                            buttonText="Assinar Anual (Desconto)"
                            onSubscribe={handleWhatsApp}
                        />
                    </div>
                </div>
            </section>

            {/* Testimonials - Infinite Marquee */}
            <section id="testimonials" className="py-24 px-6 border-t border-white/5 bg-zinc-950/30 overflow-hidden">
                <div className="max-w-7xl mx-auto mb-16 px-6">
                    <div className="text-center">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Aprovado por quem faz arte.</h2>
                    </div>
                </div>

                {/* Marquee Row 1 */}
                <div className="relative flex w-full flex-col gap-8">
                    <div className="flex w-fit animate-marquee gap-6">
                        {/* Duplicate content to make it seamless */}
                        {[1, 2].map((i) => (
                            <div key={i} className="flex gap-6 shrink-0">
                                <TestimonialCard
                                    name="Rafael Souza"
                                    role="Tatuador Especialista (Blackwork)"
                                    content="Antes do Noxus eu perdia horas no fim de semana calculando o financeiro no caderno. Agora eu sei meu faturamento em 2 cliques. O sistema é ouro."
                                />
                                <TestimonialCard
                                    name="Camila Tattoo"
                                    role="Dona de Estúdio"
                                    content="O sistema de anamnese mudou minha vida! O cliente chega, eu já tenho tudo salvo no perfil online dele, sem gastar papel e tinta da impressora."
                                />
                                <TestimonialCard
                                    name="Lucas Fineline"
                                    role="Artista Independente"
                                    content="A interface é absurdamente linda. Dá gosto de abrir o sistema todo dia de manhã para ver a agenda, muito melhor que os concorrentes travados."
                                />
                                <TestimonialCard
                                    name="Amanda Ink"
                                    role="Tatuadora Coreana"
                                    content="Eu testei mais de três sistemas diferentes. O Noxus foi o único que eu gostei visualmente e que carregou rápido no meu celular. Recomendo para todos do estúdio."
                                />
                            </div>
                        ))}
                    </div>

                    {/* Left & Right Fades for Marquee */}
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background to-transparent md:w-1/3"></div>
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background to-transparent md:w-1/3"></div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-24 px-6 max-w-4xl mx-auto relative">
                <div className="text-center mb-12">
                    <HelpCircle className="h-10 w-10 text-primary mx-auto mb-4 opacity-80" />
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Perguntas Frequentes</h2>
                    <p className="text-slate-400">Tudo que você precisa saber antes de assinar.</p>
                </div>

                <div className="bg-card/40 border border-white/5 rounded-3xl p-6 md:p-10 backdrop-blur-sm">
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1" className="border-white/10">
                            <AccordionTrigger className="text-left text-lg font-bold hover:text-primary transition-colors">A ficha de anamnese tem validade jurídica?</AccordionTrigger>
                            <AccordionContent className="text-slate-400 text-base leading-relaxed">
                                Sim. As fichas geram um registro do aceite do cliente aos seus termos no momento do envio, funcionando como um contrato digital, aceito e respaldado como prova de consentimento mútuo, protegendo o tatuador contra alegações futuras de falta de comunicação de riscos.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2" className="border-white/10">
                            <AccordionTrigger className="text-left text-lg font-bold hover:text-primary transition-colors">Preciso instalar algum aplicativo no celular?</AccordionTrigger>
                            <AccordionContent className="text-slate-400 text-base leading-relaxed">
                                Não! O Noxus Gestão roda direto no seu navegador. Isso significa que ele é super leve e não consome memória do seu iPhone ou Android. Basta logar no site e usar como se fosse um app nativo, super rápido.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3" className="border-white/10">
                            <AccordionTrigger className="text-left text-lg font-bold hover:text-primary transition-colors">Sou tatuador autônomo. O sistema serve para mim?</AccordionTrigger>
                            <AccordionContent className="text-slate-400 text-base leading-relaxed">
                                Com certeza. O Noxus foi construído não apenas para grandes estúdios, mas principalmente para o tatuador independente que precisa cuidar do próprio marketing, agendamentos e grana sem ter uma secretária física. O sistema atua como sua assistente de bolso.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4" className="border-white/10">
                            <AccordionTrigger className="text-left text-lg font-bold hover:text-primary transition-colors">Os clientes veem todo o sistema?</AccordionTrigger>
                            <AccordionContent className="text-slate-400 text-base leading-relaxed">
                                Não. Seus clientes só terão acesso às telas que você enviar para eles (como a ficha de anamnese). Todo o painel de agenda, controle de pagamentos e cadastros é exclusivo para você, selado por login e senha.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </section>

            {/* CTA Final */}
            <section className="py-24 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 rounded-full blur-[150px] pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center relative z-10 bg-card/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-12 md:p-20 shadow-2xl">
                    <Zap className="h-12 w-12 text-primary mx-auto mb-6" />
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">Pronto para subir de nível?</h2>
                    <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">Junte-se ao grupo de tatuadores que estão profissionalizando a gestão de suas carreiras. Crie sua conta hoje mesmo.</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button size="lg" className="h-14 px-10 text-lg rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xl shadow-primary/25" onClick={handleStart}>
                            Quero ser Noxus Gestão
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/5 text-center text-slate-500">
                <div className="max-w-7xl mx-auto flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-4 opacity-50 grayscale">
                        <img src="/logo-app-noxus.png" alt="Noxus Logo" className="h-6 w-auto object-contain" />
                    </div>
                    <p className="text-sm">© {new Date().getFullYear()} Noxus Gestão. Todos os direitos reservados.</p>
                    <p className="text-xs mt-2">Feito no Brasil para Tatuadores Brasileiros.</p>
                </div>
            </footer>
        </div>
    );
}

function LockIcon(props: React.ComponentProps<"svg">) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    )
}

function UserAvatarPlaceholder({ index }: { index: number }) {
    const colors = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-rose-500"];
    return (
        <div className={`w-full h-full flex items-center justify-center text-[10px] font-bold text-white ${colors[index % colors.length]}`}>
            {["R", "C", "M", "A"][index % 4]}
        </div>
    )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 group shadow-lg">
            <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 shadow-inner border border-white/5 group-hover:bg-primary/20 group-hover:text-primary transition-all duration-300">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-slate-400 leading-relaxed font-light">{description}</p>
        </div>
    );
}

function TestimonialCard({ name, role, content }: { name: string, role: string, content: string }) {
    return (
        <div className="bg-card/40 backdrop-blur-sm border border-white/5 rounded-3xl w-[350px] md:w-[400px] p-8 relative hover:border-white/10 transition-colors">
            <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
            </div>
            <p className="text-slate-300 mb-8 italic font-light">"{content}"</p>
            <div className="flex items-center gap-4 mt-auto">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary border border-primary/20">
                    {name.charAt(0)}
                </div>
                <div>
                    <p className="font-bold text-white text-sm">{name}</p>
                    <p className="text-slate-500 text-xs">{role}</p>
                </div>
            </div>
        </div>
    );
}

function PricingCard({ title, price, interval, description, features, highlighted = false, buttonText, onSubscribe }: any) {
    return (
        <div className={`relative flex flex-col rounded-3xl p-8 md:p-10 ${highlighted ? 'bg-gradient-to-b from-primary/20 to-card border-primary/50 shadow-2xl shadow-primary/20' : 'bg-card/50 border-white/10 backdrop-blur-sm'} border`}>
            {highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full">
                    Mais Popular
                </div>
            )}

            <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
            <p className="text-slate-400 text-sm mb-6 min-h-[40px]">{description}</p>

            <div className="mb-8">
                <span className="text-5xl font-extrabold text-white">{price}</span>
                <span className="text-slate-500 font-medium">{interval}</span>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
                {features.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                        <Check className={`h-5 w-5 shrink-0 ${highlighted ? 'text-primary' : 'text-slate-400'}`} />
                        <span className="text-slate-300 text-sm">{feature}</span>
                    </li>
                ))}
            </ul>

            <Button
                className={`w-full h-12 rounded-xl text-md font-bold transition-all ${highlighted ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}
                onClick={onSubscribe}
            >
                {buttonText}
            </Button>
        </div>
    );
}
