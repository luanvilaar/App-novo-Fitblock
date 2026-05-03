import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Database,
  Eye,
  Users,
  Lock,
  UserCheck,
  Cookie,
  RefreshCw,
  Mail,
  CheckCircle2,
  Target,
  Smartphone,
  Scale,
  FileText,
  AlertTriangle,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import heroImage from "@/assets/crossfit-program.jpg";

const NAV_ITEMS = [
  { id: "privacidade", label: "Política de Privacidade" },
  { id: "termos", label: "Termos de Uso" },
];

interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  id?: string;
}

const SectionCard = ({ icon, title, children, id }: SectionCardProps) => (
  <div id={id} className="scroll-mt-28 bg-card border border-border/40 rounded-2xl p-6 sm:p-8 space-y-4">
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">{title}</h3>
    </div>
    <div className="text-muted-foreground text-sm sm:text-base leading-relaxed space-y-3">{children}</div>
  </div>
);

const Callout = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-primary/10 border-l-2 border-primary rounded-r-xl px-4 py-3 text-sm text-foreground/90">
    {children}
  </div>
);

const Politicas = () => {
  useEffect(() => {
    document.title = "Política de Privacidade | FitBlock Training";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Política de Privacidade e Termos de Uso da FitBlock Training. Saiba como tratamos seus dados com transparência e segurança, em conformidade com a LGPD."
      );
    }
  }, []);

  return (
    <div className="min-h-screen relative text-foreground">
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
        <img
          src={heroImage}
          alt=""
          className="w-full h-full object-cover grayscale opacity-[0.14]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-border/40">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-12 sm:pt-16 sm:pb-16 text-center space-y-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft size={14} />
            Voltar ao site
          </Link>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Política de Privacidade
            <br className="hidden sm:block" />{" "}
            <span className="text-primary">& Termos de Uso</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Transparência, segurança e respeito aos seus dados. A FitBlock Training tem o compromisso de proteger
            suas informações pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD).
          </p>
        </div>
      </header>

      {/* Anchor Nav */}
      <nav className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex gap-3 py-3 overflow-x-auto">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="flex-shrink-0 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-xs sm:text-sm font-semibold hover:bg-primary/15 hover:text-primary transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-16">
        {/* ========== POLÍTICA DE PRIVACIDADE ========== */}
        <section id="privacidade" className="scroll-mt-28 space-y-5">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Política de Privacidade
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Última atualização: março de 2026
          </p>

          <div className="space-y-5">
            <SectionCard icon={<Shield size={20} />} title="Informações Gerais">
              <p>
                A FitBlock Training ("nós", "nosso") valoriza a privacidade de seus usuários ("você"). Esta
                política descreve como coletamos, utilizamos, armazenamos e protegemos suas informações pessoais
                ao utilizar nosso site, aplicativo e serviços relacionados.
              </p>
              <p>
                Ao utilizar nossos serviços, você concorda com as práticas descritas nesta política, em
                conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD).
              </p>
            </SectionCard>

            <SectionCard icon={<Database size={20} />} title="Dados Coletados">
              <p>Podemos coletar as seguintes categorias de dados:</p>
              <ul className="list-disc list-inside space-y-1.5 ml-1">
                <li><strong>Dados de identificação:</strong> nome, e-mail, data de nascimento, gênero.</li>
                <li><strong>Dados de acesso:</strong> endereço IP, navegador, dispositivo, páginas acessadas.</li>
                <li><strong>Dados de performance:</strong> registros de treino, cargas, repetições, tempos e scores.</li>
                <li><strong>Dados de saúde (quando aplicável):</strong> informações fornecidas voluntariamente como peso, medidas corporais e condições físicas relevantes ao treinamento.</li>
              </ul>
              <Callout>
                Dados de saúde são considerados dados sensíveis pela LGPD e recebem tratamento diferenciado e
                proteção reforçada em nossos sistemas.
              </Callout>
            </SectionCard>

            <SectionCard icon={<Eye size={20} />} title="Finalidade do Uso">
              <p>Utilizamos seus dados para:</p>
              <ul className="list-disc list-inside space-y-1.5 ml-1">
                <li>Personalizar sua experiência de treinamento e prescrição de exercícios.</li>
                <li>Gerar rankings, relatórios de progresso e análises de desempenho.</li>
                <li>Comunicar novidades, atualizações de treino e notificações relevantes.</li>
                <li>Melhorar nossos serviços, plataforma e metodologia.</li>
                <li>Cumprir obrigações legais e regulatórias.</li>
              </ul>
            </SectionCard>

            <SectionCard icon={<Users size={20} />} title="Compartilhamento de Dados">
              <p>
                Seus dados pessoais não são vendidos, alugados ou compartilhados com terceiros para fins
                comerciais. Podemos compartilhar informações apenas nas seguintes situações:
              </p>
              <ul className="list-disc list-inside space-y-1.5 ml-1">
                <li>Com seu treinador designado, para fins de prescrição e acompanhamento de treinos.</li>
                <li>Com prestadores de serviços essenciais (hospedagem, análise), sob contratos de confidencialidade.</li>
                <li>Quando exigido por ordem judicial ou autoridade competente.</li>
              </ul>
            </SectionCard>

            <SectionCard icon={<Lock size={20} />} title="Armazenamento e Segurança">
              <p>
                Seus dados são armazenados em servidores seguros com criptografia em trânsito (TLS/SSL) e em
                repouso. Adotamos medidas técnicas e administrativas adequadas para proteger suas informações
                contra acesso não autorizado, perda ou vazamento.
              </p>
              <p>
                Os dados são retidos pelo período necessário ao cumprimento das finalidades descritas ou conforme
                exigido pela legislação aplicável.
              </p>
            </SectionCard>

            <SectionCard icon={<UserCheck size={20} />} title="Seus Direitos (LGPD)">
              <p>Como titular dos dados, você tem direito a:</p>
              <ul className="list-disc list-inside space-y-1.5 ml-1">
                <li>Confirmar a existência de tratamento de seus dados.</li>
                <li>Acessar, corrigir ou atualizar seus dados pessoais.</li>
                <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários.</li>
                <li>Revogar o consentimento a qualquer momento.</li>
                <li>Solicitar a portabilidade dos seus dados.</li>
              </ul>
              <Callout>
                Para exercer seus direitos, entre em contato pelo e-mail{" "}
                <strong>fitblocktraining@gmail.com</strong>.
              </Callout>
            </SectionCard>

            <SectionCard icon={<Cookie size={20} />} title="Cookies">
              <p>
                Utilizamos cookies e tecnologias semelhantes para melhorar sua experiência, lembrar suas
                preferências (como tema claro/escuro) e analisar o uso da plataforma. Você pode gerenciar as
                configurações de cookies diretamente no seu navegador.
              </p>
            </SectionCard>

            <SectionCard icon={<RefreshCw size={20} />} title="Alterações nesta Política">
              <p>
                Reservamo-nos o direito de atualizar esta política periodicamente. Alterações significativas serão
                comunicadas por meio da plataforma ou por e-mail. Recomendamos revisar esta página regularmente.
              </p>
            </SectionCard>

            <SectionCard icon={<Mail size={20} />} title="Contato">
              <p>
                Para dúvidas, solicitações ou exercício de direitos relacionados aos seus dados pessoais, entre em
                contato conosco:
              </p>
              <p>
                <strong>E-mail:</strong> fitblocktraining@gmail.com
                <br />
                <strong>Localização:</strong> João Pessoa – PB, Brasil
              </p>
            </SectionCard>
          </div>
        </section>

        {/* ========== TERMOS DE USO ========== */}
        <section id="termos" className="scroll-mt-28 space-y-5">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Termos de Uso
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Última atualização: março de 2026
          </p>

          <div className="space-y-5">
            <SectionCard icon={<CheckCircle2 size={20} />} title="Aceitação dos Termos">
              <p>
                Ao acessar e utilizar a plataforma FitBlock Training, você declara que leu, compreendeu e concorda
                com estes Termos de Uso. Caso não concorde com qualquer condição, solicitamos que não utilize
                nossos serviços.
              </p>
            </SectionCard>

            <SectionCard icon={<Target size={20} />} title="Objetivo da Plataforma">
              <p>
                A FitBlock Training é uma plataforma de treinamento que oferece prescrição de exercícios,
                acompanhamento de performance, rankings e comunidade para atletas e treinadores. Nossa metodologia
                combina força, condicionamento aeróbico e Functional Bodybuilding para promover resultados
                sustentáveis.
              </p>
            </SectionCard>

            <SectionCard icon={<Smartphone size={20} />} title="Uso da Plataforma e Cadastro">
              <p>Para utilizar a plataforma, você deve:</p>
              <ul className="list-disc list-inside space-y-1.5 ml-1">
                <li>Ter pelo menos 18 anos de idade ou autorização de responsável legal.</li>
                <li>Criar uma conta com informações verdadeiras e atualizadas.</li>
                <li>Manter a confidencialidade de suas credenciais de acesso.</li>
                <li>Não compartilhar sua conta com terceiros.</li>
              </ul>
              <p>
                Você é responsável por todas as atividades realizadas em sua conta. Caso identifique uso não
                autorizado, notifique-nos imediatamente.
              </p>
            </SectionCard>

            <SectionCard icon={<FileText size={20} />} title="Propriedade Intelectual">
              <p>
                Todo o conteúdo disponível na plataforma — incluindo textos, imagens, logotipos, metodologias,
                programas de treino, design e código — é de propriedade da FitBlock Training ou de seus
                licenciadores e está protegido por leis de propriedade intelectual.
              </p>
              <p>
                É proibida a reprodução, distribuição ou modificação de qualquer conteúdo sem autorização prévia
                por escrito.
              </p>
            </SectionCard>

            <SectionCard icon={<AlertTriangle size={20} />} title="Limitação de Responsabilidade">
              <p>
                A FitBlock Training oferece orientação de treinamento por meio de profissionais qualificados.
                No entanto:
              </p>
              <Callout>
                <strong>Aviso importante sobre atividade física:</strong> a prática de exercícios físicos envolve
                riscos inerentes, incluindo, mas não se limitando a, lesões musculoesqueléticas, problemas
                cardiovasculares e outros eventos adversos. Antes de iniciar qualquer programa de treinamento,
                recomendamos fortemente que você consulte um médico e obtenha liberação para a prática de
                atividades físicas.
              </Callout>
              <ul className="list-disc list-inside space-y-1.5 ml-1 mt-3">
                <li>Não garantimos resultados específicos de performance, estéticos ou de saúde.</li>
                <li>Não nos responsabilizamos por lesões decorrentes de execução incorreta de exercícios.</li>
                <li>A plataforma não substitui acompanhamento médico ou nutricional.</li>
                <li>Não nos responsabilizamos por indisponibilidades temporárias do sistema.</li>
              </ul>
            </SectionCard>

            <SectionCard icon={<Scale size={20} />} title="Modificações nos Termos">
              <p>
                Podemos modificar estes Termos de Uso a qualquer momento. As alterações entram em vigor a partir
                da publicação nesta página. O uso continuado da plataforma após as alterações constitui aceitação
                dos novos termos.
              </p>
            </SectionCard>

            <SectionCard icon={<MapPin size={20} />} title="Foro e Legislação Aplicável">
              <p>
                Estes Termos de Uso são regidos pela legislação brasileira. Para dirimir quaisquer controvérsias
                oriundas destes termos, fica eleito o foro da comarca de{" "}
                <strong>João Pessoa – Paraíba (PB)</strong>, com exclusão de qualquer outro, por mais
                privilegiado que seja.
              </p>
            </SectionCard>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary tracking-tighter text-sm">FITBLOCK</span>
            <span className="font-bold tracking-tighter text-sm text-foreground">TRAINING</span>
          </div>
          <p>João Pessoa – PB, Brasil</p>
          <a href="mailto:fitblocktraining@gmail.com" className="hover:text-foreground transition-colors">
            fitblocktraining@gmail.com
          </a>
        </div>
      </footer>
      </div>
    </div>
  );
};

export default Politicas;
