'use client';
import { useId, useState } from 'react';
import { Copy } from 'lucide-react';
import {
  Avatar,
  Button,
  Dialog,
  FormField,
  InlineAlert,
  Input,
  Select,
  Tabs,
} from '../../components/ds-v2';
import s from './workspace-patterns.module.css';
export type DemoMember = { name: string; email: string; role: string; status: string };
export function InviteMembersDialog({
  open,
  onClose,
  members,
  onInvite,
}: {
  open: boolean;
  onClose: () => void;
  members: DemoMember[];
  onInvite: (members: DemoMember[]) => void;
}) {
  const uid = useId();
  const [mode, setMode] = useState('E-mail');
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState('Editor');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const link = `https://mediaon.example/convite/demonstracao?papel=${encodeURIComponent(role)}`;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Convidar para o portal"
      description="Prévia local. Nenhum e-mail ou acesso real será gerado."
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          {mode === 'E-mail' && (
            <Button type="submit" form={`${uid}-invite`} variant="primary">
              Adicionar convites
            </Button>
          )}
        </>
      }
    >
      <div className={s.stack}>
        <Tabs
          label="Forma de convite"
          values={['E-mail', 'Link'].map((label) => ({ id: label, label }))}
          active={mode}
          onChange={(next) => {
            setMode(next);
            setError('');
          }}
        />
        <form
          id={`${uid}-invite`}
          className={s.stack}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const addresses = emails
              .split(/[,;\n]/)
              .map((email) => email.trim().toLowerCase())
              .filter(Boolean);
            const unique = [...new Set(addresses)];
            if (
              !unique.length ||
              unique.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            ) {
              setError('Confira os e-mails. Separe cada endereço com uma vírgula.');
              return;
            }
            const duplicate = unique.find((email) =>
              members.some((member) => member.email.toLowerCase() === email),
            );
            if (duplicate) {
              setError(`${duplicate} já faz parte deste exemplo.`);
              return;
            }
            if (members.length + unique.length > 10) {
              setError(`Há ${10 - members.length} lugares disponíveis neste exemplo.`);
              return;
            }
            onInvite(
              unique.map((email) => ({
                name: email.split('@')[0]!,
                email,
                role,
                status: 'Convite pendente',
              })),
            );
            onClose();
          }}
        >
          {mode === 'E-mail' ? (
            <FormField
              id={`${uid}-emails`}
              label="E-mails"
              hint="Separe vários endereços com vírgulas."
              required
            >
              <Input
                id={`${uid}-emails`}
                value={emails}
                onChange={(event) => {
                  setEmails(event.target.value);
                  setError('');
                }}
                placeholder="ana@empresa.com, pedro@empresa.com"
                error={error || undefined}
              />
            </FormField>
          ) : (
            <FormField id={`${uid}-link`} label="Link de demonstração">
              <Input id={`${uid}-link`} value={link} readOnly />
            </FormField>
          )}
          <FormField id={`${uid}-role`} label="Papel dos novos membros">
            <Select
              id={`${uid}-role`}
              label="Papel dos novos membros"
              value={role}
              onValueChange={(next) => {
                setRole(next);
                setCopied(false);
              }}
              options={['Administrador', 'Editor', 'Leitor'].map((value) => ({
                value,
                label: value,
              }))}
            />
          </FormField>
          {mode === 'Link' && (
            <Button
              icon={Copy}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(link);
                  setCopied(true);
                } catch {
                  setError('Não foi possível copiar. Selecione o link acima.');
                }
              }}
            >
              {copied ? 'Link copiado' : 'Copiar link de exemplo'}
            </Button>
          )}
          {mode === 'Link' && error && <InlineAlert title={error} tone="error" />}
        </form>
        <div className={s.stack}>
          <h3 className={s.sectionHeading}>Membros · {members.length}</h3>
          <div className={s.inviteMembers}>
            {members.map((member) => (
              <div key={member.email} className={s.inviteMember}>
                <Avatar name={member.name} size={32} />
                <div>
                  <strong>{member.name}</strong>
                  <small>{member.email}</small>
                </div>
                <span>{member.role}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={s.seats}>
          <span className={s.seatBars} aria-hidden="true">
            {Array.from({ length: 10 }, (_, index) => (
              <i key={index} data-used={index < members.length} />
            ))}
          </span>
          <span>{members.length} de 10 lugares ocupados</span>
        </div>
      </div>
    </Dialog>
  );
}
