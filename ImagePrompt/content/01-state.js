// ImagePrompt content module: state

if (!globalThis.__imagetopromptV2Loaded__) {
  var isTopFrame = window.top === window.self;
  var ContentRuntimeError = class ContentRuntimeError extends Error {
    code;
    action;
    constructor(message, options = {}) {
      super(message),
        (this.name = "ContentRuntimeError"),
        (this.code = options.code ?? null),
        (this.action = options.action ?? null);
    }
  };
  var activeLanguage = "en",
    loadingMessages = LOADING_STEPS[activeLanguage],
    localizedText = CONTENT_TEXT[activeLanguage],
    contentLanguagePromise = null;
  var PANEL_WIDTH = 360,
    PANEL_HEIGHT = 520,
    MINIMIZED_PANEL_WIDTH = 360,
    HISTORY_LIMIT = 20,
    HISTORY_RAIL_WIDTH = 198,
    INLINE_MENU_EDGE_PADDING = 12,
    INLINE_MENU_CORNER_OFFSET = 10,
    HISTORY_RAIL_MIN_HEIGHT = 180,
    HISTORY_THUMB_MAX_WIDTH = HISTORY_RAIL_WIDTH - 32,
    HISTORY_THUMB_MIN_HEIGHT = 78,
    HISTORY_THUMB_MAX_HEIGHT = 292,
    PANEL_SESSION_KEY = "sharedPanelSession",
    ONBOARDING_STORAGE_KEY = "inlinePromptOnboardingComplete",
    API_SETTING_KEYS = ["apiEnabled", "baseUrl", "apiKey", "model"];
  var inlineActionStatusBySrc = new Map();
}
function normalizeLanguage(language) {
  return language === "zh" || language === "en" ? language : "en";
}
function detectDefaultLanguage() {
  const languages = [],
    browserLanguage =
      typeof chrome < "u" && chrome.i18n?.getUILanguage
        ? chrome.i18n.getUILanguage()
        : "";
  browserLanguage && languages.push(browserLanguage),
    Array.isArray(navigator.languages) && languages.push(...navigator.languages),
    navigator.language && languages.push(navigator.language);
  for (const candidateLanguage of languages) {
    const normalizedLanguage = candidateLanguage.toLowerCase();
    if (normalizedLanguage.startsWith("zh")) return "zh";
  }
  return "en";
}
function setContentLanguage(language) {
  if (
    ((activeLanguage = language),
    (loadingMessages = LOADING_STEPS[language]),
    (localizedText = CONTENT_TEXT[language]),
    (panelState.language = language),
    panelState.analysis && !isEditingPrompt())
  ) {
    const promptText = promptForLanguage(panelState.analysis, panelState.language);
    (renderedPromptDraft = promptText), (currentPromptDraft = promptText), (isPromptTyping = !1);
  }
  panelState.errorCode === "CONFIG_REQUIRED" &&
    ((panelState.error = configRequiredMessage()),
    panelState.errorAction?.type === "open-settings" &&
      (panelState.errorAction = { ...panelState.errorAction, label: settingsActionLabel() })),
    panelState.status !== "hidden" && panelLayer && renderPanel();
}
async function loadContentLanguage() {
  try {
    const storedSettings = await chrome.storage.sync.get([
        "systemLanguage",
        "defaultLanguage",
      ]),
      configuredLanguage = storedSettings.systemLanguage ?? storedSettings.defaultLanguage;
    setContentLanguage(configuredLanguage === "zh" || configuredLanguage === "en" ? configuredLanguage : detectDefaultLanguage());
  } catch {
    setContentLanguage(detectDefaultLanguage());
  }
}
function ensureContentLanguage() {
  return contentLanguagePromise || (contentLanguagePromise = loadContentLanguage()), contentLanguagePromise;
}
if (!globalThis.__imagetopromptV2Loaded__) {
  var rootHost = document.getElementById("imagetoprompt-root"),
    shadowRoot = null,
    panelLayer = null,
    inlineActionLayer = null,
    toastLayer = null,
    screenshotLayer = null,
    isScreenshotSelecting = !1,
    panelState = {
      status: "hidden",
      language: activeLanguage,
      analysis: null,
      error: "",
      errorCode: null,
      errorAction: null,
      copied: !1,
    },
    lastResolvedTarget = { element: null, target: null, point: null },
    panelAnchor = null,
    currentTarget = null,
    targetPoint = null,
    activeRequestId = 0,
    panelPosition = null,
    dragPointerId = null,
    dragOffset = { x: 0, y: 0 },
    dragStartPoint = null,
    hasDraggedPanel = !1,
    suppressPanelClickUntil = 0,
    loadingProgress = 12,
    loadingProgressFrame = null,
    loadingProgressLastTime = null,
    loadingStartedAt = null,
    typingTimer = null,
    promptSaveTimer = null,
    currentPromptDraft = "",
    renderedPromptDraft = "",
    promptDraftsByLanguage = {},
    isPromptTyping = !1,
    isResultEntering = !1,
    resultEnterTimer = null,
    copyGlowTimer = null,
    isCopyGlowActive = !1,
    historyItems = [],
    historyLoadPromise = null,
    historyLoaded = !1,
    historyRailOpen = !1,
    isHistoryRailEntering = !1,
    historyRailEnterTimer = null,
    isHistoryRailClosing = !1,
    pendingHistoryId = null,
    failedHistoryItems = [],
    activeHistoryRequest = null,
    preloadedHistoryIds = new Set(),
    historyFlyover = null,
    selectedHistoryId = null,
    historyScrollTop = 0,
    pendingHistoryScrollTop = null,
    historyScrollRestoreTimer = null,
    historyRailHeightFrame = null,
    shareCardOverlay = null,
    isShareCardRendering = !1;
  var historyImageCache = new Map(),
    historyImageLoadPromises = new Map();
  var promptEditorContainerScrollTop = 0,
    promptEditorScrollTop = 0,
    pendingPromptEditorScroll = null,
    promptEditorScrollRestoreTimer = null,
    hoveredElement = null,
    hoveredTarget = null,
    hoverPoint = null,
    isInlineMenuHovered = !1,
    hoverHideTimer = null,
    toastState = null,
    toastHideTimer = null,
    lastToastKey = "",
    lastToastAt = 0,
    extensionEnabled = !0,
    inlineActionsEnabled = !0,
    panelMode = "hidden",
    panelTransitionMode = null,
    isPanelModeAnimating = !1,
    hasLoadedInlineOnboarding = !1,
    isInlineOnboardingComplete = !1,
    suppressHoverUntil = 0,
    inlineMenuRepositionTimers = [],
    recentlyClosedHoverSrc = null,
    expandedPanelWidth = null;
  var disabledHostPatterns = [],
    blockedHostPatterns = [];
  var setupState = {
      baseUrl: "",
      apiKey: "",
      model: "",
      apiEnabled: !0,
      error: "",
      isSaving: !1,
      manualResult: "",
    },
    pendingAnalysisRequest = null,
    manualResultState = null;
}
