/**
 * `proseWidgets`: fábrica sem framework. Cada função devolve um nó novo, marcado para o CSS do
 * `Prose`, fora da edição (`contenteditable="false"`) e com o texto certo para leitor de tela. O
 * marcador da calha ativa por clique e teclado sem deixar o evento chegar ao editor.
 */
import { describe, expect, it, vi } from 'vitest';

import { PROSE_WIDGET_ATTR, proseWidgets } from './prose-widgets';

describe('proseWidgets.insertion', () => {
  it('lê como inserção no parágrafo, com “Inserido:” só para leitor de tela', () => {
    const node = proseWidgets.insertion('8 mil');
    expect(node.tagName).toBe('SPAN');
    expect(node).toHaveAttribute(PROSE_WIDGET_ATTR, 'insertion');
    expect(node).toHaveAttribute('data-suggestion', 'insert');
    expect(node).toHaveAttribute('contenteditable', 'false');
    expect(node).not.toHaveAttribute('data-stale');
    expect(node).not.toHaveAttribute('aria-hidden');
    const sr = node.querySelector('[data-prose-sr]');
    expect(sr).toHaveTextContent('Inserido:');
    expect(node.textContent).toBe('Inserido: 8 mil');
    expect(node.querySelector(`[${PROSE_WIDGET_ATTR}="caret"]`)).toBeNull();
  });

  it('marca a proposta desatualizada e a que ainda chega (cursor parado no fim)', () => {
    const node = proseWidgets.insertion('8 mil pares', {
      stale: true,
      streaming: true,
      label: 'Proposta:',
    });
    expect(node).toHaveAttribute('data-stale', '');
    expect(node).toHaveAttribute('data-streaming', '');
    expect(node.querySelector('[data-prose-sr]')).toHaveTextContent('Proposta:');
    const caret = node.lastElementChild;
    expect(caret).toHaveAttribute(PROSE_WIDGET_ATTR, 'caret');
    expect(caret).toHaveAttribute('aria-hidden', 'true');
  });

  it('guarda o texto como texto (nunca HTML)', () => {
    const node = proseWidgets.insertion('<b>8</b> mil');
    expect(node.querySelector('b')).toBeNull();
    expect(node.textContent).toContain('<b>8</b> mil');
  });
});

describe('proseWidgets.caret', () => {
  it('é decorativo e fora da edição', () => {
    const node = proseWidgets.caret();
    expect(node).toHaveAttribute(PROSE_WIDGET_ATTR, 'caret');
    expect(node).toHaveAttribute('aria-hidden', 'true');
    expect(node).toHaveAttribute('contenteditable', 'false');
    expect(node).toBeEmptyDOMElement();
  });
});

describe('proseWidgets.skeleton', () => {
  it('desenha uma barra por linha, entra no ritmo como bloco e fica oculto ao leitor de tela', () => {
    const node = proseWidgets.skeleton(4);
    expect(node.tagName).toBe('DIV');
    expect(node).toHaveAttribute(PROSE_WIDGET_ATTR, 'skeleton');
    expect(node).toHaveAttribute('data-block', '');
    expect(node).toHaveAttribute('aria-hidden', 'true');
    expect(node.children).toHaveLength(4);
  });

  it('usa 3 linhas por padrão e limita entre 1 e 12', () => {
    expect(proseWidgets.skeleton().children).toHaveLength(3);
    expect(proseWidgets.skeleton(0).children).toHaveLength(1);
    expect(proseWidgets.skeleton(40).children).toHaveLength(12);
    expect(proseWidgets.skeleton(Number.NaN).children).toHaveLength(3);
  });
});

describe('proseWidgets.gutterMarker', () => {
  it('é um botão nomeado fora da ordem do Tab, com o gancho [data-ai-marker]', () => {
    const node = proseWidgets.gutterMarker('ai');
    expect(node.tagName).toBe('BUTTON');
    expect(node).toHaveAttribute('type', 'button');
    expect(node).toHaveAttribute(PROSE_WIDGET_ATTR, 'gutter-marker');
    expect(node).toHaveAttribute('data-ai-marker', 'ai');
    expect(node).toHaveAttribute('contenteditable', 'false');
    expect(node).toHaveAccessibleName('Revisar texto da IA');
    expect(node.tabIndex).toBe(-1);
    expect(node).not.toHaveAttribute('title');
  });

  it('aceita rótulo próprio e entra no Tab quando pedido', () => {
    const node = proseWidgets.gutterMarker('ai', { label: 'Revisar parágrafo 3', focusable: true });
    expect(node).toHaveAccessibleName('Revisar parágrafo 3');
    expect(node).not.toHaveAttribute('tabindex');
  });

  it('ativa no clique sem tirar o foco do editor e cancela o mousedown', () => {
    const onActivate = vi.fn();
    const node = proseWidgets.gutterMarker('ai', { onActivate });
    document.body.append(node);
    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    node.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
    node.click();
    expect(onActivate).toHaveBeenCalledTimes(1);
    node.remove();
  });

  it('ativa com Enter e Espaço uma vez só, e a tecla não chega ao editor', async () => {
    const onActivate = vi.fn();
    const editorKeydown = vi.fn();
    const editor = document.createElement('div');
    editor.addEventListener('keydown', (event) => {
      if (!event.defaultPrevented) editorKeydown(event.key);
    });
    const node = proseWidgets.gutterMarker('ai', { onActivate, focusable: true });
    editor.append(node);
    document.body.append(editor);

    for (const key of ['Enter', ' ']) {
      node.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      // Clique sintético que o navegador dispara junto da tecla: não ativa de novo.
      node.click();
      node.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true, cancelable: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    expect(onActivate).toHaveBeenCalledTimes(2);
    expect(editorKeydown).not.toHaveBeenCalled();

    node.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true }));
    expect(editorKeydown).toHaveBeenCalledWith('a');
    editor.remove();
  });
});

describe('proseWidgets: documento', () => {
  it('cria os nós no documento recebido', () => {
    const other = document.implementation.createHTMLDocument('outra janela');
    expect(proseWidgets.insertion('x', { document: other }).ownerDocument).toBe(other);
    expect(proseWidgets.caret({ document: other }).ownerDocument).toBe(other);
    expect(proseWidgets.skeleton(2, { document: other }).ownerDocument).toBe(other);
    expect(proseWidgets.gutterMarker('ai', { document: other }).ownerDocument).toBe(other);
  });

  it('cada chamada devolve um nó novo (o editor pode montar e desmontar à vontade)', () => {
    expect(proseWidgets.caret()).not.toBe(proseWidgets.caret());
  });
});
