'use client';
import { useEffect, useId, useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import {
  Avatar,
  Button,
  Checkbox,
  ChoiceCard,
  FileDropzone,
  FormField,
  InlineAlert,
  Input,
  Select,
  SettingsSection,
  Status,
  SwitchField,
  Tabs,
  type Notify,
} from '../../components/ds-v2';
import { MemberCards, MiniPreview } from './reference-flows';
import { Stage } from './specimen-ui';
import s from './workspace-patterns.module.css';
const initial = {
  name: 'Francal Feiras',
  slug: 'francal-2026',
  email: 'comercial@example.com',
  city: 'São Paulo',
  timezone: 'America/Sao_Paulo',
  color: '#0875db',
  density: 'Padrão',
  reports: true,
  emails: true,
  summary: true,
  approvals: true,
  newsletter: false,
  frequency: 'Diário',
  logo: null as File | null,
};
const options = (values: string[]) => values.map((value) => ({ value, label: value }));
export function SettingsExample({ notify }: { notify: Notify }) {
  const uid = useId();
  const [tab, setTab] = useState('Empresa');
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [logoUrl, setLogoUrl] = useState<string>();
  const [error, setError] = useState('');
  const dirty =
    JSON.stringify({ ...draft, logo: null }) !== JSON.stringify({ ...saved, logo: null }) ||
    draft.logo !== saved.logo;
  const patch = (value: Partial<typeof initial>) => setDraft((old) => ({ ...old, ...value }));
  useEffect(() => {
    if (!draft.logo) {
      setLogoUrl(undefined);
      return;
    }
    const url = URL.createObjectURL(draft.logo);
    setLogoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [draft.logo]);
  return (
    <Stage
      title="Configurações do portal"
      footer="Preferências e prévias locais. A aparência da aplicação oficial não é alterada."
    >
      <div className={s.stack}>
        <div className={s.settingsHeader}>
          <Avatar name={draft.name} src={logoUrl} shape="square" size={48} tone="blue" />
          <div>
            <h3>{draft.name || 'Seu portal'}</h3>
            <p>Empresa e preferências do portal</p>
          </div>
        </div>
        <Tabs
          label="Configurações do portal"
          values={['Empresa', 'Aparência', 'Equipe', 'Notificações', 'Integrações'].map(
            (label) => ({ id: label, label }),
          )}
          active={tab}
          onChange={setTab}
        />
        {tab === 'Equipe' ? (
          <MemberCards notify={notify} />
        ) : tab === 'Integrações' ? (
          <DirectoryExample />
        ) : (
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              if (
                !draft.name.trim() ||
                !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug) ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)
              ) {
                setTab('Empresa');
                setError(
                  'Informe o nome, um endereço válido e um identificador usando letras minúsculas, números e hífens.',
                );
                return;
              }
              setError('');
              setSaved(draft);
              notify('Configurações salvas nesta demonstração.');
            }}
          >
            {error && <InlineAlert title={error} tone="error" />}
            {tab === 'Empresa' && (
              <>
                <SettingsSection
                  title="Perfil público"
                  description="Como o portal aparece para os anunciantes."
                >
                  <FormField id={`${uid}-name`} label="Nome da empresa" required>
                    <Input
                      id={`${uid}-name`}
                      value={draft.name}
                      onChange={(event) => patch({ name: event.target.value })}
                      maxLength={60}
                    />
                  </FormField>
                  <FormField id={`${uid}-slug`} label="Identificador do portal">
                    <Input
                      id={`${uid}-slug`}
                      value={draft.slug}
                      onChange={(event) => patch({ slug: event.target.value })}
                      prefix="mediaon /"
                    />
                  </FormField>
                  <FormField id={`${uid}-email`} label="E-mail comercial">
                    <Input
                      id={`${uid}-email`}
                      type="email"
                      value={draft.email}
                      onChange={(event) => patch({ email: event.target.value })}
                    />
                  </FormField>
                </SettingsSection>
                <SettingsSection
                  title="Marca da empresa"
                  description="Exibida no portal e nos materiais selecionados."
                >
                  <div className={s.row}>
                    <Avatar name={draft.name} src={logoUrl} size={48} shape="square" />
                    {draft.logo && (
                      <Button variant="ghost" onClick={() => patch({ logo: null })}>
                        Remover logo
                      </Button>
                    )}
                  </div>
                  <FileDropzone
                    multiple={false}
                    accept="image/png,image/jpeg"
                    hint="PNG ou JPG, até 2 MB."
                    onFiles={(files) => {
                      const file = files[0];
                      if (!file) return;
                      if (
                        !['image/png', 'image/jpeg'].includes(file.type) ||
                        file.size > 2 * 1024 * 1024 ||
                        !file.size
                      ) {
                        setError('Escolha um PNG ou JPG de até 2 MB.');
                        return;
                      }
                      setError('');
                      patch({ logo: file });
                    }}
                  />
                  <Checkbox
                    label="Usar a marca nos relatórios"
                    checked={draft.reports}
                    onChange={(event) => patch({ reports: event.target.checked })}
                  />
                  <Checkbox
                    label="Usar a marca nos e-mails do portal"
                    checked={draft.emails}
                    onChange={(event) => patch({ emails: event.target.checked })}
                  />
                </SettingsSection>
                <SettingsSection
                  title="Localização"
                  description="Referência para horários e agenda."
                >
                  <div className={s.grid}>
                    <FormField id={`${uid}-city`} label="Cidade">
                      <Input
                        id={`${uid}-city`}
                        value={draft.city}
                        onChange={(event) => patch({ city: event.target.value })}
                      />
                    </FormField>
                    <FormField id={`${uid}-tz`} label="Fuso horário">
                      <Select
                        id={`${uid}-tz`}
                        label="Fuso horário"
                        value={draft.timezone}
                        onValueChange={(timezone) => patch({ timezone })}
                        options={[
                          { value: 'America/Sao_Paulo', label: 'São Paulo · UTC−3' },
                          { value: 'America/Manaus', label: 'Manaus · UTC−4' },
                          { value: 'America/Rio_Branco', label: 'Rio Branco · UTC−5' },
                        ]}
                      />
                    </FormField>
                  </div>
                </SettingsSection>
              </>
            )}
            {tab === 'Aparência' && (
              <>
                <SettingsSection
                  title="Cor do portal"
                  description="A cor aparece nas ações da prévia abaixo."
                >
                  <div className={s.colors}>
                    {['#0875db', '#087f6b', '#6b4dc5', '#41474f'].map((color) => (
                      <button
                        type="button"
                        className={s.color}
                        key={color}
                        aria-label={`Cor ${color}`}
                        aria-pressed={draft.color === color}
                        style={{ background: color }}
                        onClick={() => patch({ color })}
                      >
                        {draft.color === color && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                  <FormField id={`${uid}-color`} label="Cor personalizada">
                    <Input
                      id={`${uid}-color`}
                      type="color"
                      value={draft.color}
                      onChange={(event) => patch({ color: event.target.value })}
                    />
                  </FormField>
                </SettingsSection>
                <SettingsSection
                  title="Densidade da tabela"
                  description="Ajuste o espaço entre os registros."
                >
                  <div className={s.grid} role="radiogroup" aria-label="Densidade da tabela">
                    {['Padrão', 'Compacta'].map((density) => (
                      <ChoiceCard
                        key={density}
                        name={`${uid}-density`}
                        title={density}
                        description={
                          density === 'Padrão'
                            ? 'Mais espaço para leitura.'
                            : 'Mais registros na mesma tela.'
                        }
                        checked={draft.density === density}
                        onChange={() => patch({ density })}
                      />
                    ))}
                  </div>
                </SettingsSection>
                <SettingsSection
                  title="Prévia"
                  description="A escolha fica restrita a este exemplo."
                >
                  <div className={s.preview} data-density={draft.density}>
                    <div className={s.previewHead}>
                      <strong>{draft.name}</strong>
                      <span style={{ background: draft.color }}>Nova campanha</span>
                    </div>
                    {['Lançamento primavera', 'Coleção Essencial', 'Retargeting · Outubro'].map(
                      (name) => (
                        <div className={s.previewRow} key={name}>
                          <span>{name}</span>
                          <Status value="Ativa" tone="green" />
                        </div>
                      ),
                    )}
                  </div>
                </SettingsSection>
              </>
            )}
            {tab === 'Notificações' && (
              <>
                <SettingsSection
                  title="Operação"
                  description="Atualizações sobre o trabalho do portal."
                >
                  <SwitchField
                    label="Pedidos e aprovações"
                    description="Quando um pedido precisa da sua revisão."
                    checked={draft.approvals}
                    onCheckedChange={(approvals) => patch({ approvals })}
                  />
                  <SwitchField
                    label="Resumo de campanhas"
                    description="Investimento, entregas e campanhas ativas."
                    checked={draft.summary}
                    onCheckedChange={(summary) => patch({ summary })}
                  />
                  <Select
                    label="Frequência do resumo"
                    value={draft.frequency}
                    onValueChange={(frequency) => patch({ frequency })}
                    disabled={!draft.summary}
                    options={options(['Diário', 'Semanal'])}
                  />
                </SettingsSection>
                <SettingsSection title="Novidades" description="Comunicações opcionais do produto.">
                  <SwitchField
                    label="Novos recursos do MediaOn"
                    checked={draft.newsletter}
                    onCheckedChange={(newsletter) => patch({ newsletter })}
                  />
                </SettingsSection>
              </>
            )}
            <div className={s.footer}>
              <span role="status">
                {dirty ? 'Alterações não salvas' : 'Todas as alterações salvas neste exemplo'}
              </span>
              <div className={s.row}>
                <Button
                  disabled={!dirty}
                  onClick={() => {
                    setDraft(saved);
                    setError('');
                  }}
                >
                  Descartar
                </Button>
                <Button type="submit" variant="primary" disabled={!dirty}>
                  Salvar alterações
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </Stage>
  );
}

export function DirectoryExample() {
  const [saved, setSaved] = useState(['Editor', 'Administrador', 'Leitor']);
  const [roles, setRoles] = useState(saved);
  const [message, setMessage] = useState('');
  const dirty = roles.join() !== saved.join();
  return (
    <div className={s.stack}>
      <div className={s.spread}>
        <div className={s.row}>
          <Link2 size={20} />
          <div>
            <h3 className={s.sectionHeading}>Papéis por grupo</h3>
            <span className={s.muted}>Diretório da empresa → Portal Francal</span>
          </div>
        </div>
        <Status variant="soft" value="Demonstração" tone="neutral" />
      </div>
      <InlineAlert title="Mapeamento ilustrativo">
        Não há conexão com diretórios nem sincronização de usuários.
      </InlineAlert>
      <div>
        {[
          ['Comercial', '12 pessoas'],
          ['Gestores do portal', '3 pessoas'],
          ['Parceiros', '8 pessoas'],
        ].map(([name, count], index) => (
          <div className={s.groupRow} key={name}>
            <div>
              <strong>{name}</strong>
              <small>{count}</small>
            </div>
            <Select
              label={`Papel do grupo ${name}`}
              value={roles[index]}
              options={options(['Administrador', 'Editor', 'Leitor'])}
              onValueChange={(value) =>
                setRoles((old) => old.map((role, position) => (index === position ? value : role)))
              }
            />
          </div>
        ))}
      </div>
      <div className={s.footer}>
        <span role="status">{message}</span>
        <div className={s.row}>
          <Button
            disabled={!dirty}
            onClick={() => {
              setRoles(saved);
              setMessage('');
            }}
          >
            Descartar
          </Button>
          <Button
            variant="primary"
            disabled={!dirty}
            onClick={() => {
              setSaved(roles);
              setMessage('Mapeamento salvo apenas na prévia.');
            }}
          >
            Salvar mapeamento
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PrivacyExample({ notify }: { notify: Notify }) {
  const [appearance, setAppearance] = useState('Completo');
  const [metrics, setMetrics] = useState(false);
  const [language, setLanguage] = useState('Português');
  return (
    <div className={s.stack}>
      <SettingsSection
        title="Aviso de privacidade"
        description="Escolha como o visitante encontra as preferências."
      >
        <div className={s.grid} role="radiogroup" aria-label="Formato do aviso">
          {['Completo', 'Compacto'].map((name) => (
            <ChoiceCard
              key={name}
              name="privacy-appearance"
              title={name}
              description={
                name === 'Completo'
                  ? 'Preferências visíveis no primeiro acesso.'
                  : 'Resumo e acesso às preferências.'
              }
              checked={appearance === name}
              onChange={() => setAppearance(name)}
              preview={<MiniPreview type={name === 'Completo' ? 'Display' : 'Discreto'} />}
            />
          ))}
        </div>
        <Select
          label="Idioma do aviso"
          value={language}
          onValueChange={setLanguage}
          options={options(['Português', 'English', 'Español'])}
        />
      </SettingsSection>
      <SettingsSection
        title="Preferências"
        description="Prévia visual, sem aplicar cookies ou consentimentos."
      >
        <SwitchField label="Cookies essenciais" checked disabled onCheckedChange={() => {}} />
        <SwitchField label="Métricas de uso" checked={metrics} onCheckedChange={setMetrics} />
      </SettingsSection>
      <div className={s.preview}>
        <div className={s.previewHead}>
          <strong>
            {language === 'English'
              ? 'Your privacy'
              : language === 'Español'
                ? 'Tu privacidad'
                : 'Sua privacidade'}
          </strong>
          <span style={{ background: 'var(--action)' }}>
            {appearance === 'Completo' ? 'Preferências' : 'Saiba mais'}
          </span>
        </div>
        <div className={s.previewRow}>
          Essenciais ativos · Métricas {metrics ? 'ativadas' : 'desativadas'}
        </div>
      </div>
      <div className={s.spread}>
        <span className={s.muted}>Textos ilustrativos para revisão visual.</span>
        <Button
          variant="primary"
          onClick={() => notify('Preferências salvas apenas neste exemplo.')}
        >
          Salvar preferências
        </Button>
      </div>
    </div>
  );
}
