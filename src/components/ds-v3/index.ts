/**
 * MediaOn DS V3 — barril público. Cada arquivo continua importável direto
 * (`@/components/ds-v3/<arquivo>`); aqui ficam só os nomes de uso geral.
 * Auxiliares internos (posicionamento, presença, hosts de camada) não saem daqui.
 */

/* Fundamentos */
export { ThemeV3, type ThemeMode } from './theme';
export { interV3 } from './font';
export { VisuallyHidden, LiveRegion, useAnnouncer } from './a11y';
export { formatRelative, textStats, type TextStats } from './format';

/* Ações */
export {
  Button,
  IconButton,
  ButtonLink,
  ButtonGroup,
  SplitButton,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
} from './button';
export { TextLink, LinkButton, type LinkTone, type LinkSize } from './link';
export { ToggleButton, ToggleGroup, type ToggleItem, type ToggleGroupProps } from './toggle';
export { RowActions, type RowAction } from './row-actions';

/* Identidade e mídia */
export {
  IconTile,
  Avatar,
  AvatarGroup,
  BrandMark,
  MediaOnMark,
  MadeWith,
  BrandLockup,
  seedOf,
  type AvatarSize,
  type AvatarPresence,
  type AvatarImageState,
} from './identity';
export {
  FileGlyph,
  MediaFrame,
  MiddleEllipsis,
  fileExt,
  fileKindOf,
  formatBytes,
  ratioOf,
  type FileKind,
  type MediaState,
  type MediaRatio,
} from './media';
export { Gallery, Carousel, type GalleryItem } from './gallery';
export { Dropzone, FileRow, FormatFrame, type UploadFormat, type RejectedFile } from './upload';
export {
  AttachmentRow,
  AttachmentChip,
  AttachmentPreview,
  type AttachmentStatus,
} from './attachment';
export { VideoPlayer, formatClock, type VideoState, type VideoCue } from './video';

/* Status e marcadores */
export { Badge, Chip, Kbd, Count, type Tone } from './badge';

/* Formulários */
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
export { ErrorSummary, focusField, type FormError } from './error-summary';
export { Select, type SelectOption, type SelectProps } from './select';
export { Combobox, searchOptions, type ComboboxProps } from './combobox';
export { MultiSelect, type MultiSelectProps } from './multiselect';
export {
  Checkbox,
  CheckboxMark,
  CheckboxGroup,
  Radio,
  RadioGroup,
  Switch,
  SwitchRow,
  Segmented,
  ChoiceCard,
  type CheckboxProps,
  type RadioProps,
  type SegmentOption,
} from './selection';
export {
  Slider,
  RangeSlider,
  type SliderMark,
  type SliderTick,
  type SliderProps,
  type RangeSliderProps,
} from './slider';
export {
  DatePicker,
  DateRangePicker,
  Calendar,
  DayPreview,
  type DatePickerProps,
  type DateRangePickerProps,
  type DateRange,
  type DateWindow,
  type DatePreset,
  type CalendarEvent,
  type CalendarProps,
  type DayPreviewItem,
} from './date-picker';
export { TimeField, parseTime, type TimeFieldProps } from './time-field';
export {
  ColorField,
  COLOR_PRESETS,
  normalizeHex,
  contrastRatio,
  whiteTextContrast,
  type ColorFieldProps,
} from './color-picker';
export { TagInput } from './tag-input';

/* Navegação */
export {
  AppShell,
  useShell,
  Sidebar,
  SidebarItem,
  SidebarSearch,
  SidebarAccount,
  ProductMark,
  PortalSwitcher,
  Breadcrumb,
  BreadcrumbItem,
  TopBar,
  TopBarItem,
  TopBarAccount,
  NotificationsButton,
  CommandPanel,
  CommandPalette,
  type NavItem,
  type NavSoon,
  type NavGroup,
  type Portal,
  type Crumb,
  type CommandItem,
  type CommandGroup,
} from './app-shell';
export { Tabs, type TabItem } from './tabs';
export {
  Stepper,
  StepperCompact,
  StepList,
  StepMarker,
  StepPipeline,
  FormSection,
  FormRow,
  ActionBar,
  SaveIndicator,
  stepStateAt,
  type StepState,
  type StepItem,
  type PipelineSubstep,
  type PipelineStage,
  type SectionState,
  type SaveStatus,
} from './stepper';
export { Pagination, PageButton, PageArrow, pageList } from './pagination';
export {
  Menu,
  MenuPanel,
  MenuSurface,
  type MenuItem,
  type MenuSection,
  type MenuSurfaceProps,
  type MenuTriggerProps,
} from './menu';
export { ContextMenu } from './context-menu';

/* Estrutura */
export {
  PageHeader,
  PageStack,
  SplitLayout,
  Panel,
  Section,
  Accordion,
  Disclosure,
  ExpandableText,
  ScrollArea,
  ResizablePanels,
  DescriptionList,
  FixedFrame,
  CopyButton,
  type AccordionStatus,
  type AccordionItem,
  type DescriptionItem,
} from './structure';
export {
  Card,
  CardLink,
  CardHeader,
  Tray,
  AttachedNote,
  PropertyList,
  Divider,
  MetaList,
  Overline,
} from './surfaces';
export {
  Grid,
  GridItem,
  type GridProps,
  type GridItemProps,
  type GridColumns,
  type GridGap,
  type GridCollapse,
  type GridElement,
} from './grid';
export {
  WorkspaceLayout,
  WorkspaceToggle,
  useWorkspace,
  type WorkspaceLayoutProps,
  type WorkspacePane,
  type WorkspaceSide,
  type WorkspaceView,
  type WorkspaceState,
  type WorkspaceToggleProps,
} from './workspace-layout';

/* Dados */
export {
  DataTable,
  ColumnsMenu,
  BulkBar,
  SelectAllBand,
  type Column,
  type SortState,
  type BulkAction,
} from './table';
export {
  FilterBar,
  FilterBand,
  FilterField,
  ActiveFilters,
  type ActiveFilter,
  type FilterBarProps,
} from './filter-bar';
export { List, ListGroup, ListItem, ListItemSkeleton } from './list-item';
export { StatCard, Delta, Meter, Sparkline, type MeterTone } from './stat';
export { Metric, MetricStrip, type MetricDelta, type MetricProps } from './metric-strip';
export { AuthShowcase, AuthSplit, ShowcaseLayer } from './auth-split';
export { AuthScene, type AuthSceneVariant } from './auth-scenes';
export { Timeline, type TimelineEntry, type TimelineState } from './timeline';

/* Gráficos */
export {
  BarChart,
  LineChart,
  DonutChart,
  DonutMeter,
  FunnelChart,
  SankeyChart,
  MeterList,
  ChartCard,
  ChartKey,
  ChartFigures,
  ChartState,
  ChartSwap,
  ChartTable,
  ChartTooltip,
  Legend,
  chartPalette,
  chartColor,
  niceTicks,
  formatInt,
  formatCompact,
  formatBRL,
  formatBRLCompact,
  formatPct,
  formatDelta,
  type ChartColor,
  type ChartTone,
  type KeyShape,
  type LegendItem,
  type TooltipRow,
  type TooltipDelta,
  type TooltipContent,
  type ChartFigure,
  type SkeletonShape,
  type ChartDatum,
  type ChartSeries,
  type BarChartProps,
  type LineChartProps,
  type MeterItem,
  type DonutDatum,
  type DonutChartProps,
  type FunnelStage,
  type FunnelChartProps,
  type SankeyChartProps,
  type SankeyLink,
  type SankeyNode,
} from './charts';

/* Feedback */
export {
  Reveal,
  Alert,
  Banner,
  Countdown,
  Progress,
  ProgressSteps,
  Spinner,
  Skeleton,
  SkeletonRegion,
  SkeletonText,
  SkeletonRows,
  LoadingSwap,
  EmptyState,
  ErrorState,
  AccessState,
  NotificationItem,
  NotificationList,
  NotificationDot,
  type AlertTone,
  type BannerTone,
  type ProgressTone,
  type ProgressStep,
  type ProgressStepState,
  type SkeletonColumn,
  type StateSize,
  type AccessKind,
  type NotificationEntry,
} from './feedback';
export {
  toast,
  Toaster,
  ToastCard,
  type ToastTone,
  type ToastAction,
  type ToastOptions,
} from './toast';

/* Camadas */
export {
  Dialog,
  DialogFrame,
  Tooltip,
  TruncatedText,
  ContainedLayer,
  useModalLayer,
  type DialogSize,
  type ModalLayerOptions,
} from './overlays';
export {
  Popover,
  PopoverHeader,
  type PopoverTriggerProps,
  type Placement as PopoverPlacement,
} from './popover';
export { HoverCard } from './hover-card';
export { Drawer, DrawerFrame, type DrawerSize } from './drawer';
export { BottomSheet, BottomSheetFrame, type SheetSnap } from './bottom-sheet';
export { ResponsiveDialog, type ResponsiveVariant } from './responsive-dialog';
export { ConfirmDialog, ConfirmFrame, type ConfirmTone } from './confirm-dialog';

/* Editor */
export {
  Prose,
  type ProseProps,
  type ProseVariant,
  type ProseSize,
  type ProseMeasure,
  type ProseAlign,
} from './prose';
export {
  proseWidgets,
  PROSE_WIDGET_ATTR,
  type ProseWidgets,
  type ProseWidgetKind,
  type ProseWidgetOptions,
  type ProseInsertionOptions,
  type ProseGutterMarkerKind,
  type ProseGutterMarkerOptions,
} from './prose-widgets';

/* Padrões */
export {
  KanbanBoard,
  KanbanColumn,
  KanbanPlaceholder,
  KanbanEmpty,
  KanbanIconButton,
  KanbanCard,
  KanbanCardRow,
  KanbanCardValue,
  KanbanCardMeta,
  useKanbanDrag,
  StageIcon,
  NextAction,
  LeadCard,
  ActivityComposer,
  ActivityFeed,
  activityKinds,
  type StageKind,
  type KanbanMove,
  type KanbanLane,
  type KanbanEntry,
  type NextActionDue,
  type LeadInterest,
  type LeadNote,
  type LeadOutcome,
  type LeadCardProps,
  type KanbanCardProps,
  type ActivityKind,
  type ActivityDraft,
  type ActivityEntry,
} from './kanban';
export { CampaignKanbanCard } from './campaign-kanban-card';
