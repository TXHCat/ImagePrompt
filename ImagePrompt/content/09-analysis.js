// ImagePrompt content module: analysis flow

function trimSettingValue(rawValue) {
  return typeof rawValue == "string" ? rawValue.trim() : "";
}
async function loadApiSettings() {
  const storedSettings = await chrome.storage.local.get(API_SETTING_KEYS);
  return {
    apiEnabled: typeof storedSettings.apiEnabled == "boolean" ? storedSettings.apiEnabled : !0,
    baseUrl: trimSettingValue(storedSettings.baseUrl),
    apiKey: trimSettingValue(storedSettings.apiKey),
    model: trimSettingValue(storedSettings.model),
  };
}
function isApiReady(settings) {
  return skipApiConfigCheck
    ? !0
    : settings.apiEnabled !== !1 && !!(settings.baseUrl && settings.apiKey && settings.model);
}
function apiSetupError(settings) {
  return settings.baseUrl
    ? settings.apiKey
      ? settings.model
        ? ""
        : "Please fill in the image analysis model name."
      : "Please fill in API Key."
    : "Please fill in Base URL.";
}
function isApiConfigError(error) {
  return skipApiConfigCheck || !(error instanceof Error)
    ? !1
    : /Base URL|API Key|model/i.test(error.message);
}
async function saveApiSettings(settings) {
  await chrome.storage.local.set({
    baseUrl: settings.baseUrl.trim(),
    apiKey: settings.apiKey.trim(),
    model: settings.model.trim(),
  });
}
function clearApiSetupError() {
  const errorElement = panelLayer?.querySelector(".setup-error");
  errorElement && (errorElement.textContent = "");
}
function updateApiSetupField(field, nextValue) {
  (setupState[field] = nextValue), setupState.error && ((setupState.error = ""), clearApiSetupError());
}
function focusFirstMissingApiField() {
  const baseUrlInput = panelLayer?.querySelector('[data-api-field="base-url"]'),
    apiKeyInput = panelLayer?.querySelector('[data-api-field="api-key"]'),
    modelInput = panelLayer?.querySelector('[data-api-field="model"]');
  (
    (baseUrlInput && !baseUrlInput.value.trim() ? baseUrlInput : null) ??
    (apiKeyInput && !apiKeyInput.value.trim() ? apiKeyInput : null) ??
    (modelInput && !modelInput.value.trim() ? modelInput : null) ??
    baseUrlInput
  )?.focus();
}
async function showApiSetupWorkflow(request, workflowContext) {
  const settings = await loadApiSettings();
  (pendingAnalysisRequest = request),
    request.options?.historyPlaceholderId &&
      removeHistoryPlaceholder(request.options.historyPlaceholderId),
    (activeHistoryRequest = null),
    ensureContentRoot(),
    (panelAnchor = workflowContext && Object.prototype.hasOwnProperty.call(workflowContext, "anchor") ? workflowContext.anchor : panelAnchor),
    (currentTarget =
      workflowContext && Object.prototype.hasOwnProperty.call(workflowContext, "target")
        ? workflowContext.target
        : currentTarget),
    (targetPoint =
      workflowContext && Object.prototype.hasOwnProperty.call(workflowContext, "point")
        ? workflowContext.point
        : targetPoint),
    (panelPosition = null),
    (expandedPanelWidth = null),
    (panelMode = "expanded"),
    clearPanelDrag(),
    stopLoadingProgress(),
    resetPromptDraftAnimation(""),
    clearResultEntry(),
    (setupState = {
      baseUrl: settings.baseUrl,
      apiKey: settings.apiKey,
      model: settings.model,
      apiEnabled: settings.apiEnabled,
      error: workflowContext?.message ?? apiSetupError(settings),
      isSaving: !1,
      manualResult: setupState.manualResult ?? "",
    }),
    updatePanelState({
      status: "setup",
      analysis: null,
      error: "",
      copied: !1,
    }),
    request.options?.centerPanel && centerPanel(!0);
}
async function showNoApiWorkflow(request = {}, workflowContext = {}) {
  captureManualResultState();
  await ensureManualResultState();
  const settings = await loadApiSettings();
  (pendingAnalysisRequest = request),
    request?.options?.historyPlaceholderId &&
      removeHistoryPlaceholder(request.options.historyPlaceholderId),
    (activeHistoryRequest = null),
    ensureContentRoot(),
    (panelAnchor = workflowContext && Object.prototype.hasOwnProperty.call(workflowContext, "anchor") ? workflowContext.anchor : panelAnchor),
    (currentTarget =
      workflowContext && Object.prototype.hasOwnProperty.call(workflowContext, "target")
        ? workflowContext.target
        : currentTarget),
    (targetPoint =
      workflowContext && Object.prototype.hasOwnProperty.call(workflowContext, "point")
        ? workflowContext.point
        : targetPoint),
    (panelPosition = workflowContext?.preservePosition ? panelPosition : null),
    (expandedPanelWidth = null),
    (panelMode = "expanded"),
    clearPanelDrag(),
    stopLoadingProgress(),
    resetPromptDraftAnimation(""),
    clearResultEntry(),
    (setupState = {
      baseUrl: settings.baseUrl,
      apiKey: settings.apiKey,
      model: settings.model,
      apiEnabled: settings.apiEnabled,
      error: workflowContext?.message ?? "",
      isSaving: !1,
      manualResult: setupState.manualResult ?? "",
    }),
    updatePanelState({
      status: "manual",
      analysis: null,
      error: "",
      copied: !1,
    }),
    request?.options?.centerPanel && centerPanel(!0);
}
async function renderNoApiWorkflowNow() {
  (historyRailOpen = !1),
    clearHistoryRailEnter(),
    (panelMode = "expanded"),
    (expandedPanelWidth = null),
    renderPanel(),
    await waitAnimationFrames(1),
    renderPanel(),
    syncPanelPosition(),
    scheduleHistoryRailHeightSync(),
    await savePanelSession("expanded");
}
async function continuePendingAnalysis() {
  const request = pendingAnalysisRequest;
  if (((pendingAnalysisRequest = null), !request)) return;
  let options = request.options;
  if (request.options?.autoSaveToHistory) {
    let target = currentTarget;
    if ((!target || (request.srcUrl && target.src !== request.srcUrl)) && request.srcUrl) {
      const imageElement = findImageByUrl(request.srcUrl);
      target = imageElement instanceof HTMLImageElement ? targetFromImageElement(imageElement) : null;
    }
    if (target) {
      await ensureHistoryLoaded();
      const placeholder = createHistoryPlaceholder(target);
      options = { ...request.options, historyPlaceholderId: placeholder.id };
    }
  }
  await openAnalysisPanel(request.srcUrl, request.preferLatest, options);
}
async function saveApiSetupAndContinue() {
  const settings = {
      baseUrl: setupState.baseUrl.trim(),
      apiKey: setupState.apiKey.trim(),
      model: setupState.model.trim(),
    },
    errorMessage = apiSetupError(settings);
  if (errorMessage) {
    (setupState = { ...setupState, ...settings, error: errorMessage, isSaving: !1 }),
      renderPanel();
    return;
  }
  (setupState = { ...setupState, ...settings, error: "", isSaving: !0 }),
    renderPanel();
  try {
    await saveApiSettings(settings), await continuePendingAnalysis();
  } catch (error) {
    (setupState = {
      ...setupState,
      isSaving: !1,
      error: error instanceof Error ? error.message : "Save failed. Please try again.",
    }),
      updatePanelState({
        status: "setup",
        analysis: null,
        error: "",
        copied: !1,
      });
  }
}
async function addAnalysisToHistory(target, analysis, options) {
  await ensureHistoryLoaded();
  const entry = createHistoryEntry(target, analysis);
  if (
    (preloadedHistoryIds.delete(entry.id),
    options?.selectEntry && (selectedHistoryId = entry.id),
    (historyItems = await addStoredHistoryEntry(entry)),
    loadHistoryImagePayload(entry.id),
    options?.revealHistory && (historyRailOpen || startHistoryRailEnter(), (historyRailOpen = !0)),
    options?.animate)
  ) {
    pendingHistoryId = entry.id;
    try {
      renderPanel(),
        await new Promise((resolve) => {
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => resolve());
          });
        }),
        await animateHistoryFlyoverToCard(entry);
    } finally {
      (pendingHistoryId = null), renderPanel();
    }
    return entry;
  }
  return panelState.status !== "hidden" && historyRailOpen && renderPanel(), entry;
}
async function analyzeAndSaveToHistory(target) {
  await ensureHistoryLoaded();
  const placeholder = createHistoryPlaceholder(target),
    shouldRevealHistory = panelState.status !== "hidden";
  shouldRevealHistory && (historyRailOpen || startHistoryRailEnter(), (historyRailOpen = !0), renderPanel());
  try {
    const analysis = await requestAnalysisFromBackground(target);
    await saveLatestSnapshot(latestSnapshotFromAnalysis(target, analysis)),
      removeHistoryPlaceholder(placeholder.id),
      await addAnalysisToHistory(target, analysis, {
        revealHistory: shouldRevealHistory,
        animate: !1,
        selectEntry: !1,
      });
  } catch (error) {
    throw (
      (markHistoryPlaceholderFailed(
        placeholder.id,
        error instanceof Error ? error.message : "Analysis failed. Please try again.",
      ),
      error)
    );
  }
}
async function analyzeHoveredImage() {
  if (!extensionEnabled) return;
  const element = hoveredElement,
    target = hoveredTarget;
  if (!(!element || !target)) {
    updateInlineActionStatus(target.src, { promptStatus: "loading" });
    try {
      const settings = await loadApiSettings(),
        hasCompletedOnboarding = await hasCompletedInlineOnboarding(),
        latestSnapshot = await loadLatestSnapshot(),
        needsPanelOnboarding = !hasCompletedOnboarding || !latestSnapshot;
      (lastResolvedTarget = { element: element, target: target, point: hoverPoint }),
        (isInlineMenuHovered = !1),
        clearHoveredTarget();
      const requestTarget = target;
      if (
        ((lastResolvedTarget = { element: element, target: requestTarget, point: hoverPoint }),
        !isApiReady(settings))
      ) {
        await openAnalysisPanel(requestTarget.src, !1, {
          autoSaveToHistory: !0,
          markInlinePromptOnboardingComplete: !hasCompletedOnboarding,
        });
        return;
      }
      if (needsPanelOnboarding) {
        await ensureHistoryLoaded();
        const placeholder = createHistoryPlaceholder(requestTarget);
        await openAnalysisPanel(requestTarget.src, !1, {
          autoSaveToHistory: !0,
          historyPlaceholderId: placeholder.id,
          markInlinePromptOnboardingComplete: !hasCompletedOnboarding,
        });
        return;
      }
      await analyzeAndSaveToHistory(requestTarget),
        showToast(localizedText.saveSuccessToast, "success");
    } finally {
      updateInlineActionStatus(target.src, { promptStatus: "idle" });
    }
  }
}
async function openLatestOrAnalyzeHoveredImage() {
  if (!extensionEnabled) return;
  const element = hoveredElement,
    target = hoveredTarget,
    anchorPoint = hoverPoint ?? null;
  (isInlineMenuHovered = !1), clearHoveredTarget();
  try {
    const latestSnapshot = await loadLatestSnapshot();
    if (latestSnapshot) {
      (panelMode = "expanded"),
        showAnalysisEntry(latestSnapshot, { preservePosition: !1, anchorPoint: anchorPoint }),
        savePanelSession("expanded");
      return;
    }
    if (!element || !target) {
      showToast(localizedText.missingLatestAnalysis, "error");
      return;
    }
    (lastResolvedTarget = { element: element, target: target, point: hoverPoint }),
      await openAnalysisPanel(target.src);
  } catch (error) {
    showToast(
      error instanceof Error ? error.message : "打开提示词卡片失败，请稍后重试。",
      "error",
    );
  }
}
async function toggleHistoryRail() {
  if (isHistoryRailClosing) return;
  await ensureHistoryLoaded();
  const shouldOpen = !historyRailOpen;
  if (!shouldOpen) {
    isHistoryRailClosing = !0;
    try {
      await animateHistoryRailExit();
    } finally {
      isHistoryRailClosing = !1;
    }
  }
  (historyRailOpen = shouldOpen),
    historyRailOpen &&
      !selectedHistoryId &&
      historyItems.length > 0 &&
      (selectedHistoryId = historyItems[0].id),
    historyRailOpen && (preloadHistoryImages(), startHistoryRailEnter()),
    renderPanel();
}
function selectHistoryEntry(entryId) {
  if (pendingHistoryId !== entryId) {
    if (failedHistoryItems.some((entry) => entry.id === entryId && entry.status === "failed")) {
      selectFailedHistoryEntry(entryId);
      return;
    }
    selectSavedHistoryEntry(entryId);
  }
}
async function deleteHistoryEntry(entryId) {
  if (failedHistoryItems.find((entry) => entry.id === entryId)) {
    (failedHistoryItems = failedHistoryItems.filter((entry) => entry.id !== entryId)),
      historyImageCache.delete(entryId),
      historyImageLoadPromises.delete(entryId),
      saveFailedPlaceholders(),
      selectedHistoryId === entryId &&
        (selectedHistoryId = historyItems[0]?.id ?? null),
      failedHistoryItems.length === 0 &&
        historyItems.length === 0 &&
        ((historyRailOpen = !1), (selectedHistoryId = null)),
      renderPanel();
    return;
  }
  await ensureHistoryLoaded(),
    (historyItems = await removeStoredHistoryEntry(entryId)),
    historyImageCache.delete(entryId),
    historyImageLoadPromises.delete(entryId),
    preloadedHistoryIds.delete(entryId),
    selectedHistoryId === entryId &&
      (selectedHistoryId = historyItems[0]?.id ?? null),
    historyItems.length === 0 &&
      ((historyRailOpen = !1), (selectedHistoryId = null)),
    renderPanel();
}
async function clearHistoryEntries() {
  await ensureHistoryLoaded(),
    (failedHistoryItems = []),
    (historyItems = []),
    (selectedHistoryId = null),
    preloadedHistoryIds.clear(),
    (pendingHistoryId = null),
    historyImageCache.clear(),
    historyImageLoadPromises.clear(),
    await Promise.all([clearStoredHistory(), saveFailedPlaceholders([])]),
    renderPanel();
}
async function runApiAnalysis(target, requestId) {
  try {
    const analysis = await requestAnalysisFromBackground(target),
      historyRequest = activeHistoryRequestFor(requestId);
    if (isStaleAnalysisRequest(requestId)) {
      if (historyRequest) consumeHistoryRequest(requestId, true);
      return;
    }
    await finishApiLoadingProgress();
    await showApiAnalysisSuccess(target, requestId, analysis, historyRequest);
  } catch (error) {
    await handleApiAnalysisError(target, requestId, error);
  }
}

function activeHistoryRequestFor(requestId) {
  return activeHistoryRequest?.requestId === requestId
    ? activeHistoryRequest
    : null;
}

function isStaleAnalysisRequest(requestId) {
  return requestId !== activeRequestId;
}

async function finishApiLoadingProgress() {
  await finishLoadingProgress();
  panelState.status === "loading" ? startResultEntry() : clearResultEntry();
}

async function showApiAnalysisSuccess(
  target,
  requestId,
  analysis,
  historyRequest,
) {
  const prompt = promptForLanguage(analysis, panelState.language);
  restorePromptDrafts({});
  renderedPromptDraft = prompt;
  currentPromptDraft = prompt;
  isPromptTyping = false;
  panelMode = "expanded";
  capturePanelPosition();
  targetPoint = null;
  updatePanelState({
    status: "success",
    analysis,
    error: "",
    errorCode: null,
    errorAction: null,
    copied: false,
  });
  saveCurrentAnalysisSnapshot();
  savePanelSession("expanded");
  if (historyRequest) {
    if (historyRequest.markInlinePromptOnboardingComplete) markInlineOnboardingComplete();
    consumeHistoryRequest(requestId, false);
    await addAnalysisToHistory(historyRequest.target, analysis, {
      revealHistory: true,
      animate: false,
      selectEntry: true,
    });
  }
  resetPromptDraftAnimation(prompt);
}

async function handleApiAnalysisError(target, requestId, error) {
  const historyRequest = activeHistoryRequestFor(requestId),
    placeholder = consumeHistoryRequest(requestId, false, {
      keepPlaceholder: true,
    });
  if (isStaleAnalysisRequest(requestId)) {
    if (placeholder) removeHistoryPlaceholder(placeholder.placeholderId);
    return;
  }
  if (error instanceof ContentRuntimeError && error.code === "API_DISABLED") {
    await showApiDisabledFallback(target, historyRequest);
    return;
  }
  if (!skipApiConfigCheck && isApiConfigError(error)) {
    await showMissingApiConfigFallback(target, historyRequest, error);
    return;
  }
  showGenericApiError(error, placeholder);
}

function analysisRetryOptions(historyRequest) {
  return historyRequest
    ? {
        autoSaveToHistory: true,
        historyPlaceholderId: historyRequest.placeholderId,
        markInlinePromptOnboardingComplete:
          historyRequest.markInlinePromptOnboardingComplete,
      }
    : void 0;
}

async function showApiDisabledFallback(target, historyRequest) {
  await showNoApiWorkflow(
    {
      srcUrl: target.src,
      preferLatest: false,
      options: analysisRetryOptions(historyRequest),
    },
    { target, anchor: panelAnchor, point: targetPoint, message: "" },
  );
}

async function showMissingApiConfigFallback(target, historyRequest, error) {
  await showApiSetupWorkflow(
    {
      srcUrl: target.src,
      preferLatest: false,
      options: analysisRetryOptions(historyRequest),
    },
    {
      target,
      anchor: panelAnchor,
      point: targetPoint,
      message:
        error instanceof Error
          ? error.message
          : "Please finish API setup first.",
    },
  );
}

function showGenericApiError(error, placeholder) {
  stopLoadingProgress();
  resetPromptDraftAnimation("");
  const message =
    error instanceof ContentRuntimeError || error instanceof Error
      ? error.message
      : "Analysis failed. Please try again.";
  if (placeholder)
    markHistoryPlaceholderFailed(placeholder.placeholderId, message);
  clearResultEntry();
  panelMode = "expanded";
  capturePanelPosition();
  targetPoint = null;
  updatePanelState({
    status: "error",
    error: message,
    errorCode: error instanceof ContentRuntimeError ? error.code : null,
    errorAction: error instanceof ContentRuntimeError ? error.action : null,
    analysis: null,
    copied: false,
  });
  savePanelSession("expanded");
}
function findImageByUrl(srcUrl) {
  return srcUrl
    ? (Array.from(document.images).find(
        (imageElement) => imageElement.currentSrc === srcUrl || imageElement.src === srcUrl,
      ) ?? null)
    : null;
}
function findLargestVisibleImage() {
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0,
    viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  let bestMatch = null,
    bestScore = 0;
  for (const imageElement of Array.from(document.images)) {
    if (!imageElement.isConnected || !isUsableImageElement(imageElement)) continue;
    const imageTarget = targetFromImageElement(imageElement);
    if (!imageTarget) continue;
    const imageRect = imageElement.getBoundingClientRect(),
      visibleLeft = Math.max(imageRect.left, 0),
      visibleTop = Math.max(imageRect.top, 0),
      visibleRight = Math.min(imageRect.right, viewportWidth),
      visibleBottom = Math.min(imageRect.bottom, viewportHeight),
      visibleWidth = Math.max(0, visibleRight - visibleLeft),
      visibleHeight = Math.max(0, visibleBottom - visibleTop),
      visibleArea = visibleWidth * visibleHeight;
    if (visibleArea < 14e3) continue;
    const imageScore = visibleArea + imageRect.width * imageRect.height * 0.12;
    imageScore <= bestScore ||
      ((bestScore = imageScore),
      (bestMatch = {
        element: imageElement,
        target: imageTarget,
        point: { x: Math.round(visibleLeft + visibleWidth / 2), y: Math.round(visibleTop + visibleHeight / 2) },
      }));
  }
  return bestMatch ?? { element: null, target: null, point: null };
}
async function openAnalysisPanel(srcUrl, preferLatest = false, options) {
  if (await shouldAbortPanelOpen()) return;
  await refreshHistoryState({ render: false });
  const requestId = beginAnalysisRequest();
  if (preferLatest && (await restoreLatestAnalysis(options))) return;

  const resolved = resolveAnalysisTarget(srcUrl, options);
  if (!resolved.target) {
    await handleMissingAnalysisTarget(srcUrl, preferLatest, options);
    return;
  }
  const settings = await loadApiSettings();
  if (!settings.apiEnabled) {
    await showNoApiWorkflow(
      { srcUrl, preferLatest, options },
      {
        target: resolved.target,
        anchor: resolved.element,
        point: lastResolvedTarget.point,
        message: "",
      },
    );
    return;
  }
  if (!isApiReady(settings)) {
    await showApiSetupWorkflow(
      { srcUrl, preferLatest, options },
      {
        target: resolved.target,
        anchor: resolved.element,
        point: lastResolvedTarget.point,
        message: apiSetupError(settings),
      },
    );
    return;
  }

  await startApiAnalysis(resolved, requestId, options);
}

async function shouldAbortPanelOpen() {
  await ensureContentLanguage();
  if (isBlockedByHost()) {
    teardownContentUi();
    return true;
  }
  if (!extensionEnabled) {
    resetPanelState({ preserveSessionMode: true });
    return true;
  }
  return false;
}

function beginAnalysisRequest() {
  const requestId = Date.now();
  activeRequestId = requestId;
  activeHistoryRequest = null;
  return requestId;
}

async function restoreLatestAnalysis(options) {
  const latest = await loadLatestSnapshot();
  if (!latest) return false;
  targetPoint = null;
  showAnalysisEntry(latest, { centerPanel: options?.centerPanel === true });
  if (!options?.centerPanel) savePanelSession("expanded");
  return true;
}

function resolveAnalysisTarget(srcUrl, options) {
  let element = lastResolvedTarget.element,
    target = lastResolvedTarget.target;
  if (!target || (srcUrl && target.src !== srcUrl)) {
    element = findImageByUrl(srcUrl);
    target =
      element instanceof HTMLImageElement
        ? targetFromImageElement(element)
        : null;
  }
  if (!target && options?.analyzeCurrentPage) {
    const pageTarget = findLargestVisibleImage();
    element = pageTarget.element;
    target = pageTarget.target;
    lastResolvedTarget = pageTarget;
    targetPoint = pageTarget.point;
  }
  return { element, target };
}

async function handleMissingAnalysisTarget(srcUrl, preferLatest, options) {
  if (options?.historyPlaceholderId)
    removeHistoryPlaceholder(options.historyPlaceholderId);
  if (await restoreLatestAnalysis(options)) return;

  const settings = await loadApiSettings();
  if (!settings.apiEnabled) {
    await showNoApiWorkflow(
      { srcUrl, preferLatest, options },
      {
        target: null,
        anchor: null,
        point: lastResolvedTarget.point,
        message: "",
      },
    );
    return;
  }
  if (!isApiReady(settings)) {
    await showApiSetupWorkflow(
      { srcUrl, preferLatest, options },
      {
        target: null,
        anchor: null,
        point: lastResolvedTarget.point,
        message: apiSetupError(settings),
      },
    );
    return;
  }
  showMissingImageError(srcUrl, options);
}

function showMissingImageError(srcUrl, options) {
  ensureContentRoot();
  panelAnchor = null;
  currentTarget = null;
  targetPoint = lastResolvedTarget.point;
  panelPosition = null;
  expandedPanelWidth = null;
  panelMode = "expanded";
  stopLoadingProgress();
  updatePanelState({
    status: "error",
    language: activeLanguage,
    analysis: null,
    error: srcUrl
      ? localizedText.missingImage
      : localizedText.missingLatestAnalysis,
    errorCode: null,
    errorAction: null,
    copied: false,
  });
  options?.centerPanel ? centerPanel(true) : savePanelSession("expanded");
}

async function startApiAnalysis(resolved, requestId, options) {
  ensureContentRoot();
  clearPromptDrafts();
  panelAnchor = resolved.element;
  currentTarget = resolved.target;
  targetPoint = lastResolvedTarget.point;
  panelPosition = null;
  expandedPanelWidth = null;
  panelMode = "expanded";
  clearPanelDrag();
  resetPromptDraftAnimation("");
  clearResultEntry();

  let placeholderId = options?.historyPlaceholderId;
  if (options?.autoSaveToHistory && !placeholderId) {
    await ensureHistoryLoaded();
    placeholderId = createHistoryPlaceholder(resolved.target).id;
  }
  if (options?.autoSaveToHistory && placeholderId) {
    activeHistoryRequest = {
      requestId,
      target: resolved.target,
      placeholderId,
      markInlinePromptOnboardingComplete:
        options.markInlinePromptOnboardingComplete === true,
    };
  }
  startLoadingProgress();
  updatePanelState({
    status: "loading",
    language: activeLanguage,
    analysis: null,
    error: "",
    copied: false,
  });
  if (options?.centerPanel) centerPanel(true);
  await runApiAnalysis(resolved.target, requestId);
}
