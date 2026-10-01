'use client';
import { useEffect, useId, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  FileText,
  FolderOpen,
  Info,
  ListFilter,
  Lock,
  Plus,
  RefreshCw,
  SearchX,
  Trash2,
  Upload,
  WifiOff,
  X,
} from 'lucide-react';
import {
  Button,
  EmptyState,
  IconButton,
  Input,
  InlineAlert,
  Textarea,
  FormField,
  Select,
  Status,
  Dialog,
  Popover,
  Tooltip,
  type useToast,
} from '../../components/ds-v2';
import { Feedback } from './base-examples';
import { Stage, Segmented, Description } from './specimen-ui';
import s from './specimen.module.css';
import { GalleryExample, VideoExample } from './media-workspace';
import { AvatarExamples, UploadExample } from './reference-media';
import { AppearanceExample } from './reference-flows';
import { DetailLayerExample, InlineNotices } from './context-specimens';
type Notify = ReturnType<typeof useToast>['notify'];

export function FeedbackSpecimen({ id, notify }: { id: string; notify: Notify }) {
  const [state, setState] = useState('Informação');
  const [progress, setProgress] = useState(36);
  const [done, setDone] = useState(false);
  const [read, setRead] = useState(false);
  const [emptyMode, setEmptyMode] = useState('Primeiro uso');
  const [errorMode, setErrorMode] = useState('Ação local');
  if (id === 'alerta' || id === 'banner') return <InlineNotices banner={id === 'banner'} />;
  if (id === 'toast') return <Feedback notify={notify} />;
  return (
    <Stage
      title={
        {
          alerta: 'Aviso dentro do contexto',
          banner: 'Aviso persistente',
          progresso: 'Importação de públicos',
          spinner: 'Carregamento localizado',
          skeleton: 'Carregamento de listagem',
          'estado-vazio': 'Ausência de conteúdo',
          'estado-erro': 'Falha e recuperação',
          'estados-acesso': 'Acesso à página',
          notificacao: 'Central de notificações',
        }[id] ?? 'Feedback'
      }
    >
      {id === 'progresso' && (
        <div className={s.progressCard}>
          <div className={s.spread}>
            <strong>{progress === 100 ? 'Importação concluída' : 'Validando registros'}</strong>
            <span>{progress}%</span>
          </div>
          <div
            role="progressbar"
            aria-label="Progresso da importação"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className={s.progress}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
          <p className={s.muted}>
            {Math.round((18400 * progress) / 100).toLocaleString('pt-BR')} de 18.400 registros
          </p>
          <div className={s.row}>
            <Button
              onClick={() => setProgress((value) => Math.min(100, value + 16))}
              disabled={progress === 100}
            >
              Simular avanço
            </Button>
            <Button variant="ghost" onClick={() => setProgress(0)}>
              Reiniciar
            </Button>
          </div>
        </div>
      )}
      {id === 'spinner' && (
        <div className={s.row}>
          <Button loading>Salvando campanha</Button>
          <Button variant="primary" loading>
            Enviando para análise
          </Button>
          <span role="status" className={s.muted}>
            Aguarde a conclusão desta ação.
          </span>
        </div>
      )}
      {id === 'skeleton' && (
        <div className={s.loadingExample}>
          <Segmented
            label="Carregamento"
            values={['Carregando', 'Carregado']}
            value={done ? 'Carregado' : 'Carregando'}
            onChange={(value) => setDone(value === 'Carregado')}
          />
          {done ? (
            <ul className={s.list}>
              {['Lançamento primavera', 'Conexões que transformam', 'Novos caminhos'].map(
                (name) => (
                  <li key={name}>
                    <strong>{name}</strong>
                    <Status value="Em veiculação" tone="blue" />
                  </li>
                ),
              )}
            </ul>
          ) : (
            <div role="status" aria-label="Carregando campanhas" className={s.skeletonList}>
              {[0, 1, 2].map((row) => (
                <div key={row} className={s.skeletonRow}>
                  <div className={s.skeleton} style={{ width: 32, height: 32 }} />
                  <div className={s.skeleton} style={{ width: '45%' }} />
                  <div className={s.skeleton} style={{ width: '18%', marginLeft: 'auto' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {id === 'estado-vazio' && (
        <div className={s.stack}>
          <Segmented
            label="Tipo de vazio"
            values={['Primeiro uso', 'Lista vazia', 'Sem resultados']}
            value={emptyMode}
            onChange={setEmptyMode}
          />
          {emptyMode === 'Primeiro uso' ? (
            <EmptyState
              placement="page"
              icon={FolderOpen}
              eyebrow="Comece por aqui"
              title="Crie sua primeira campanha"
              description="Monte o plano de mídia, defina o período e acompanhe aprovações em um só lugar."
              actions={
                <>
                  <Button
                    variant="primary"
                    icon={Plus}
                    onClick={() => {
                      window.location.hash = 'wizard';
                    }}
                  >
                    Criar campanha
                  </Button>
                  <Button
                    icon={Upload}
                    onClick={() => {
                      window.location.hash = 'importar-exportar';
                    }}
                  >
                    Importar briefing
                  </Button>
                </>
              }
            />
          ) : emptyMode === 'Lista vazia' ? (
            <EmptyState
              placement="section"
              icon={ListFilter}
              eyebrow="Outubro de 2026"
              title="Nenhuma campanha neste período"
              description="A agenda está livre. Crie uma campanha ou consulte outro intervalo para continuar."
              actions={
                <>
                  <Button
                    variant="primary"
                    icon={Plus}
                    onClick={() => {
                      window.location.hash = 'wizard';
                    }}
                  >
                    Criar campanha
                  </Button>
                  <Button onClick={() => setEmptyMode('Primeiro uso')}>Alterar período</Button>
                </>
              }
            />
          ) : (
            <EmptyState
              placement="table"
              icon={SearchX}
              title="Nenhum resultado para “primavera”"
              description="Revise o termo ou remova os filtros de status e canal."
              meta="2 filtros ativos · Em revisão · Display"
              actions={
                <>
                  <Button onClick={() => setEmptyMode('Lista vazia')}>Limpar filtros</Button>
                  <Button
                    variant="ghost"
                    icon={Plus}
                    onClick={() => {
                      window.location.hash = 'wizard';
                    }}
                  >
                    Criar campanha
                  </Button>
                </>
              }
            />
          )}
        </div>
      )}
      {id === 'estado-erro' && (
        <div className={s.stack}>
          <Segmented
            label="Local do erro"
            values={['Ação local', 'Seção de dados', 'Página']}
            value={errorMode}
            onChange={(value) => {
              setErrorMode(value);
              setDone(false);
            }}
          />
          {done ? (
            <InlineAlert
              title="Conexão restabelecida"
              tone="success"
              placement={errorMode === 'Ação local' ? 'inline' : 'section'}
              actions={<Button onClick={() => setDone(false)}>Simular outra falha</Button>}
            >
              As campanhas foram atualizadas sem perder seus filtros.
            </InlineAlert>
          ) : errorMode === 'Página' ? (
            <EmptyState
              placement="page"
              tone="error"
              icon={WifiOff}
              eyebrow="Falha temporária"
              title="Não foi possível abrir esta área"
              description="A conexão com o serviço de campanhas foi interrompida. Seu trabalho salvo continua seguro."
              meta="Código CAMP-503 · ocorrido às 16:24"
              actions={
                <>
                  <Button variant="primary" icon={RefreshCw} onClick={() => setDone(true)}>
                    Tentar novamente
                  </Button>
                  <Button
                    onClick={() => {
                      window.location.hash = 'template-dashboard';
                    }}
                  >
                    Voltar ao dashboard
                  </Button>
                </>
              }
            />
          ) : (
            <InlineAlert
              title={
                errorMode === 'Ação local'
                  ? 'Não foi possível salvar o rascunho'
                  : 'As campanhas não puderam ser atualizadas'
              }
              tone="error"
              placement={errorMode === 'Ação local' ? 'inline' : 'section'}
              actions={
                <>
                  <Button icon={RefreshCw} onClick={() => setDone(true)}>
                    Tentar novamente
                  </Button>
                  <Button variant="ghost" onClick={() => setErrorMode('Página')}>
                    Ver detalhes
                  </Button>
                </>
              }
            >
              {errorMode === 'Ação local'
                ? 'As alterações permanecem nesta tela. Revise sua conexão e tente outra vez.'
                : 'Mantivemos a busca e os filtros aplicados. Tente recarregar somente esta seção.'}
            </InlineAlert>
          )}
        </div>
      )}
      {id === 'estados-acesso' && (
        <>
          <Select
            compact
            label="Estado de acesso"
            value={state}
            onValueChange={setState}
            options={['Informação', 'Sessão expirada', 'Página não encontrada'].map((value) => ({
              value,
              label: value === 'Informação' ? 'Acesso restrito' : value,
            }))}
          />
          <div className={s.empty}>
            <Lock size={26} />
            <h3>{state === 'Informação' ? 'Você não tem acesso a esta área' : state}</h3>
            <p>
              {state === 'Informação'
                ? 'Um administrador do portal pode revisar seu perfil de acesso.'
                : state === 'Sessão expirada'
                  ? 'Entre novamente para continuar de onde parou.'
                  : 'Confira o endereço ou volte para o início.'}
            </p>
            <Button
              onClick={() => {
                window.location.hash =
                  state === 'Sessão expirada' ? 'template-acesso' : 'template-dashboard';
              }}
            >
              {state === 'Sessão expirada' ? 'Entrar novamente' : 'Voltar ao dashboard'}
            </Button>
          </div>
        </>
      )}
      {id === 'notificacao' && (
        <ul className={s.list}>
          <li
            style={{ background: read ? 'transparent' : '#f5faff', padding: 16, borderRadius: 7 }}
          >
            <div className={s.row}>
              <Bell size={18} />
              <div>
                <strong>Pedido PI-2026-048 aprovado</strong>
                <small>Ana Lima · Campanha Lançamento primavera · há 12 min</small>
              </div>
            </div>
            <Button variant="ghost" onClick={() => setRead(!read)}>
              {read ? 'Marcar como não lida' : 'Marcar como lida'}
            </Button>
          </li>
        </ul>
      )}
    </Stage>
  );
}

export function LayerSpecimen({ id, notify }: { id: string; notify: Notify }) {
  if (id === 'drawer') return <DetailLayerExample notify={notify} />;
  if (id === 'modal') return <AppearanceExample notify={notify} />;
  return <BasicLayerSpecimen id={id} notify={notify} />;
}
function BasicLayerSpecimen({ id, notify }: { id: string; notify: Notify }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const uid = useId();
  const kind =
    id === 'drawer'
      ? 'drawer'
      : id === 'bottom-sheet'
        ? 'sheet'
        : id === 'dialogo-responsivo'
          ? 'responsive'
          : 'modal';
  return (
    <Stage
      title="Camada em contexto"
      footer="Escape fecha a camada e devolve o foco ao controle que a abriu."
    >
      {id === 'tooltip' ? (
        <div className={s.row}>
          <Tooltip text="Duplicar sem alterar a campanha original">
            <span>Duplicar campanha</span>
          </Tooltip>
          <Tooltip text="Este relatório considera apenas campanhas aprovadas.">
            <Info size={14} />
          </Tooltip>
        </div>
      ) : id === 'popover' ? (
        <Popover label="Filtros de período" trigger={<Button>Definir período</Button>}>
          <div className={s.stack}>
            <h3>Período do relatório</h3>
            <Input type="date" aria-label="Início do relatório" defaultValue="2026-10-01" />
            <Input type="date" aria-label="Fim do relatório" defaultValue="2026-10-31" />
            <Button onClick={() => notify('Período aplicado na demonstração.')}>Aplicar</Button>
          </div>
        </Popover>
      ) : id === 'hover-card' ? (
        <Popover
          label="Contato de Ana Lima"
          trigger={<Button variant="ghost">Ana Lima · Comercial</Button>}
        >
          <div className={s.stack}>
            <div className={s.row}>
              <span className={s.avatar}>AL</span>
              <div>
                <strong>Ana Lima</strong>
                <p className={s.muted}>Executiva de contas</p>
              </div>
            </div>
            <Description
              entries={[
                ['Portal', 'Francal 2026'],
                ['Campanhas', '12 em andamento'],
              ]}
            />
          </div>
        </Popover>
      ) : (
        <>
          <div className={s.spread}>
            <div>
              <h3 style={{ margin: '0 0 6px', font: 'var(--type-section)' }}>
                Lançamento primavera
              </h3>
              <Status value="Rascunho" />
            </div>
            <Button
              variant={id === 'confirmacao' ? 'danger-ghost' : 'secondary'}
              icon={id === 'confirmacao' ? Trash2 : undefined}
              onClick={() => setOpen(true)}
            >
              {id === 'confirmacao'
                ? 'Excluir campanha'
                : id === 'drawer'
                  ? 'Ver detalhes'
                  : 'Editar campanha'}
            </Button>
          </div>
          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            kind={kind}
            size={
              id === 'confirmacao' ? 'small' : id === 'dialogo-responsivo' ? 'medium' : 'default'
            }
            title={
              id === 'confirmacao'
                ? 'Excluir esta campanha?'
                : id === 'drawer'
                  ? 'Lançamento primavera'
                  : 'Editar campanha'
            }
            description={
              id === 'confirmacao'
                ? 'Esta ação remove o rascunho deste exemplo.'
                : 'Calçados Aurora · Portal Francal'
            }
            footer={
              <>
                <Button onClick={() => setOpen(false)}>Cancelar</Button>
                <Button
                  variant={id === 'confirmacao' ? 'danger' : 'primary'}
                  disabled={id === 'confirmacao' && name !== 'EXCLUIR'}
                  onClick={() => {
                    setOpen(false);
                    notify(
                      id === 'confirmacao'
                        ? 'Rascunho excluído da demonstração.'
                        : 'Alterações salvas na demonstração.',
                    );
                  }}
                >
                  {id === 'confirmacao' ? 'Confirmar exclusão' : 'Salvar alterações'}
                </Button>
              </>
            }
          >
            {id === 'drawer' ? (
              <Description
                entries={[
                  ['Anunciante', 'Calçados Aurora'],
                  ['Período', '01 a 31 out, 2026'],
                  ['Investimento', 'R$ 24.800,00'],
                  ['Responsável', 'Ana Lima'],
                ]}
              />
            ) : id === 'confirmacao' ? (
              <FormField id={uid} label="Digite EXCLUIR para confirmar">
                <Input
                  id={uid}
                  autoComplete="off"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </FormField>
            ) : (
              <div className={s.stack}>
                <FormField id={uid} label="Nome da campanha">
                  <Input id={uid} defaultValue="Lançamento primavera" />
                </FormField>
                <FormField id={`${uid}-note`} label="Observações">
                  <Textarea id={`${uid}-note`} rows={3} />
                </FormField>
              </div>
            )}
          </Dialog>
        </>
      )}
    </Stage>
  );
}

export function MediaSpecimen({ id }: { id: string }) {
  if (id === 'avatar') return <AvatarExamples />;
  if (id === 'galeria') return <GalleryExample />;
  if (id === 'video') return <VideoExample />;
  if (id === 'upload' || id === 'anexo') return <UploadExample attachment={id === 'anexo'} />;
  return <BasicMediaSpecimen id={id} />;
}
function BasicMediaSpecimen({ id }: { id: string }) {
  const [index, setIndex] = useState(0);
  const [ratio, setRatio] = useState('16:9');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  function receive(next?: File) {
    if (!next) return;
    if (next.size > 10 * 1024 * 1024) {
      setError('O arquivo deve ter até 10 MB.');
      return;
    }
    if (
      id === 'video'
        ? !next.type.startsWith('video/')
        : !['image/png', 'image/jpeg', 'application/pdf', 'text/csv'].includes(next.type) &&
          !next.name.endsWith('.csv')
    ) {
      setError('Formato não permitido.');
      return;
    }
    setError('');
    setFile(next);
  }
  const artwork = (
    <div
      className={s.mediaArtwork}
      role="img"
      aria-label={`Peça de demonstração ${index + 1}: Francal 2026, conexões para novos negócios`}
      style={{
        aspectRatio: ratio.replace(':', '/'),
        minHeight: 100,
        background: ['#edf5fb', '#f1f6f0', '#fcf5eb'][index],
      }}
    >
      <small>FRANCAL 2026</small>
      <strong>
        {
          [
            'Conexões para novos negócios.',
            'Sua marca em evidência.',
            'O próximo passo começa aqui.',
          ][index]
        }
      </strong>
      <span style={{ marginTop: 18, font: 'var(--type-caption)' }}>
        Mídia de demonstração · {index + 1}/3
      </span>
    </div>
  );
  return (
    <Stage
      title={
        id === 'avatar'
          ? 'Identidade em diferentes contextos'
          : id === 'marca'
            ? 'Assinatura do portal'
            : id === 'upload'
              ? 'Envio de criativo'
              : id === 'video'
                ? 'Player de vídeo local'
                : 'Peças e arquivos'
      }
      footer={
        ['upload', 'video', 'anexo'].includes(id)
          ? 'O arquivo permanece no navegador. Nenhum upload é realizado.'
          : undefined
      }
    >
      {id === 'marca' && (
        <div className={s.row} style={{ gap: 24 }}>
          <strong style={{ font: 'var(--type-heading)' }}>
            francal<span style={{ color: 'var(--accent)' }}>.</span>
          </strong>
          <span style={{ height: 28, borderLeft: '1px solid var(--line)' }} />
          <div>
            <strong>MediaOn</strong>
            <div className={s.muted}>Plataforma de mídia</div>
          </div>
        </div>
      )}
      {(id === 'imagem' || id === 'galeria') && (
        <div className={s.stack}>
          {id === 'imagem' && (
            <Segmented
              label="Proporção"
              values={['16:9', '4:3', '1:1']}
              value={ratio}
              onChange={setRatio}
            />
          )}
          <div style={{ maxWidth: 520, margin: 'auto', width: '100%' }}>{artwork}</div>
          {id === 'galeria' && (
            <div className={s.spread}>
              <IconButton
                label="Imagem anterior"
                icon={ArrowLeft}
                onClick={() => setIndex((index + 2) % 3)}
              />
              <span aria-live="polite">Peça {index + 1} de 3</span>
              <IconButton
                label="Próxima imagem"
                icon={ArrowRight}
                onClick={() => setIndex((index + 1) % 3)}
              />
            </div>
          )}
        </div>
      )}
      {['upload', 'anexo', 'video'].includes(id) && (
        <div className={s.stack}>
          {file ? (
            <>
              <div className={s.spread}>
                <div className={s.row}>
                  <FileText size={20} />
                  <div>
                    <strong>{file.name}</strong>
                    <div className={s.muted}>
                      {(file.size / 1024).toFixed(0)} KB · arquivo local
                    </div>
                  </div>
                </div>
                <IconButton
                  label="Remover arquivo"
                  icon={X}
                  onClick={() => {
                    setFile(null);
                    setUrl('');
                  }}
                />
              </div>
              {url && file.type.startsWith('image/') && (
                /* eslint-disable-next-line @next/next/no-img-element -- Prévia local de arquivo, sem processamento de imagem remoto. */
                <img
                  src={url}
                  alt={`Prévia de ${file.name}`}
                  style={{ maxWidth: '100%', maxHeight: 240, objectFit: 'contain' }}
                />
              )}
              {url && file.type.startsWith('video/') && (
                <video
                  src={url}
                  controls
                  style={{ width: '100%', maxHeight: 320 }}
                  aria-label={file.name}
                >
                  <track kind="captions" />
                </video>
              )}
              {url && (
                <a href={url} download={file.name}>
                  Baixar arquivo selecionado
                </a>
              )}
            </>
          ) : (
            <label
              className={s.dropzone}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                receive(event.dataTransfer.files[0]);
              }}
            >
              <Upload size={24} />
              <strong>
                {id === 'video'
                  ? 'Selecionar vídeo do computador'
                  : 'Solte o arquivo aqui ou selecione'}
              </strong>
              <span className={s.muted}>
                {id === 'video' ? 'Vídeo local' : 'PNG, JPG, PDF ou CSV'} · até 10 MB
              </span>
              <input
                type="file"
                aria-label={id === 'video' ? 'Selecionar vídeo' : 'Selecionar arquivo'}
                accept={id === 'video' ? 'video/*' : '.png,.jpg,.jpeg,.pdf,.csv'}
                onChange={(event) => receive(event.target.files?.[0])}
              />
            </label>
          )}
          {error && (
            <p role="alert" style={{ color: 'var(--status-pink)' }}>
              {error}
            </p>
          )}
        </div>
      )}
    </Stage>
  );
}
