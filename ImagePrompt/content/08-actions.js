// ImagePrompt content module: actions

function clearPanelDrag() {
  (dragPointerId = null),
    (dragStartPoint = null),
    panelShellElement()?.classList.remove("dragging"),
    window.removeEventListener("pointermove", handlePanelDragMove),
    window.removeEventListener("pointerup", handlePanelDragEnd),
    window.removeEventListener("pointercancel", handlePanelDragEnd);
}
function handlePanelDragMove(event) {
  dragPointerId === event.pointerId &&
    (dragStartPoint && Math.hypot(event.clientX - dragStartPoint.x, event.clientY - dragStartPoint.y) > 4 && (hasDraggedPanel = !0),
    (panelPosition = { left: event.clientX - dragOffset.x, top: event.clientY - dragOffset.y }),
    syncPanelPosition());
}
function handlePanelDragEnd(event) {
  dragPointerId === event.pointerId &&
    (hasDraggedPanel && (suppressPanelClickUntil = Date.now() + 220),
    clearPanelDrag(),
    panelMode !== "hidden" &&
      panelState.status !== "loading" &&
      panelState.status !== "setup" &&
      panelState.status !== "manual" &&
      savePanelSession(panelMode));
}
function bindPanelDrag() {
  const panelShell = panelShellElement(),
    dragHandle = panelLayer?.querySelector("[data-drag-handle='true']");
  !panelShell ||
    !dragHandle ||
    (dragHandle.onpointerdown = (event) => {
      const targetElement = event.target;
      if (
        !(targetElement instanceof Element) ||
        targetElement.closest("[data-action]") ||
        event.button !== 0
      )
        return;
      const panelRect = panelShell.getBoundingClientRect();
      (dragPointerId = event.pointerId),
        (dragStartPoint = { x: event.clientX, y: event.clientY }),
        (hasDraggedPanel = !1),
        (dragOffset = { x: event.clientX - panelRect.left, y: event.clientY - panelRect.top }),
        (panelPosition = { left: panelRect.left, top: panelRect.top }),
        panelShell.classList.add("dragging"),
        window.addEventListener("pointermove", handlePanelDragMove),
        window.addEventListener("pointerup", handlePanelDragEnd),
        window.addEventListener("pointercancel", handlePanelDragEnd),
        event.preventDefault();
    });
}
function bindPanelInputs() {
  if (!panelLayer) return;
  bindPanelDrag();
  const baseUrlInput = panelLayer.querySelector('[data-api-field="base-url"]'),
    apiKeyInput = panelLayer.querySelector('[data-api-field="api-key"]'),
    modelInput = panelLayer.querySelector('[data-api-field="model"]'),
    bindApiInput = (input, key) => {
      input &&
        ((input.oninput = () => {
          updateApiSetupField(key, input.value);
        }),
        (input.onkeydown = (event) => {
          event.key === "Enter" &&
            (event.preventDefault(), saveApiSetupAndContinue());
        }));
    };
  bindApiInput(baseUrlInput, "baseUrl"),
    bindApiInput(apiKeyInput, "apiKey"),
    bindApiInput(modelInput, "model");
  const manualResultInput = panelLayer.querySelector('[data-manual-field="gpt-result"]');
  manualResultInput &&
    (manualResultInput.oninput = () => {
      (setupState.manualResult = manualResultInput.value),
        setupState.error && ((setupState.error = ""), clearApiSetupError());
    });
  const promptEditor = panelLayer.querySelector(".prompt-editor");
  promptEditor &&
    (resizePromptEditor(),
    (promptEditor.oninput = () => {
      (isPromptTyping = !1),
        (renderedPromptDraft = promptEditor.value),
        (currentPromptDraft = promptEditor.value),
        setPromptDraft(panelState.language, promptEditor.value),
        schedulePromptDraftSave(),
        resizePromptEditor();
    }),
    (promptEditor.onblur = () => {
      savePromptDraftNow();
    }));
}
function bindPanelActions() {
  if (!panelLayer) return;
  panelLayer.querySelectorAll("[data-action]").forEach((actionElement) => {
    (actionElement.onclick = (event) => handlePanelAction(actionElement, event)),
      actionElement.dataset.action === "toggle-history" &&
        (actionElement.onkeydown = (event) => {
          (event.key === "Enter" || event.key === " ") &&
            (event.preventDefault(), actionElement.click());
        });
  });
}
async function handlePanelAction(element, event) {
  if (Date.now() < suppressPanelClickUntil) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  const action = element.dataset.action;
  if (await handlePanelModeAction(action)) return;
  if (await handleSetupOrManualAction(action)) return;
  if (await handleResultAction(element, event, action)) return;
  if (await handleHistoryAction(element, event, action)) return;
  if (await handleRetryAction(action)) return;
  await handlePrimaryAction(action);
}

async function handlePanelModeAction(action) {
  if (action === "minimize-panel") {
    await minimizePanel();
    return true;
  }
  if (action === "expand-panel") {
    await expandPanel();
    return true;
  }
  if (action === "toggle-inline-actions") {
    await toggleInlineActions();
    return true;
  }
  if (action === "close-shared-panel") {
    await closeSharedPanel();
    return true;
  }
  return false;
}

async function handleSetupOrManualAction(action) {
  if (action === "save-api-setup" && panelState.status === "setup") {
    await saveApiSetupAndContinue();
    return true;
  }
  if (panelState.status !== "manual") return false;
  if (action === "show-analysis-result") {
    await showManualResult();
    return true;
  }
  if (action === "manual-select-screenshot") {
    await startNoApiScreenshot();
    return true;
  }
  if (action === "copy-manual-screenshot") {
    await copyNoApiScreenshot();
    return true;
  }
  if (action === "copy-manual-reverse-prompt") {
    await copyManualReversePrompt();
    return true;
  }
  if (action === "import-manual-gpt-result") {
    await importManualGptResult();
    return true;
  }
  return false;
}

async function handleResultAction(element, event, action) {
  if (panelState.status !== "success") return false;
  if (action === "switch-language") {
    const language = element.dataset.language;
    if (!language || language === panelState.language) return true;
    switchResultLanguage(language);
    window.setTimeout(() => {
      savePanelSession(panelMode);
    }, 320);
    return true;
  }
  if (action === "toggle-history-rail") {
    await toggleHistoryRail();
    return true;
  }
  if (action === "copy") {
    await copyPromptToClipboard();
    return true;
  }
  if (action === "open-share-card") {
    await openShareCard();
    return true;
  }
  if (action === "manual-screenshot" || action === "prompt-title") {
    event.preventDefault();
    event.stopPropagation();
    await handleResultScreenshotAction();
    return true;
  }
  return false;
}

async function handleHistoryAction(element, event, action) {
  if (action === "close-history") {
    if (isHistoryRailClosing) return true;
    isHistoryRailClosing = true;
    try {
      await animateHistoryRailExit();
    } finally {
      isHistoryRailClosing = false;
    }
    historyRailOpen = false;
    renderPanel();
    return true;
  }
  if (action === "clear-history") {
    event.stopPropagation();
    await clearHistoryEntries();
    return true;
  }
  if (action === "toggle-history") {
    const historyId = element.dataset.historyId;
    if (historyId) selectHistoryEntry(historyId);
    return true;
  }
  if (action === "delete-history") {
    event.stopPropagation();
    const historyId = element.dataset.historyId;
    if (historyId) await deleteHistoryEntry(historyId);
    return true;
  }
  return false;
}

async function handleRetryAction(action) {
  if (action !== "retry" || !currentTarget) return false;
  const requestId = Date.now();
  activeRequestId = requestId;
  const retryTarget = currentTarget;
  await ensureHistoryLoaded();
  const failedSelection =
    selectedHistoryId &&
    failedHistoryItems.some(
      (item) => item.id === selectedHistoryId && item.status === "failed",
    )
      ? selectedHistoryId
      : null;
  if (failedSelection) removeHistoryPlaceholder(failedSelection);
  const placeholder = createHistoryPlaceholder(retryTarget);
  activeHistoryRequest = {
    requestId,
    target: retryTarget,
    placeholderId: placeholder.id,
    markInlinePromptOnboardingComplete: false,
  };
  selectedHistoryId = placeholder.id;
  panelMode = "expanded";
  startLoadingProgress();
  updatePanelState({
    status: "loading",
    language: activeLanguage,
    analysis: null,
    error: "",
    errorCode: null,
    errorAction: null,
    copied: false,
  });
  await runApiAnalysis(retryTarget, requestId);
  return true;
}

async function handlePrimaryAction(action) {
  if (
    action === "primary-action" &&
    panelState.errorAction?.type === "open-support" &&
    currentTarget
  ) {
    await runApiAnalysis(currentTarget, activeRequestId);
    return true;
  }
  if (action !== "primary-action" && action !== "options") return false;
  try {
    const response = await chrome.runtime.sendMessage({
      type: "OPEN_SETTINGS",
      payload: { focus: "settings" },
    });
    if (!response?.ok) throw new Error(response?.error || toolbarFallbackMessage());
  } catch {
    showToast(toolbarFallbackMessage(), "error");
  }
  return true;
}
function bindPanelEvents() {
  if (!panelLayer) return;
  bindPanelInputs();
  bindPanelActions();
}
