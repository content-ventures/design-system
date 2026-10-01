'use client';

import { useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Grid2X2,
  Layers,
  List,
  Megaphone,
  Plus,
  Search,
  Upload,
  Users,
  X,
} from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Dialog,
  EmptyState,
  Field,
  Input,
  Progress,
  Section,
  Segmented,
  Steps,
  Switch,
  Tabs,
} from '../components/ds/primitives';
import { LeadCard, exampleLeads } from '../components/ds/lead-card';
import type { SampleKind } from './catalog';
import p from '../components/ds/primitives.module.css';
import s from './showcase.module.css';

export function ButtonExamples({ onNotify }: { onNotify: (message: string) => void }) {
  const [size, setSize] = useState('md');
  const [selected, setSelected] = useState('lista');
  return (
    <>
      <Section
        title="A hierarquia começa na ação."
        description="Uma ação principal por contexto. As demais apoiam a decisão."
        action={
          <Segmented
            label="Tamanho dos botões"
            value={size}
            onChange={setSize}
            options={[
              { value: 'sm', label: 'P' },
              { value: 'md', label: 'M' },
              { value: 'lg', label: 'G' },
            ]}
          />
        }
      >
        <div className={s.buttonSpecimen}>
          {(
            [
              { variant: 'primary', label: 'Criar campanha', caption: 'Primário' },
              { variant: 'secondary', label: 'Ver detalhes', caption: 'Secundário' },
              { variant: 'ghost', label: 'Cancelar', caption: 'Discreto' },
              { variant: 'danger', label: 'Arquivar', caption: 'Destrutivo' },
            ] as const
          ).map(({ variant, label, caption }) => (
            <div key={variant}>
              <Button
                variant={variant}
                size={size as 'sm' | 'md' | 'lg'}
                onClick={() => onNotify(`Exemplo: ${label.toLowerCase()}. Nenhuma alteração real.`)}
              >
                {variant === 'primary' && <Plus size={15} />} {label}
              </Button>
              <span>{caption}</span>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Estados fazem parte do componente">
        <div className={s.buttonSpecimen}>
          <div>
            <Button onClick={() => onNotify('Ação de demonstração concluída.')}>
              Continuar
              <ArrowRight size={14} />
            </Button>
            <span>Disponível</span>
          </div>
          <div>
            <Button loading>Salvando</Button>
            <span>Carregando · exemplo fixo</span>
          </div>
          <div>
            <Button disabled>Criar campanha</Button>
            <span>Indisponível</span>
          </div>
          <div>
            <Button
              variant="secondary"
              aria-label="Copiar exemplo"
              onClick={() => onNotify('Exemplo de ação compacta.')}
            >
              <Copy size={16} />
            </Button>
            <span>Somente ícone, com rótulo</span>
          </div>
        </div>
      </Section>
      <Section title="Ações relacionadas">
        <div className={s.canvas}>
          <Segmented
            label="Modo de visualização"
            value={selected}
            onChange={setSelected}
            options={[
              { value: 'lista', label: 'Lista' },
              { value: 'grade', label: 'Grade' },
            ]}
          />
          <span className={s.muted}>
            {selected === 'lista' ? <List size={18} /> : <Grid2X2 size={18} />} Visualização em{' '}
            {selected}
          </span>
          <a className={s.textLink} href="#nova-campanha">
            Explorar fluxo de campanha <ArrowUpRight size={14} />
          </a>
        </div>
      </Section>
      <div className={s.ruleNote}>
        <Check size={17} />
        <p>
          Rótulos descrevem o resultado: “Criar campanha”, “Salvar alterações”, “Arquivar”. Ícones
          complementam, não substituem a clareza.
        </p>
      </div>
    </>
  );
}

export function FormExamples({
  selectedId,
  onNotify,
}: {
  selectedId: string;
  onNotify: (message: string) => void;
}) {
  const [name, setName] = useState('Presença em destaque');
  const [error, setError] = useState('');
  const [notify, setNotify] = useState(true);
  const [password, setPassword] = useState(false);
  const [range, setRange] = useState(65);
  const [color, setColor] = useState('#3559c7');
  const fieldRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <Section
        title="Preencher com segurança."
        description="Rótulos permanentes, ajuda no contexto e validação perto da decisão."
      >
        <form
          className={s.formSpecimen}
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) {
              setError('Informe um nome para a campanha.');
              fieldRef.current?.focus();
            } else {
              setError('');
              onNotify('Formulário validado. Nenhum dado foi enviado.');
            }
          }}
        >
          <div className={s.twoColumns}>
            <Field
              htmlFor="demo-name"
              label="Nome da campanha"
              required
              hint="Um nome claro para identificar a ação."
              error={error}
            >
              <Input
                ref={fieldRef}
                id="demo-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={Boolean(error)}
                aria-describedby="demo-name-hint"
              />
            </Field>
            <Field htmlFor="demo-portal" label="Portal" hint="O contexto da campanha.">
              <select id="demo-portal" className={p.input} defaultValue="negocios">
                <option value="negocios">Feira de negócios</option>
                <option value="design">Feira de design</option>
                <option value="setorial">Feira setorial</option>
              </select>
            </Field>
            <Field htmlFor="demo-start" label="Data de início">
              <Input id="demo-start" type="date" defaultValue="2026-10-01" />
            </Field>
            <Field
              htmlFor="demo-budget"
              label="Investimento (R$)"
              hint="Valor total previsto para a campanha."
            >
              <Input id="demo-budget" type="number" min="1" step="100" defaultValue="5000" />
            </Field>
          </div>
          <Field htmlFor="demo-notes" label="Observações" hint="Opcional. Até 240 caracteres.">
            <textarea
              id="demo-notes"
              className={p.input}
              rows={3}
              maxLength={240}
              placeholder="O que sua equipe precisa saber?"
            />
          </Field>
          <div className={s.formFooter}>
            <span>Campos com * são obrigatórios.</span>
            <Button type="submit">
              Validar exemplo
              <Check size={14} />
            </Button>
          </div>
        </form>
      </Section>
      <Section title="Escolhas e preferências">
        <div className={s.twoColumns}>
          <div className={s.paddedPanel}>
            <fieldset className={s.choiceList}>
              <legend>Canais de veiculação</legend>
              <label>
                <input type="checkbox" defaultChecked />
                Vitrine da feira
              </label>
              <label>
                <input type="checkbox" defaultChecked />
                Mídia de performance
              </label>
              <label>
                <input type="checkbox" />
                E-mail
              </label>
            </fieldset>
          </div>
          <div className={s.paddedPanel}>
            <fieldset className={s.choiceList}>
              <legend>Objetivo da campanha</legend>
              <label>
                <input type="radio" name="demo-objective" defaultChecked />
                Gerar oportunidades
              </label>
              <label>
                <input type="radio" name="demo-objective" />
                Ampliar a presença
              </label>
            </fieldset>
            <div className={s.divider} />
            <Switch label="Notificar sobre novos leads" checked={notify} onChange={setNotify} />
          </div>
        </div>
      </Section>
      <Section title="Estados e entradas específicas">
        <div className={s.formSpecimen}>
          <div className={s.twoColumns}>
            <Field htmlFor="demo-readonly" label="Identificador" hint="Somente leitura.">
              <Input id="demo-readonly" value="CMP-2026-0042" readOnly />
            </Field>
            <Field htmlFor="demo-disabled" label="Código externo" hint="Indisponível nesta etapa.">
              <Input id="demo-disabled" placeholder="Disponível após integração" disabled />
            </Field>
            <Field
              htmlFor="demo-error"
              label="E-mail de contato"
              error="Use um e-mail no formato nome@empresa.com."
            >
              <Input
                id="demo-error"
                defaultValue="contato@"
                aria-invalid="true"
                aria-describedby="demo-error-hint"
              />
            </Field>
            <Field htmlFor="demo-search" label="Buscar">
              <div className={s.inputWithIcon}>
                <Search size={15} />
                <Input id="demo-search" type="search" placeholder="Nome ou anunciante" />
              </div>
            </Field>
          </div>
          {selectedId === 'senha' && (
            <Field htmlFor="demo-password" label="Senha de demonstração">
              <div className={s.passwordInput}>
                <Input
                  id="demo-password"
                  type={password ? 'text' : 'password'}
                  defaultValue="Senha fictícia"
                  autoComplete="off"
                />
                <Button
                  variant="ghost"
                  aria-label={password ? 'Ocultar senha' : 'Mostrar senha'}
                  onClick={() => setPassword(!password)}
                >
                  {password ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </Field>
          )}
          {(selectedId === 'slider' || selectedId === 'numero') && (
            <Field htmlFor="demo-range" label={`Distribuição do investimento: ${range}%`}>
              <input
                id="demo-range"
                type="range"
                min="0"
                max="100"
                value={range}
                onChange={(e) => setRange(Number(e.target.value))}
              />
            </Field>
          )}
          {selectedId === 'seletor-cor' && (
            <Field htmlFor="demo-color" label="Cor do portal (demonstração)">
              <div className={s.buttonRow}>
                <input
                  id="demo-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
                <code>{color}</code>
              </div>
            </Field>
          )}
          {selectedId === 'periodo' && (
            <div className={s.twoColumns}>
              <Field htmlFor="demo-end" label="Data de término">
                <Input id="demo-end" type="date" defaultValue="2026-10-30" />
              </Field>
              <Field htmlFor="demo-time" label="Horário">
                <Input id="demo-time" type="time" defaultValue="09:00" />
              </Field>
            </div>
          )}
        </div>
      </Section>
    </>
  );
}

export function ComponentExamples({
  kind,
  onNotify,
}: {
  kind: SampleKind;
  onNotify: (message: string) => void;
}) {
  const [dialog, setDialog] = useState(false);
  const [tags, setTags] = useState(['Vitrine', 'Compradores', 'Outubro']);
  const [progress, setProgress] = useState(64);
  const [recovered, setRecovered] = useState(false);
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [fileError, setFileError] = useState('');
  const [stage, setStage] = useState<Record<string, string>>({
    'Empresa Aurora': 'Novos leads',
    'Grupo Horizonte': 'Em contato',
    'Casa Forma': 'Qualificados',
  });
  if (kind === 'status')
    return (
      <>
        <Section title="O estado precisa ser entendido de relance.">
          <div className={s.canvas}>
            <Badge>Rascunho</Badge>
            <Badge tone="warning">Em revisão</Badge>
            <Badge tone="success">Em veiculação</Badge>
            <Badge tone="brand">Concluída</Badge>
            <Badge tone="danger">Atenção necessária</Badge>
          </div>
        </Section>
        <Section
          title="Etiquetas removíveis"
          description="Categorias são diferentes de status: não comunicam o estado da operação."
        >
          <div className={s.canvas}>
            {tags.map((tag) => (
              <button
                className={s.tag}
                key={tag}
                onClick={() => setTags(tags.filter((t) => t !== tag))}
                aria-label={`Remover etiqueta ${tag}`}
              >
                {tag}
                <X size={12} />
              </button>
            ))}
            {tags.length === 0 && (
              <Button
                variant="ghost"
                onClick={() => setTags(['Vitrine', 'Compradores', 'Outubro'])}
              >
                Restaurar etiquetas
              </Button>
            )}
          </div>
        </Section>
      </>
    );
  if (kind === 'dialog')
    return (
      <>
        <Section
          title="Interromper apenas quando necessário."
          description="Confirmações e ajustes pequenos cabem em diálogos. Criação de campanha acontece em página."
        >
          <div className={s.dialogSpecimen}>
            <span className={s.miniLabel}>CONFIRMAÇÃO DE AÇÃO</span>
            <h3>Uma decisão. Sem perder o contexto.</h3>
            <p>O diálogo explica a consequência e oferece um caminho claro para voltar.</p>
            <Button variant="secondary" onClick={() => setDialog(true)}>
              Experimentar confirmação
              <ArrowUpRight size={14} />
            </Button>
          </div>
        </Section>
        <div className={s.ruleNote}>
          <Layers size={17} />
          <p>
            Foco contido no diálogo, Escape para cancelar e foco devolvido ao acionador. A ação
            menos destrutiva vem primeiro.
          </p>
        </div>
        <Dialog
          open={dialog}
          onClose={() => setDialog(false)}
          title="Pausar esta campanha?"
          description="Em um fluxo real, a veiculação seria interrompida. Aqui, a ação demonstra apenas o comportamento da interface."
          footer={
            <>
              <Button variant="secondary" onClick={() => setDialog(false)}>
                Manter campanha
              </Button>
              <Button
                onClick={() => {
                  setDialog(false);
                  onNotify('Pausa demonstrada. Nenhuma campanha real foi alterada.');
                }}
              >
                Pausar na prévia
              </Button>
            </>
          }
        />
      </>
    );
  if (kind === 'feedback')
    return (
      <>
        <Section title="A interface responde, sem fazer ruído.">
          <div className={s.stack}>
            <Alert title="Seu rascunho está pronto para revisar." />
            <Alert tone="success" title="Alterações salvas na demonstração." />
            <Alert tone="warning" title="O período termina em 3 dias.">
              Revise a programação antes de solicitar uma extensão.
            </Alert>
            <Alert tone="danger" title="Não foi possível carregar os dados.">
              Tente novamente. O que você preencheu continua nesta página.
            </Alert>
          </div>
          <div className={s.buttonRow}>
            <Button
              variant="secondary"
              onClick={() => onNotify('Alterações salvas na demonstração.')}
            >
              Disparar notificação
              <Bell size={14} />
            </Button>
          </div>
        </Section>
        <Section title="Progresso, espera e recuperação">
          <div className={s.twoColumns}>
            <div className={s.paddedPanel}>
              <div className={s.rowBetween}>
                <span>Importando arquivo de exemplo</span>
                <code>{progress}%</code>
              </div>
              <Progress value={progress} label="Importação de demonstração" />
              <div className={s.buttonRow}>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setProgress(progress === 100 ? 0 : Math.min(100, progress + 12))}
                >
                  {progress === 100 ? 'Recomeçar' : 'Avançar exemplo'}
                </Button>
                <Button size="sm" loading>
                  Carregando
                </Button>
              </div>
              <div className={s.skeleton} aria-label="Exemplo de skeleton" role="img">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className={s.paddedPanel}>
              {recovered ? (
                <Alert tone="success" title="Exemplo recuperado." />
              ) : (
                <EmptyState
                  title="Os dados não chegaram."
                  description="Sua conexão pode ter sido interrompida. Tente carregar novamente."
                >
                  <Button variant="secondary" onClick={() => setRecovered(true)}>
                    Tentar novamente
                  </Button>
                </EmptyState>
              )}
            </div>
          </div>
        </Section>
        <Section title="Ausência de dados também é um estado">
          <div className={s.panel}>
            <EmptyState
              title="Sua próxima campanha começa aqui."
              description="Reúna objetivo, público e investimento em um fluxo guiado."
            >
              <a href="#nova-campanha" className={s.primaryLink}>
                <Plus size={15} />
                Criar campanha de exemplo
              </a>
            </EmptyState>
          </div>
        </Section>
      </>
    );
  if (kind === 'navigation')
    return (
      <>
        <Section title="Saber onde está. Saber para onde ir.">
          <div className={s.themePreview}>
            <div className={s.previewSidebar}>
              <span className={s.miniBrand}>media.on</span>
              <a href="#template-dashboard">
                <Grid2X2 size={14} />
                Visão geral
              </a>
              <a href="#template-listagem" className={s.miniActive}>
                <Megaphone size={14} />
                Campanhas
              </a>
              <a href="#kanban">
                <Users size={14} />
                Leads
              </a>
            </div>
            <div className={s.themePreviewMain}>
              <nav className={s.breadcrumbDemo} aria-label="Exemplo de localização">
                <a href="#telas">Portal</a>
                <ChevronRight size={12} />
                <span>Campanhas</span>
              </nav>
              <h3>Campanhas</h3>
              <Tabs
                label="Exemplo de abas"
                items={[
                  {
                    id: 'ativas',
                    label: 'Em veiculação',
                    content: (
                      <Alert tone="success" title="3 campanhas em veiculação">
                        Exemplo do conteúdo da aba ativa.
                      </Alert>
                    ),
                  },
                  {
                    id: 'rascunhos',
                    label: 'Rascunhos',
                    content: (
                      <Alert title="1 campanha em rascunho">
                        Continue o planejamento antes de veicular.
                      </Alert>
                    ),
                  },
                  {
                    id: 'concluidas',
                    label: 'Concluídas',
                    content: (
                      <Alert title="1 campanha concluída">
                        Os resultados continuam disponíveis para consulta.
                      </Alert>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        </Section>
        <Section title="Etapas com contexto">
          <div className={s.canvas}>
            <Steps
              steps={['Objetivo', 'Público e canais', 'Investimento', 'Revisão']}
              current={1}
            />
          </div>
          <a className={s.textLink} href="#nova-campanha">
            Testar o fluxo completo
            <ArrowRight size={14} />
          </a>
        </Section>
      </>
    );
  if (kind === 'structure')
    return (
      <>
        <Section
          title="Organizar sem encaixotar tudo."
          description="Superfícies agrupam uma tarefa. Linhas e espaço resolvem o restante."
        >
          <div className={s.panel}>
            <div className={s.specimenHeader}>
              <div>
                <h3>Presença em destaque</h3>
                <p>Expositor Aurora · Feira de negócios</p>
              </div>
              <Badge tone="success">Em veiculação</Badge>
            </div>
            <div className={s.paddedPanel}>
              <dl className={s.descriptionList}>
                {[
                  ['Período', '01–30 out. 2026'],
                  ['Investimento', 'R$ 18.400,00'],
                  ['Objetivo', 'Gerar oportunidades'],
                  ['Responsável', 'Equipe comercial'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className={s.accordion}>
              <details open>
                <summary>Informações da campanha</summary>
                <p>O conteúdo principal é apresentado antes das configurações complementares.</p>
              </details>
              <details>
                <summary>Configurações complementares</summary>
                <p>
                  Use expansão para informação secundária. Nunca esconda um erro obrigatório aqui.
                </p>
              </details>
            </div>
          </div>
        </Section>
      </>
    );
  if (kind === 'timeline')
    return (
      <Section title="Um histórico legível, na ordem certa.">
        <ol className={s.timeline}>
          {[
            [
              'Campanha em veiculação',
              'Hoje, 09:42',
              'A programação foi iniciada no período definido.',
            ],
            ['Revisão concluída', 'Ontem, 16:20', 'Equipe de mídia · Materiais revisados.'],
            [
              'Rascunho criado',
              '27 set., 10:15',
              'Equipe comercial · Objetivo e público definidos.',
            ],
          ].map(([title, time, text], i) => (
            <li key={title}>
              <span className={i === 0 ? s.timelineActive : ''}>
                {i === 0 ? <Check size={12} /> : <span />}
              </span>
              <div>
                <strong>{title}</strong>
                <p>{text}</p>
                <time>{time}</time>
              </div>
            </li>
          ))}
        </ol>
      </Section>
    );
  if (kind === 'kanban')
    return (
      <Section
        title="O próximo contato, sempre à vista."
        description="Mova os exemplos pelo seletor. A alternativa por teclado é parte do padrão."
      >
        <div className={s.kanban}>
          {['Novos leads', 'Em contato', 'Qualificados'].map((column) => (
            <div key={column}>
              <h3>
                {column}
                <span>{Object.values(stage).filter((v) => v === column).length}</span>
              </h3>
              {Object.entries(stage)
                .filter(([, value]) => value === column)
                .map(([name]) => (
                  <LeadCard
                    key={name}
                    lead={exampleLeads.find((lead) => lead.company === name)}
                    stage={column}
                    onStageChange={(value) => setStage({ ...stage, [name]: value })}
                  />
                ))}
            </div>
          ))}
        </div>
      </Section>
    );
  return (
    <>
      <Section title="Pessoas, marcas e arquivos.">
        <div className={s.canvas}>
          <span className={s.avatar}>AV</span>
          <span className={s.avatar}>HF</span>
          <span className={s.avatar}>CF</span>
          <div className={s.dividerVertical} />
          <span className={s.miniBrand}>media.on</span>
          <span className={s.muted}>/</span>
          <span>Feira de negócios</span>
        </div>
      </Section>
      <Section
        title="Selecionar um arquivo"
        description="Prévia local. O arquivo não é enviado para nenhum serviço."
      >
        <div className={s.uploadArea}>
          <Upload size={26} />
          <strong>Adicione um material à demonstração</strong>
          <p>PNG, JPG, WebP ou PDF · até 10 MB</p>
          <input
            type="file"
            aria-label="Selecionar material de demonstração"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            onChange={(e) => {
              const chosen = e.target.files?.[0];
              setFileError('');
              if (!chosen) return;
              if (chosen.size > 10 * 1024 * 1024) {
                setFileError('O arquivo deve ter até 10 MB.');
                setFile(null);
                return;
              }
              if (
                !['image/png', 'image/jpeg', 'image/webp', 'application/pdf'].includes(chosen.type)
              ) {
                setFileError('Selecione um PNG, JPG, WebP ou PDF.');
                setFile(null);
                return;
              }
              setFile({ name: chosen.name, size: chosen.size });
            }}
          />
          {fileError && <Alert tone="danger" title={fileError} />}
        </div>
        {file && (
          <div className={s.attachment}>
            <FileText size={20} />
            <span>
              <strong>{file.name}</strong>
              <small>{(file.size / 1024).toFixed(1)} KB · Somente neste navegador</small>
            </span>
            <Button
              variant="ghost"
              aria-label="Remover arquivo da prévia"
              onClick={() => setFile(null)}
            >
              <X size={16} />
            </Button>
          </div>
        )}
      </Section>
    </>
  );
}
