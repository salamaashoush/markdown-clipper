/**
 * Chrome Extension API Contracts
 * Version: 1.0.0
 *
 * Defines contracts for Chrome Extension APIs usage
 */

// Context Menu API
export interface ContextMenuContract {
  // Menu Items
  menuItems: ContextMenuItem[];

  // Operations
  create(item: ContextMenuItem): Promise<string>;
  update(id: string, updates: Partial<ContextMenuItem>): Promise<void>;
  remove(id: string): Promise<void>;
  removeAll(): Promise<void>;
}

export interface ContextMenuItem {
  id: string;
  title: string;
  contexts: ContextType[];
  parentId?: string;
  documentUrlPatterns?: string[];
  targetUrlPatterns?: string[];
  enabled?: boolean;
  visible?: boolean;
  onclick?: (info: OnClickData, tab: Browser.tabs.Tab) => void;
}

export enum ContextType {
  ALL = 'all',
  PAGE = 'page',
  FRAME = 'frame',
  SELECTION = 'selection',
  LINK = 'link',
  EDITABLE = 'editable',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
}

export interface OnClickData {
  menuItemId: string;
  parentMenuItemId?: string;
  mediaType?: string;
  linkUrl?: string;
  srcUrl?: string;
  pageUrl: string;
  frameUrl?: string;
  frameId?: number;
  selectionText?: string;
  editable: boolean;
  wasChecked?: boolean;
  checked?: boolean;
}

// Downloads API
export interface DownloadsContract {
  // Operations
  download(options: DownloadOptions): Promise<number>;
  cancel(downloadId: number): Promise<void>;
  pause(downloadId: number): Promise<void>;
  resume(downloadId: number): Promise<void>;
  search(query: DownloadQuery): Promise<DownloadItem[]>;
  getFileIcon(downloadId: number, options?: GetFileIconOptions): Promise<string>;
  open(downloadId: number): Promise<void>;
  show(downloadId: number): Promise<void>;
  showDefaultFolder(): Promise<void>;
  erase(query: DownloadQuery): Promise<number[]>;
  removeFile(downloadId: number): Promise<void>;

  // Events
  onCreated: DownloadEvent<DownloadItem>;
  onChanged: DownloadEvent<DownloadDelta>;
  onErased: DownloadEvent<number>;
}

export interface DownloadOptions {
  url?: string;
  filename?: string;
  conflictAction?: ConflictAction;
  saveAs?: boolean;
  method?: HttpMethod;
  headers?: HttpHeader[];
  body?: string;
}

export enum ConflictAction {
  UNIQUIFY = 'uniquify',
  OVERWRITE = 'overwrite',
  PROMPT = 'prompt',
}

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
}

export interface HttpHeader {
  name: string;
  value: string;
}

export interface DownloadQuery {
  query?: string[];
  startedBefore?: string;
  startedAfter?: string;
  endedBefore?: string;
  endedAfter?: string;
  totalBytesGreater?: number;
  totalBytesLess?: number;
  filenameRegex?: string;
  urlRegex?: string;
  limit?: number;
  state?: DownloadState;
  paused?: boolean;
  error?: DownloadInterruptReason;
  bytesReceived?: number;
  totalBytes?: number;
  fileSize?: number;
  exists?: boolean;
}

export enum DownloadState {
  IN_PROGRESS = 'in_progress',
  INTERRUPTED = 'interrupted',
  COMPLETE = 'complete',
}

export enum DownloadInterruptReason {
  FILE_FAILED = 'FILE_FAILED',
  FILE_ACCESS_DENIED = 'FILE_ACCESS_DENIED',
  FILE_NO_SPACE = 'FILE_NO_SPACE',
  FILE_NAME_TOO_LONG = 'FILE_NAME_TOO_LONG',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_VIRUS_INFECTED = 'FILE_VIRUS_INFECTED',
  FILE_TRANSIENT_ERROR = 'FILE_TRANSIENT_ERROR',
  FILE_BLOCKED = 'FILE_BLOCKED',
  FILE_SECURITY_CHECK_FAILED = 'FILE_SECURITY_CHECK_FAILED',
  FILE_TOO_SHORT = 'FILE_TOO_SHORT',
  NETWORK_FAILED = 'NETWORK_FAILED',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_DISCONNECTED = 'NETWORK_DISCONNECTED',
  NETWORK_SERVER_DOWN = 'NETWORK_SERVER_DOWN',
  NETWORK_INVALID_REQUEST = 'NETWORK_INVALID_REQUEST',
  SERVER_FAILED = 'SERVER_FAILED',
  SERVER_NO_RANGE = 'SERVER_NO_RANGE',
  SERVER_BAD_CONTENT = 'SERVER_BAD_CONTENT',
  SERVER_UNAUTHORIZED = 'SERVER_UNAUTHORIZED',
  SERVER_CERT_PROBLEM = 'SERVER_CERT_PROBLEM',
  SERVER_FORBIDDEN = 'SERVER_FORBIDDEN',
  USER_CANCELED = 'USER_CANCELED',
  USER_SHUTDOWN = 'USER_SHUTDOWN',
  CRASH = 'CRASH',
}

export interface DownloadItem {
  id: number;
  url: string;
  referrer?: string;
  filename: string;
  incognito: boolean;
  danger: DangerType;
  mime: string;
  startTime: string;
  endTime?: string;
  estimatedEndTime?: string;
  state: DownloadState;
  paused: boolean;
  canResume: boolean;
  error?: DownloadInterruptReason;
  bytesReceived: number;
  totalBytes: number;
  fileSize: number;
  exists: boolean;
}

export enum DangerType {
  FILE = 'file',
  URL = 'url',
  CONTENT = 'content',
  UNCOMMON = 'uncommon',
  HOST = 'host',
  UNWANTED = 'unwanted',
  SAFE = 'safe',
  ACCEPTED = 'accepted',
}

export interface DownloadDelta {
  id: number;
  url?: StringDelta;
  filename?: StringDelta;
  danger?: StringDelta;
  mime?: StringDelta;
  startTime?: StringDelta;
  endTime?: StringDelta;
  state?: StringDelta;
  canResume?: BooleanDelta;
  paused?: BooleanDelta;
  error?: StringDelta;
  totalBytes?: NumberDelta;
  fileSize?: NumberDelta;
  exists?: BooleanDelta;
}

export interface StringDelta {
  previous?: string;
  current?: string;
}

export interface NumberDelta {
  previous?: number;
  current?: number;
}

export interface BooleanDelta {
  previous?: boolean;
  current?: boolean;
}

export interface GetFileIconOptions {
  size?: number;
}

export interface DownloadEvent<T> {
  addListener(callback: (downloadItem: T) => void): void;
  removeListener(callback: (downloadItem: T) => void): void;
  hasListener(callback: (downloadItem: T) => void): boolean;
}

// Tabs API
export interface TabsContract {
  // Query and Get
  query(queryInfo: TabQuery): Promise<Browser.tabs.Tab[]>;
  get(tabId: number): Promise<Browser.tabs.Tab>;
  getCurrent(): Promise<Browser.tabs.Tab | undefined>;

  // Create and Update
  create(createProperties: TabCreateProperties): Promise<Browser.tabs.Tab>;
  update(tabId: number, updateProperties: TabUpdateProperties): Promise<Browser.tabs.Tab>;

  // Navigation
  reload(tabId: number, reloadProperties?: ReloadProperties): Promise<void>;
  goBack(tabId?: number): Promise<void>;
  goForward(tabId?: number): Promise<void>;

  // Tab Management
  duplicate(tabId: number): Promise<Browser.tabs.Tab>;
  remove(tabIds: number | number[]): Promise<void>;
  move(tabIds: number | number[], moveProperties: MoveProperties): Promise<Browser.tabs.Tab | Browser.tabs.Tab[]>;

  // Messaging
  sendMessage<T = any>(tabId: number, message: any): Promise<T>;
  connect(tabId: number, connectInfo?: ConnectInfo): Browser.runtime.Port;

  // Content Scripts
  executeScript(tabId: number, details: ScriptInjection): Promise<any[]>;
  insertCSS(tabId: number, details: CSSInjection): Promise<void>;
  removeCSS(tabId: number, details: CSSInjection): Promise<void>;

  // Events
  onCreated: TabEvent<Browser.tabs.Tab>;
  onUpdated: TabUpdateEvent;
  onMoved: TabMoveEvent;
  onActivated: TabActivatedEvent;
  onRemoved: TabRemovedEvent;
}

export interface TabQuery {
  active?: boolean;
  audible?: boolean;
  autoDiscardable?: boolean;
  currentWindow?: boolean;
  discarded?: boolean;
  groupId?: number;
  highlighted?: boolean;
  index?: number;
  lastFocusedWindow?: boolean;
  muted?: boolean;
  pinned?: boolean;
  status?: TabStatus;
  title?: string;
  url?: string | string[];
  windowId?: number;
  windowType?: WindowType;
}

export enum TabStatus {
  LOADING = 'loading',
  COMPLETE = 'complete',
}

export enum WindowType {
  NORMAL = 'normal',
  POPUP = 'popup',
  PANEL = 'panel',
  APP = 'app',
  DEVTOOLS = 'devtools',
}

export interface TabCreateProperties {
  windowId?: number;
  index?: number;
  url?: string;
  active?: boolean;
  pinned?: boolean;
  openerTabId?: number;
}

export interface TabUpdateProperties {
  url?: string;
  active?: boolean;
  highlighted?: boolean;
  pinned?: boolean;
  muted?: boolean;
  openerTabId?: number;
  autoDiscardable?: boolean;
}

export interface ReloadProperties {
  bypassCache?: boolean;
}

export interface MoveProperties {
  windowId?: number;
  index: number;
}

export interface ConnectInfo {
  name?: string;
  frameId?: number;
}

export interface ScriptInjection {
  target: InjectionTarget;
  func?: () => void;
  files?: string[];
  args?: any[];
  injectImmediately?: boolean;
  world?: ExecutionWorld;
}

export interface CSSInjection {
  target: InjectionTarget;
  css?: string;
  files?: string[];
  origin?: StyleOrigin;
}

export interface InjectionTarget {
  tabId: number;
  frameIds?: number[];
  allFrames?: boolean;
}

export enum ExecutionWorld {
  ISOLATED = 'ISOLATED',
  MAIN = 'MAIN',
}

export enum StyleOrigin {
  AUTHOR = 'author',
  USER = 'user',
}

export interface TabEvent<T> {
  addListener(callback: (tab: T) => void): void;
  removeListener(callback: (tab: T) => void): void;
  hasListener(callback: (tab: T) => void): boolean;
}

export interface TabUpdateEvent {
  addListener(callback: (tabId: number, changeInfo: TabChangeInfo, tab: Browser.tabs.Tab) => void): void;
  removeListener(callback: (tabId: number, changeInfo: TabChangeInfo, tab: Browser.tabs.Tab) => void): void;
  hasListener(callback: (tabId: number, changeInfo: TabChangeInfo, tab: Browser.tabs.Tab) => void): boolean;
}

export interface TabChangeInfo {
  status?: TabStatus;
  url?: string;
  pinned?: boolean;
  audible?: boolean;
  discarded?: boolean;
  autoDiscardable?: boolean;
  groupId?: number;
  mutedInfo?: Browser.tabs.MutedInfo;
  favIconUrl?: string;
  title?: string;
}

export interface TabMoveEvent {
  addListener(callback: (tabId: number, moveInfo: TabMoveInfo) => void): void;
  removeListener(callback: (tabId: number, moveInfo: TabMoveInfo) => void): void;
  hasListener(callback: (tabId: number, moveInfo: TabMoveInfo) => void): boolean;
}

export interface TabMoveInfo {
  windowId: number;
  fromIndex: number;
  toIndex: number;
}

export interface TabActivatedEvent {
  addListener(callback: (activeInfo: TabActiveInfo) => void): void;
  removeListener(callback: (activeInfo: TabActiveInfo) => void): void;
  hasListener(callback: (activeInfo: TabActiveInfo) => void): boolean;
}

export interface TabActiveInfo {
  tabId: number;
  windowId: number;
}

export interface TabRemovedEvent {
  addListener(callback: (tabId: number, removeInfo: TabRemoveInfo) => void): void;
  removeListener(callback: (tabId: number, removeInfo: TabRemoveInfo) => void): void;
  hasListener(callback: (tabId: number, removeInfo: TabRemoveInfo) => void): boolean;
}

export interface TabRemoveInfo {
  windowId: number;
  isWindowClosing: boolean;
}

// Permissions
export const REQUIRED_PERMISSIONS = [
  'contextMenus',
  'storage',
  'activeTab',
  'tabs',
  'downloads',
  'clipboardWrite',
];

export const OPTIONAL_PERMISSIONS = [
  'notifications',
  'bookmarks',
];

export const HOST_PERMISSIONS = [
  '<all_urls>',
];