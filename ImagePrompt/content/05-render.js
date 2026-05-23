// ImagePrompt content module: render

function renderHistoryRail() {
  if (!historyRailOpen) return "";
  const railClass = `history-rail${isHistoryRailEntering ? " is-entering" : ""}`,
    historyEntries = [
      ...failedHistoryItems.map((historyEntry) => ({
        id: historyEntry.id,
        imageSrc: historyEntry.imageSrc,
        imageWidth: historyEntry.imageWidth,
        imageHeight: historyEntry.imageHeight,
        isPlaceholder: !0,
        isSelected: selectedHistoryId === historyEntry.id,
        isPending: historyEntry.status === "pending",
        isFailed: historyEntry.status === "failed",
        error: historyEntry.error,
      })),
      ...historyItems.map((historyEntry) => ({
        id: historyEntry.id,
        imageSrc: historyEntry.imageSrc,
        imageWidth: historyEntry.imageWidth,
        imageHeight: historyEntry.imageHeight,
        isPlaceholder: !1,
        isSelected: selectedHistoryId === historyEntry.id,
        isPending: pendingHistoryId === historyEntry.id,
        isFailed: !1,
        error: void 0,
      })),
    ].slice(0, HISTORY_LIMIT);
  if (historyEntries.length === 0)
    return `
      <aside class="${railClass}">
        <div class="history-rail-inner">
          <div class="history-rail-header">
            <div class="history-rail-heading">
              <div class="history-rail-title">${localizedText.history}</div>
              <div class="history-rail-count">0/${HISTORY_LIMIT}</div>
            </div>
            <div class="history-header-actions">
              <button
                type="button"
                class="history-close-button"
                data-action="close-history"
                aria-label="${localizedText.closeHistory}"
              >${closeIcon()}</button>
            </div>
          </div>
          <div class="history-list">
            <div class="history-item" style="${historyThumbStyle(void 0, void 0, !0)} opacity:0.72;">
              <div class="history-card-shell">
                <div class="history-card-inner">
                  <div class="history-card-face image-face is-placeholder">
                    <span class="history-placeholder-badge">${localizedText.emptyHistory}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    `;
  const hasSelectedEntry = historyEntries.some((historyEntry) => historyEntry.isSelected),
    historyHtml = historyEntries
      .map((historyEntry) => {
        const itemClass = `history-item${historyEntry.isSelected ? " is-selected" : ""}${historyEntry.isPending ? " is-pending" : ""}${historyEntry.isFailed ? " is-failed" : ""}`,
          imageFaceClass = `history-card-face image-face${historyEntry.isPlaceholder ? " is-placeholder" : ""}${historyEntry.isFailed ? " is-failed" : ""}`,
          thumbStyle = historyThumbStyle(historyEntry.imageWidth, historyEntry.imageHeight),
          statusText = historyEntry.isFailed
            ? localizedText.failedHistory
            : localizedText.savingHistory,
          statusBadgeClass = `history-placeholder-badge${historyEntry.isFailed ? " is-failed" : ""}`,
          cardHtml = `
        <div class="history-card-inner">
          <div class="${imageFaceClass}">
            <img class="history-image-thumb" src="${escapeHtml(historyEntry.imageSrc)}" alt="" />
            ${historyEntry.isPlaceholder ? `<span class="${statusBadgeClass}" title="${escapeHtml(historyEntry.error ?? "")}">${statusText}</span>` : ""}
          </div>
        </div>
      `;
        if (historyEntry.isPlaceholder) {
          const thumbnailAlt = historyEntry.isFailed
              ? `<button
            type="button"
            class="history-delete-button"
            data-action="delete-history"
            data-history-id="${historyEntry.id}"
            aria-label="${localizedText.deleteHistory}"
          >${closeIcon()}</button>`
              : "",
            deleteTitle = historyEntry.isFailed
              ? `data-action="toggle-history" data-history-id="${historyEntry.id}" role="button" tabindex="0" aria-label="${localizedText.historyLabel}"`
              : "";
          return `
          <div
            class="${itemClass}"
            data-history-id="${historyEntry.id}"
            style="${thumbStyle}"
          >
            ${thumbnailAlt}
            <div class="history-card-shell" ${deleteTitle}>
              ${cardHtml}
            </div>
          </div>
        `;
        }
        return `
        <div
          class="${itemClass}"
          data-history-id="${historyEntry.id}"
          style="${thumbStyle}"
        >
          <button
            type="button"
            class="history-delete-button"
            data-action="delete-history"
            data-history-id="${historyEntry.id}"
            aria-label="${localizedText.deleteHistory}"
          >${closeIcon()}</button>
          <div
            class="history-card-shell"
            data-action="toggle-history"
            data-history-id="${historyEntry.id}"
            role="button"
            tabindex="0"
            aria-label="${localizedText.historyLabel}"
          >
            ${cardHtml}
          </div>
        </div>
      `;
      })
      .join("");
  return `
    <aside class="${railClass}">
      <div class="history-rail-inner">
        <div class="history-rail-header">
          <div class="history-rail-heading">
            <div class="history-title-row">
              <div class="history-rail-title">${localizedText.history}</div>
              <button
                type="button"
                class="history-clear-button"
                data-action="clear-history"
                aria-label="${localizedText.clearAllHistory}"
              >${localizedText.clearAllHistory}</button>
            </div>
            <div class="history-rail-count">${historyEntries.length}/${HISTORY_LIMIT}</div>
          </div>
          <div class="history-header-actions">
            <button
              type="button"
              class="history-close-button"
              data-action="close-history"
              aria-label="${localizedText.closeHistory}"
            >${closeIcon()}</button>
          </div>
        </div>
        <div class="history-list${hasSelectedEntry ? " has-selection" : ""}">${historyHtml}</div>
      </div>
    </aside>
  `;
}
async function animateHistoryFlyoverToCard(historyEntry) {
  const sourceCard = panelLayer?.querySelector(".body-success"),
    targetCard = panelLayer?.querySelector(`[data-history-id="${historyEntry.id}"] .history-card-shell`);
  if (!sourceCard || !targetCard || !shadowRoot) return;
  removeHistoryFlyover();
  const sourceRect = sourceCard.getBoundingClientRect(),
    targetRect = targetCard.getBoundingClientRect(),
    flyover = document.createElement("div"),
    promptPreview = truncateText(collapseWhitespace(currentPromptText() ?? ""), 320);
  (flyover.className = "history-flyover"),
    (flyover.style.width = `${sourceRect.width}px`),
    (flyover.style.height = `${sourceRect.height}px`),
    (flyover.style.left = `${sourceRect.left}px`),
    (flyover.style.top = `${sourceRect.top}px`),
    (flyover.innerHTML = `
      <div class="history-flyover-inner">
        <div class="history-flyover-face prompt-face">
          <p class="history-flyover-front-copy">${escapeHtml(promptPreview)}</p>
        </div>
        <div class="history-flyover-face image-face">
          <img class="history-flyover-image" src="${escapeHtml(historyEntry.imageSrc)}" alt="" />
        </div>
      </div>
    `),
    shadowRoot.append(flyover),
    (historyFlyover = flyover);
  const deltaX = targetRect.left - sourceRect.left,
    deltaY = targetRect.top - sourceRect.top,
    scaleX = targetRect.width / Math.max(sourceRect.width, 1),
    scaleY = targetRect.height / Math.max(sourceRect.height, 1);
  await flyover
    .animate(
      [
        {
          transform: "translate3d(0px, 0px, 0px) scale(1)",
          opacity: 0.98,
          offset: 0,
        },
        {
          transform: `translate3d(${deltaX}px, ${deltaY}px, 0px) scale(${scaleX}, ${scaleY})`,
          opacity: 0.82,
          offset: 1,
        },
      ],
      {
        duration: 520,
        easing: "cubic-bezier(0.22, 0.82, 0.2, 1)",
        fill: "forwards",
      },
    )
    .finished.catch(() => {}),
    removeHistoryFlyover();
}
function showAnalysisEntry(snapshot, options) {
  ensureContentRoot(),
    restorePromptDrafts(snapshot.promptDrafts),
    options?.preservePosition
      ? capturePanelPosition()
      : ((panelAnchor = options?.anchorPoint ? null : findImageByUrl(snapshot.target.src)),
        (targetPoint = options?.anchorPoint ?? null),
        (expandedPanelWidth = null)),
    (currentTarget = snapshot.target),
    options?.preservePosition || (panelPosition = null),
    (panelMode = "expanded"),
    clearPanelDrag(),
    stopLoadingProgress(),
    clearResultEntry();
  const promptText = promptForLanguage(snapshot.analysis, panelState.language);
  (renderedPromptDraft = promptText),
    (currentPromptDraft = promptText),
    (isPromptTyping = !1),
    updatePanelState({
      status: "success",
      analysis: snapshot.analysis,
      error: "",
      errorCode: null,
      errorAction: null,
      copied: !1,
    }),
    resetPromptDraftAnimation(promptText),
    options?.centerPanel && centerPanel(!0);
}
function historyEntryToSnapshot(entry) {
  return {
    createdAt: entry.createdAt,
    target: {
      src: entry.imageSrc,
      pageUrl: entry.pageUrl,
      naturalWidth: entry.imageWidth,
      naturalHeight: entry.imageHeight,
    },
    analysis: entry.analysis,
    promptDrafts: entry.promptDrafts,
  };
}
function selectSavedHistoryEntry(entryId) {
  const entry = historyItems.find((historyEntry) => historyEntry.id === entryId);
  entry &&
    (captureHistoryScroll(),
    (selectedHistoryId = entryId),
    loadHistoryImagePayload(entryId),
    (panelMode = "expanded"),
    showAnalysisEntry(historyEntryToSnapshot(entry), { preservePosition: !0 }),
    saveCurrentAnalysisSnapshot(),
    savePanelSession("expanded"));
}
function selectFailedHistoryEntry(entryId) {
  const entry = failedHistoryItems.find((historyEntry) => historyEntry.id === entryId && historyEntry.status === "failed");
  entry &&
    (captureHistoryScroll(),
    (selectedHistoryId = entryId),
    loadHistoryImagePayload(entryId),
    (currentTarget = {
      src: entry.imageSrc,
      alt: entry.alt,
      pageUrl: entry.pageUrl,
      naturalWidth: entry.imageWidth,
      naturalHeight: entry.imageHeight,
    }),
    (panelMode = "expanded"),
    stopLoadingProgress(),
    resetPromptDraftAnimation(""),
    clearResultEntry(),
    updatePanelState({
      status: "error",
      language: activeLanguage,
      analysis: null,
      error: entry.error || "Analysis failed. Please try again.",
      errorCode: "ANALYSIS_FAILED",
      errorAction: null,
      copied: !1,
    }),
    savePanelSession("expanded"));
}
function applyExpandedPanelWidth() {
  const panel = panelElement(),
    widthOverride = expandedWidthOverride();
  if (!panel || widthOverride === null || panel.classList.contains("is-minimized")) return;
  const viewportWidth = viewportSize().width,
    widthStyle = `${Math.round(Math.min(widthOverride, Math.max(220, viewportWidth - 24)))}px`;
  (panel.style.width = widthStyle), (panel.style.minWidth = widthStyle), (panel.style.maxWidth = widthStyle);
}
function rememberExpandedPanelWidth() {
  const panel = panelElement();
  if (!panel || panelMode !== "expanded" || panel.classList.contains("is-minimized")) return;
  const panelWidth = Math.round(panel.getBoundingClientRect().width);
  if (panelWidth <= 0) return;
  const viewportWidth = viewportSize().width;
  (expandedPanelWidth = Math.min(panelWidth, Math.max(220, viewportWidth - 24))), applyExpandedPanelWidth();
}
function ensureContentRoot() {
  if (isBlockedByHost()) {
    teardownContentUi();
    return;
  }
  if (rootHost) return;
  (rootHost = document.createElement("div")),
    (rootHost.id = "imagetoprompt-root"),
    (rootHost.style.cssText = [
      "all: initial",
      "position: fixed",
      "inset: 0",
      "width: var(--imagetoprompt-vw, 100vw)",
      "height: var(--imagetoprompt-vh, 100vh)",
      "display: block",
      "overflow: visible",
      "pointer-events: none",
      "z-index: 2147483646",
      "font-size: 16px",
      "line-height: normal",
      "direction: ltr",
      "unicode-bidi: isolate",
      "transform: none",
      "zoom: 1",
    ].join("; ")),
    updateRootViewportVars(),
    document.documentElement.appendChild(rootHost),
    (shadowRoot = rootHost.attachShadow({ mode: "open" }));
  const styleElement = document.createElement("style");
  (styleElement.textContent = contentStyles),
    (inlineActionLayer = document.createElement("div")),
    (inlineActionLayer.className = "image-action-overlay"),
    (toastLayer = document.createElement("div")),
    (toastLayer.className = "image-action-toast-layer"),
    (screenshotLayer = document.createElement("div")),
    (screenshotLayer.className = "screenshot-selection-layer"),
    (panelLayer = document.createElement("div")),
    (panelLayer.className = "overlay"),
    shadowRoot.append(styleElement, inlineActionLayer, toastLayer, screenshotLayer, panelLayer),
    ensureHistoryLoaded(),
    renderInlineActionMenu(),
    renderToast(),
    renderPanel();
}
function stringifyJsonPrompt(analysis) {
  const jsonPrompt =
    analysis.jsonPrompt.raw && Object.keys(analysis.jsonPrompt.raw).length > 0
      ? analysis.jsonPrompt.raw
      : {
          subject: analysis.jsonPrompt.subject,
          action_pose: analysis.jsonPrompt.actionPose,
          details_appearance: analysis.jsonPrompt.detailsAppearance,
          environment_background: analysis.jsonPrompt.environmentBackground,
          lighting_atmosphere: analysis.jsonPrompt.lightingAtmosphere,
          style_camera: analysis.jsonPrompt.styleCamera,
          colors: analysis.jsonPrompt.colors,
          materials: analysis.jsonPrompt.materials,
          aspect_ratio: analysis.jsonPrompt.aspectRatio,
        };
  return JSON.stringify(jsonPrompt, null, 2);
}
function clearPromptDrafts() {
  promptDraftsByLanguage = {};
}
function hasPromptDraft(language) {
  return Object.prototype.hasOwnProperty.call(promptDraftsByLanguage, language);
}
function defaultPromptForLanguage(analysis, language) {
  return language === "json" ? stringifyJsonPrompt(analysis) : analysis[language].prompt;
}
function setPromptDraft(language, promptText) {
  promptDraftsByLanguage[language] = promptText;
}
function promptForLanguage(analysis, language) {
  return hasPromptDraft(language) ? (promptDraftsByLanguage[language] ?? "") : defaultPromptForLanguage(analysis, language);
}
function currentPromptText() {
  return panelState.analysis
    ? promptForLanguage(panelState.analysis, panelState.language)
    : null;
}
function currentStyleTags() {
  return !panelState.analysis || panelState.language === "json"
    ? []
    : (panelState.analysis.styleTags[panelState.language] ?? []);
}
function shortenStyleTag(tag) {
  const cleanTag = tag.replace(/\s+/g, " ").trim(),
    lowerTag = cleanTag.toLowerCase(),
    replacements = {
      "high-end fashion photography": "high-end fashion",
      "fashion editorial photography": "fashion editorial",
      "retro-modern aesthetic": "retro-modern",
      "vibrant color saturation": "vibrant color",
      "natural skin texture": "skin texture",
      "cinematic lighting": "cinematic light",
      "high-contrast lighting": "high contrast",
      "minimalist aesthetic": "minimalist",
      "photorealistic portrait": "photo portrait",
      "commercial fashion portrait": "fashion portrait",
      "modern commercial photography": "commercial photo",
      "high detail": "high-detail",
    };
  if (replacements[lowerTag]) return replacements[lowerTag];
  const shortenedTag = cleanTag
      .replace(/\bphotography\b/gi, "photo")
      .replace(/\baesthetic\b/gi, "")
      .replace(/\bsaturation\b/gi, "")
      .replace(/\s+/g, " ")
      .trim(),
    words = shortenedTag.split(/\s+/).filter(Boolean),
    compactTag = words.length > 3 ? words.slice(0, 3).join(" ") : shortenedTag;
  if (compactTag.length <= 24) return compactTag;
  const clippedTag = compactTag.slice(0, 24),
    lastSpace = clippedTag.lastIndexOf(" ");
  return (lastSpace >= 12 ? clippedTag.slice(0, lastSpace) : clippedTag).trim();
}
function visibleStyleTags() {
  const seenTags = new Set(),
    language = panelState.language;
  return currentStyleTags()
    .map((tag) => (language === "en" ? shortenStyleTag(tag) : tag.replace(/\s+/g, " ").trim()))
    .filter((tag) =>
      !tag || seenTags.has(tag.toLowerCase()) ? !1 : (seenTags.add(tag.toLowerCase()), !0),
    )
    .slice(0, 4);
}
function renderLanguageToggle() {
  const tabs = languageTabOrder(activeLanguage).map((language) => ({
    key: language,
    label: languageTabLabel(language),
  }));
  return `<div class="toggle-group" data-active-index="${Math.max(
    0,
    tabs.findIndex(({ key: language }) => language === panelState.language),
  )}">${tabs
    .map(
      ({ key: language, label }) =>
        `<button class="toggle-option${panelState.language === language ? " is-active" : ""}" data-action="switch-language" data-language="${language}">${label}</button>`,
    )
    .join("")}</div>`;
}
function configRequiredMessage() {
  return "Finish API setup before analysis.";
}
function settingsActionLabel() {
  return "Open settings";
}
function screenshotActionLabel() {
  switch (activeLanguage) {
    case "zh":
      return "截图";
    case "en":
    default:
      return "Screen shot";
  }
}
function manualResultIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 4.8H17C17.9 4.8 18.6 5.5 18.6 6.4V17.6C18.6 18.5 17.9 19.2 17 19.2H7C6.1 19.2 5.4 18.5 5.4 17.6V6.4C5.4 5.5 6.1 4.8 7 4.8Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"></path>
      <path d="M8.6 9H15.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
      <path d="M8.6 12H14.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
      <path d="M8.6 15H12.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
    </svg>
  `;
}
function captureManualResultState() {
  panelState.analysis &&
    (manualResultState = {
      target: currentTarget,
      analysis: panelState.analysis,
      language: panelState.language,
      promptDrafts: capturePromptDrafts(),
    });
}
async function ensureManualResultState() {
  if (manualResultState?.analysis || panelState.analysis) return;
  const latestSnapshot = await loadLatestSnapshot();
  latestSnapshot?.analysis &&
    (manualResultState = {
      target: latestSnapshot.target,
      analysis: latestSnapshot.analysis,
      language: panelState.language,
      promptDrafts: latestSnapshot.promptDrafts ?? {},
    });
}
function manualResultButton() {
  return manualResultState?.analysis
    ? `
    <button
      type="button"
      class="history-button"
      data-action="show-analysis-result"
      aria-label="${escapeHtml(localizedText.showAnalysisResult)}"
      title="${escapeHtml(localizedText.showAnalysisResult)}"
    >
      <span class="history-button-icon" aria-hidden="true">${manualResultIcon()}</span>
    </button>
  `
    : "";
}
async function showManualResult() {
  const resultState = manualResultState;
  if (!resultState?.analysis) return;
  (historyRailOpen = !1),
    clearHistoryRailEnter(),
    (panelState.language = normalizeLanguage(
      resultState.language || panelState.language,
    )),
    showAnalysisEntry(
      {
        target: resultState.target ?? manualBaseTarget(),
        analysis: resultState.analysis,
        promptDrafts: resultState.promptDrafts ?? {},
      },
      { preservePosition: !0 },
    ),
    await savePanelSession("expanded"),
    scheduleHistoryRailHeightSync();
}
function showConfigRequiredError(target, anchor, point) {
  ensureContentRoot(),
    (panelAnchor = anchor),
    (currentTarget = target),
    (targetPoint = point),
    (panelPosition = null),
    (expandedPanelWidth = null),
    (panelMode = "expanded"),
    clearPanelDrag(),
    stopLoadingProgress(),
    resetPromptDraftAnimation(""),
    clearResultEntry(),
    updatePanelState({
      status: "error",
      language: activeLanguage,
      analysis: null,
      error: configRequiredMessage(),
      errorCode: "CONFIG_REQUIRED",
      errorAction: { type: "open-settings", label: settingsActionLabel() },
      copied: !1,
    }),
    savePanelSession("expanded");
}
function renderHistoryButton() {
  return `
    <button
      type="button"
      class="history-button${historyRailOpen ? " is-active" : ""}${isHistoryRailEntering ? " is-opening" : ""}"
      data-action="toggle-history-rail"
      aria-label="${localizedText.history}"
      aria-pressed="${historyRailOpen ? "true" : "false"}"
    >
      <span class="history-button-icon" aria-hidden="true">
        <img src="${chrome.runtime.getURL("icons/history-icon.png")}" alt="" />
      </span>
    </button>
  `;
}
function renderShareButton() {
  return `
    <button
      type="button"
      class="close-button share-button"
      data-action="open-share-card"
      aria-label="Share ImagePrompt"
    >${shareIcon()}</button>
  `;
}
function renderScreenshotButton() {
  return `
    <button
      type="button"
      class="close-button screenshot-button"
      data-action="manual-screenshot"
      aria-label="${escapeHtml(screenshotActionLabel())}"
    >${screenshotIcon()}</button>
  `;
}
function panelWidthForMode(mode) {
  const viewport = viewportSize(),
    availableWidth = Math.max(220, viewport.width - 24);
  return Math.min(mode === "minimized" ? MINIMIZED_PANEL_WIDTH : PANEL_WIDTH, availableWidth);
}
function expandedWidthOverride() {
  if (panelMode !== "expanded" || expandedPanelWidth === null) return null;
  const viewport = viewportSize(),
    availableWidth = Math.max(220, viewport.width - 24),
    defaultWidth = panelWidthForMode("expanded"),
    overrideWidth = Math.min(expandedPanelWidth, availableWidth);
  return overrideWidth >= defaultWidth - 8 ? overrideWidth : null;
}
function isPanelModeRendered(mode) {
  const panel = panelElement();
  if (!panel) return !1;
  const isMinimized = panel.classList.contains("is-minimized");
  return mode === "minimized" ? isMinimized : !isMinimized;
}
function panelDimensions(mode = panelMode) {
  const panelShell = panelShellElement();
  return panelShell && isPanelModeRendered(mode)
    ? {
        width: panelShell.offsetWidth || panelWidthForMode(mode),
        height: panelShell.offsetHeight || (mode === "minimized" ? 62 : PANEL_HEIGHT),
      }
    : { width: expandedWidthOverride() ?? panelWidthForMode(mode), height: mode === "minimized" ? 62 : PANEL_HEIGHT };
}
function panelCoordinates() {
  const viewport = viewportSize(),
    { width: panelWidth, height: panelHeight } = panelDimensions(),
    maxLeft = Math.max(12, viewport.width - panelWidth - 12),
    maxTop = Math.max(12, viewport.height - panelHeight - 12),
    defaultLeft = viewport.width - panelWidth - 20,
    defaultTop = 80,
    clampPosition = (position) => ({ left: clamp(position.left, 12, maxLeft), top: clamp(position.top, 12, maxTop) });
  if (panelPosition) return clampPosition(panelPosition);
  if (targetPoint)
    return clampPosition({ left: targetPoint.x + 8, top: targetPoint.y + 8 });
  if (!panelAnchor) return isPinterestHost() ? clampPosition({ left: 20, top: defaultTop }) : clampPosition({ left: defaultLeft, top: defaultTop });
  const anchorRect = panelAnchor.getBoundingClientRect(),
    rightSideLeft = anchorRect.right + 16,
    leftSideLeft = anchorRect.left - panelWidth - 16,
    centeredLeft = anchorRect.left + anchorRect.width / 2 - panelWidth / 2,
    left = rightSideLeft + panelWidth + 12 <= viewport.width ? rightSideLeft : leftSideLeft >= 12 ? leftSideLeft : clamp(centeredLeft, 12, maxLeft),
    top = clamp(anchorRect.top + Math.min(anchorRect.height * 0.12, 24), 12, maxTop);
  return { left: left, top: top };
}
function centeredPanelCoordinates() {
  const viewport = viewportSize(),
    { width: panelWidth, height: panelHeight } = panelDimensions("expanded"),
    maxLeft = Math.max(12, viewport.width - panelWidth - 12),
    maxTop = Math.max(12, viewport.height - panelHeight - 12);
  return {
    left: clamp(Math.round((viewport.width - panelWidth) / 2), 12, maxLeft),
    top: clamp(Math.round((viewport.height - panelHeight) / 2), 12, maxTop),
  };
}
function centerPanel(shouldSave = !1) {
  window.requestAnimationFrame(() => {
    (panelPosition = centeredPanelCoordinates()), syncPanelPosition(), syncHistoryRailHeight(), shouldSave && savePanelSession(panelMode);
  });
}
function syncPanelPosition() {
  const panelShell = panelShellElement();
  if (!panelShell) return;
  const coordinates = panelCoordinates();
  (panelShell.style.left = `${coordinates.left}px`), (panelShell.style.top = `${coordinates.top}px`);
}
function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
function toolbarFallbackMessage() {
  switch (activeLanguage) {
    case "zh":
      return "请点击浏览器右上角的 ImagePrompt 图标继续。";
    case "en":
    default:
      return "Click the ImagePrompt extension icon in the browser toolbar to continue.";
  }
}
function resizePromptEditor() {
  const promptEditor = panelLayer?.querySelector(".prompt-editor");
  if (!promptEditor) return;
  const scrollArea = promptEditor.closest(".scroll-area"),
    previousScrollTop = scrollArea?.scrollTop ?? 0,
    isActiveEditor = activePromptEditor() === promptEditor,
    selectionStart = promptEditor.selectionStart,
    selectionEnd = promptEditor.selectionEnd;
  if (promptEditor.classList.contains("json-view")) {
    (promptEditor.style.height = "min(38vh, 300px)"), scrollArea && (scrollArea.scrollTop = previousScrollTop);
    return;
  }
  (promptEditor.style.height = "auto"),
    (promptEditor.style.height = `${Math.max(promptEditor.scrollHeight, 24)}px`),
    scrollArea && (scrollArea.scrollTop = previousScrollTop),
    isActiveEditor && promptEditor.setSelectionRange(selectionStart, selectionEnd);
}
function savePromptDraftNow() {
  promptSaveTimer !== null && (window.clearTimeout(promptSaveTimer), (promptSaveTimer = null)),
    saveCurrentAnalysisSnapshot();
}
function schedulePromptDraftSave() {
  promptSaveTimer !== null && window.clearTimeout(promptSaveTimer),
    (promptSaveTimer = window.setTimeout(() => {
      (promptSaveTimer = null), saveCurrentAnalysisSnapshot();
    }, 280));
}
function renderPromptEditorValue(promptText) {
  renderedPromptDraft = promptText;
  const promptEditor = panelLayer?.querySelector(".prompt-editor");
  promptEditor &&
    ((promptEditor.value = promptText),
    promptEditor.classList.toggle("typing", isPromptTyping),
    resizePromptEditor(),
    scheduleHistoryRailHeightSync());
}
function resetPromptDraftAnimation(promptText) {
  typingTimer !== null && (window.clearTimeout(typingTimer), (typingTimer = null)),
    (isPromptTyping = !1),
    typeof promptText == "string" && ((currentPromptDraft = promptText), renderPromptEditorValue(promptText));
}
function animatePromptText(promptText) {
  resetPromptDraftAnimation(),
    (currentPromptDraft = promptText),
    (renderedPromptDraft = promptText),
    (isPromptTyping = !0),
    renderPromptEditorValue(promptText),
    (typingTimer = window.setTimeout(() => {
      (isPromptTyping = !1), renderPromptEditorValue(promptText), (typingTimer = null);
    }, 560));
}
function animateCurrentPrompt() {
  const promptText = currentPromptText();
  promptText &&
    window.requestAnimationFrame(() => {
      animatePromptText(promptText);
    });
}
function renderStyleTags() {
  return visibleStyleTags()
    .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
    .join("");
}
function switchResultLanguage(language) {
  if (!panelState.analysis) return;
  const tabOrder = languageTabOrder(activeLanguage),
    activeIndex = Math.max(0, tabOrder.indexOf(language));
  panelState = { ...panelState, language: language, copied: !1 };
  const toggleGroup = panelLayer?.querySelector(".toggle-group");
  toggleGroup?.setAttribute("data-active-index", String(activeIndex)),
    toggleGroup?.querySelectorAll(".toggle-option").forEach((toggleOption) => {
      toggleOption.classList.toggle("is-active", toggleOption.dataset.language === language);
    });
  const isJsonView = language === "json";
  panelLayer?.querySelector(".scroll-area")?.classList.toggle("json-scroll", isJsonView),
    panelLayer?.querySelector(".prompt-editor")?.classList.toggle("json-view", isJsonView),
    scheduleHistoryRailHeightSync();
  const styleTagsHtml = renderStyleTags(),
    tagsElement = panelLayer?.querySelector(".tags");
  tagsElement && ((tagsElement.innerHTML = styleTagsHtml), tagsElement.classList.toggle("hidden", !styleTagsHtml));
  const copyButton = panelLayer?.querySelector('[data-action="copy"]');
  copyButton && (copyButton.textContent = localizedText.copy),
    (currentPromptDraft = ""),
    (renderedPromptDraft = ""),
    animateCurrentPrompt(),
    scheduleHistoryRailHeightSync();
}
function clearResultEntryTimer() {
  resultEnterTimer !== null && (window.clearTimeout(resultEnterTimer), (resultEnterTimer = null));
}
function startResultEntry() {
  clearResultEntryTimer(),
    (isResultEntering = !0),
    (resultEnterTimer = window.setTimeout(() => {
      (isResultEntering = !1), (resultEnterTimer = null);
    }, RESULT_ENTER_MS));
}
function clearResultEntry() {
  clearResultEntryTimer(), (isResultEntering = !1);
}
function clearHistoryRailEnterTimer() {
  historyRailEnterTimer !== null && (window.clearTimeout(historyRailEnterTimer), (historyRailEnterTimer = null));
}
function startHistoryRailEnter() {
  clearHistoryRailEnterTimer(),
    (isHistoryRailEntering = !0),
    (historyRailEnterTimer = window.setTimeout(() => {
      (isHistoryRailEntering = !1), (historyRailEnterTimer = null);
    }, HISTORY_RAIL_ENTER_MS));
}
function clearHistoryRailEnter() {
  clearHistoryRailEnterTimer(), (isHistoryRailEntering = !1);
}
function renderLoadingPanel() {
  return `
    <div class="body body-loading">
      <div class="loading">
        <div class="progress-row">
          <div class="progress-track" aria-hidden="true">
            <div class="progress-bar" style="width:${loadingProgress.toFixed(1)}%"></div>
          </div>
          <div class="progress-value">${Math.round(loadingProgress)}%</div>
        </div>
        <p class="loading-status">${loadingStatusText()}...</p>
      </div>
    </div>
  `;
}
function primaryErrorAction() {
  return panelState.errorAction &&
    panelState.errorAction.type !== "open-support"
    ? panelState.errorAction
    : null;
}
function renderErrorPanel() {
  const errorAction = primaryErrorAction(),
    actionHtml = errorAction
      ? `<button class="primary-button" data-action="primary-action">${escapeHtml(errorAction.label)}</button>`
      : `<button class="primary-button" data-action="retry">${localizedText.retry}</button>`;
  return `
    <div class="body">
      <p class="error-text">${escapeHtml(panelState.error)}</p>
      <div class="helper">
        ${actionHtml}
      </div>
    </div>
  `;
}
function renderApiSetupPanel() {
  return `
    <div class="body body-setup">
      <div class="setup-shell">
        <p class="setup-copy setup-api-copy">${escapeHtml(localizedText.apiConfigDescription)}</p>
        ${setupState.error ? `<payloadValue class="setup-error">${escapeHtml(setupState.error)}</payloadValue>` : ""}
        <div class="setup-form">
          <label class="setup-field">
            <span class="setup-label">${localizedText.apiSetupBaseUrl}</span>
            <input
              class="setup-input"
              data-api-field="base-url"
              type="url"
              spellcheck="false"
              value="${escapeHtml(setupState.baseUrl)}"
              placeholder="${escapeHtml(localizedText.apiSetupBaseUrlPlaceholder)}"
            />
          </label>
          <label class="setup-field">
            <span class="setup-label">${localizedText.apiSetupApiKey}</span>
            <input
              class="setup-input"
              data-api-field="api-key"
              type="password"
              spellcheck="false"
              value="${escapeHtml(setupState.apiKey)}"
              placeholder="${escapeHtml(localizedText.apiSetupApiKeyPlaceholder)}"
            />
          </label>
          <label class="setup-field">
            <span class="setup-label">${localizedText.apiSetupModel}</span>
            <input
              class="setup-input"
              data-api-field="model"
              type="text"
              spellcheck="false"
              value="${escapeHtml(setupState.model)}"
              placeholder="${escapeHtml(localizedText.apiSetupModelPlaceholder)}"
            />
          </label>
        </div>
        <div class="setup-actions">
          <button type="button" class="primary-button" data-action="save-api-setup" ${setupState.isSaving ? "disabled" : ""}>
            ${setupState.isSaving ? localizedText.apiSetupSaving : localizedText.apiSetupSave}
          </button>
        </div>
      </div>
    </div>
  `;
}
function renderNoApiPanel() {
  return `
    <div class="body body-setup body-manual">
      <div class="setup-shell">
        <p class="setup-copy">${escapeHtml(localizedText.manualSetupDescription)}</p>
        <div class="setup-actions">
          <button type="button" class="secondary-button" data-action="manual-select-screenshot">
            ${localizedText.manualScreenshot}
          </button>
          <button type="button" class="secondary-button" data-action="copy-manual-screenshot">
            ${localizedText.copyManualScreenshot}
          </button>
          <button type="button" class="secondary-button" data-action="copy-manual-reverse-prompt">
            ${localizedText.copyManualPrompt}
          </button>
        </div>
        <div class="manual-import">
          <label class="setup-field">
            <span class="setup-label">${localizedText.gptResultPaste}</span>
            <textarea
              class="setup-input setup-textarea"
              data-manual-field="gpt-result"
              spellcheck="false"
              placeholder="${escapeHtml(localizedText.gptResultPlaceholder)}"
            >${escapeHtml(setupState.manualResult ?? "")}</textarea>
          </label>
          <button type="button" class="secondary-button" data-action="import-manual-gpt-result">
            ${localizedText.importGptResult}
          </button>
        </div>
        ${setupState.error ? `<payloadValue class="setup-error">${escapeHtml(setupState.error)}</payloadValue>` : ""}
      </div>
    </div>
  `;
}
function renderResultBody(enterClass) {
  if (!panelState.analysis) return renderErrorPanel();
  const promptText = currentPromptText() ?? "",
    styleTagsHtml = renderStyleTags(),
    isJsonView = panelState.language === "json";
  return `
    <div class="body body-success${enterClass}">
      <div class="scroll-area${isJsonView ? " json-scroll" : ""}">
        <textarea class="prompt prompt-editor${`${isPromptTyping ? " typing" : ""}${isJsonView ? " json-view" : ""}`}" spellcheck="false">${escapeHtml(renderedPromptDraft || promptText)}</textarea>
      </div>
      <div class="success-meta">
        <div class="tags ${styleTagsHtml ? "" : "hidden"}">${styleTagsHtml}</div>
      </div>
    </div>
  `;
}
function chevronIcon(direction) {
  return `
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="${direction === "up" ? "M4 10L8 6L12 10" : "M4 6L8 10L12 6"}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>
  `;
}
function closeIcon() {
  return `
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M4.5 4.5L11.5 11.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
      <path d="M11.5 4.5L4.5 11.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
    </svg>
  `;
}
function shareIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M10.8 6.2H7.2C6.1 6.2 5.2 7.1 5.2 8.2V16.8C5.2 17.9 6.1 18.8 7.2 18.8H15.8C16.9 18.8 17.8 17.9 17.8 16.8V13.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"></path>
      <path d="M13.2 5.2H18.8V10.8" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"></path>
      <path d="M11.6 12.4L18.4 5.6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>
  `;
}
function screenshotIcon() {
  return `
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M3.2 5.2V3.8C3.2 3.36 3.56 3 4 3H5.4" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"></path>
      <path d="M10.6 3H12C12.44 3 12.8 3.36 12.8 3.8V5.2" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"></path>
      <path d="M12.8 10.8V12.2C12.8 12.64 12.44 13 12 13H10.6" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"></path>
      <path d="M5.4 13H4C3.56 13 3.2 12.64 3.2 12.2V10.8" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"></path>
      <circle cx="8" cy="8" r="2.15" fill="none" stroke="currentColor" stroke-width="1.55"></circle>
    </svg>
  `;
}
function renderMinimizedPanel() {
  return `
    <div class="minimized-panel" data-drag-handle="true">
      <button
        type="button"
        class="minimized-toggle-card${inlineActionsEnabled ? " is-active" : ""}"
        data-action="toggle-inline-actions"
        aria-pressed="${inlineActionsEnabled ? "true" : "false"}"
      >
        <span class="minimized-toggle-copy">
          <span class="minimized-toggle-title">${localizedText.inlineActionsTitle}</span>
        </span>
        <span class="minimized-toggle-switch" aria-hidden="true"></span>
      </button>
      <div class="minimized-actions">
        <button
          type="button"
          class="minimized-icon-button is-danger"
          data-action="close-shared-panel"
          aria-label="${localizedText.closeSharedPanel}"
        >${closeIcon()}</button>
        <button
          type="button"
          class="minimized-icon-button is-expand"
          data-action="expand-panel"
          aria-label="${localizedText.expandPanel}"
        >${chevronIcon("down")}</button>
      </div>
    </div>
  `;
}
function renderHeaderActions() {
  const resultAction =
      panelState.status === "success"
        ? renderHistoryButton()
        : panelState.status === "manual"
          ? manualResultButton()
          : "",
    shareAction = panelState.status === "success" ? renderShareButton() : "",
    screenshotAction = panelState.status === "success" ? renderScreenshotButton() : "",
    closeAction =
      panelState.status === "loading"
        ? `<button class="close-button" data-action="close-shared-panel" aria-label="${localizedText.closeSharedPanel}">${closeIcon()}</button>`
        : `<button class="close-button" data-action="minimize-panel" aria-label="${localizedText.minimizePanel}">${chevronIcon("up")}</button>`;
  return {
    top: shareAction
      ? `<div class="header-top-actions">${shareAction}${closeAction}</div>`
      : closeAction,
    secondary: screenshotAction
      ? `<div class="header-secondary-actions">${screenshotAction}${resultAction}</div>`
      : resultAction,
  };
}
function renderPanelTitle() {
  const title =
    panelState.status === "loading"
      ? localizedText.analysisImage
      : panelState.status === "setup"
        ? localizedText.apiSetupTitle
        : panelState.status === "manual"
          ? localizedText.manualSetupTitle
          : localizedText.analysisResult;
  return panelState.status === "success"
    ? `<div class="title-stack">
        <span class="title title-button" data-title="${escapeHtml(title)}">${escapeHtml(title)}</span>
      </div>`
    : `<div class="title">${escapeHtml(title)}</div>`;
}
function renderPanelBody(enterClass) {
  return panelState.status === "loading"
    ? renderLoadingPanel()
    : panelState.status === "setup"
      ? renderApiSetupPanel()
      : panelState.status === "manual"
        ? renderNoApiPanel()
        : panelState.status === "error"
          ? renderErrorPanel()
          : renderResultBody(enterClass);
}
function renderPanel() {
  if (!panelLayer) return;
  if (
    (updateRootViewportVars(),
    rememberHistoryScroll(),
    panelState.status === "hidden")
  ) {
    panelLayer.innerHTML = "";
    return;
  }
  const panelCoords = panelCoordinates();
  if (panelMode === "minimized") {
    const collapseClass = panelTransitionMode === "collapse" ? " mode-collapse" : "";
    (panelLayer.innerHTML = `
      <div
        class="panel-shell"
        style="left:${panelCoords.left}px; top:${panelCoords.top}px;"
      >
        <div
          class="panel is-minimized${collapseClass}"
          role="dialog"
          aria-modal="false"
          aria-label="Image prompt minimized menu"
        >
          <div class="ring-glow" aria-hidden="true"></div>
          <div class="glass-pill"></div>
          ${renderMinimizedPanel()}
        </div>
      </div>
    `),
      bindPanelEvents(),
      window.requestAnimationFrame(() => {
        syncPanelPosition(), panelPosition || (panelPosition = { ...panelCoords });
      }),
      (panelTransitionMode = null);
    return;
  }
  const copyLabel = panelState.copied
      ? `${localizedText.copied}<span class="button-check" aria-hidden="true">&#10003;</span>`
      : localizedText.copy,
    enterClass = panelState.status === "success" && isResultEntering ? " result-enter" : "",
    isEnteringResult = !!enterClass,
    expandClass = panelTransitionMode === "expand" && !enterClass ? " mode-expand" : "",
    glowClass =
      panelState.status === "loading"
        ? " loading-glow"
        : isCopyGlowActive
          ? " copy-glow"
          : "",
    systemClass = ` is-system-${activeLanguage}`,
    shouldShowHistoryRail =
      panelState.status !== "setup" &&
      panelState.status !== "manual" &&
      historyRailOpen,
    shouldAnimateHistoryRail = shouldShowHistoryRail && (isHistoryRailEntering || isEnteringResult),
    languageToggleHtml = panelState.status === "success" ? renderLanguageToggle() : "",
    bodyHtml = renderPanelBody(enterClass),
    historyRailHtml = shouldShowHistoryRail ? renderHistoryRail() : "",
    loadingClass = panelState.status === "loading" ? " is-loading" : "",
    headerActions = renderHeaderActions(),
    panelTitle = renderPanelTitle(),
    widthOverride = expandedWidthOverride(),
    widthStyle =
      widthOverride !== null
        ? ` style="width:${Math.round(widthOverride)}px; min-width:${Math.round(widthOverride)}px; max-width:${Math.round(widthOverride)}px;"`
        : "";
  (panelLayer.innerHTML = `
    <div
      class="panel-shell"
      style="left:${panelCoords.left}px; top:${panelCoords.top}px;"
    >
      <div
        class="panel${systemClass}${enterClass}${expandClass}${glowClass}"${widthStyle}
        role="dialog"
        aria-modal="false"
        aria-label="Image prompt analysis"
      >
        <div class="ring-glow" aria-hidden="true"></div>
        <div class="glass-pill"></div>
        <div class="panel-inner">
          <div class="header${loadingClass}" data-drag-handle="true">
            <div class="header-copy">
              <div class="eyebrow">${escapeHtml(EXTENSION_TITLE)}</div>
              <div class="title-row${panelState.status === "success" ? " has-screenshot-notice" : ""}">
                ${panelTitle}
              </div>
            </div>
            <div class="header-actions">
              ${headerActions.top}
              ${headerActions.secondary}
            </div>
          </div>
          ${bodyHtml}
          ${
            panelState.status === "success"
              ? `<div class="footer${enterClass}">
            ${languageToggleHtml}
            <button type="button" class="primary-button" data-action="copy">${copyLabel}</button>
          </div>`
              : ""
          }
        </div>
      </div>
      ${historyRailHtml}
    </div>
  `),
    bindPanelEvents(),
    window.requestAnimationFrame(() => {
      expandedPanelWidth === null ? rememberExpandedPanelWidth() : applyExpandedPanelWidth(),
        syncPanelPosition(),
        panelPosition || (panelPosition = { ...panelCoords }),
        syncHistoryRailHeight(),
        isEnteringResult && animateResultEntry(),
        shouldAnimateHistoryRail && animateHistoryRailEntry(),
        pendingHistoryScrollTop !== null ? preserveHistoryScroll(pendingHistoryScrollTop) : restoreHistoryScroll(),
        pendingPromptEditorScroll !== null && preservePromptEditorScroll(pendingPromptEditorScroll),
        panelState.status === "setup" && focusFirstMissingApiField();
    }),
    (panelTransitionMode = null);
}
