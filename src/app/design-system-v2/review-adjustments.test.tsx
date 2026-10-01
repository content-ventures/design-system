import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  ActionMenu,
  Button,
  Checkbox,
  ColorPicker,
  DesignSystemTheme,
  MoneyInput,
  NumberInput,
  SearchField,
  Slider,
  VerificationCode,
} from '../../components/ds-v2';
import { GalleryExample, VideoExample, validateVideo } from './media-workspace';
import { CatalogSpecimen } from './catalog';
import { catalogItems } from './registry';
const setup = (children: ReactNode) => render(<DesignSystemTheme>{children}</DesignSystemTheme>);

describe('ajustes das notas de Minha revisão', () => {
  it('mantém o slider controlado e expõe o valor monetário para tecnologia assistiva', () => {
    function SliderHarness() {
      const [value, setValue] = useState(35);
      return (
        <>
          <Slider
            aria-label="Limite diário"
            min={10}
            max={100}
            step={5}
            value={value}
            aria-valuetext={`R$ ${value * 10} por dia`}
            onChange={(event) => setValue(Number(event.target.value))}
          />
          <output>{value}</output>
        </>
      );
    }

    setup(<SliderHarness />);
    const slider = screen.getByRole('slider', { name: 'Limite diário' });
    expect(slider).toHaveAttribute('aria-valuetext', 'R$ 350 por dia');
    fireEvent.change(slider, { target: { value: '45' } });
    expect(screen.getByText('45')).toBeVisible();
    expect(slider).toHaveAttribute('aria-valuetext', 'R$ 450 por dia');
  });

  it('mantém o menu no tema, navega com setas e fecha após a escolha', async () => {
    const action = vi.fn();
    const user = userEvent.setup();
    setup(
      <ActionMenu
        label="Opções"
        description="Escolha uma ação para o registro."
        trigger={<Button>Mais ações</Button>}
        items={[
          { label: 'Duplicar', description: 'Cria uma nova versão.', onSelect: action },
          { label: 'Bloqueado', disabled: true },
          { label: 'Arquivar', onSelect: action },
        ]}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Mais ações' });
    await user.click(trigger);
    expect(screen.getByRole('menu').closest('[data-ds-v2]')).not.toBeNull();
    expect(screen.getByText('Escolha uma ação para o registro.')).toBeVisible();
    expect(screen.getByText('Cria uma nova versão.')).toBeVisible();
    expect(screen.getByRole('menuitem', { name: 'Duplicar' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Arquivar' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(action).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
  it('foca também o primeiro link do menu de conta e restaura o gatilho', async () => {
    const user = userEvent.setup();
    setup(
      <ActionMenu
        label="Conta"
        trigger={<Button>Minha conta</Button>}
        header={<strong>Ana Lima</strong>}
        items={[
          { label: 'Meu perfil', href: '#perfil' },
          { label: 'Equipe', href: '#membros' },
        ]}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Minha conta' }));
    expect(screen.getByRole('menuitem', { name: 'Meu perfil' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('menuitem', { name: 'Equipe' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Minha conta' })).toHaveFocus();
  });
  it('representa seleção parcial e mantém o checkbox nativo operável por teclado', async () => {
    function Example() {
      const [checked, setChecked] = useState(false);
      return (
        <Checkbox
          label="Todos"
          checked={checked}
          indeterminate={!checked}
          onChange={(event) => setChecked(event.target.checked)}
        />
      );
    }
    setup(<Example />);
    const user = userEvent.setup();
    expect(screen.getByRole('checkbox')).toBePartiallyChecked();
    await user.tab();
    await user.keyboard(' ');
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.getByRole('checkbox')).not.toBePartiallyChecked();
  });
  it('limita os incrementos e permite limpar e digitar a quantidade', async () => {
    function Example() {
      const [value, setValue] = useState<number | ''>(1);
      return (
        <NumberInput
          aria-label="Inserções"
          value={value}
          onValueChange={setValue}
          min={1}
          max={2}
        />
      );
    }
    setup(<Example />);
    const user = userEvent.setup();
    expect(screen.getByRole('button', { name: 'Diminuir quantidade' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Aumentar quantidade' }));
    expect(screen.getByRole('spinbutton')).toHaveValue(2);
    expect(screen.getByRole('button', { name: 'Aumentar quantidade' })).toBeDisabled();
    await user.clear(screen.getByRole('spinbutton'));
    await user.type(screen.getByRole('spinbutton'), '1');
    expect(screen.getByRole('spinbutton')).toHaveValue(1);
  });
  it('limita contagens a oito dígitos e dimensiona o campo pelo maior valor', async () => {
    function Example() {
      const [value, setValue] = useState<number | ''>(12);
      return (
        <NumberInput
          aria-label="Inserções"
          value={value}
          onValueChange={setValue}
          min={1}
          max={99_999_999}
          suffix="inserções"
        />
      );
    }
    setup(<Example />);
    const user = userEvent.setup();
    const input = screen.getByRole('spinbutton', { name: 'Inserções' });
    expect(input.parentElement).toHaveStyle({ '--number-input-width': '9.5ch' });
    await user.clear(input);
    await user.type(input, '123456789');
    expect(input).toHaveValue(99_999_999);
    expect(screen.getByRole('button', { name: 'Aumentar quantidade' })).toBeDisabled();
  });
  it('mascara moeda brasileira durante a digitação e descarta caracteres inválidos', async () => {
    setup(<MoneyInput aria-label="Investimento" />);
    const user = userEvent.setup();
    const input = screen.getByRole('textbox', { name: 'Investimento' });
    await user.type(input, '24800');
    expect(input).toHaveValue('24800');
    await user.type(input, ',5texto');
    expect(input).toHaveValue('24800,5');
    await user.tab();
    expect(input).toHaveValue('24.800,50');
  });
  it('valida hexadecimal e mantém cor inválida fora da prévia', async () => {
    const change = vi.fn();
    setup(<ColorPicker value="#0875db" onChange={change} />);
    const user = userEvent.setup();
    const input = screen.getByRole('textbox', { name: 'Código hexadecimal' });
    await user.clear(input);
    await user.type(input, '#zzzzzz');
    await user.tab();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(change).not.toHaveBeenCalled();
    await user.clear(input);
    await user.type(input, '#246878');
    expect(change).toHaveBeenLastCalledWith('#246878');
  });
  it('distribui o código colado, filtra caracteres e permite navegar entre os dígitos', () => {
    function CodeHarness() {
      const [value, setValue] = useState('');
      return <VerificationCode value={value} onChange={setValue} />;
    }
    setup(<CodeHarness />);
    const inputs = screen.getAllByRole('textbox', { name: /Dígito \d de 6/ });

    fireEvent.paste(inputs[0]!, { clipboardData: { getData: () => '12a-3456' } });
    expect(inputs.map((input) => (input as HTMLInputElement).value)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
    ]);
    expect(inputs[5]).toHaveFocus();

    fireEvent.keyDown(inputs[5]!, { key: 'Home' });
    expect(inputs[0]).toHaveFocus();
    fireEvent.keyDown(inputs[0]!, { key: 'ArrowRight' });
    expect(inputs[1]).toHaveFocus();
  });
  it('busca sem acentos, não escolhe bloqueados e fecha com Escape', async () => {
    const select = vi.fn();
    setup(
      <SearchField
        label="Portais"
        options={[
          { value: 'a', label: 'São Paulo' },
          { value: 'b', label: 'Portal bloqueado', disabled: true },
        ]}
        onSelect={select}
      />,
    );
    const user = userEvent.setup();
    const input = screen.getByRole('combobox');
    await user.type(input, 'sao');
    expect(screen.getByRole('option', { name: 'São Paulo' })).toBeInTheDocument();
    await user.keyboard('{ArrowDown}{Enter}');
    expect(select).toHaveBeenCalledWith({ value: 'a', label: 'São Paulo' });
    expect(input).toHaveAttribute('aria-expanded', 'false');
    await user.clear(input);
    await user.type(input, 'bloqueado');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(select).toHaveBeenCalledOnce();
    await user.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });
  it('filtra criativos e mantém seleção ao abrir e navegar pela prévia', async () => {
    setup(<GalleryExample />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('checkbox', { name: 'Selecionar Lançamento primavera' }));
    await user.click(screen.getByRole('button', { name: 'Ampliar Lançamento primavera' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Lançamento primavera' }));
    expect(dialog.getByText('aurora-display-1200x628.png')).toBeInTheDocument();
    await user.click(dialog.getByRole('button', { name: 'Próxima imagem' }));
    expect(screen.getByRole('dialog', { name: 'Encontro de negócios' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Fechar janela' }));
    expect(screen.getByRole('checkbox', { name: 'Selecionar Lançamento primavera' })).toBeChecked();
    await user.type(screen.getByRole('textbox', { name: 'Buscar criativos' }), 'inexistente');
    expect(screen.getByText('Nenhum criativo encontrado')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(screen.getAllByRole('article')).toHaveLength(4);
  });
  it('valida vídeo e libera a URL local ao remover', async () => {
    expect(validateVideo(new File([], 'vazio.mp4', { type: 'video/mp4' }))).toContain('vazio');
    expect(validateVideo(new File(['texto'], 'arquivo.txt', { type: 'text/plain' }))).toContain(
      'MP4',
    );
    const create = vi.fn(() => 'blob:video-local');
    const revoke = vi.fn();
    const oldCreate = URL.createObjectURL;
    const oldRevoke = URL.revokeObjectURL;
    URL.createObjectURL = create;
    URL.revokeObjectURL = revoke;
    try {
      const view = setup(<VideoExample />);
      const user = userEvent.setup();
      await user.upload(
        screen.getByLabelText('Selecionar arquivos'),
        new File(['mp4'], 'campanha.mp4', { type: 'video/mp4' }),
      );
      expect(view.container.querySelector('video')).toHaveAttribute('src', 'blob:video-local');
      fireEvent.error(view.container.querySelector('video')!);
      expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível reproduzir');
      await user.click(screen.getByRole('button', { name: 'Remover vídeo' }));
      expect(revoke).toHaveBeenCalledWith('blob:video-local');
    } finally {
      URL.createObjectURL = oldCreate;
      URL.revokeObjectURL = oldRevoke;
    }
  });
  it('confere o plano por mídia e permite editar sem perder o preenchimento', async () => {
    setup(
      <CatalogSpecimen
        item={catalogItems.find((item) => item.id === 'wizard')!}
        notify={() => {}}
      />,
    );
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox', { name: 'Nome da campanha' }), 'Primavera 2026');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.click(screen.getByRole('checkbox', { name: 'E-mail dedicado' }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByText('120.000 impressões')).toBeInTheDocument();
    expect(screen.getByText('18.400 contatos')).toBeInTheDocument();
    expect(screen.getAllByText(/19\.200,00/).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Editar informações' }));
    expect(screen.getByRole('textbox', { name: 'Nome da campanha' })).toHaveValue('Primavera 2026');
  });
});
