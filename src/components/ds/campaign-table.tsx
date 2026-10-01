'use client';

import { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { Badge, Button, Dialog, EmptyState, Input, Progress, type Tone } from './primitives';
import s from './patterns.module.css';

const initialRows = [
  {
    id: 1,
    name: 'Conexões que geram negócios',
    company: 'Expositor Aurora',
    portal: 'Feira de negócios',
    status: 'Em veiculação',
    tone: 'success' as Tone,
    budget: 18400,
    delivery: 68,
    leads: 142,
  },
  {
    id: 2,
    name: 'Lançamento coleção 2027',
    company: 'Estúdio Norte',
    portal: 'Feira de design',
    status: 'Em veiculação',
    tone: 'success' as Tone,
    budget: 12600,
    delivery: 42,
    leads: 96,
  },
  {
    id: 3,
    name: 'Presença em destaque',
    company: 'Grupo Horizonte',
    portal: 'Feira de negócios',
    status: 'Em revisão',
    tone: 'warning' as Tone,
    budget: 8200,
    delivery: 0,
    leads: 0,
  },
  {
    id: 4,
    name: 'Novos caminhos para sua marca',
    company: 'Casa Forma',
    portal: 'Feira de design',
    status: 'Rascunho',
    tone: 'neutral' as Tone,
    budget: 5000,
    delivery: 0,
    leads: 0,
  },
  {
    id: 5,
    name: 'Encontre seu próximo parceiro',
    company: 'Ateliê Sul',
    portal: 'Feira setorial',
    status: 'Concluída',
    tone: 'brand' as Tone,
    budget: 9700,
    delivery: 100,
    leads: 118,
  },
  {
    id: 6,
    name: 'Oportunidades de setembro',
    company: 'Expositor Lume',
    portal: 'Feira setorial',
    status: 'Em veiculação',
    tone: 'success' as Tone,
    budget: 6300,
    delivery: 81,
    leads: 73,
  },
];
export const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
export function CampaignTable({
  compact = false,
  onNotify,
}: {
  compact?: boolean;
  onNotify: (message: string) => void;
}) {
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Todas');
  const [sort, setSort] = useState<'asc' | 'desc' | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [detail, setDetail] = useState<number | null>(null);
  const filtered = rows
    .filter(
      (row) =>
        `${row.name} ${row.company}`
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .includes(
            query
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase(),
          ) &&
        (status === 'Todas' || row.status === status),
    )
    .sort((a, b) =>
      sort === null ? a.id - b.id : sort === 'asc' ? a.budget - b.budget : b.budget - a.budget,
    );
  const pages = Math.max(1, Math.ceil(filtered.length / 4));
  const currentPage = Math.min(page, pages - 1);
  const shown = compact
    ? filtered.slice(0, 3)
    : filtered.slice(currentPage * 4, currentPage * 4 + 4);
  const selectedRow = rows.find((row) => row.id === detail);
  function exportRows() {
    const csv =
      '\uFEFFCampanha;Expositor;Status;Investimento;Leads\n' +
      filtered
        .map((row) => [row.name, row.company, row.status, row.budget, row.leads].join(';'))
        .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mediaon-campanhas-demonstracao.csv';
    a.click();
    URL.revokeObjectURL(url);
    onNotify('CSV de demonstração exportado.');
  }
  return (
    <div className={s.tablePanel}>
      <div className={s.panelHeading}>
        <span>
          Campanhas <small>{rows.length}</small>
        </span>
        <a href="#nova-campanha" className={s.inlineAction}>
          <Plus size={14} />
          Nova campanha
        </a>
      </div>
      {!compact && (
        <div className={s.tableToolbar}>
          <div className={s.searchInput}>
            <Search size={15} />
            <Input
              type="search"
              aria-label="Buscar campanhas"
              placeholder="Buscar campanhas…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
            />
          </div>
          <select
            aria-label="Filtrar por status"
            className={s.select}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
          >
            <option>Todas</option>
            <option>Em veiculação</option>
            <option>Em revisão</option>
            <option>Rascunho</option>
            <option>Concluída</option>
          </select>
          <Button variant="secondary" onClick={exportRows}>
            <Download size={14} />
            Exportar
          </Button>
        </div>
      )}
      {!compact && (query || status !== 'Todas') && (
        <div className={s.activeFilters} aria-label="Filtros ativos">
          {query && (
            <Button
              size="sm"
              variant="secondary"
              aria-label="Remover filtro de busca"
              onClick={() => {
                setQuery('');
                setPage(0);
              }}
            >
              Busca: {query}
              <X size={12} />
            </Button>
          )}
          {status !== 'Todas' && (
            <Button
              size="sm"
              variant="secondary"
              aria-label="Remover filtro de status"
              onClick={() => {
                setStatus('Todas');
                setPage(0);
              }}
            >
              {status}
              <X size={12} />
            </Button>
          )}
        </div>
      )}
      {selected.length > 0 && !compact && (
        <div className={s.bulkBar}>
          <span>{selected.length} selecionada(s)</span>
          <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
            Limpar
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setConfirm(true)}>
            Arquivar na prévia
          </Button>
        </div>
      )}
      <div className={s.tableScroll}>
        <table className={s.campaignTable}>
          <caption className={s.srOnly}>
            Campanhas fictícias para validar o design. Nenhum dado de produção.
          </caption>
          <thead>
            <tr>
              {!compact && (
                <th className={s.checkCell}>
                  <input
                    type="checkbox"
                    aria-label="Selecionar campanhas desta página"
                    checked={shown.length > 0 && shown.every((row) => selected.includes(row.id))}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...new Set([...selected, ...shown.map((row) => row.id)])]
                          : selected.filter((id) => !shown.some((row) => row.id === id)),
                      )
                    }
                  />
                </th>
              )}
              <th>Campanha</th>
              <th>Status</th>
              {!compact && <th>Entrega</th>}
              <th
                className={s.numeric}
                aria-sort={sort === 'asc' ? 'ascending' : sort === 'desc' ? 'descending' : 'none'}
              >
                <button onClick={() => setSort(sort === 'desc' ? 'asc' : 'desc')}>
                  Investimento {sort === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                </button>
              </th>
              {!compact && <th className={s.numeric}>Leads</th>}
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => (
              <tr key={row.id} data-selected={selected.includes(row.id)}>
                {!compact && (
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Selecionar ${row.name}`}
                      checked={selected.includes(row.id)}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [...selected, row.id]
                            : selected.filter((id) => id !== row.id),
                        )
                      }
                    />
                  </td>
                )}
                <td>
                  <button className={s.campaignName} onClick={() => setDetail(row.id)}>
                    {row.name}
                  </button>
                  <small>{row.company}</small>
                </td>
                <td>
                  <Badge tone={row.tone}>{row.status}</Badge>
                </td>
                {!compact && (
                  <td className={s.deliveryCell}>
                    <div>
                      <span>{row.delivery}%</span>
                      <span>{row.delivery > 0 ? 'da meta' : 'Não iniciada'}</span>
                    </div>
                    <Progress value={row.delivery} label={`Entrega de ${row.name}`} />
                  </td>
                )}
                <td className={s.numeric}>{money(row.budget)}</td>
                {!compact && <td className={s.numeric}>{row.leads || '—'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {shown.length === 0 && (
        <EmptyState
          title="Nenhuma campanha encontrada"
          description="Tente outro nome ou remova os filtros para ver as campanhas."
        >
          <Button
            variant="secondary"
            onClick={() => {
              setStatus('Todas');
              setQuery('');
            }}
          >
            Limpar filtros
          </Button>
        </EmptyState>
      )}
      {!compact && (
        <div className={s.tableFooter}>
          <span role="status">{filtered.length} campanha(s) · Dados fictícios</span>
          <div>
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
              aria-label="Página anterior"
            >
              <ChevronLeft size={15} />
            </Button>
            <span>
              {currentPage + 1} de {pages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage + 1 >= pages}
              onClick={() => setPage(currentPage + 1)}
              aria-label="Próxima página"
            >
              <ChevronRight size={15} />
            </Button>
          </div>
        </div>
      )}
      {selectedRow && (
        <section className={s.inlineDetail} aria-label="Resumo da campanha">
          <div className={s.panelHeading}>
            <strong>{selectedRow.name}</strong>
            <Button variant="ghost" aria-label="Fechar resumo" onClick={() => setDetail(null)}>
              <X size={16} />
            </Button>
          </div>
          <dl>
            <div>
              <dt>Expositor</dt>
              <dd>{selectedRow.company}</dd>
            </div>
            <div>
              <dt>Portal</dt>
              <dd>{selectedRow.portal}</dd>
            </div>
            <div>
              <dt>Investimento</dt>
              <dd>{money(selectedRow.budget)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <Badge tone={selectedRow.tone}>{selectedRow.status}</Badge>
              </dd>
            </div>
          </dl>
          <p>Resumo local de demonstração. Sem conexão com campanhas reais.</p>
        </section>
      )}
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Arquivar campanhas nesta prévia?"
        description={`${selected.length} campanha(s) serão removidas apenas desta demonstração. Recarregar a página restaura os exemplos.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setRows(rows.filter((row) => !selected.includes(row.id)));
                setSelected([]);
                setConfirm(false);
                onNotify('Campanhas arquivadas somente nesta prévia.');
              }}
            >
              Arquivar na prévia
            </Button>
          </>
        }
      />
    </div>
  );
}
