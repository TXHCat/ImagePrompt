// ImagePrompt content module: history

if (!globalThis.__imagetopromptV2Loaded__) {
  var HISTORY_STORAGE_KEY = "historyEntries",
    FAILED_HISTORY_STORAGE_KEY = "failedHistoryPlaceholders",
    LATEST_ANALYSIS_STORAGE_KEY = "latestAnalysisSnapshot",
    EXTENSION_ENABLED_STORAGE_KEY = "enabled",
    URL_CHANGE_DEBOUNCE_MS = 280;
  var lastObservedUrl = window.location.href,
    urlChangeTimer = null;
}
function normalizeStringList(rawList) {
  return Array.isArray(rawList)
    ? rawList
        .filter((entry) => typeof entry == "string")
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];
}
function sanitizeStoredValue(rawValue) {
  if (rawValue === null) return null;
  if (typeof rawValue == "string") return rawValue.trim();
  if (typeof rawValue == "number") return Number.isFinite(rawValue) ? rawValue : null;
  if (typeof rawValue == "boolean") return rawValue;
  if (Array.isArray(rawValue))
    return rawValue.map((entry) => sanitizeStoredValue(entry)).filter((entry) => entry !== void 0);
  if (typeof rawValue == "object") {
    const storedObject = {};
    return (
      Object.entries(rawValue).forEach(([key, entryValue]) => {
        const cleanValue = sanitizeStoredValue(entryValue);
        cleanValue !== void 0 && (storedObject[key] = cleanValue);
      }),
      storedObject
    );
  }
}
function sanitizeStoredObject(rawValue) {
  const storedObject = sanitizeStoredValue(rawValue);
  return typeof storedObject == "object" && storedObject !== null && !Array.isArray(storedObject) ? storedObject : {};
}
function readStringPromptField(jsonPrompt, rawJson, camelKey, snakeKey) {
  const directValue = jsonPrompt[camelKey];
  if (typeof directValue == "string") return directValue.trim();
  const rawSnakeValue = rawJson[snakeKey];
  if (typeof rawSnakeValue == "string") return rawSnakeValue.trim();
  const rawCamelValue = rawJson[camelKey];
  return typeof rawCamelValue == "string" ? rawCamelValue.trim() : "";
}
function readStringListPromptField(jsonPrompt, rawJson, camelKey, snakeKey) {
  return jsonPrompt[camelKey] !== void 0
    ? normalizeStringList(jsonPrompt[camelKey])
    : rawJson[snakeKey] !== void 0
      ? normalizeStringList(rawJson[snakeKey])
      : normalizeStringList(rawJson[camelKey]);
}
function normalizePromptDrafts(rawDrafts) {
  if (typeof rawDrafts != "object" || rawDrafts === null) return {};
  const sourceDrafts = rawDrafts,
    normalizedDrafts = {};
  return (
    ["zh", "en", "json"].forEach((language) => {
      typeof sourceDrafts[language] == "string" && (normalizedDrafts[language] = sourceDrafts[language].trim());
    }),
    normalizedDrafts
  );
}
function normalizeAnalysisResponse(rawAnalysis) {
  if (!isPlainObject(rawAnalysis)) return null;
  const source = rawAnalysis,
    chineseValue = normalizeLanguageAnalysis(source.zh),
    englishValue = normalizeLanguageAnalysis(source.en),
    jsonPrompt = isPlainObject(source.jsonPrompt) ? source.jsonPrompt : null,
    styleTags = isPlainObject(source.styleTags) ? source.styleTags : null;
  if (!chineseValue || !englishValue || !jsonPrompt || !styleTags) return null;
  const rawJson = normalizeJsonPromptRaw(jsonPrompt);
  return {
    zh: chineseValue,
    en: englishValue,
    jsonPrompt: normalizeJsonPrompt(jsonPrompt, rawJson),
    styleTags: normalizeStyleTags(styleTags),
  };
}

function isPlainObject(rawValue) {
  return typeof rawValue == "object" && rawValue !== null && !Array.isArray(rawValue);
}

function normalizeLanguageAnalysis(rawLanguageAnalysis) {
  if (!isPlainObject(rawLanguageAnalysis)) return null;
  return typeof rawLanguageAnalysis.prompt == "string" && typeof rawLanguageAnalysis.analysis == "string"
    ? { prompt: rawLanguageAnalysis.prompt.trim(), analysis: rawLanguageAnalysis.analysis.trim() }
    : null;
}

function normalizeJsonPromptRaw(jsonPrompt) {
  const explicitRaw = sanitizeStoredObject(jsonPrompt.raw);
  if (Object.keys(explicitRaw).length > 0) return explicitRaw;
  return sanitizeStoredObject({
    subject: jsonPrompt.subject,
    action_pose: jsonPrompt.actionPose,
    details_appearance: jsonPrompt.detailsAppearance,
    environment_background: jsonPrompt.environmentBackground,
    lighting_atmosphere: jsonPrompt.lightingAtmosphere,
    style_camera: jsonPrompt.styleCamera,
    colors: jsonPrompt.colors,
    materials: jsonPrompt.materials,
    aspect_ratio: jsonPrompt.aspectRatio,
  });
}

function normalizeJsonPrompt(jsonPrompt, rawJson) {
  return {
    subject: readStringPromptField(jsonPrompt, rawJson, "subject", "subject"),
    actionPose: readStringPromptField(
      jsonPrompt,
      rawJson,
      "actionPose",
      "action_pose",
    ),
    detailsAppearance: readStringPromptField(
      jsonPrompt,
      rawJson,
      "detailsAppearance",
      "details_appearance",
    ),
    environmentBackground: readStringPromptField(
      jsonPrompt,
      rawJson,
      "environmentBackground",
      "environment_background",
    ),
    lightingAtmosphere: readStringPromptField(
      jsonPrompt,
      rawJson,
      "lightingAtmosphere",
      "lighting_atmosphere",
    ),
    compositionFraming: readStringPromptField(
      jsonPrompt,
      rawJson,
      "compositionFraming",
      "composition_framing",
    ),
    styleCamera: readStringPromptField(
      jsonPrompt,
      rawJson,
      "styleCamera",
      "style_camera",
    ),
    colors: readStringListPromptField(jsonPrompt, rawJson, "colors", "colors"),
    materials: readStringListPromptField(
      jsonPrompt,
      rawJson,
      "materials",
      "materials",
    ),
    aspectRatio: readStringPromptField(
      jsonPrompt,
      rawJson,
      "aspectRatio",
      "aspect_ratio",
    ),
    qualityModifiers: readStringListPromptField(
      jsonPrompt,
      rawJson,
      "qualityModifiers",
      "quality_modifiers",
    ),
    likelyGenerationIntent: readStringPromptField(
      jsonPrompt,
      rawJson,
      "likelyGenerationIntent",
      "likely_generation_intent",
    ),
    raw: rawJson,
  };
}

function normalizeStyleTags(styleTags) {
  const chineseValue = normalizeStringList(styleTags.zh),
    englishValue = normalizeStringList(styleTags.en);
  return { zh: chineseValue, en: englishValue };
}
function normalizeImageTarget(rawTarget) {
  if (typeof rawTarget != "object" || rawTarget === null) return null;
  const target = rawTarget;
  return typeof target.src != "string" || typeof target.pageUrl != "string"
    ? null
    : {
        src: target.src,
        alt: typeof target.alt == "string" && target.alt.trim() ? target.alt.trim() : void 0,
        pageUrl: target.pageUrl,
        naturalWidth:
          typeof target.naturalWidth == "number" && Number.isFinite(target.naturalWidth)
            ? target.naturalWidth
            : void 0,
        naturalHeight:
          typeof target.naturalHeight == "number" && Number.isFinite(target.naturalHeight)
            ? target.naturalHeight
            : void 0,
      };
}
function normalizeHistoryEntries(rawEntries) {
  return Array.isArray(rawEntries)
    ? rawEntries
        .map((rawEntry) => {
          if (typeof rawEntry != "object" || rawEntry === null) return null;
          const entry = rawEntry,
            analysis = normalizeAnalysisResponse(entry.analysis);
          return !analysis ||
            typeof entry.id != "string" ||
            typeof entry.createdAt != "number" ||
            !Number.isFinite(entry.createdAt) ||
            typeof entry.imageSrc != "string" ||
            typeof entry.pageUrl != "string"
            ? null
            : {
                id: entry.id,
                createdAt: entry.createdAt,
                imageSrc: entry.imageSrc,
                pageUrl: entry.pageUrl,
                imageWidth:
                  typeof entry.imageWidth == "number" &&
                  Number.isFinite(entry.imageWidth)
                    ? entry.imageWidth
                    : void 0,
                imageHeight:
                  typeof entry.imageHeight == "number" &&
                  Number.isFinite(entry.imageHeight)
                    ? entry.imageHeight
                    : void 0,
                analysis: analysis,
                promptDrafts: normalizePromptDrafts(entry.promptDrafts),
              };
        })
        .filter((entry) => entry !== null)
        .sort((leftEntry, rightEntry) => rightEntry.createdAt - leftEntry.createdAt)
        .slice(0, HISTORY_LIMIT)
    : [];
}
function normalizeFailedHistoryEntries(rawEntries) {
  return Array.isArray(rawEntries)
    ? rawEntries
        .map((rawEntry) => {
          if (typeof rawEntry != "object" || rawEntry === null) return null;
          const entry = rawEntry;
          return typeof entry.id != "string" ||
            typeof entry.createdAt != "number" ||
            !Number.isFinite(entry.createdAt) ||
            typeof entry.imageSrc != "string" ||
            typeof entry.pageUrl != "string" ||
            typeof entry.error != "string"
            ? null
            : {
                id: entry.id,
                createdAt: entry.createdAt,
                imageSrc: entry.imageSrc,
                pageUrl: entry.pageUrl,
                alt:
                  typeof entry.alt == "string" && entry.alt.trim()
                    ? entry.alt.trim()
                    : void 0,
                imageWidth:
                  typeof entry.imageWidth == "number" &&
                  Number.isFinite(entry.imageWidth)
                    ? entry.imageWidth
                    : void 0,
                imageHeight:
                  typeof entry.imageHeight == "number" &&
                  Number.isFinite(entry.imageHeight)
                    ? entry.imageHeight
                    : void 0,
                status: "failed",
                error: entry.error.trim() || "Analysis failed. Please try again.",
              };
        })
        .filter((entry) => entry !== null)
        .sort((leftEntry, rightEntry) => rightEntry.createdAt - leftEntry.createdAt)
        .slice(0, HISTORY_LIMIT)
    : [];
}
function normalizeLatestSnapshot(rawSnapshot) {
  if (typeof rawSnapshot != "object" || rawSnapshot === null) return null;
  const snapshot = rawSnapshot,
    target = normalizeImageTarget(snapshot.target),
    analysis = normalizeAnalysisResponse(snapshot.analysis);
  return !target ||
    !analysis ||
    typeof snapshot.createdAt != "number" ||
    !Number.isFinite(snapshot.createdAt)
    ? null
    : {
        createdAt: snapshot.createdAt,
        target: target,
        analysis: analysis,
        promptDrafts: normalizePromptDrafts(snapshot.promptDrafts),
      };
}
async function loadHistoryEntries() {
  const storedHistory = await chrome.storage.local.get(HISTORY_STORAGE_KEY);
  return normalizeHistoryEntries(storedHistory[HISTORY_STORAGE_KEY]);
}
async function loadFailedPlaceholders() {
  const storedPlaceholders = await chrome.storage.local.get(FAILED_HISTORY_STORAGE_KEY);
  return normalizeFailedHistoryEntries(storedPlaceholders[FAILED_HISTORY_STORAGE_KEY]);
}
function mergeHistoryItems(historyEntries, failedEntries) {
  const entryMap = new Map();
  return (
    failedEntries.forEach((entry) => entryMap.set(entry.id, entry)),
    historyEntries.forEach((entry) => entryMap.set(entry.id, entry)),
    Array.from(entryMap.values())
      .sort((leftEntry, rightEntry) => rightEntry.createdAt - leftEntry.createdAt)
      .slice(0, HISTORY_LIMIT)
  );
}
async function saveFailedPlaceholders(entries = failedHistoryItems) {
  const failedEntries = normalizeFailedHistoryEntries(
    entries.filter((entry) => entry.status === "failed"),
  );
  await chrome.storage.local.set({ [FAILED_HISTORY_STORAGE_KEY]: failedEntries });
}
async function addStoredHistoryEntry(entry) {
  const existingEntries = await loadHistoryEntries(),
    nextEntries = normalizeHistoryEntries([entry, ...existingEntries]);
  return await chrome.storage.local.set({ [HISTORY_STORAGE_KEY]: nextEntries }), nextEntries;
}
async function removeStoredHistoryEntry(entryId) {
  const nextEntries = (await loadHistoryEntries()).filter((entry) => entry.id !== entryId);
  return await chrome.storage.local.set({ [HISTORY_STORAGE_KEY]: nextEntries }), nextEntries;
}
async function clearStoredHistory() {
  await chrome.storage.local.set({ [HISTORY_STORAGE_KEY]: [] });
}
async function loadLatestSnapshot() {
  const storedSnapshot = await chrome.storage.local.get(LATEST_ANALYSIS_STORAGE_KEY);
  return normalizeLatestSnapshot(storedSnapshot[LATEST_ANALYSIS_STORAGE_KEY]);
}
async function saveLatestSnapshot(snapshot) {
  await chrome.storage.local.set({
    [LATEST_ANALYSIS_STORAGE_KEY]: {
      createdAt: snapshot.createdAt,
      target: snapshot.target,
      analysis: snapshot.analysis,
      promptDrafts: snapshot.promptDrafts,
    },
  });
}
function normalizePanelMode(mode) {
  return mode === "expanded" || mode === "minimized" ? mode : "hidden";
}
function normalizePanelLanguage(language) {
  return language === "zh" || language === "en" || language === "json" ? language : activeLanguage;
}
function normalizePanelSession(rawSession) {
  if (typeof rawSession != "object" || rawSession === null)
    return {
      mode: "hidden",
      language: activeLanguage,
      inlineActionsEnabled: !0,
      updatedAt: 0,
    };
  const session = rawSession,
    storedPosition =
      typeof session.position == "object" && session.position !== null ? session.position : null,
    normalizedPosition =
      storedPosition &&
      typeof storedPosition.left == "number" &&
      Number.isFinite(storedPosition.left) &&
      typeof storedPosition.top == "number" &&
      Number.isFinite(storedPosition.top)
        ? { left: storedPosition.left, top: storedPosition.top }
        : void 0;
  return {
    mode: normalizePanelMode(session.mode),
    language: normalizePanelLanguage(session.language),
    inlineActionsEnabled:
      typeof session.inlineActionsEnabled == "boolean" ? session.inlineActionsEnabled : !0,
    position: normalizedPosition,
    updatedAt:
      typeof session.updatedAt == "number" && Number.isFinite(session.updatedAt)
        ? session.updatedAt
        : 0,
  };
}
async function loadPanelSession() {
  const storedSession = await chrome.storage.local.get(PANEL_SESSION_KEY);
  return normalizePanelSession(storedSession[PANEL_SESSION_KEY]);
}
function currentPanelCoordinates() {
  const panelShell = panelShellElement();
  if (panelShell) {
    const rect = panelShell.getBoundingClientRect();
    return { left: rect.left, top: rect.top };
  }
  if (panelPosition) return { left: panelPosition.left, top: panelPosition.top };
}
function buildPanelSession(mode = panelMode) {
  return {
    mode: mode,
    language: panelState.language,
    inlineActionsEnabled: inlineActionsEnabled,
    position: currentPanelCoordinates(),
    updatedAt: Date.now(),
  };
}
function isExtensionContextInvalidatedError(error) {
  return String(error?.message ?? error ?? "").includes("Extension context invalidated");
}
async function savePanelSession(mode = panelMode) {
  try {
    await chrome.storage.local.set({ [PANEL_SESSION_KEY]: buildPanelSession(mode) });
  } catch (error) {
    if (isExtensionContextInvalidatedError(error)) return;
    throw error;
  }
}
function applyPanelSession(session) {
  (panelMode = session.mode),
    (inlineActionsEnabled = session.inlineActionsEnabled),
    (panelState.language = normalizePanelLanguage(session.language)),
    session.mode !== "expanded" && (expandedPanelWidth = null),
    (panelPosition = session.position ? { left: session.position.left, top: session.position.top } : null);
}
function hasSamePanelSessionMode(leftSession, rightSession) {
  return leftSession.mode === rightSession.mode && leftSession.inlineActionsEnabled === rightSession.inlineActionsEnabled;
}
function restorePanelFromSessionIfHidden() {
  panelState.status === "hidden" && restoreSharedPanel();
}
function applyExtensionEnabled(isEnabled) {
  if (((extensionEnabled = isEnabled), isBlockedByHost())) {
    teardownContentUi();
    return;
  }
  if (!isEnabled) {
    clearHoveredTarget(),
      renderToast(),
      panelState.status !== "hidden" && resetPanelState({ preserveSessionMode: !0 });
    return;
  }
  if (!isTopFrame) {
    clearHoveredTarget(), panelState.status !== "hidden" && resetPanelState({ preserveSessionMode: !1 });
    return;
  }
  renderInlineActionMenu(), renderToast(), restorePanelFromSessionIfHidden();
}
async function loadExtensionEnabled() {
  try {
    const storedEnabled = await chrome.storage.sync.get(EXTENSION_ENABLED_STORAGE_KEY);
    applyExtensionEnabled(typeof storedEnabled[EXTENSION_ENABLED_STORAGE_KEY] == "boolean" ? storedEnabled[EXTENSION_ENABLED_STORAGE_KEY] : !0);
  } catch {
    applyExtensionEnabled(!0);
  }
}
function isDisabledHost(hostname = window.location.hostname) {
  return disabledHostPatterns.some((hostPattern) => hostPattern.test(hostname));
}
function isBlockedHost(hostname = window.location.hostname) {
  return blockedHostPatterns.some((hostPattern) => hostPattern.test(hostname));
}
function isBlockedByHost(hostname = window.location.hostname) {
  return isDisabledHost(hostname) || isBlockedHost(hostname);
}
function teardownContentUi() {
  clearHoveredTarget(),
    stopLoadingProgress(),
    clearPanelDrag(),
    (panelState = {
      status: "hidden",
      language: panelState.language,
      analysis: null,
      error: "",
      errorCode: null,
      errorAction: null,
      copied: !1,
    }),
    (panelMode = "hidden"),
    rootHost?.remove(),
    (rootHost = null),
    (shadowRoot = null),
    (panelLayer = null),
    (inlineActionLayer = null),
    (toastLayer = null),
    (screenshotLayer = null);
}
function isBlockedPage() {
  return isBlockedByHost();
}
async function copyTextToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const fallbackInput = document.createElement("textarea");
    (fallbackInput.value = text),
      (fallbackInput.style.position = "fixed"),
      (fallbackInput.style.opacity = "0"),
      document.body.appendChild(fallbackInput),
      fallbackInput.select(),
      document.execCommand("copy"),
      fallbackInput.remove();
  }
}
function panelShellElement() {
  return panelLayer?.querySelector(".panel-shell") ?? null;
}
function panelElement() {
  return panelLayer?.querySelector(".panel") ?? null;
}
function viewportSize() {
  const visualViewport = window.visualViewport;
  return {
    width: Math.round(visualViewport?.width ?? window.innerWidth),
    height: Math.round(visualViewport?.height ?? window.innerHeight),
  };
}
function updateRootViewportVars() {
  if (!rootHost) return;
  const viewport = viewportSize();
  rootHost.style.setProperty("--imagetoprompt-vw", `${viewport.width}px`),
    rootHost.style.setProperty("--imagetoprompt-vh", `${viewport.height}px`);
}
function inlineActionMenuElement() {
  return inlineActionLayer?.querySelector(".image-action-menu") ?? null;
}
function historyListElement() {
  return panelLayer?.querySelector(".history-list") ?? null;
}
function historyRailElement() {
  return panelLayer?.querySelector(".history-rail") ?? null;
}
function rememberHistoryScroll() {
  const historyList = historyListElement();
  if (historyList) {
    if (pendingHistoryScrollTop !== null) {
      historyScrollTop = pendingHistoryScrollTop;
      return;
    }
    historyScrollTop = historyList.scrollTop;
  }
}
function restoreHistoryScroll() {
  const historyList = historyListElement();
  historyList && (historyList.scrollTop = pendingHistoryScrollTop ?? historyScrollTop);
}
function preserveHistoryScroll(scrollTop = historyScrollTop) {
  (pendingHistoryScrollTop = scrollTop),
    (historyScrollTop = scrollTop),
    historyScrollRestoreTimer !== null && (window.clearTimeout(historyScrollRestoreTimer), (historyScrollRestoreTimer = null)),
    restoreHistoryScroll(),
    window.requestAnimationFrame(() => {
      restoreHistoryScroll(),
        window.requestAnimationFrame(() => {
          restoreHistoryScroll();
        });
    }),
    (historyScrollRestoreTimer = window.setTimeout(() => {
      restoreHistoryScroll(), (pendingHistoryScrollTop = null), (historyScrollRestoreTimer = null);
    }, 180));
}
function captureHistoryScroll() {
  const currentScrollTop = historyListElement()?.scrollTop ?? historyScrollTop;
  preserveHistoryScroll(currentScrollTop);
}
function promptEditorElement() {
  return panelLayer?.querySelector(".prompt-editor") ?? null;
}
function restorePromptEditorScroll() {
  const promptEditor = promptEditorElement(),
    scrollArea = promptEditor?.closest(".scroll-area") ?? null,
    containerTop = pendingPromptEditorScroll?.containerTop ?? promptEditorContainerScrollTop,
    editorTop = pendingPromptEditorScroll?.editorTop ?? promptEditorScrollTop;
  scrollArea && (scrollArea.scrollTop = containerTop), promptEditor && (promptEditor.scrollTop = editorTop);
}
function preservePromptEditorScroll(
  scrollState = pendingPromptEditorScroll ?? { containerTop: promptEditorContainerScrollTop, editorTop: promptEditorScrollTop },
) {
  (pendingPromptEditorScroll = scrollState),
    (promptEditorContainerScrollTop = scrollState.containerTop),
    (promptEditorScrollTop = scrollState.editorTop),
    promptEditorScrollRestoreTimer !== null && (window.clearTimeout(promptEditorScrollRestoreTimer), (promptEditorScrollRestoreTimer = null)),
    restorePromptEditorScroll(),
    window.requestAnimationFrame(() => {
      restorePromptEditorScroll(),
        window.requestAnimationFrame(() => {
          restorePromptEditorScroll();
        });
    }),
    (promptEditorScrollRestoreTimer = window.setTimeout(() => {
      restorePromptEditorScroll(), (pendingPromptEditorScroll = null), (promptEditorScrollRestoreTimer = null);
    }, 180));
}
function capturePromptEditorScroll() {
  const promptEditor = promptEditorElement(),
    scrollArea = promptEditor?.closest(".scroll-area") ?? null;
  preservePromptEditorScroll({
    containerTop: scrollArea?.scrollTop ?? promptEditorContainerScrollTop,
    editorTop: promptEditor?.scrollTop ?? promptEditorScrollTop,
  });
}
function removeHistoryFlyover() {
  historyFlyover?.remove(), (historyFlyover = null);
}
function syncHistoryRailHeight() {
  const panel = panelElement(),
    historyRail = historyRailElement();
  if (!panel || !historyRail) return;
  const railHeight = Math.max(Math.round(panel.offsetHeight), HISTORY_RAIL_MIN_HEIGHT);
  historyRail.style.height = `${railHeight}px`;
}
function scheduleHistoryRailHeightSync() {
  historyRailHeightFrame !== null && (window.cancelAnimationFrame(historyRailHeightFrame), (historyRailHeightFrame = null)),
    syncHistoryRailHeight();
  let remainingFrames = 3;
  const syncNextFrame = () => {
    if ((syncHistoryRailHeight(), (remainingFrames -= 1), remainingFrames <= 0)) {
      historyRailHeightFrame = null;
      return;
    }
    historyRailHeightFrame = window.requestAnimationFrame(syncNextFrame);
  };
  historyRailHeightFrame = window.requestAnimationFrame(syncNextFrame);
}
function animateResultEntry() {
  const panel = panelElement(),
    successBody = panelLayer?.querySelector(".body-success"),
    footer = panelLayer?.querySelector(".footer");
  if (!panel || prefersReducedMotion()) return;
  panel
    .animate(
      [
        {
          opacity: 0.74,
          transform: "translateY(-28px) scaleY(0.78) scaleX(0.99)",
          clipPath: "inset(0 0 42% 0 round 30px)",
          offset: 0,
        },
        {
          opacity: 1,
          transform: "translateY(5px) scaleY(1.035) scaleX(1)",
          clipPath: "inset(0 0 0 0 round 30px)",
          offset: 0.72,
        },
        {
          opacity: 1,
          transform: "translateY(0) scaleY(1) scaleX(1)",
          clipPath: "inset(0 0 0 0 round 30px)",
          offset: 1,
        },
      ],
      {
        duration: 620,
        easing: "cubic-bezier(0.22, 0.82, 0.2, 1)",
        fill: "both",
      },
    )
    .finished.then(() => syncHistoryRailHeight())
    .catch(() => {}),
    [successBody, footer].forEach((animatedElement, elementIndex) => {
      animatedElement &&
        animatedElement.animate(
          [
            {
              opacity: 0,
              transform: "translateY(-14px) scaleY(0.96)",
              offset: 0,
            },
            {
              opacity: 1,
              transform: "translateY(2px) scaleY(1.008)",
              offset: 0.72,
            },
            { opacity: 1, transform: "translateY(0) scaleY(1)", offset: 1 },
          ],
          {
            duration: 620,
            delay: elementIndex === 0 ? 110 : 180,
            easing: "cubic-bezier(0.22, 0.82, 0.2, 1)",
            fill: "both",
          },
        );
    });
}
function animateHistoryRailEntry() {
  const historyRail = historyRailElement();
  if (!historyRail || prefersReducedMotion()) return;
  historyRail.animate(
    [
      {
        opacity: 0.74,
        transform: "scaleX(0.7)",
        clipPath: "inset(0 48% 0 0 round 28px)",
        offset: 0,
      },
      {
        opacity: 1,
        transform: "scaleX(1.045)",
        clipPath: "inset(0 0 0 0 round 28px)",
        offset: 0.68,
      },
      {
        opacity: 1,
        transform: "scaleX(1)",
        clipPath: "inset(0 0 0 0 round 28px)",
        offset: 1,
      },
    ],
    { duration: 780, easing: "cubic-bezier(0.22, 0.82, 0.2, 1)", fill: "both" },
  )
    .finished.then(() => syncHistoryRailHeight())
    .catch(() => {});
}
function positionInlineActionMenu() {
  const menu = inlineActionMenuElement(),
    imageElement = hoveredElement;
  if (!menu || !imageElement) return;
  if (!imageElement.isConnected || !isUsableImageElement(imageElement)) {
    clearHoveredTarget();
    return;
  }
  const imageRect = imageElement.getBoundingClientRect();
  if (
    imageRect.width <= 0 ||
    imageRect.height <= 0 ||
    imageRect.bottom < 0 ||
    imageRect.top > window.innerHeight
  ) {
    clearHoveredTarget();
    return;
  }
  const menuWidth = menu.offsetWidth || 94,
    menuHeight = menu.offsetHeight || 84,
    edgePadding = 10,
    imageInset = clamp(Math.round(Math.min(imageRect.width, imageRect.height) * 0.06), 6, 10),
    maxLeft = window.innerWidth - menuWidth - edgePadding,
    maxTop = window.innerHeight - menuHeight - edgePadding;
  if (isPinterestHost()) {
    const isMainPinImage = isPinterestPinMainImage(imageRect),
      menuPosition = {
        left: clamp(isMainPinImage ? imageRect.right - menuWidth - imageInset : imageRect.left + imageInset, edgePadding, maxLeft),
        top: clamp(imageRect.top + imageInset, edgePadding, maxTop),
      };
    (menu.style.transformOrigin = isMainPinImage ? "top right" : "top left"),
      (menu.style.left = `${menuPosition.left}px`),
      (menu.style.top = `${menuPosition.top}px`);
    return;
  }
  menu.style.transformOrigin = "top right";
  const overlapsBlockingElement = (pointX, pointY) => {
      if (typeof document.elementsFromPoint != "function") return !1;
      const elementsAtPoint = document.elementsFromPoint(pointX, pointY);
      for (const elementAtPoint of elementsAtPoint)
        if (elementAtPoint instanceof Element && !elementAtPoint.closest("#imagetoprompt-root")) {
          if (elementAtPoint === imageElement) return !1;
          if (!elementAtPoint.contains(imageElement)) return !0;
        }
      return !1;
    },
    hasBlockedMenuCorner = (left, top) => {
      const horizontalInset = Math.min(16, Math.max(6, menuWidth * 0.1)),
        verticalInset = Math.min(16, Math.max(6, menuHeight * 0.1));
      return [
        {
          x: clamp(left + horizontalInset, edgePadding, window.innerWidth - edgePadding),
          y: clamp(top + verticalInset, edgePadding, window.innerHeight - edgePadding),
        },
        {
          x: clamp(left + menuWidth - horizontalInset, edgePadding, window.innerWidth - edgePadding),
          y: clamp(top + verticalInset, edgePadding, window.innerHeight - edgePadding),
        },
        {
          x: clamp(left + horizontalInset, edgePadding, window.innerWidth - edgePadding),
          y: clamp(top + menuHeight - verticalInset, edgePadding, window.innerHeight - edgePadding),
        },
        {
          x: clamp(left + menuWidth / 2, edgePadding, window.innerWidth - edgePadding),
          y: clamp(top + menuHeight / 2, edgePadding, window.innerHeight - edgePadding),
        },
        {
          x: clamp(left + menuWidth - horizontalInset, edgePadding, window.innerWidth - edgePadding),
          y: clamp(top + menuHeight / 2, edgePadding, window.innerHeight - edgePadding),
        },
        {
          x: clamp(left + menuWidth / 2, edgePadding, window.innerWidth - edgePadding),
          y: clamp(top + verticalInset, edgePadding, window.innerHeight - edgePadding),
        },
      ].some((point) => overlapsBlockingElement(point.x, point.y));
    },
    candidatePositions = [
      { left: clamp(imageRect.right - menuWidth - imageInset, edgePadding, maxLeft), top: clamp(imageRect.top + imageInset, edgePadding, maxTop) },
      { left: clamp(imageRect.left + imageInset, edgePadding, maxLeft), top: clamp(imageRect.top + imageInset, edgePadding, maxTop) },
      { left: clamp(imageRect.left + imageInset, edgePadding, maxLeft), top: clamp(imageRect.bottom - menuHeight - imageInset, edgePadding, maxTop) },
    ],
    selectedPosition = candidatePositions.find((position) => !hasBlockedMenuCorner(position.left, position.top)) ?? candidatePositions[0];
  (menu.style.left = `${selectedPosition.left}px`), (menu.style.top = `${selectedPosition.top}px`);
}
async function ensureHistoryLoaded() {
  return historyLoaded
    ? historyItems
    : (historyLoadPromise ||
        (historyLoadPromise = Promise.all([loadHistoryEntries(), loadFailedPlaceholders()])
          .then(
            ([storedEntries, failedPlaceholders]) => (
              (historyItems = storedEntries),
              (failedHistoryItems = mergeHistoryItems(failedHistoryItems, failedPlaceholders)),
              (historyLoaded = !0),
              (historyLoadPromise = null),
              panelState.status !== "hidden" && renderPanel(),
              storedEntries
            ),
          )
          .catch(
            () => ((historyItems = []), (historyLoaded = !0), (historyLoadPromise = null), historyItems),
          )),
      historyLoadPromise);
}
async function reloadHistory() {
  historyLoadPromise = null;
  const [storedEntries, failedPlaceholders] = await Promise.all([
    loadHistoryEntries(),
    loadFailedPlaceholders(),
  ]);
  return (
    (historyItems = storedEntries),
    (failedHistoryItems = mergeHistoryItems(failedHistoryItems, failedPlaceholders)),
    (historyLoaded = !0),
    historyItems
  );
}
async function refreshHistoryState(options) {
  const storedEntries = await reloadHistory(),
    currentUrl = window.location.href,
    selectedStoredEntry = selectedHistoryId ? storedEntries.find((entry) => entry.id === selectedHistoryId) : null,
    selectedFailedEntry = selectedHistoryId
      ? failedHistoryItems.find((entry) => entry.id === selectedHistoryId)
      : null;
  selectedHistoryId && !selectedStoredEntry && !selectedFailedEntry && (selectedHistoryId = null),
    !selectedHistoryId &&
      options?.resetSelection &&
      (selectedHistoryId = storedEntries.find((entry) => entry.pageUrl === currentUrl)?.id ?? null),
    panelState.status === "success" &&
      currentTarget?.pageUrl &&
      currentTarget.pageUrl !== currentUrl &&
      ((panelAnchor = null), (currentTarget = null)),
    options?.render !== !1 && panelState.status !== "hidden" && renderPanel();
}
function capturePromptDrafts() {
  const drafts = {};
  return (
    ["zh", "en", "json"].forEach((language) => {
      hasPromptDraft(language) && (drafts[language] = promptDraftsByLanguage[language] ?? "");
    }),
    drafts
  );
}
function restorePromptDrafts(drafts) {
  promptDraftsByLanguage = { ...drafts };
}
function createHistoryEntry(target, analysis) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    imageSrc: target.src,
    pageUrl: target.pageUrl,
    imageWidth:
      typeof target.naturalWidth == "number" &&
      Number.isFinite(target.naturalWidth) &&
      target.naturalWidth > 0
        ? target.naturalWidth
        : void 0,
    imageHeight:
      typeof target.naturalHeight == "number" &&
      Number.isFinite(target.naturalHeight) &&
      target.naturalHeight > 0
        ? target.naturalHeight
        : void 0,
    analysis: analysis,
    promptDrafts: capturePromptDrafts(),
  };
}
function createPendingHistoryPlaceholder(target) {
  return {
    id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    imageSrc: target.src,
    pageUrl: target.pageUrl,
    alt: target.alt,
    imageWidth: target.naturalWidth,
    imageHeight: target.naturalHeight,
    status: "pending",
  };
}
function createHistoryPlaceholder(target) {
  const placeholder = createPendingHistoryPlaceholder(target);
  return (
    (failedHistoryItems = [placeholder, ...failedHistoryItems].slice(0, HISTORY_LIMIT)),
    historyRailOpen || startHistoryRailEnter(),
    (historyRailOpen = !0),
    renderPanel(),
    placeholder
  );
}
function removeHistoryPlaceholder(placeholderId) {
  const nextFailedItems = failedHistoryItems.filter((entry) => entry.id !== placeholderId);
  nextFailedItems.length !== failedHistoryItems.length &&
    ((failedHistoryItems = nextFailedItems), saveFailedPlaceholders(), renderPanel());
}
function markHistoryPlaceholderFailed(placeholderId, errorMessage) {
  let didUpdate = !1;
  (failedHistoryItems = failedHistoryItems.map((entry) =>
    entry.id !== placeholderId ? entry : ((didUpdate = !0), { ...entry, status: "failed", error: errorMessage }),
  )),
    didUpdate && (saveFailedPlaceholders(), loadHistoryImagePayload(placeholderId), renderPanel());
}
function consumeHistoryRequest(requestId, shouldRender = !1, options) {
  if (!activeHistoryRequest || activeHistoryRequest.requestId !== requestId)
    return null;
  const request = activeHistoryRequest;
  if (((activeHistoryRequest = null), options?.keepPlaceholder))
    return shouldRender && renderPanel(), request;
  const nextFailedItems = failedHistoryItems.filter((entry) => entry.id !== request.placeholderId);
  return (
    nextFailedItems.length !== failedHistoryItems.length &&
      ((failedHistoryItems = nextFailedItems), shouldRender && renderPanel()),
    request
  );
}
function collapseWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}
function truncateText(text, maxLength) {
  return text.length <= maxLength ? text : `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}
function capturePanelPosition() {
  const panelShell = panelShellElement();
  if (!panelShell) return;
  const rect = panelShell.getBoundingClientRect();
  (panelPosition = { left: rect.left, top: rect.top }), rememberExpandedPanelWidth();
}
function panelAnchorPoint() {
  const panel = panelElement() ?? panelShellElement();
  if (!panel) return null;
  const rect = panel.getBoundingClientRect();
  return { centerX: rect.left + rect.width / 2, top: rect.top };
}
function positionPanelAroundAnchor(anchorPoint, mode) {
  if (!anchorPoint) return;
  const padding = 12,
    viewport = viewportSize(),
    panelWidth = panelWidthForMode(mode),
    panelHeight = mode === "minimized" ? 62 : PANEL_HEIGHT,
    maxLeft = Math.max(padding, viewport.width - panelWidth - padding),
    maxTop = Math.max(padding, viewport.height - panelHeight - padding);
  panelPosition = {
    left: clamp(Math.round(anchorPoint.centerX - panelWidth / 2), padding, maxLeft),
    top: clamp(Math.round(anchorPoint.top), padding, maxTop),
  };
}
function latestSnapshotFromAnalysis(target, analysis) {
  return { createdAt: Date.now(), target: target, analysis: analysis, promptDrafts: capturePromptDrafts() };
}
function saveCurrentAnalysisSnapshot() {
  !panelState.analysis ||
    !currentTarget ||
    saveLatestSnapshot(
      latestSnapshotFromAnalysis(currentTarget, panelState.analysis),
    );
}
function activePromptEditor() {
  const activeElement = shadowRoot?.activeElement ?? document.activeElement;
  return activeElement instanceof HTMLTextAreaElement &&
    activeElement.classList.contains("prompt-editor") &&
    panelLayer?.contains(activeElement)
    ? activeElement
    : null;
}
function isEditingPrompt() {
  return activePromptEditor() !== null;
}
async function restoreSharedPanel() {
  if (!isTopFrame || isBlockedByHost()) {
    isBlockedByHost() && teardownContentUi();
    return;
  }
  await refreshHistoryState({ render: !1 });
  const [session, latestSnapshot] = await Promise.all([loadPanelSession(), loadLatestSnapshot()]);
  if ((applyPanelSession(session), !extensionEnabled || session.mode === "hidden")) {
    resetPanelState({ preserveSessionMode: !0 }), renderInlineActionMenu();
    return;
  }
  if (!latestSnapshot) {
    if (panelState.status === "setup" || panelState.status === "manual") {
      ensureContentRoot(), renderPanel();
      return;
    }
    resetPanelState({ preserveSessionMode: !0 });
    return;
  }
  ensureContentRoot(),
    restorePromptDrafts(latestSnapshot.promptDrafts),
    (panelAnchor = null),
    (currentTarget = latestSnapshot.target),
    (targetPoint = null),
    (expandedPanelWidth = null),
    clearPanelDrag(),
    stopLoadingProgress(),
    resetPromptDraftAnimation(""),
    clearResultEntry();
  const promptText = promptForLanguage(latestSnapshot.analysis, panelState.language);
  (renderedPromptDraft = promptText),
    (currentPromptDraft = promptText),
    (isPromptTyping = !1),
    (panelState = {
      status: "success",
      language: panelState.language,
      analysis: latestSnapshot.analysis,
      error: "",
      errorCode: null,
      errorAction: null,
      copied: !1,
    }),
    renderPanel();
}
function historyThumbSize(imageWidth, imageHeight) {
  const maxWidth = HISTORY_THUMB_MAX_WIDTH,
    maxHeight = HISTORY_THUMB_MAX_HEIGHT,
    minHeight = HISTORY_THUMB_MIN_HEIGHT,
    normalizedWidth = typeof imageWidth == "number" && Number.isFinite(imageWidth) && imageWidth > 0 ? imageWidth : maxWidth,
    normalizedHeight =
      typeof imageHeight == "number" && Number.isFinite(imageHeight) && imageHeight > 0
        ? imageHeight
        : Math.round(maxWidth * 1.28),
    aspectRatio = normalizedWidth / normalizedHeight;
  let thumbWidth = maxWidth,
    thumbHeight = Math.round(thumbWidth / Math.max(aspectRatio, 0.08));
  return (
    thumbHeight > maxHeight && ((thumbHeight = maxHeight), (thumbWidth = Math.round(thumbHeight * aspectRatio))),
    thumbHeight < minHeight &&
      ((thumbHeight = minHeight),
      (thumbWidth = Math.round(thumbHeight * aspectRatio)),
      thumbWidth > maxWidth && ((thumbWidth = maxWidth), (thumbHeight = Math.round(thumbWidth / Math.max(aspectRatio, 0.08))))),
    (thumbWidth = Math.max(112, Math.min(thumbWidth, maxWidth))),
    (thumbHeight = Math.max(minHeight, Math.min(thumbHeight, maxHeight))),
    { width: thumbWidth, height: thumbHeight }
  );
}
function historyThumbStyle(imageWidth, imageHeight, usePlaceholderHeight = !1) {
  if (usePlaceholderHeight) return `width:${HISTORY_THUMB_MAX_WIDTH}px; min-height:${HISTORY_THUMB_MIN_HEIGHT}px;`;
  const { width: thumbWidth, height: thumbHeight } = historyThumbSize(imageWidth, imageHeight);
  return `width:${thumbWidth}px; height:${thumbHeight}px;`;
}
