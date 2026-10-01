'use client';

import { useState } from 'react';
import {
  SelectControl,
  InputControl,
  TextareaControl,
  selectOptions,
  useFormValidation,
} from './controls';
import {
  ArrowRight,
  Bell,
  Building2,
  Check,
  ChevronRight,
  CircleCheck,
  Layers2,
  Mail,
  Megaphone,
  Radio,
  UsersRound,
} from 'lucide-react';
import { useCampaigns } from '../campanhas/campaign-context';
import { delivery, number } from '../campanhas/campaign-data';
import { navigate, type DemoRecord, type ScreenKey, type ViewMode } from './workspace-data';
import { SummaryStrip, Tabs, Status } from './workspace-ui';
import { formatCurrency as currency } from './workspace-ui';
import s from './dashboard.module.css';
import a from './application.module.css';

export function OverviewScreen({
  mode,
  data,
}: {
  mode: ViewMode;
  data: Record<ScreenKey, DemoRecord[]>;
}) {
  const { rows } = useCampaigns();
  const campaigns =
    mode === 'anunciante' ? rows.filter((row) => row.advertiser === 'Aurora') : rows;
  const active = campaigns.filter((row) => row.status === 'active');
  return (
    <div className={a.screenBody}>
      <div className={a.welcome}>
        <div>
          <h2>
            {mode === 'anunciante'
              ? 'Campanhas e resultados'
              : mode === 'plataforma'
                ? 'Visão da plataforma'
                : 'Resumo do portal'}
          </h2>
        </div>
        <span className={a.periodPill}>Setembro de 2026</span>
      </div>
      <SummaryStrip
        items={
          mode === 'plataforma'
            ? [
                { label: 'Portais', value: data.portais.length },
                { label: 'Usuários', value: data.usuarios.length },
                { label: 'Integrações', value: data.webhooks.length },
                { label: 'Eventos recebidos', value: data['fila-leads'].length },
              ]
            : [
                {
                  label: 'Campanhas ativas',
                  value: active.length,
                  hint: `${campaigns.length} campanhas no total`,
                },
                {
                  label: 'Verba planejada',
                  value: currency(campaigns.reduce((sum, row) => sum + row.budget, 0)),
                  hint: 'Campanhas do período',
                },
                {
                  label: 'Impressões entregues',
                  value: number(campaigns.reduce((sum, row) => sum + row.delivered, 0)),
                  hint: 'Acumulado das campanhas',
                },
                {
                  label: 'Oportunidades',
                  value: data.leads.length,
                  hint: `${data.leads.filter((row) => row.status === 'Novo').length} novos leads`,
                },
              ]
        }
      />
      {mode === 'plataforma' ? (
        <div className={a.homeColumns}>
          <section className={a.homePanel}>
            <div className={a.panelHeading}>
              <h2>Portais da plataforma</h2>
              <button onClick={() => navigate('portais', mode)}>
                Ver todos
                <ArrowRight size={14} />
              </button>
            </div>
            {data.portais.map((portal) => (
              <button
                className={a.activityRow}
                key={portal.id}
                onClick={() => navigate('portais', mode, portal.id)}
              >
                <span className={a.activityIcon}>
                  <Building2 size={17} />
                </span>
                <span>
                  <strong>{portal.name}</strong>
                  <small>
                    {portal.company} · {portal.members} membros
                  </small>
                </span>
                <Status value={portal.status} />
              </button>
            ))}
          </section>
          <QuickLinks
            mode={mode}
            items={[
              ['usuarios', 'Gerenciar usuários'],
              ['webhooks', 'Ver integrações'],
              ['importacoes', 'Acompanhar importações'],
              ['fila-leads', 'Entrada de leads'],
            ]}
          />
        </div>
      ) : (
        <>
          <div className={a.homeColumns}>
            <section className={a.homePanel}>
              <div className={a.panelHeading}>
                <div>
                  <h2>Entrega por campanha</h2>
                  <p>Impressões entregues em relação à meta</p>
                </div>
                <button onClick={() => navigate('performance', mode)}>
                  Performance
                  <ArrowRight size={14} />
                </button>
              </div>
              <div className={a.deliveryChart}>
                {campaigns
                  .filter((row) => row.delivered > 0)
                  .map((row) => (
                    <div key={row.id}>
                      <span>{row.advertiser}</span>
                      <div
                        role="meter"
                        aria-label={`Entrega de ${row.advertiser}`}
                        aria-valuenow={delivery(row)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <i style={{ width: `${delivery(row)}%` }} />
                      </div>
                      <strong>{delivery(row)}%</strong>
                    </div>
                  ))}
              </div>
            </section>
            <section className={a.homePanel}>
              <div className={a.panelHeading}>
                <h2>Precisam de atenção</h2>
                <span className={s.count}>3</span>
              </div>
              {[
                {
                  label: 'Pedido aguardando aprovação',
                  detail: 'PI-2026-0044 · Grupo Horizonte',
                  screen: 'pedidos' as ScreenKey,
                },
                {
                  label: 'Novo lead na Vitrine',
                  detail: 'Marina Costa · Casa Forma',
                  screen: 'leads' as ScreenKey,
                },
                {
                  label: 'Materiais para revisão',
                  detail: 'Sua marca em primeiro plano',
                  screen: 'criativos' as ScreenKey,
                },
              ].map((item) => (
                <button
                  key={item.label}
                  className={a.taskRow}
                  onClick={() => navigate(item.screen, mode)}
                >
                  <span className={a.taskDot} />
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.detail}</small>
                  </span>
                  <ChevronRight size={14} />
                </button>
              ))}
            </section>
          </div>
          <div className={a.homeColumns}>
            <section className={a.homePanel}>
              <div className={a.panelHeading}>
                <h2>Campanhas em destaque</h2>
                <button onClick={() => navigate('campanhas', mode)}>
                  Ver campanhas
                  <ArrowRight size={14} />
                </button>
              </div>
              {campaigns.slice(0, 3).map((row) => (
                <button
                  key={row.id}
                  className={a.activityRow}
                  onClick={() => navigate('campanhas', mode, row.id)}
                >
                  <span className={a.activityIcon}>
                    <Megaphone size={17} />
                  </span>
                  <span>
                    <strong>{row.name}</strong>
                    <small>
                      {row.advertiser} · {row.assets.join(', ')}
                    </small>
                  </span>
                  <strong>{currency(row.budget)}</strong>
                </button>
              ))}
            </section>
            <QuickLinks
              mode={mode}
              items={
                mode === 'anunciante'
                  ? [
                      ['catalogo', 'Explorar catálogo'],
                      ['campanhas', 'Planejar campanha'],
                      ['data-on', 'Conhecer minha audiência'],
                    ]
                  : [
                      ['inventario', 'Consultar inventário'],
                      ['publicos', 'Conhecer os públicos'],
                      ['canais', 'Organizar canais'],
                      ['leads', 'Acompanhar oportunidades'],
                    ]
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
function QuickLinks({ mode, items }: { mode: ViewMode; items: [ScreenKey, string][] }) {
  return (
    <section className={a.homePanel}>
      <div className={a.panelHeading}>
        <h2>Acesso rápido</h2>
      </div>
      {items.map(([screen, label]) => (
        <button key={screen} className={a.quickLink} onClick={() => navigate(screen, mode)}>
          {label}
          <ArrowRight size={15} />
        </button>
      ))}
    </section>
  );
}
export type Preferences = {
  members: { name: string; role: string; email: string }[];
  portalName: string;
  company: string;
  email: string;
  description: string;
  color: string;
  campaignAlerts: boolean;
  leadAlerts: boolean;
  weeklySummary: boolean;
};
export const defaultPreferences: Preferences = {
  members: [
    { name: 'Equipe de mídia', role: 'Administrador do portal', email: 'midia@example.invalid' },
    { name: 'Equipe comercial', role: 'Comercial', email: 'comercial@example.invalid' },
    { name: 'Aurora', role: 'Anunciante', email: 'aurora@example.invalid' },
  ],
  portalName: 'Francal',
  company: 'Francal',
  email: 'midia@example.invalid',
  description: 'Conectamos marcas, pessoas e oportunidades de negócio.',
  color: '#0783f8',
  campaignAlerts: true,
  leadAlerts: true,
  weeklySummary: false,
};
export function SettingsScreen({
  brand = false,
  mode,
  preferences,
  save,
}: {
  brand?: boolean;
  mode: ViewMode;
  preferences: Preferences;
  save: (value: Preferences) => void;
}) {
  const [tab, setTab] = useState(
    brand ? 'identidade' : mode === 'anunciante' ? 'perfil' : 'equipe',
  );
  const [draft, setDraft] = useState(preferences);
  const { errors, validate, clearError } = useFormValidation();
  const [saved, setSaved] = useState(false);
  const members = preferences.members;
  return (
    <>
      <div className={s.toolbar}>
        <Tabs
          active={tab}
          onChange={(value) => {
            setTab(value);
            setSaved(false);
          }}
          values={
            brand
              ? [
                  { id: 'identidade', label: 'Identidade visual' },
                  { id: 'dados', label: 'Dados da empresa' },
                ]
              : mode === 'anunciante'
                ? [
                    { id: 'perfil', label: 'Meu perfil' },
                    { id: 'notificacoes', label: 'Notificações' },
                  ]
                : [
                    { id: 'equipe', label: 'Equipe e papéis' },
                    { id: 'notificacoes', label: 'Notificações' },
                    { id: 'integracoes', label: 'Integrações' },
                  ]
          }
        />
      </div>
      <div className={a.settingsLayout}>
        <section>
          {tab === 'equipe' ? (
            <>
              <h2 className={a.sectionHeading}>Pessoas do workspace</h2>
              <p className={a.sectionDescription}>
                Os papéis organizam as responsabilidades de cada pessoa.
              </p>
              <div>
                {members.map((member, index) => (
                  <div key={member.email} className={a.memberRow}>
                    <span className={a.memberAvatar}>
                      <UsersRound size={18} />
                    </span>
                    <span>
                      <strong>{member.name}</strong>
                      <small>{member.email}</small>
                    </span>
                    <SelectControl
                      className={a.memberSelect}
                      label={`Papel de ${member.name}`}
                      compact
                      value={member.role}
                      onValueChange={(value) => {
                        save({
                          ...preferences,
                          members: members.map((row, i) =>
                            i === index ? { ...row, role: value } : row,
                          ),
                        });
                        setSaved(true);
                      }}
                      options={selectOptions([
                        'Administrador do portal',
                        'Comercial',
                        'Anunciante',
                      ])}
                    />
                  </div>
                ))}
              </div>
              <div className={a.inlineNote}>
                <CircleCheck size={17} />
                <p>A atribuição de papéis é apenas visual nesta prévia.</p>
              </div>
            </>
          ) : tab === 'integracoes' ? (
            <>
              <h2 className={a.sectionHeading}>Conexões do portal</h2>
              <p className={a.sectionDescription}>
                A estrutura das integrações, sem conexões externas nesta prévia.
              </p>
              {[
                {
                  name: 'Entrada de leads',
                  description: 'Recebimento de oportunidades do CRM',
                  icon: Radio,
                },
                {
                  name: 'Credenciamento CDP',
                  description: 'Públicos e atualização da base do evento',
                  icon: UsersRound,
                },
                {
                  name: 'E-mails transacionais',
                  description: 'Avisos de campanhas e pedidos de inserção',
                  icon: Mail,
                },
              ].map(({ name, description, icon: Icon }) => (
                <div className={a.integrationRow} key={name}>
                  <Icon size={21} />
                  <span>
                    <strong>{name}</strong>
                    <small>{description}</small>
                  </span>
                  <Status value="Demonstração" />
                </div>
              ))}
            </>
          ) : (
            <form
              noValidate
              onInput={clearError}
              onSubmit={(event) => {
                event.preventDefault();
                if (!validate(event.currentTarget)) return;
                save({ ...draft, members: preferences.members });
                setSaved(true);
              }}
            >
              <h2 className={a.sectionHeading}>
                {tab === 'notificacoes'
                  ? 'Escolha como acompanhar o portal'
                  : tab === 'identidade'
                    ? 'Sua marca no workspace'
                    : tab === 'perfil'
                      ? 'Informações do perfil'
                      : 'Informações da empresa'}
              </h2>
              <p className={a.sectionDescription}>
                {tab === 'notificacoes'
                  ? 'Mantenha por perto as atualizações que importam.'
                  : 'Edite os dados para experimentar a organização da tela.'}
              </p>
              {tab === 'notificacoes' ? (
                <div>
                  {(
                    [
                      {
                        key: 'campaignAlerts',
                        label: 'Campanhas e aprovações',
                        detail: 'Mudanças de etapa e materiais para revisão.',
                      },
                      {
                        key: 'leadAlerts',
                        label: 'Novas oportunidades',
                        detail: 'Leads recebidos e movimentações no funil.',
                      },
                      {
                        key: 'weeklySummary',
                        label: 'Resumo semanal',
                        detail: 'Uma visão consolidada da atividade do portal.',
                      },
                    ] as const
                  ).map(({ key, label, detail }) => (
                    <label className={a.preferenceRow} key={key}>
                      <span>
                        <strong>{label}</strong>
                        <small>{detail}</small>
                      </span>
                      <input
                        type="checkbox"
                        role="switch"
                        checked={draft[key]}
                        onChange={(event) => {
                          setDraft({ ...draft, [key]: event.target.checked });
                          setSaved(false);
                        }}
                      />
                    </label>
                  ))}
                </div>
              ) : (
                <div className={a.formGrid}>
                  <label className={a.wideField}>
                    {tab === 'perfil' ? 'Nome da marca' : 'Nome do portal'}
                    <InputControl
                      required
                      name="portalName"
                      error={errors.portalName}
                      value={draft.portalName}
                      onChange={(event) => {
                        setDraft({ ...draft, portalName: event.target.value });
                        setSaved(false);
                      }}
                    />
                  </label>
                  <label className={a.wideField}>
                    Empresa
                    <InputControl
                      required
                      name="company"
                      error={errors.company}
                      value={draft.company}
                      onChange={(event) => {
                        setDraft({ ...draft, company: event.target.value });
                        setSaved(false);
                      }}
                    />
                  </label>
                  <label className={a.wideField}>
                    E-mail de contato
                    <InputControl
                      required
                      name="email"
                      error={errors.email}
                      type="email"
                      value={draft.email}
                      onChange={(event) => {
                        setDraft({ ...draft, email: event.target.value });
                        setSaved(false);
                      }}
                    />
                  </label>
                  {tab === 'identidade' && (
                    <>
                      <label className={a.wideField}>
                        Descrição
                        <TextareaControl
                          name="description"
                          rows={3}
                          value={draft.description}
                          onChange={(event) => {
                            setDraft({ ...draft, description: event.target.value });
                            setSaved(false);
                          }}
                        />
                      </label>
                      <label>
                        Cor da marca
                        <InputControl
                          name="color"
                          type="color"
                          value={draft.color}
                          onChange={(event) => {
                            setDraft({ ...draft, color: event.target.value });
                            setSaved(false);
                          }}
                        />
                      </label>
                    </>
                  )}
                </div>
              )}
              <div className={a.formActions}>
                <span>Preferências locais da demonstração.</span>
                <button className={a.primaryButton} type="submit">
                  <Check size={15} />
                  Salvar alterações
                </button>
              </div>
            </form>
          )}
          {saved && (
            <p role="status" className={a.savedNote}>
              <Check size={14} />
              Alterações salvas nesta demonstração
            </p>
          )}
        </section>
        <aside className={a.settingsAside}>
          {brand ? (
            <>
              <span className={a.eyebrow}>PRÉVIA DA IDENTIDADE</span>
              <div className={a.brandPreview}>
                <span style={{ background: draft.color }}>
                  <Layers2 size={26} />
                </span>
                <h3>{draft.portalName}</h3>
                <p>{draft.description}</p>
              </div>
            </>
          ) : (
            <>
              <Bell size={24} />
              <h3>Um workspace organizado</h3>
              <p>As configurações acompanham a mesma linguagem das demais áreas do MediaOn.</p>
              <p>Os exemplos não alteram acessos nem enviam notificações.</p>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
