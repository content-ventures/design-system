/**
 * Campos do DS V3 (grupo formularios-a) num ponto só: campo, grupo, controle, área de texto,
 * busca e os especiais (senha, número, dinheiro, código, resumo de erros).
 */
export {
  Field,
  FieldGroup,
  Counter,
  useNotice,
  Input,
  ControlButton,
  Textarea,
  SearchField,
  Highlight,
  HintIcon,
  type InputProps,
  type TextareaProps,
} from './fields';
export { PasswordField, type PasswordRequirement } from './password-field';
export { NumberField, formatNumber, parseNumber, type NumberFieldProps } from './number-field';
export {
  MoneyField,
  formatMoney,
  moneyBRL,
  parseMoney,
  type MoneyFieldProps,
  type MoneyAdjustReason,
} from './money-field';
export { CodeInput, type CodeStatus } from './code-input';
export { ErrorCount, ErrorSummary, focusField, type FormError } from './error-summary';
