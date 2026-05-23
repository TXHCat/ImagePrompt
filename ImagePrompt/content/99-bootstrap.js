// ImagePrompt content module: bootstrap

function handlePointerMove(event) {
  if (isBlockedPage()) {
    clearHoveredTarget();
    return;
  }
  if (!extensionEnabled || !inlineActionsEnabled) {
    clearHoveredTarget();
    return;
  }
  if (event.pointerType === "touch") {
    clearHoveredTarget();
    return;
  }
  const targetElement = event.target;
  if (targetElement instanceof Element && targetElement.closest("#imagetoprompt-root")) {
    clearHoverHideTimer();
    return;
  }
  const point = { x: event.clientX, y: event.clientY };
  if (((hoverPoint = point), isInlineMenuHovered)) return;
  const resolvedTarget = resolveImageTarget(event.target, point);
  if (recentlyClosedHoverSrc)
    if (!resolvedTarget.target || resolvedTarget.target.src !== recentlyClosedHoverSrc) recentlyClosedHoverSrc = null;
    else {
      scheduleHoverClear();
      return;
    }
  if (!resolvedTarget.element || !resolvedTarget.target || !isUsableImageElement(resolvedTarget.element)) {
    scheduleHoverClear();
    return;
  }
  ensureContentRoot(), setHoveredTarget(resolvedTarget.element, resolvedTarget.target, point);
}
function handlePointerLeave() {
  isInlineMenuHovered || scheduleHoverClear();
}
function handleViewportChange() {
  updateRootViewportVars(),
    panelState.status !== "hidden" && (applyExpandedPanelWidth(), syncPanelPosition(), syncHistoryRailHeight()),
    positionInlineActionMenu();
}
function handleUrlChange() {
  if (!isTopFrame) return;
  const currentUrl = window.location.href;
  currentUrl !== lastObservedUrl &&
    ((lastObservedUrl = currentUrl),
    urlChangeTimer !== null && window.clearTimeout(urlChangeTimer),
    (urlChangeTimer = window.setTimeout(() => {
      (urlChangeTimer = null), refreshHistoryState({ resetSelection: !0 });
    }, URL_CHANGE_DEBOUNCE_MS)));
}
function installUrlChangeListeners() {
  const wrapHistoryMethod = (methodName) => {
    const originalMethod = window.history[methodName];
    window.history[methodName] = function (...args) {
      const result = originalMethod.apply(this, args);
      return handleUrlChange(), result;
    };
  };
  wrapHistoryMethod("pushState"),
    wrapHistoryMethod("replaceState"),
    window.addEventListener("popstate", handleUrlChange),
    window.addEventListener("hashchange", handleUrlChange),
    window.addEventListener("focus", handleUrlChange),
    document.addEventListener("visibilitychange", () => {
      document.visibilityState === "visible" && handleUrlChange();
    });
}
if (!globalThis.__imagetopromptV2Loaded__) {
  globalThis.__imagetopromptV2Loaded__ = true;
  if (isBlockedByHost()) {
    teardownContentUi();
  } else {
    document.addEventListener(
      "contextmenu",
      (event) => {
        lastResolvedTarget = resolveImageTarget(event.target, {
          x: event.clientX,
          y: event.clientY,
        });
      },
      !0,
    ),
      document.addEventListener("pointermove", handlePointerMove, !0),
      document.addEventListener("pointerleave", handlePointerLeave, !0),
      document.addEventListener("keydown", handleHistoryCopyShortcut, !0),
      document.addEventListener(
        "pointerdown",
        (event) => {
          const targetElement = event.target;
          !(
            targetElement instanceof Element &&
            (targetElement.closest("#imagetoprompt-root") ||
              targetElement.closest("[data-inline-action]"))
          ) &&
            (isInlineMenuHovered || scheduleHoverClear());
        },
        !0,
      ),
      window.addEventListener("scroll", handleViewportChange, !0),
      window.addEventListener("resize", handleViewportChange),
      window.visualViewport?.addEventListener("resize", handleViewportChange),
      window.visualViewport?.addEventListener("scroll", handleViewportChange),
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) =>
        message.type === "OPEN_PANEL"
          ? ((async () => {
              try {
                await openAnalysisPanel(
                  message.payload?.srcUrl,
                  message.payload?.preferLatest === !0,
                  message.payload?.autoSaveToHistory ||
                    message.payload?.analyzeCurrentPage ||
                    message.payload?.centerPanel
                    ? {
                        autoSaveToHistory: message.payload?.autoSaveToHistory === !0,
                        analyzeCurrentPage:
                          message.payload?.analyzeCurrentPage === !0,
                        centerPanel: message.payload?.centerPanel === !0,
                      }
                    : void 0,
                ),
                  sendResponse({ ok: !0, data: { opened: !0 } });
              } catch (error) {
                sendResponse({
                  ok: !1,
                  error:
                    error instanceof Error
                      ? error.message
                      : "Save failed. Please try again.",
                });
              }
            })(),
            !0)
          : !1,
      ),
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "sync") {
          if (
            Object.prototype.hasOwnProperty.call(changes, "systemLanguage") ||
            Object.prototype.hasOwnProperty.call(changes, "defaultLanguage")
          ) {
            const nextLanguage = normalizeLanguage(
              changes.systemLanguage?.newValue ?? changes.defaultLanguage?.newValue,
            );
            setContentLanguage(nextLanguage);
          }
          if (Object.prototype.hasOwnProperty.call(changes, EXTENSION_ENABLED_STORAGE_KEY)) {
            const nextEnabled = changes[EXTENSION_ENABLED_STORAGE_KEY]?.newValue;
            applyExtensionEnabled(typeof nextEnabled == "boolean" ? nextEnabled : !0);
          }
          return;
        }
        if (areaName === "local") {
          if (Object.prototype.hasOwnProperty.call(changes, EXTENSION_ENABLED_STORAGE_KEY)) {
            const nextEnabled = changes[EXTENSION_ENABLED_STORAGE_KEY]?.newValue;
            applyExtensionEnabled(typeof nextEnabled == "boolean" ? nextEnabled : !0);
          }
          if (
            (Object.prototype.hasOwnProperty.call(changes, ONBOARDING_STORAGE_KEY) &&
              ((isInlineOnboardingComplete = changes[ONBOARDING_STORAGE_KEY]?.newValue === !0), (hasLoadedInlineOnboarding = !0)),
            Object.prototype.hasOwnProperty.call(changes, "apiEnabled") &&
              panelState.status !== "hidden" &&
              renderPanel(),
            Object.prototype.hasOwnProperty.call(changes, PANEL_SESSION_KEY))
          ) {
            const previousSession = normalizePanelSession(changes[PANEL_SESSION_KEY]?.oldValue),
              nextSession = normalizePanelSession(changes[PANEL_SESSION_KEY]?.newValue);
            if ((applyPanelSession(nextSession), isTopFrame)) {
              if ((renderInlineActionMenu(), panelState.status !== "hidden")) {
                if (nextSession.mode === "hidden") {
                  resetPanelState({ preserveSessionMode: !0 });
                  return;
                }
                syncPanelPosition(), scheduleHistoryRailHeightSync();
                return;
              }
              if (hasSamePanelSessionMode(previousSession, nextSession)) return;
              restoreSharedPanel();
            } else
              panelState.status !== "hidden" && resetPanelState({ preserveSessionMode: !1 });
          }
          if (
            isTopFrame &&
            Object.prototype.hasOwnProperty.call(changes, LATEST_ANALYSIS_STORAGE_KEY) &&
            panelMode !== "hidden"
          ) {
            if (isEditingPrompt()) return;
            restoreSharedPanel();
          }
        }
      }),
      (async () => (
        installUrlChangeListeners(),
        await ensureContentLanguage(),
        await Promise.all([loadExtensionEnabled(), loadInlineOnboardingState()])
      ))();
  }
}
