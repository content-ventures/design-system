'use client';

import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Layers,
  MousePointer2,
  MoveUpRight,
  Play,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { Badge, Button, Switch } from '../components/ds/primitives';
import { ConnectionMark } from '../components/ds/connection-mark';
import { LeadCard } from '../components/ds/lead-card';
import { PerformanceChart } from '../components/ds/charts';
import { CampaignTable } from '../components/ds/campaign-table';
import s from './identity-overview.module.css';

export function IdentityOverview({ onNotify }: { onNotify: (message: string) => void }) {
  const [replay, setReplay] = useState(0);
  const [delivery, setDelivery] = useState(true);
  return (
    <div className={s.overview}>
      <section className={s.brandStage} aria-labelledby="identity-title">
        <div className={s.brandCopy}>
          <span className={s.edition}>
            <span /> MEDIAON / EXPLORAÇÃO 02
          </span>
          <h2 id="identity-title">
            Conexões que
            <br />
            <em>ganham forma.</em>
          </h2>
          <p>
            Uma linguagem visual para aproximar marcas, pessoas e negócios. Do primeiro contato à
            próxima oportunidade.
          </p>
          <a href="#principios" className={s.stageLink}>
            Conheça a direção
            <ArrowUpRight size={16} />
          </a>
        </div>
        <div className={s.connectionStage}>
          <div
            key={replay}
            className={s.connectionArtwork}
            role="img"
            aria-label="Duas formas se encontram, representando a conexão entre marcas e pessoas."
          >
            <svg viewBox="0 0 440 260" fill="none" aria-hidden="true">
              <path
                className={s.pathBack}
                d="M267 62h25a69 69 0 0 1 69 69v0a69 69 0 0 1-69 69h-55"
              />
              <path
                className={s.pathFront}
                d="M192 200h-35a69 69 0 0 1-69-69v0a69 69 0 0 1 69-69h55"
              />
              <path className={s.pathJoin} d="M179 131h88" />
            </svg>
            <div className={s.presenceTag}>
              <span>
                <MousePointer2 size={14} />
              </span>
              <div>
                <small>Sua marca</small>
                <strong>Presença relevante</strong>
              </div>
              <Check size={13} />
            </div>
            <div className={s.peopleTag}>
              <span>
                <Users size={14} />
              </span>
              <div>
                <small>Novas conexões</small>
                <strong>Oportunidades reais</strong>
              </div>
              <MoveUpRight size={13} />
            </div>
          </div>
          <button className={s.replay} onClick={() => setReplay(replay + 1)}>
            <RotateCcw size={12} />
            Rever movimento
          </button>
        </div>
      </section>
      <div className={s.foundationRail}>
        <a href="#cores">
          <span className={s.colorSwatches}>
            <i />
            <i />
            <i />
            <i />
          </span>
          <span>
            Uma paleta com presença<small>Azul conexão & neutros minerais</small>
          </span>
          <ArrowUpRight size={16} />
        </a>
        <a href="#tipografia">
          <b className={s.typeSample}>Ag</b>
          <span>
            Tipografia com ritmo<small>Instrument Sans · 400 / 500 / 600</small>
          </span>
          <ArrowUpRight size={16} />
        </a>
        <a href="#movimento">
          <span className={s.motionSample}>
            <i />
            <i />
          </span>
          <span>
            Movimento com intenção<small>Suave na entrada. Preciso na resposta.</small>
          </span>
          <ArrowUpRight size={16} />
        </a>
      </div>
      <header className={s.sectionTitle}>
        <div>
          <span>COMPONENTES EM CONTEXTO</span>
          <h2>O detalhe muda a experiência.</h2>
        </div>
        <a href="#telas">
          Explorar telas
          <ArrowUpRight size={16} />
        </a>
      </header>
      <div className={s.componentGrid}>
        <div className={s.controlsPanel}>
          <div className={s.panelCaption}>
            <span>
              <SlidersHorizontal size={15} />
              Ações & controles
            </span>
            <a href="#botoes" aria-label="Explorar botões">
              <ArrowUpRight size={16} />
            </a>
          </div>
          <div className={s.buttonStack}>
            <Button
              onClick={() => {
                window.location.hash = 'nova-campanha';
              }}
            >
              <Plus size={16} />
              Criar campanha
            </Button>
            <Button
              variant="secondary"
              onClick={() => onNotify('Alterações salvas apenas nesta demonstração.')}
            >
              <Check size={15} />
              Salvar alterações
            </Button>
            <Button variant="ghost" onClick={() => onNotify('Nenhuma alteração foi feita.')}>
              Cancelar
            </Button>
          </div>
          <div className={s.controlDivider} />
          <Switch
            checked={delivery}
            onChange={setDelivery}
            label="Veiculação"
            description={delivery ? 'Ativa nesta demonstração' : 'Pausada nesta demonstração'}
          />
          <div className={s.stateRow}>
            <Badge tone={delivery ? 'success' : 'warning'}>
              {delivery ? 'Em veiculação' : 'Pausada'}
            </Badge>
            <Badge>Rascunho</Badge>
          </div>
        </div>
        <div className={s.leadSpecimen}>
          <LeadCard />
          <a className={s.specimenLink} href="#card-lead">
            Card de lead
            <ArrowUpRight size={13} />
          </a>
        </div>
        <div className={s.identityTile}>
          <ConnectionMark size={48} />
          <div>
            <span>DA MARCA À INTERFACE</span>
            <h3>
              Um sistema.
              <br />
              Muitas conexões.
            </h3>
            <p>Curvas compartilhadas, camadas leves e espaço para o que importa.</p>
          </div>
          <a href="#bordas">
            Explorar as formas
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
      <header className={s.sectionTitle}>
        <div>
          <span>DA BIBLIOTECA AO PRODUTO</span>
          <h2>Bonito para olhar. Claro para operar.</h2>
        </div>
        <Badge>Dados fictícios</Badge>
      </header>
      <div className={s.dataGrid}>
        <PerformanceChart kind="area" compact />
        <div className={s.flowPanel}>
          <span className={s.flowIcon}>
            <Layers size={24} />
          </span>
          <h3>
            Campanhas têm
            <br />
            um caminho. Não um pop-up.
          </h3>
          <p>Objetivo, público, investimento e revisão, com contexto do começo ao fim.</p>
          <div className={s.flowSteps} aria-hidden="true">
            <i>
              <Check size={12} />
            </i>
            <span />
            <i>2</i>
            <span />
            <i>3</i>
            <span />
            <i>4</i>
          </div>
          <a href="#nova-campanha">
            Experimentar o fluxo
            <Play size={13} />
          </a>
        </div>
      </div>
      <CampaignTable compact onNotify={onNotify} />
      <footer className={s.footer}>
        <span>Exploração visual 02 · Biblioteca independente do produto</span>
        <a href="#inventario">
          Ver inventário
          <ArrowRight size={14} />
        </a>
      </footer>
    </div>
  );
}
