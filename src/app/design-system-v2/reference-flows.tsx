'use client';

import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Circle,
  Info,
  MoreHorizontal,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  ActionMenu,
  Avatar,
  Button,
  ChoiceCard,
  Dialog,
  FormField,
  IconButton,
  Input,
  Select,
  Status,
  type useToast,
} from '../../components/ds-v2';
import { Stage } from './specimen-ui';
import { InviteMembersDialog } from './invite-specimen';
import s from './reference-patterns.module.css';
type Notify = ReturnType<typeof useToast>['notify'];

export function MiniPreview({ type = 'Display' }: { type?: string }) {
  return (
    <span className={s.miniPreview}>
      <span className={s.miniTop} />
      {type === 'Social' || type === 'Grade' ? (
        <span className={s.miniColumns}>
          <span />
          <span />
        </span>
      ) : type !== 'Sem banner' ? (
        <span
          className={s.miniHero}
          style={type === 'Discreto' || type === 'E-mail' ? { height: 12 } : undefined}
        />
      ) : null}
      <span className={s.miniLines}>
        <i />
        <i />
        <i />
      </span>
    </span>
  );
}

export function AppearanceExample({ notify }: { notify: Notify }) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState('Destaque');
  const [draft, setDraft] = useState(saved);
  const options = [
    { name: 'Destaque', description: 'Banner acima dos produtos.' },
    { name: 'Discreto', description: 'Faixa compacta no cabeçalho.' },
    { name: 'Grade', description: 'Produtos em primeiro plano.' },
    { name: 'Sem banner', description: 'Somente marca e catálogo.' },
  ];
  return (
    <Stage title="Escolha visual em modal">
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ width: 200 }}>
          <MiniPreview type={saved} />
        </div>
        <div>
          <strong>Aparência da vitrine</strong>
          <p style={{ color: 'var(--muted)' }}>{saved}</p>
          <Button
            onClick={() => {
              setDraft(saved);
              setOpen(true);
            }}
          >
            Alterar aparência
          </Button>
        </div>
      </div>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Aparência da vitrine"
        description="Escolha como apresentar as mídias do portal."
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              variant="primary"
              onClick={() => {
                setSaved(draft);
                setOpen(false);
                notify('Aparência atualizada neste exemplo.');
              }}
            >
              Salvar alterações
            </Button>
          </>
        }
      >
        <div role="radiogroup" aria-label="Aparência da vitrine" className={s.choiceGridTwo}>
          {options.map((item) => (
            <ChoiceCard
              key={item.name}
              name="appearance"
              title={item.name}
              description={item.description}
              checked={draft === item.name}
              onChange={() => setDraft(item.name)}
              preview={
                item.name === 'Sem banner' ? (
                  <span className={s.miniPreview}>
                    <span className={s.miniTop} />
                    <span className={s.miniLines}>
                      <i />
                      <i />
                    </span>
                  </span>
                ) : (
                  <MiniPreview type={item.name} />
                )
              }
            />
          ))}
        </div>
      </Dialog>
    </Stage>
  );
}

export function MemberCards({ notify }: { notify: Notify }) {
  const [members, setMembers] = useState([
    { name: 'Ana Lima', email: 'ana.lima@example.com', role: 'Administrador', status: 'Ativo' },
    {
      name: 'Pedro Costa',
      email: 'pedro.costa@example.com',
      role: 'Editor',
      status: 'Convite expirado',
    },
    {
      name: 'Bia Souza',
      email: 'bia.souza@example.com',
      role: 'Leitor',
      status: 'Convite pendente',
    },
  ]);
  const [open, setOpen] = useState(false);
  const [inviteVersion, setInviteVersion] = useState(0);
  return (
    <div className={s.formStack}>
      <div className={s.entityList}>
        {members.map((member) => (
          <article
            key={member.email}
            className={s.entity}
            data-tone={
              member.status === 'Convite expirado'
                ? 'amber'
                : member.status === 'Convite pendente'
                  ? 'blue'
                  : 'neutral'
            }
          >
            <div className={s.entityMain}>
              <Avatar name={member.name} shape="square" size={40} tone="neutral" />
              <div className={s.entityInfo}>
                <div>
                  <strong>{member.name}</strong>
                  <Status
                    variant="soft"
                    value={member.status}
                    tone={
                      member.status === 'Ativo'
                        ? 'green'
                        : member.status === 'Convite expirado'
                          ? 'amber'
                          : 'blue'
                    }
                  />
                </div>
                <p>{member.email}</p>
              </div>
              <Select
                compact
                label={`Papel de ${member.name}`}
                value={member.role}
                onValueChange={(role) =>
                  setMembers((previous) =>
                    previous.map((item) =>
                      item.email === member.email ? { ...item, role } : item,
                    ),
                  )
                }
                options={['Administrador', 'Editor', 'Leitor'].map((value) => ({
                  value,
                  label: value,
                }))}
              />
              <ActionMenu
                label={`Opções de ${member.name}`}
                simple
                trigger={
                  <IconButton
                    label={`Opções de ${member.name}`}
                    icon={MoreHorizontal}
                    variant="ghost"
                  />
                }
                items={[
                  {
                    label: 'Remover',
                    icon: Trash2,
                    danger: true,
                    onSelect: () => {
                      setMembers((previous) =>
                        previous.filter((item) => item.email !== member.email),
                      );
                      notify('Membro removido somente da demonstração.');
                    },
                  },
                ]}
              />
            </div>
            {member.status !== 'Ativo' && (
              <div className={s.entityNotice}>
                {member.status === 'Convite expirado' ? (
                  <AlertCircle size={14} />
                ) : (
                  <Info size={14} />
                )}
                <span>
                  {member.status === 'Convite expirado'
                    ? 'O convite venceu. Gere um novo para continuar.'
                    : 'Aguardando a pessoa aceitar o convite.'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMembers((previous) =>
                      previous.map((item) =>
                        item.email === member.email
                          ? {
                              ...item,
                              status:
                                member.status === 'Convite expirado' ? 'Convite pendente' : 'Ativo',
                            }
                          : item,
                      ),
                    );
                    notify(
                      member.status === 'Convite expirado'
                        ? 'Convite renovado no exemplo. Nenhum e-mail foi enviado.'
                        : 'Aceite simulado. Nenhum acesso real foi concedido.',
                    );
                  }}
                >
                  {member.status === 'Convite expirado' ? 'Renovar convite' : 'Simular aceite'}
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Button
          icon={Plus}
          onClick={() => {
            setInviteVersion((version) => version + 1);
            setOpen(true);
          }}
        >
          Adicionar membro
        </Button>
        <Button variant="primary" onClick={() => notify('Papéis salvos somente neste exemplo.')}>
          Salvar papéis
        </Button>
      </div>
      <small style={{ color: 'var(--muted)' }}>
        Prévia local de permissões e convites. Nenhum acesso é concedido.
      </small>
      <InviteMembersDialog
        key={inviteVersion}
        open={open}
        onClose={() => setOpen(false)}
        members={members}
        onInvite={(next) => {
          setMembers((previous) => [...previous, ...next]);
          notify(`${next.length} convite(s) adicionado(s) ao exemplo. Nenhum e-mail enviado.`);
        }}
      />
    </div>
  );
}

export function SetupChecklist() {
  const [portalName, setPortalName] = useState('Francal 2026');
  const [done, setDone] = useState(['Marca e identidade']);
  const [open, setOpen] = useState<string | null>(null);
  const tasks = [
    { name: 'Marca e identidade', text: 'Logo, cor do portal e nome público.' },
    { name: 'Catálogo de mídias', text: 'Formatos e condições comerciais.' },
    { name: 'Equipe do portal', text: 'Responsáveis e papéis de acesso.' },
    { name: 'Revisão da vitrine', text: 'Confira a apresentação antes de publicar.' },
  ];
  return (
    <div className={s.checklist}>
      <details open>
        <summary>
          Preparar o portal{' '}
          <small>
            {done.length} de {tasks.length} concluídos
          </small>
        </summary>
        <ul>
          {tasks.map((task) => (
            <li key={task.name} data-done={done.includes(task.name) || undefined}>
              {done.includes(task.name) ? <CheckCircle2 size={17} /> : <Circle size={17} />}
              <div>
                <strong>{task.name}</strong>
                <p>{task.text}</p>
              </div>
              <Button onClick={() => setOpen(task.name)}>
                {done.includes(task.name) ? 'Revisar' : 'Configurar'}
              </Button>
            </li>
          ))}
        </ul>
      </details>
      <details>
        <summary>
          Integrações{' '}
          <small>
            Opcional <ChevronDown size={12} />
          </small>
        </summary>
        <ul>
          {['Credenciamento CDP', 'Notificações por e-mail'].map((name) => (
            <li key={name}>
              <Circle size={17} />
              <div>
                <strong>{name}</strong>
                <p>Conexão ainda não configurada.</p>
              </div>
              <Button onClick={() => setOpen(name)}>Ver configuração</Button>
            </li>
          ))}
        </ul>
      </details>
      <Dialog
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        title={open ?? 'Configuração'}
        description="Prévia da preparação do portal."
        footer={
          <>
            <Button onClick={() => setOpen(null)}>Voltar</Button>
            {open && tasks.some((task) => task.name === open) && (
              <Button
                variant="primary"
                onClick={() => {
                  setDone((previous) => [...new Set([...previous, open])]);
                  setOpen(null);
                }}
              >
                Marcar como concluído
              </Button>
            )}
          </>
        }
      >
        {open === 'Marca e identidade' ? (
          <div className={s.formStack}>
            <FormField id="setup-portal" label="Nome público">
              <Input
                id="setup-portal"
                value={portalName}
                onChange={(event) => setPortalName(event.target.value)}
              />
            </FormField>
            <p>Este exemplo registra apenas o progresso da revisão.</p>
          </div>
        ) : (
          <p>
            {open === 'Catálogo de mídias'
              ? 'Revise os formatos, as medidas e os preços disponíveis no catálogo.'
              : open === 'Equipe do portal'
                ? 'Confira os responsáveis e os papéis antes de finalizar a configuração.'
                : open === 'Revisão da vitrine'
                  ? 'Confira a apresentação da marca e dos produtos em desktop e celular.'
                  : 'Esta composição demonstra o estado da integração. Não inicia uma conexão externa.'}
          </p>
        )}
      </Dialog>
    </div>
  );
}
