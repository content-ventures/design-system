'use client';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileText,
  Film,
  HardDrive,
  Image as ImageIcon,
  Info,
  Maximize2,
  Play,
  Search,
  Upload,
  Volume2,
  Wrench,
  X,
} from 'lucide-react';
import {
  Button,
  Checkbox,
  Dialog,
  EmptyState,
  FileDropzone,
  IconButton,
  Input,
  InlineAlert,
  LinkAction,
  Select,
  Status,
  Tag,
  formatFileSize,
} from '../../components/ds-v2';
import { Stage } from './specimen-ui';
import s from './media-workspace.module.css';

const pieces = [
  {
    name: 'Lançamento primavera',
    file: 'aurora-display-1200x628.png',
    format: 'Display',
    dimensions: '1.200 × 628 px',
    size: '2,4 MB',
    tone: 'blue',
    title: 'O próximo passo é seu.',
    subtitle: 'Coleção primavera / 2026',
    status: 'Aprovado',
    statusTone: 'green' as const,
    statusIcon: CheckCircle2,
  },
  {
    name: 'Encontro de negócios',
    file: 'francal-negocios-1080x1080.png',
    format: 'Social',
    dimensions: '1.080 × 1.080 px',
    size: '1,8 MB',
    tone: 'green',
    title: 'Boas conexões. Novos caminhos.',
    subtitle: 'Francal / Negócios que ficam',
    status: 'Em revisão',
    statusTone: 'amber' as const,
    statusIcon: Clock3,
  },
  {
    name: 'Novidades da coleção',
    file: 'aurora-newsletter-600x400.jpg',
    format: 'E-mail',
    dimensions: '600 × 400 px',
    size: '840 KB',
    tone: 'sand',
    title: 'Uma nova estação para sua marca.',
    subtitle: 'Aurora / Edição 04',
    status: 'Aprovado',
    statusTone: 'green' as const,
    statusIcon: CheckCircle2,
  },
  {
    name: 'Presença no portal',
    file: 'francal-marca-1200x628.png',
    format: 'Display',
    dimensions: '1.200 × 628 px',
    size: '2,1 MB',
    tone: 'ink',
    title: 'Seu negócio no centro da conversa.',
    subtitle: 'MediaOn / Francal 2026',
    status: 'Ajustes',
    statusTone: 'pink' as const,
    statusIcon: Wrench,
  },
];

function formatTone(format: string) {
  if (format === 'Display') return 'blue' as const;
  if (format === 'Social') return 'green' as const;
  return 'violet' as const;
}

export function CampaignArtwork({ index = 0 }: { index?: number }) {
  const piece = pieces[index % pieces.length]!;
  return (
    <div
      className={s.artwork}
      data-tone={piece.tone}
      role="img"
      aria-label={`${piece.name}: ${piece.title}`}
    >
      <span>{piece.subtitle}</span>
      <div className={s.artworkCopy}>
        <strong>{piece.title}</strong>
        <small>
          Conheça as oportunidades <ArrowRight size={13} />
        </small>
      </div>
      <div className={s.artworkSymbol} aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <footer>
        FRANCAL<span>26</span>
      </footer>
    </div>
  );
}
export function GalleryExample() {
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState('Todos');
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState<number | null>(null);
  const visible = pieces
    .map((piece, index) => ({ ...piece, index }))
    .filter(
      (piece) =>
        (format === 'Todos' || piece.format === format) &&
        piece.name.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')),
    );
  const current = preview === null ? null : pieces[preview]!;
  return (
    <Stage
      title="Biblioteca de criativos"
      tools={<span>{pieces.length} peças · Campanha primavera</span>}
    >
      <div className={s.toolbar}>
        <Input
          aria-label="Buscar criativos"
          placeholder="Buscar criativo…"
          icon={<Search size={15} />}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Select
          label="Formato de mídia"
          value={format}
          onValueChange={setFormat}
          options={['Todos', 'Display', 'Social', 'E-mail'].map((value) => ({
            value,
            label: value,
          }))}
        />
        <LinkAction href="#upload" icon={Upload}>
          Adicionar arquivos
        </LinkAction>
      </div>
      {selected.length > 0 && (
        <div className={s.selectionBar}>
          <strong>{selected.length} selecionados</strong>
          <Button size="small" variant="ghost" onClick={() => setSelected([])}>
            Limpar seleção
          </Button>
        </div>
      )}
      <div className={s.gallery}>
        {visible.map((piece) => (
          <article
            key={piece.file}
            className={s.tile}
            data-selected={selected.includes(piece.file)}
          >
            <div className={s.tileMedia}>
              <button
                className={s.previewButton}
                onClick={() => setPreview(piece.index)}
                aria-label={`Ampliar ${piece.name}`}
              >
                <CampaignArtwork index={piece.index} />
                <span className={s.previewAction}>
                  <Eye size={14} aria-hidden="true" />
                  Abrir prévia
                </span>
              </button>
              <Checkbox
                label={`Selecionar ${piece.name}`}
                className={s.imageCheck}
                checked={selected.includes(piece.file)}
                onChange={(event) =>
                  setSelected(
                    event.target.checked
                      ? [...selected, piece.file]
                      : selected.filter((file) => file !== piece.file),
                  )
                }
              />
            </div>
            <div className={s.tileInfo}>
              <div>
                <strong>{piece.name}</strong>
                <small title={piece.file}>{piece.file}</small>
              </div>
              <div className={s.tileInfoMeta}>
                <Tag value={piece.format} tone={formatTone(piece.format)} />
                <span>{piece.size}</span>
              </div>
            </div>
            <footer>
              <Status
                value={piece.status}
                tone={piece.statusTone}
                variant="soft"
                icon={piece.statusIcon}
              />
              <span className={s.dimensions}>
                <Maximize2 size={13} aria-hidden="true" />
                {piece.dimensions}
              </span>
            </footer>
          </article>
        ))}
      </div>
      {!visible.length && (
        <EmptyState
          placement="section"
          icon={ImageIcon}
          eyebrow="Biblioteca de criativos"
          title="Nenhum criativo encontrado"
          description="A busca e o formato selecionado não correspondem a nenhuma peça desta campanha."
          actions={
            <Button
              onClick={() => {
                setQuery('');
                setFormat('Todos');
              }}
            >
              Limpar filtros
            </Button>
          }
        />
      )}
      <Dialog
        open={current !== null}
        onClose={() => setPreview(null)}
        title={current?.name ?? 'Prévia do criativo'}
        description={current ? `${current.format} · ${current.dimensions}` : undefined}
        size="wide"
        footer={
          <div className={s.galleryDialogFooter}>
            <div className={s.counter} aria-live="polite">
              <span>
                Peça {(preview ?? 0) + 1} de {pieces.length}
              </span>
              <strong>{current?.name}</strong>
            </div>
            <div className={s.galleryPager} role="group" aria-label="Navegação da galeria">
              <IconButton
                label="Imagem anterior"
                icon={ArrowLeft}
                onClick={() => setPreview(((preview ?? 0) + pieces.length - 1) % pieces.length)}
              />
              <span>
                {String((preview ?? 0) + 1).padStart(2, '0')} /{' '}
                {String(pieces.length).padStart(2, '0')}
              </span>
              <IconButton
                label="Próxima imagem"
                icon={ArrowRight}
                onClick={() => setPreview(((preview ?? 0) + 1) % pieces.length)}
              />
            </div>
          </div>
        }
      >
        {current && (
          <div className={s.detail}>
            <div className={s.detailVisual}>
              <CampaignArtwork index={preview!} />
            </div>
            <aside className={s.detailPanel} aria-label="Detalhes do arquivo">
              <div className={s.detailPanelHeader}>
                <span>Detalhes do arquivo</span>
                <Status
                  value={current.status}
                  tone={current.statusTone}
                  variant="soft"
                  icon={current.statusIcon}
                />
              </div>
              <div className={s.fileSummary}>
                <span>
                  <FileText size={18} aria-hidden="true" />
                </span>
                <div>
                  <small>Nome do arquivo</small>
                  <strong>{current.file}</strong>
                </div>
              </div>
              <dl className={s.detailList}>
                <div>
                  <dt>
                    <ImageIcon size={15} aria-hidden="true" />
                    Formato
                  </dt>
                  <dd>
                    <Tag value={current.format} tone={formatTone(current.format)} />
                  </dd>
                </div>
                <div>
                  <dt>
                    <Maximize2 size={15} aria-hidden="true" />
                    Dimensões
                  </dt>
                  <dd>{current.dimensions}</dd>
                </div>
                <div>
                  <dt>
                    <HardDrive size={15} aria-hidden="true" />
                    Tamanho
                  </dt>
                  <dd>{current.size}</dd>
                </div>
              </dl>
            </aside>
          </div>
        )}
      </Dialog>
    </Stage>
  );
}
export function validateVideo(file: File) {
  if (!['video/mp4', 'video/webm'].includes(file.type)) return 'Selecione um vídeo MP4 ou WebM.';
  if (!file.size) return 'O vídeo está vazio.';
  if (file.size > 50 * 1024 * 1024) return 'O vídeo deve ter até 50 MB.';
  return '';
}
export function VideoExample() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState('');
  useEffect(() => {
    if (!file) {
      setUrl('');
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  function receive(files: File[]) {
    const next = files[0];
    if (!next) return;
    const reason = validateVideo(next);
    setError(reason);
    if (!reason) {
      setFile(next);
      setMetadata('');
    }
  }
  return (
    <Stage
      title="Prévia de vídeo"
      tools={
        <Status
          value={file ? 'Arquivo selecionado' : 'Aguardando arquivo'}
          tone={file ? 'blue' : 'neutral'}
          variant="soft"
          icon={file ? CheckCircle2 : Clock3}
        />
      }
      footer="Reprodução local. O vídeo permanece no navegador."
    >
      <div className={s.videoLayout}>
        <section className={s.videoPreview} aria-label="Prévia do vídeo selecionado">
          <div className={s.videoSurface} data-empty={!file || undefined}>
            {file && url ? (
              <video
                src={url}
                controls
                preload="metadata"
                aria-label={file.name}
                onLoadedMetadata={(event) => {
                  const video = event.currentTarget;
                  setMetadata(
                    `${video.videoWidth} × ${video.videoHeight} px · ${Math.floor(video.duration / 60)}:${String(Math.floor(video.duration % 60)).padStart(2, '0')}`,
                  );
                }}
                onError={() =>
                  setError(
                    'Não foi possível reproduzir este vídeo. Experimente outro arquivo MP4 ou WebM.',
                  )
                }
              >
                <track kind="captions" />
              </video>
            ) : (
              <>
                <div className={s.videoTopline} aria-hidden="true">
                  <span>Prévia 16:9</span>
                  <span>00:00</span>
                </div>
                <div className={s.videoEmpty}>
                  <span className={s.videoPlayMark} aria-hidden="true">
                    <Play size={24} fill="currentColor" />
                  </span>
                  <strong>Seu vídeo aparece aqui</strong>
                  <span>Envie um arquivo para conferir enquadramento, áudio e reprodução.</span>
                </div>
                <div className={s.videoControls} aria-hidden="true">
                  <Play size={14} fill="currentColor" />
                  <span className={s.videoProgress}>
                    <i />
                  </span>
                  <span>00:00</span>
                  <Volume2 size={15} />
                  <Maximize2 size={15} />
                </div>
              </>
            )}
          </div>
          <div className={s.videoPreviewMeta}>
            <div>
              <strong>{file ? 'Prévia pronta para revisão' : 'Prévia da campanha'}</strong>
              <span>
                {file
                  ? 'Confira o conteúdo antes de usar a peça.'
                  : 'O arquivo permanece somente neste navegador.'}
              </span>
            </div>
            <Tag value={metadata || 'Proporção 16:9'} tone={file ? 'blue' : 'neutral'} />
          </div>
        </section>
        <aside className={s.videoAside}>
          <div className={s.videoAsideHeader}>
            <span aria-hidden="true">
              <Film size={19} />
            </span>
            <div>
              <small>Arquivo de vídeo</small>
              <h3>{file?.name ?? 'Vídeo da campanha'}</h3>
              <p>{file ? formatFileSize(file.size) : 'Adicione a versão final da peça.'}</p>
            </div>
          </div>
          <div className={s.videoFormats} aria-label="Formatos aceitos">
            <Tag value="MP4" tone="blue" />
            <Tag value="WebM" tone="neutral" />
            <span>até 50 MB</span>
          </div>
          <FileDropzone
            accept="video/mp4,video/webm"
            hint="Selecione ou arraste um vídeo"
            multiple={false}
            onFiles={receive}
            compact
          />
          {error && (
            <InlineAlert title="Não foi possível usar este vídeo" tone="error">
              {error}
            </InlineAlert>
          )}
          {file && (
            <div className={s.videoAsideActions}>
              <LinkAction href={url} download={file.name} icon={Download}>
                Baixar vídeo
              </LinkAction>
              <Button
                variant="secondary"
                icon={X}
                onClick={() => {
                  setFile(null);
                  setError('');
                  setMetadata('');
                }}
              >
                Remover vídeo
              </Button>
            </div>
          )}
          {!file && (
            <div className={s.videoHint}>
              <Info size={15} aria-hidden="true" />
              <span>Use um vídeo em 16:9 para aproveitar melhor os espaços de campanha.</span>
            </div>
          )}
        </aside>
      </div>
    </Stage>
  );
}
