'use client';

import {
  Boxes,
  ChartNoAxesColumn,
  CheckCheck,
  FileSignature,
  FileText,
  KeyRound,
  LayoutDashboard,
  Lock,
  Megaphone,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';

import { AuthShowcase, ShowcaseLayer } from './auth-split';
import { Badge } from './badge';
import { Button } from './button';
import { LineChart, type ChartDatum } from './charts';
import { Avatar, AvatarGroup, BrandMark, IconTile, MediaOnMark } from './identity';
import { MetricStrip } from './metric-strip';
import { Timeline } from './timeline';
import s from './auth-scenes.module.css';

/** O momento da página de acesso: muda a chamada e a cena do painel da marca. */
export type AuthSceneVariant = 'login' | 'invite' | 'code' | 'recover';

/* Tudo aqui é fictício de propósito: nenhum cliente aparece numa tela de acesso. */
const PORTAL = 'Feira Exemplo 2026';

const PITCH: Record<AuthSceneVariant, { eyebrow: string; title: string; highlight: string }> = {
  login: {
    eyebrow: 'MediaOn · Ad Manager',
    title: 'Campanhas, mídia e leads das suas feiras',
    highlight: 'em um só lugar.',
  },
  invite: {
    eyebrow: 'Primeiro acesso',
    title: 'Seu portal já está pronto.',
    highlight: 'Falta só a sua senha.',
  },
  code: {
    eyebrow: 'Acesso sem senha',
    title: 'Um código no seu e-mail',
    highlight: 'e você está dentro.',
  },
  recover: {
    eyebrow: 'Recuperação de senha',
    title: 'Uma senha nova',
    highlight: 'em poucos minutos.',
  },
};

/**
 * O painel da marca de cada momento do acesso — a chamada e uma cena em camadas montada com os
 * componentes do DS: entrar (o produto em uso), convite (o portal que espera a pessoa), código
 * (o e-mail com o código) e recuperação (o link e a senha nova). Decorativo e inerte.
 */
export function AuthScene({ variant }: { variant: AuthSceneVariant }) {
  const pitch = PITCH[variant];
  return (
    <AuthShowcase eyebrow={pitch.eyebrow} title={pitch.title} highlight={pitch.highlight}>
      {variant === 'login' && <LoginScene />}
      {variant === 'invite' && <InviteScene />}
      {variant === 'code' && <CodeScene />}
      {variant === 'recover' && <RecoverScene />}
    </AuthShowcase>
  );
}

/* ——— Entrar: o produto em uso ——— */

const NAV = [
  { label: 'Visão geral', icon: LayoutDashboard, active: true },
  { label: 'Campanhas', icon: Megaphone },
  { label: 'Pedidos de inserção', icon: FileText },
  { label: 'Leads', icon: UsersRound },
  { label: 'Inventário', icon: Boxes },
  { label: 'Métricas', icon: ChartNoAxesColumn },
];

const WEEKS: ChartDatum[] = [
  { label: '04/08', values: { leads: 182 } },
  { label: '11/08', values: { leads: 214 } },
  { label: '18/08', values: { leads: 198 } },
  { label: '25/08', values: { leads: 260 } },
  { label: '01/09', values: { leads: 311 } },
  { label: '08/09', values: { leads: 296 } },
  { label: '15/09', values: { leads: 354 } },
  { label: '22/09', values: { leads: 402 } },
];

function LoginScene() {
  return (
    <>
      <ShowcaseLayer top={28} left={40} width={880} fade>
        <div className={s.app}>
          <div className={s.side}>
            <MediaOnMark size="sm" />
            <div className={s.portal}>
              <BrandMark name={PORTAL} size="xs" variant="soft" decorative />
              <span>{PORTAL}</span>
            </div>
            <ul className={s.nav}>
              {NAV.map(({ label, icon: Icon, active }) => (
                <li key={label} data-active={active || undefined}>
                  <Icon aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
          <div className={s.content}>
            <div className={s.head}>
              <strong>Visão geral</strong>
              <span>{PORTAL} · setembro</span>
            </div>
            <MetricStrip
              items={[
                { label: 'Receita do mês', value: 'R$ 182,4 mil', hint: '9 pedidos assinados' },
                { label: 'Campanhas veiculando', value: '14', hint: '3 começam esta semana' },
                { label: 'Leads no mês', value: '1.286', hint: '402 na última semana' },
              ]}
            />
            <div className={s.chart}>
              <strong>Leads por semana</strong>
              <LineChart
                label="Leads por semana"
                data={WEEKS}
                series={[{ key: 'leads', label: 'Leads' }]}
                height={180}
                area
              />
            </div>
          </div>
        </div>
      </ShowcaseLayer>

      <ShowcaseLayer top={-8} right={24} width={336} float delay={180}>
        <div className={s.notice}>
          <IconTile icon={FileSignature} tone="green" size="sm" />
          <span className={s.noticeText}>
            <strong>PI-2026-0042 assinado</strong>
            <span>{PORTAL} · R$ 48.000,00</span>
          </span>
          <span className={s.time}>agora</span>
        </div>
      </ShowcaseLayer>

      <ShowcaseLayer bottom={56} left={20} width={312} float delay={320}>
        <div className={s.lead}>
          <Avatar name="Marina Costa" size="md" />
          <span className={s.noticeText}>
            <strong>Marina Costa</strong>
            <span>Loja Aurora · pela Vitrine</span>
          </span>
          <Badge variant="text" size="sm" tone="teal">
            Novo lead
          </Badge>
        </div>
      </ShowcaseLayer>
    </>
  );
}

/* ——— Convite: o portal que espera a pessoa ——— */

function InviteScene() {
  return (
    <>
      <ShowcaseLayer top={8} left={40} width={372} float delay={60}>
        <div className={s.invite}>
          <div className={s.inviteHead}>
            <BrandMark name={PORTAL} size="md" decorative />
            <span className={s.noticeText}>
              <strong>{PORTAL}</strong>
              <span>Portal do organizador</span>
            </span>
          </div>
          <div className={s.inviteRow}>
            <span className={s.rowLabel}>Convite de</span>
            <span className={s.person}>
              <Avatar name="Ana Ribeiro" size="xs" />
              Ana Ribeiro
            </span>
          </div>
          <div className={s.inviteRow}>
            <span className={s.rowLabel}>Seu acesso</span>
            <Badge variant="text" size="sm" tone="violet">
              Anunciante
            </Badge>
          </div>
          <ul className={s.access}>
            {[
              { icon: Megaphone, label: 'Campanhas e briefings' },
              { icon: FileText, label: 'Pedidos de inserção' },
              { icon: UsersRound, label: 'Leads da Vitrine' },
            ].map(({ icon: Icon, label }) => (
              <li key={label}>
                <Icon aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </ShowcaseLayer>

      <ShowcaseLayer top={150} right={28} width={256} float delay={220}>
        <div className={s.steps}>
          <Timeline
            label="Primeiro acesso"
            variant="steps"
            items={[
              { title: 'Convite aceito', state: 'done' },
              { title: 'Definir a senha', state: 'current' },
              { title: 'Abrir o portal', state: 'upcoming' },
            ]}
          />
        </div>
      </ShowcaseLayer>

      <ShowcaseLayer bottom={104} left={132} width={280} float delay={360}>
        <div className={s.team}>
          <span className={s.noticeText}>
            <strong>Equipe do portal</strong>
            <span>6 pessoas já estão lá</span>
          </span>
          <AvatarGroup
            names={[
              'Ana Ribeiro',
              'Bruno Lima',
              'Carla Mendes',
              'Diego Alves',
              'Eva Prado',
              'Felipe Rocha',
            ]}
            max={4}
            size="sm"
          />
        </div>
      </ShowcaseLayer>
    </>
  );
}

/* ——— Código: o e-mail com o código ——— */

const INBOX = [
  { from: 'MediaOn', subject: 'Seu código de acesso', time: 'agora', unread: true },
  { from: PORTAL, subject: 'Briefing aprovado: Vitrine Destaque', time: '09:12' },
  { from: 'MediaOn', subject: 'Resumo da semana do portal', time: 'ontem' },
  { from: PORTAL, subject: 'Novo pedido de inserção para assinar', time: 'seg.' },
];

function CodeScene() {
  return (
    <>
      <ShowcaseLayer top={28} left={40} width={600} fade>
        <div className={s.inbox}>
          <div className={s.inboxHead}>
            <strong>Caixa de entrada</strong>
            <span>4 mensagens</span>
          </div>
          <ul className={s.mails}>
            {INBOX.map((mail) => (
              <li key={mail.subject} data-unread={mail.unread || undefined}>
                <span className={s.mailFrom}>{mail.from}</span>
                <span className={s.mailSubject}>{mail.subject}</span>
                <span className={s.time}>{mail.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </ShowcaseLayer>

      <ShowcaseLayer top={150} left={112} width={352} float delay={200}>
        <div className={s.mail}>
          <MediaOnMark size="sm" />
          <div className={s.noticeText}>
            <strong>Seu código de acesso</strong>
            <span>Digite na tela de acesso do MediaOn.</span>
          </div>
          <div className={s.code}>
            {['4', '8', '2', '9', '1', '6'].map((digit, index) => (
              <span key={index}>{digit}</span>
            ))}
          </div>
          <span className={s.fine}>Uso único. Não compartilhe este código.</span>
        </div>
      </ShowcaseLayer>

      <ShowcaseLayer top={-8} right={28} width={264} float delay={340}>
        <div className={s.chip}>
          <IconTile icon={Lock} tone="green" size="sm" />
          <span className={s.noticeText}>
            <strong>Sem senha</strong>
            <span>Só quem abre o seu e-mail</span>
          </span>
        </div>
      </ShowcaseLayer>
    </>
  );
}

/* ——— Recuperação: o link e a senha nova ——— */

function RecoverScene() {
  return (
    <>
      <ShowcaseLayer top={28} left={40} width={560} fade>
        <div className={s.mailFull}>
          <MediaOnMark size="sm" />
          <div className={s.noticeText}>
            <strong>Criar uma senha nova</strong>
            <span>Recebemos um pedido para trocar a senha da sua conta.</span>
          </div>
          <Button variant="primary" size="sm" icon={KeyRound}>
            Criar senha nova
          </Button>
          <span className={s.fine}>
            Se não foi você, ignore este e-mail: a senha atual continua valendo.
          </span>
        </div>
      </ShowcaseLayer>

      <ShowcaseLayer top={176} right={28} width={276} float delay={200}>
        <div className={s.strength}>
          <span className={s.rowLabel}>Nova senha</span>
          <span className={s.dots}>••••••••••</span>
          <span className={s.meter}>
            <i />
          </span>
          <ul className={s.checks}>
            {['Ao menos 8 caracteres', 'Uma letra', 'Um número'].map((label) => (
              <li key={label}>
                <CheckCheck aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </ShowcaseLayer>

      <ShowcaseLayer bottom={64} left={72} width={300} float delay={340}>
        <div className={s.chip}>
          <IconTile icon={ShieldCheck} tone="green" size="sm" />
          <span className={s.noticeText}>
            <strong>Link de uso único</strong>
            <span>Depois da troca, a senha antiga deixa de valer.</span>
          </span>
        </div>
      </ShowcaseLayer>
    </>
  );
}
