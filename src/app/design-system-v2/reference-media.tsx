'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  Download,
  ExternalLink,
  FileText,
  Settings2,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import {
  Avatar,
  ActionMenu,
  AvatarGroup,
  Button,
  Dialog,
  FileDropzone,
  FileItem,
  Input,
  LinkAction,
  Select,
  Status,
  formatFileSize,
  IconButton,
  type FileItemProps,
} from '../../components/ds-v2';
import { Stage } from './specimen-ui';
import { CampaignArtwork } from './media-workspace';
import s from './reference-patterns.module.css';

export function AvatarExamples() {
  return (
    <div className={s.formStack}>
      <Stage title="Identidade e presença">
        <div className={s.identityGrid}>
          <div className={s.identityCell}>
            <small>Iniciais</small>
            <div>
              <Avatar name="Ana Lima" size={40} />
            </div>
          </div>
          <div className={s.identityCell}>
            <small>Fotografia</small>
            <div>
              <Avatar name="Alex, pessoa fictícia" src="/images/avatar-demo.png" size={40} />
            </div>
          </div>
          <div className={s.identityCell}>
            <small>Sem identificação</small>
            <div>
              <Avatar name="Visitante" fallback="icon" tone="neutral" size={40} />
            </div>
          </div>
          <div className={s.identityCell}>
            <small>Empresa</small>
            <div>
              <Avatar name="Calçados Aurora" shape="square" tone="neutral" size={40} />
            </div>
          </div>
          <div className={s.identityCell}>
            <small>Online</small>
            <div>
              <Avatar name="Ana Lima" size={40} presence="online" />
            </div>
          </div>
          <div className={s.identityCell}>
            <small>Offline</small>
            <div>
              <Avatar name="Pedro Costa" size={40} tone="green" presence="offline" />
            </div>
          </div>
          <div className={s.identityCell}>
            <small>Carregamento</small>
            <div>
              <Avatar name="Ana Lima" size={40} loading />
            </div>
          </div>
          <div className={s.identityCell}>
            <small>Verificado</small>
            <div>
              <Avatar name="Ana Lima" size={40} verified />
            </div>
          </div>
          <div className={s.identityCell}>
            <small>Notificações</small>
            <div>
              <Avatar name="Bia Souza" size={40} tone="amber" notification={3} />
            </div>
          </div>
          <div className={`${s.identityCell} ${s.identityWide}`}>
            <small>Escala · 24 / 32 / 40 / 48</small>
            <div>
              {([24, 32, 40, 48] as const).map((size) => (
                <Avatar key={size} name="Ana Lima" size={size} />
              ))}
            </div>
          </div>
          <div className={`${s.identityCell} ${s.identityWide}`}>
            <small>Responsáveis</small>
            <div>
              <AvatarGroup
                size={32}
                people={[
                  { name: 'Ana Lima' },
                  { name: 'Pedro Costa', tone: 'green' },
                  { name: 'Bia Souza', tone: 'amber' },
                  { name: 'Rafael Santos' },
                  { name: 'Clara Nunes' },
                ]}
              />
              <span>
                Equipe comercial<p>5 pessoas no portal</p>
              </span>
            </div>
          </div>
        </div>
      </Stage>
      <Stage title="Com nome e menu de conta">
        <ActionMenu
          label="Perfil de Ana Lima"
          align="start"
          trigger={
            <Button size="large" className={s.accountTrigger}>
              <Avatar name="Ana Lima" presence="online" />
              <span>Ana Lima</span>
              <ChevronDown size={14} />
            </Button>
          }
          header={
            <>
              <strong>Ana Lima</strong>
              <p>ana.lima@example.com</p>
              <p>Equipe comercial · Francal 2026</p>
            </>
          }
          items={[
            { label: 'Meu perfil', icon: UserRound, href: '#template-configuracoes' },
            { label: 'Gerenciar equipe', icon: Users, href: '#membros' },
            { label: 'Preferências', icon: Settings2, href: '#template-configuracoes' },
            { label: 'Abrir aplicação', icon: ExternalLink, href: '/dashboardv2', separator: true },
          ]}
        />
      </Stage>
    </div>
  );
}

type LocalFile = FileItemProps & { id: number; example?: boolean; file?: File };

function LocalPreview({ file }: { file: File }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return (
    <div className={s.localPreview}>
      <div className={s.localPreviewSurface}>
        {url && file.type.startsWith('image/') ? (
          // eslint-disable-next-line @next/next/no-img-element -- Prévia local com URL revogada ao fechar o diálogo.
          <img src={url} alt={`Prévia de ${file.name}`} />
        ) : (
          <div className={s.localPreviewFallback}>
            <FileText size={28} aria-hidden="true" />
            <strong>Prévia indisponível</strong>
            <p>Baixe o arquivo para consultar o conteúdo no seu computador.</p>
          </div>
        )}
      </div>
      <div className={s.localPreviewMeta}>
        <div>
          <span>
            <FileText size={17} aria-hidden="true" />
          </span>
          <div>
            <strong>{file.name}</strong>
            <small>{formatFileSize(file.size)}</small>
          </div>
        </div>
        {url && (
          <LinkAction href={url} download={file.name} icon={Download}>
            Baixar arquivo
          </LinkAction>
        )}
      </div>
    </div>
  );
}
const initialFiles: LocalFile[] = [
  { id: 1, name: 'campanha-primavera.png', size: 2457600, status: 'ready', example: true },
  { id: 2, name: 'briefing-francal.pdf', size: 245760, status: 'complete', example: true },
];
export function validateLocalFile(file: Pick<File, 'name' | 'size' | 'type'>) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const types: Record<string, string[]> = {
    png: ['image/png'],
    jpg: ['image/jpeg'],
    jpeg: ['image/jpeg'],
    pdf: ['application/pdf'],
    csv: ['text/csv', 'application/vnd.ms-excel'],
  };
  if (!extension || !types[extension] || (file.type && !types[extension]?.includes(file.type)))
    return 'Use PNG, JPG, PDF ou CSV.';
  if (!file.size) return 'O arquivo está vazio.';
  if (file.size > 10 * 1024 * 1024) return 'O limite por arquivo é 10 MB.';
  return null;
}

const fileStateLabels: Record<FileItemProps['status'], string> = {
  ready: 'Pronto para envio',
  uploading: 'Em envio',
  complete: 'Concluído',
  error: 'Falha no envio',
  cancelled: 'Cancelado',
};

export function UploadExample({ attachment = false }: { attachment?: boolean }) {
  const [files, setFiles] = useState<LocalFile[]>(initialFiles);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<File | null>(null);
  const [sample, setSample] = useState<LocalFile | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Todos');
  function receive(incoming: File[]) {
    const errors: string[] = [];
    const accepted: LocalFile[] = [];
    incoming.forEach((file, index) => {
      const reason = validateLocalFile(file);
      if (reason) errors.push(`${file.name}: ${reason}`);
      else
        accepted.push({
          id: Date.now() + index,
          name: file.name,
          size: file.size,
          status: 'ready',
          file,
        });
    });
    setError(errors.join(' '));
    setFiles((previous) => [...previous, ...accepted]);
  }
  const update = (id: number, patch: Partial<LocalFile>) =>
    setFiles((previous) => previous.map((file) => (file.id === id ? { ...file, ...patch } : file)));
  const queue = (
    <div className={s.uploadColumn}>
      {!attachment && (
        <FileDropzone
          accept=".png,.jpg,.jpeg,.pdf,.csv"
          hint="PNG, JPG, PDF ou CSV · até 10 MB por arquivo"
          onFiles={receive}
        />
      )}
      {error && <p role="alert">{error}</p>}
      <div className={s.fileSummary} aria-live="polite">
        <strong>{files.length} arquivos</strong>
        <span>{formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}</span>
        <Status
          value={`${files.filter((file) => file.status === 'complete').length} ${files.filter((file) => file.status === 'complete').length === 1 ? 'concluído' : 'concluídos'}`}
          tone="green"
        />
      </div>
      <div className={s.fileFilters}>
        <Input
          aria-label="Buscar arquivos"
          placeholder="Buscar arquivo…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Select
          label="Situação do arquivo"
          value={filter}
          onValueChange={setFilter}
          options={['Todos', 'Pendentes', 'Concluídos'].map((value) => ({ value, label: value }))}
        />
      </div>
      {files
        .filter(
          (file) =>
            file.name.toLowerCase().includes(query.toLowerCase()) &&
            (filter === 'Todos' ||
              (filter === 'Concluídos' ? file.status === 'complete' : file.status !== 'complete')),
        )
        .map((file) => (
          <FileItem
            key={file.id}
            {...file}
            onPreview={() => (file.file ? setPreview(file.file) : setSample(file))}
            onRemove={() => setFiles((previous) => previous.filter((item) => item.id !== file.id))}
            onCancel={() => update(file.id, { status: 'cancelled' })}
            onRetry={() => update(file.id, { status: 'ready', progress: 0, message: undefined })}
          />
        ))}
      {!files.length && <p>Nenhum arquivo selecionado.</p>}
      {files.length > 0 &&
        !files.some(
          (file) =>
            file.name.toLowerCase().includes(query.toLowerCase()) &&
            (filter === 'Todos' ||
              (filter === 'Concluídos' ? file.status === 'complete' : file.status !== 'complete')),
        ) && <p role="status">Nenhum arquivo corresponde aos filtros.</p>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button
          variant="primary"
          disabled={!files.some((file) => ['ready', 'uploading'].includes(file.status))}
          onClick={() =>
            setFiles((previous) =>
              previous.map((file) => {
                if (file.status === 'ready') return { ...file, status: 'uploading', progress: 25 };
                if (file.status === 'uploading') {
                  const progress = Math.min(100, (file.progress ?? 0) + 25);
                  return { ...file, progress, status: progress === 100 ? 'complete' : 'uploading' };
                }
                return file;
              }),
            )
          }
        >
          {files.some((file) => file.status === 'uploading')
            ? 'Avançar simulação'
            : 'Simular envio'}
        </Button>
        {files.some((file) => file.status === 'uploading') && (
          <Button
            onClick={() =>
              setFiles((previous) =>
                previous.map((file) =>
                  file.status === 'uploading'
                    ? { ...file, status: 'error', message: 'Conexão interrompida' }
                    : file,
                ),
              )
            }
          >
            Simular falha
          </Button>
        )}
        {attachment ? (
          <Button onClick={() => setOpen(true)}>Adicionar anexo</Button>
        ) : (
          <Button onClick={() => setOpen(true)}>Ver em modal</Button>
        )}
      </div>
    </div>
  );
  return (
    <Stage
      title={attachment ? 'Arquivos da campanha' : 'Adicionar arquivos'}
      footer="Seleção e estados locais. Nenhum arquivo é enviado ao servidor."
    >
      <Dialog
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title={preview?.name ?? 'Prévia do arquivo'}
        description={preview ? `${formatFileSize(preview.size)} · Arquivo local` : undefined}
        size="medium"
        footer={<Button onClick={() => setPreview(null)}>Fechar</Button>}
      >
        {preview && <LocalPreview file={preview} />}
      </Dialog>
      <Dialog
        open={Boolean(sample)}
        onClose={() => setSample(null)}
        title={sample?.name ?? 'Prévia'}
        description={
          sample ? `${formatFileSize(sample.size)} · Arquivo de demonstração` : undefined
        }
        size="medium"
        footer={<Button onClick={() => setSample(null)}>Fechar</Button>}
      >
        {sample?.name.endsWith('.png') ? (
          <div className={s.sampleArtwork}>
            <CampaignArtwork />
          </div>
        ) : (
          <div className={s.documentPreview}>
            <small>FRANCAL / MEDIAON</small>
            <h3>Briefing de campanha</h3>
            <p>Calçados Aurora · Primavera 2026</p>
            <hr />
            <strong>Objetivo</strong>
            <p>Apresentar a nova coleção ao público profissional do portal.</p>
            <strong>Mensagem</strong>
            <p>Conexões para novos negócios.</p>
            <small>Documento fictício para demonstração.</small>
          </div>
        )}
      </Dialog>
      <div className={s.uploadLayout}>
        {queue}
        <aside className={s.fileContext}>
          <small>{attachment ? 'DOCUMENTOS' : 'CAMPANHA'}</small>
          <h3>Lançamento primavera</h3>
          <p>Calçados Aurora · Francal 2026</p>
          <dl>
            <dt>Veiculação</dt>
            <dd>01 a 31 out, 2026</dd>
            <dt>Destino</dt>
            <dd>
              {attachment ? 'Documentos do plano de mídia' : 'Criativos e materiais de apoio'}
            </dd>
          </dl>
          <div>
            <strong>{attachment ? 'Organização dos anexos' : 'Antes de enviar'}</strong>
            <p>
              {attachment
                ? 'Mantenha briefing, plano de mídia e documentos da campanha no mesmo lugar.'
                : 'Confira o formato e a versão final. Arquivos com falha podem ser reenviados individualmente.'}
            </p>
          </div>
          <span>PNG · JPG · PDF · CSV</span>
          <p>Até 10 MB por arquivo.</p>
        </aside>
      </div>
      <Dialog
        title="Adicionar arquivos"
        description="Criativos e documentos da campanha"
        open={open}
        onClose={() => setOpen(false)}
        size="medium"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="primary" disabled={!files.length} onClick={() => setOpen(false)}>
              Concluir
            </Button>
          </>
        }
      >
        <div className={s.dialogUpload}>
          <FileDropzone
            accept=".png,.jpg,.jpeg,.pdf,.csv"
            hint="PNG, JPG, PDF ou CSV · até 10 MB"
            onFiles={receive}
            compact
          />
          {error && <p role="alert">{error}</p>}
          <div className={s.dialogFileHeading}>
            <div>
              <strong>Arquivos selecionados</strong>
              <span>Revise a seleção antes de concluir.</span>
            </div>
            <Status
              value={`${files.length} ${files.length === 1 ? 'arquivo' : 'arquivos'}`}
              tone={files.length ? 'blue' : 'neutral'}
              variant="soft"
              icon={files.length ? CheckCircle2 : undefined}
            />
          </div>
          {files.length ? (
            <div className={s.dialogFileList}>
              {files.map((file) => (
                <div className={s.dialogFileRow} key={file.id}>
                  <span className={s.dialogFileIcon} aria-hidden="true">
                    <FileText size={18} />
                  </span>
                  <div>
                    <strong>{file.name}</strong>
                    <span>
                      {formatFileSize(file.size)} · {fileStateLabels[file.status]}
                    </span>
                  </div>
                  <IconButton
                    variant="ghost"
                    icon={X}
                    label={`Retirar ${file.name}`}
                    onClick={() =>
                      setFiles((previous) => previous.filter((item) => item.id !== file.id))
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className={s.dialogFileEmpty}>
              <FileText size={22} aria-hidden="true" />
              <span>Nenhum arquivo selecionado.</span>
            </div>
          )}
        </div>
      </Dialog>
    </Stage>
  );
}
