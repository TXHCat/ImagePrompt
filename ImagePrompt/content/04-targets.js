// ImagePrompt content module: targets

function clamp(rawNumber, minValue, maxValue) {
  return maxValue < minValue ? minValue : Math.min(Math.max(rawNumber, minValue), maxValue);
}
function isPinterestHost() {
  const host = window.location.hostname.toLowerCase();
  return host === "pin.it" || /(^|\.)pinterest\./i.test(host);
}
function isPinterestPinMainImage(rect) {
  if (!isPinterestHost() || !/\/pin\//i.test(window.location.pathname)) return !1;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1,
    viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1,
    minMainWidth = Math.min(420, viewportWidth * 0.32),
    minMainHeight = Math.min(520, viewportHeight * 0.45);
  return rect.width >= minMainWidth && rect.height >= minMainHeight;
}
function loadingStatusText() {
  return loadingProgress < 36
    ? loadingMessages[0]
    : loadingProgress < 71
      ? loadingMessages[1]
      : loadingMessages[2];
}
function loadingProgressVelocity(progress) {
  return progress < 36 ? 20 : progress < 71 ? 12 : progress < 88 ? 4.5 : 1.8;
}
function renderLoadingProgress() {
  if (panelState.status !== "loading" || !panelLayer) return;
  const progressBar = panelLayer.querySelector(".progress-bar");
  progressBar && (progressBar.style.width = `${loadingProgress.toFixed(1)}%`);
  const progressValue = panelLayer.querySelector(".progress-value");
  progressValue && (progressValue.textContent = `${Math.round(loadingProgress)}%`);
  const loadingStatus = panelLayer.querySelector(".loading-status");
  loadingStatus && (loadingStatus.textContent = `${loadingStatusText()}...`);
}
function tickLoadingProgress(now) {
  if (panelState.status !== "loading") {
    stopLoadingProgress();
    return;
  }
  loadingProgressLastTime === null && (loadingProgressLastTime = now);
  const elapsedSeconds = Math.min((now - loadingProgressLastTime) / 1e3, 0.05);
  (loadingProgressLastTime = now),
    (loadingProgress = Math.min(92, loadingProgress + loadingProgressVelocity(loadingProgress) * elapsedSeconds)),
    renderLoadingProgress(),
    (loadingProgressFrame = window.requestAnimationFrame(tickLoadingProgress));
}
function startLoadingProgress() {
  stopLoadingProgress(),
    (loadingProgress = 12),
    (loadingStartedAt = performance.now()),
    (loadingProgressLastTime = null),
    (loadingProgressFrame = window.requestAnimationFrame(tickLoadingProgress));
}
function stopLoadingProgress(finalProgress) {
  typeof finalProgress == "number" && (loadingProgress = finalProgress),
    loadingProgressFrame !== null && (window.cancelAnimationFrame(loadingProgressFrame), (loadingProgressFrame = null)),
    (loadingProgressLastTime = null),
    (loadingStartedAt = null);
}
async function animateLoadingProgressTo(targetProgress, durationMs) {
  const startProgress = loadingProgress,
    endProgress = Math.max(startProgress, targetProgress);
  await new Promise((resolve) => {
    const startedAt = performance.now(),
      tick = (now) => {
        if (panelState.status !== "loading") {
          (loadingProgressFrame = null), resolve();
          return;
        }
        const progressRatio = Math.min(1, (now - startedAt) / durationMs);
        if (((loadingProgress = startProgress + (endProgress - startProgress) * progressRatio), renderLoadingProgress(), progressRatio >= 1)) {
          (loadingProgressFrame = null), resolve();
          return;
        }
        loadingProgressFrame = window.requestAnimationFrame(tick);
      };
    loadingProgressFrame = window.requestAnimationFrame(tick);
  });
}
async function finishLoadingProgress() {
  if (panelState.status !== "loading") {
    stopLoadingProgress(100);
    return;
  }
  const minimumLoadingMs = 1200,
    stepPauseMs = 170,
    finalAnimationMs = 260,
    finalHoldMs = 120,
    startedAt = loadingStartedAt ?? performance.now(),
    elapsedMs = performance.now() - startedAt;
  if (
    (elapsedMs < minimumLoadingMs &&
      (await new Promise((resolve) => {
        window.setTimeout(() => resolve(), minimumLoadingMs - elapsedMs);
      })),
    panelState.status !== "loading")
  ) {
    stopLoadingProgress(100);
    return;
  }
  loadingProgressFrame !== null && (window.cancelAnimationFrame(loadingProgressFrame), (loadingProgressFrame = null)),
    (loadingProgressLastTime = null),
    loadingProgress < 36 &&
      (await animateLoadingProgressTo(38, 180),
      panelState.status === "loading" &&
        (await new Promise((resolve) => {
          window.setTimeout(() => resolve(), stepPauseMs);
        }))),
    panelState.status === "loading" &&
      loadingProgress < 71 &&
      (await animateLoadingProgressTo(73, 210),
      panelState.status === "loading" &&
        (await new Promise((resolve) => {
          window.setTimeout(() => resolve(), stepPauseMs);
        }))),
    panelState.status === "loading" && (await animateLoadingProgressTo(100, finalAnimationMs)),
    panelState.status === "loading" &&
      ((loadingProgress = 100),
      renderLoadingProgress(),
      await new Promise((resolve) => {
        window.setTimeout(() => resolve(), finalHoldMs);
      })),
    stopLoadingProgress(100);
}
function isImageElement(element) {
  return element instanceof HTMLImageElement;
}
function resolveUrl(rawUrl) {
  const cleanUrl = rawUrl.trim();
  if (!cleanUrl) return null;
  try {
    return new URL(cleanUrl, window.location.href).href;
  } catch {
    return cleanUrl;
  }
}
function backgroundImageUrl(backgroundImage) {
  const urlMatch = backgroundImage.match(/url\((['"]?)(.*?)\1\)/i);
  return urlMatch?.[2] ? resolveUrl(urlMatch[2]) : null;
}
function closestImageElement(element, point) {
  if (!element || !(element instanceof Element)) return null;
  if (isImageElement(element)) return element;
  if (point) return null;
  const closestImage = element.closest("img");
  return isImageElement(closestImage) ? closestImage : null;
}
function elementSearchText(element) {
  return element instanceof HTMLImageElement
    ? [
        element.alt,
        element.currentSrc,
        element.src,
        element.id,
        typeof element.className == "string" ? element.className : "",
        element.getAttribute("aria-label") ?? "",
        element.getAttribute("data-testid") ?? "",
      ]
        .join(" ")
        .toLowerCase()
    : [
        element.id,
        typeof element.className == "string" ? element.className : "",
        element.getAttribute("aria-label") ?? "",
        element.getAttribute("title") ?? "",
        element.getAttribute("data-title") ?? "",
        element.getAttribute("data-testid") ?? "",
        element.getAttribute("role") ?? "",
      ]
        .join(" ")
        .toLowerCase();
}
function ancestorSearchText(element, maxDepth = 4) {
  const textParts = [];
  let currentElement = element,
    depth = 0;
  for (; currentElement && depth <= maxDepth; ) {
    const attributeText = [
        currentElement.getAttribute("aria-label") ?? "",
        currentElement.getAttribute("title") ?? "",
        currentElement.getAttribute("data-title") ?? "",
        currentElement.getAttribute("data-testid") ?? "",
      ].join(" "),
      nodeText = currentElement.textContent ?? "",
      combinedText = `${attributeText} ${nodeText}`.replace(/\s+/g, " ").trim();
    combinedText && textParts.push(combinedText.slice(0, 500)), (currentElement = currentElement.parentElement), (depth += 1);
  }
  return textParts.join(" ").toLowerCase();
}
function isQrLikeImage(element, searchText, rect) {
  const longSide = Math.max(rect.width, rect.height),
    shortSide = Math.min(rect.width, rect.height),
    aspectRatio = longSide / Math.max(1, shortSide);
  if (shortSide < 120 || aspectRatio > 1.18) return !1;
  const ancestorText = ancestorSearchText(element),
    fileNamePattern =
      /(^|[\s/_:.-])(qr|qrcode|qr-code|barcode|scan-code|login-code)([\s/_:.-]|$)/i,
    surroundingTextPattern =
      /二维码|扫码|扫一扫|扫描登录|手机扫码|qr\s*code|qrcode|scan\s+(with|to|code)|scan.*login|mobile.*scan/i;
  return fileNamePattern.test(searchText) || surroundingTextPattern.test(ancestorText);
}
function targetFromImageElement(imageElement) {
  const imageSrc = imageElement.currentSrc || imageElement.src;
  return imageSrc
    ? {
        src: imageSrc,
        alt: imageElement.alt || void 0,
        pageUrl: window.location.href,
        naturalWidth: imageElement.naturalWidth || void 0,
        naturalHeight: imageElement.naturalHeight || void 0,
      }
    : null;
}
function targetFromBackgroundElement(element) {
  const backgroundImage = window.getComputedStyle(element).backgroundImage;
  if (!backgroundImage || backgroundImage === "none") return null;
  const imageSrc = backgroundImageUrl(backgroundImage);
  if (!imageSrc) return null;
  const rect = element.getBoundingClientRect(),
    altText =
      element.getAttribute("aria-label") ||
      element.getAttribute("title") ||
      element.getAttribute("data-title") ||
      void 0;
  return {
    src: imageSrc,
    alt: altText || void 0,
    pageUrl: window.location.href,
    naturalWidth: rect.width > 0 ? Math.round(rect.width) : void 0,
    naturalHeight: rect.height > 0 ? Math.round(rect.height) : void 0,
  };
}
function isFloatingUiElement(element) {
  return !!element.closest(
    [
      "[role='menu']",
      "[role='menubar']",
      "[role='menuitem']",
      "[role='listbox']",
      "[role='option']",
      "[role='combobox']",
      "[role='tooltip']",
      "[popover]",
      "[data-radix-popper-content-wrapper]",
      "[data-popper-placement]",
      "[data-floating-ui-portal]",
      "[data-headlessui-portal]",
      ".ant-select-dropdown",
      ".MuiPopover-root",
      ".MuiMenu-root",
    ].join(","),
  );
}
function resolveImageTarget(element, point) {
  const hitElements =
      point && typeof document.elementsFromPoint == "function"
        ? document.elementsFromPoint(point.x, point.y)
        : [],
    candidateElements = [],
    seenElements = new Set(),
    isInsideExtensionUi = (candidateElement) => !!candidateElement.closest("#imagetoprompt-root");
  if (hitElements.some((hitElement) => !isInsideExtensionUi(hitElement) && isFloatingUiElement(hitElement)))
    return { element: null, target: null, point: point };
  if (element instanceof Element && !isInsideExtensionUi(element)) {
    candidateElements.push(element);
    seenElements.add(element);
  }
  hitElements.forEach((hitElement) => {
    if (isInsideExtensionUi(hitElement) || seenElements.has(hitElement)) return;
    candidateElements.push(hitElement);
    seenElements.add(hitElement);
  });
  for (const candidateElement of candidateElements) {
    const imageElement = closestImageElement(candidateElement, point);
    if (imageElement) return { element: imageElement, target: targetFromImageElement(imageElement), point: point };
    const backgroundTarget = targetFromBackgroundElement(candidateElement);
    if (backgroundTarget) return { element: candidateElement, target: backgroundTarget, point: point };
  }
  return { element: null, target: null, point: point };
}
function isUsableImageElement(imageElement) {
  if (isFloatingUiElement(imageElement)) return !1;
  const rect = imageElement.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return !1;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1,
    viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1,
    viewportArea = viewportWidth * viewportHeight;
  if (
    (rect.width >= viewportWidth * 0.72 && rect.height >= viewportHeight * 0.72) ||
    rect.width * rect.height >= viewportArea * 0.68
  )
    return !1;
  const searchText = elementSearchText(imageElement),
    longSide = Math.max(rect.width, rect.height),
    shortSide = Math.min(rect.width, rect.height),
    imageArea = rect.width * rect.height,
    aspectRatio = longSide / Math.max(1, shortSide),
    isIconLike =
      /(^|[\s/_-])(icon|logo|avatar|emoji|favicon|badge|sprite|sticker)([\s/_-]|$)/.test(
        searchText,
      ) ||
      longSide <= 42 ||
      (longSide <= 64 && aspectRatio <= 1.45) ||
      (longSide <= 84 && shortSide <= 64 && aspectRatio <= 1.35),
    isTooSmall = shortSide < 104 || imageArea < 14e3;
  return isIconLike || isTooSmall || isQrLikeImage(imageElement, searchText, rect) ? !1 : rect.width >= 112 && rect.height >= 112;
}
function inlineMenuScaleForImage(imageElement) {
  const rect = imageElement.getBoundingClientRect(),
    shortestSide = Math.min(rect.width, rect.height);
  return shortestSide <= 96 ? 0.76 : shortestSide <= 128 ? 0.84 : shortestSide <= 168 ? 0.92 : 1;
}
function clearHoverHideTimer() {
  hoverHideTimer !== null && (window.clearTimeout(hoverHideTimer), (hoverHideTimer = null));
}
function clearToastHideTimer() {
  toastHideTimer !== null && (window.clearTimeout(toastHideTimer), (toastHideTimer = null));
}
function clearInlineMenuRepositionTimers() {
  inlineMenuRepositionTimers.forEach((timerId) => {
    window.clearTimeout(timerId);
  }),
    (inlineMenuRepositionTimers = []);
}
function scheduleInlineMenuReposition(element, targetSrc) {
  clearInlineMenuRepositionTimers(),
    [90, 220].forEach((delayMs) => {
      const timerId = window.setTimeout(() => {
        (inlineMenuRepositionTimers = inlineMenuRepositionTimers.filter((storedTimerId) => storedTimerId !== timerId)),
          extensionEnabled && (hoveredElement !== element || hoveredTarget?.src !== targetSrc || positionInlineActionMenu());
      }, delayMs);
      inlineMenuRepositionTimers.push(timerId);
    });
}
function inlineActionStatus(src) {
  return inlineActionStatusBySrc.get(src) ?? { promptStatus: "idle", saveStatus: "idle" };
}
async function loadInlineOnboardingState() {
  try {
    isInlineOnboardingComplete =
      (await chrome.storage.local.get(ONBOARDING_STORAGE_KEY))[
        ONBOARDING_STORAGE_KEY
      ] === !0;
  } catch {
    isInlineOnboardingComplete = !1;
  } finally {
    hasLoadedInlineOnboarding = !0;
  }
}
async function hasCompletedInlineOnboarding() {
  return hasLoadedInlineOnboarding || (await loadInlineOnboardingState()), isInlineOnboardingComplete;
}
async function markInlineOnboardingComplete() {
  (isInlineOnboardingComplete = !0),
    (hasLoadedInlineOnboarding = !0),
    await chrome.storage.local.set({ [ONBOARDING_STORAGE_KEY]: !0 });
}
function renderInlineActionMenu() {
  if (!inlineActionLayer) return;
  if (!extensionEnabled || !inlineActionsEnabled || isBlockedPage()) {
    inlineActionLayer.innerHTML = "";
    return;
  }
  const target = hoveredTarget,
    element = hoveredElement,
    canRenderMenu = !!(target && element && isUsableImageElement(element)),
    status = target ? inlineActionStatus(target.src) : null,
    scale = element ? inlineMenuScaleForImage(element) : 1,
    promptLabel =
      status?.promptStatus === "loading"
        ? localizedText.promptLoading
        : localizedText.promptAction;
  inlineActionLayer.innerHTML = canRenderMenu
    ? `
      <div class="image-action-menu" aria-label="${localizedText.actionMenuLabel}" style="--image-action-scale:${scale.toFixed(3)};">
        <button
          type="button"
          class="image-action-button${status?.promptStatus === "loading" ? " is-disabled" : ""}"
          data-inline-action="prompt"
          ${status?.promptStatus === "loading" ? "disabled" : ""}
        >${promptLabel}</button>
        <button
          type="button"
          class="image-action-button"
          data-inline-action="open"
        >${localizedText.openAction}</button>
      </div>
    `
    : "";
  const menu = inlineActionLayer.querySelector(".image-action-menu");
  menu &&
    ((menu.onpointerenter = () => {
      (isInlineMenuHovered = !0), clearHoverHideTimer();
    }),
    (menu.onpointerleave = () => {
      (isInlineMenuHovered = !1), scheduleHoverClear();
    }),
    menu.querySelectorAll("[data-inline-action]").forEach((button) => {
      button.onclick = async (clickEvent) => {
        if ((clickEvent.preventDefault(), clickEvent.stopPropagation(), !hoveredTarget || !hoveredElement)) return;
        const action = button.dataset.inlineAction;
        if (action === "prompt") {
          await analyzeHoveredImage();
          return;
        }
        action === "open" && (await openLatestOrAnalyzeHoveredImage());
      };
    })),
    positionInlineActionMenu();
}
function renderToast() {
  if (toastLayer) {
    if (!extensionEnabled || !toastState || isBlockedPage()) {
      toastLayer.innerHTML = "";
      return;
    }
    toastLayer.innerHTML = `
    <div class="image-action-toast${toastState.tone === "error" ? " is-error" : ""}">
      ${escapeHtml(toastState.message)}
    </div>
  `;
  }
}
function updateInlineActionStatus(src, patch) {
  const status = inlineActionStatus(src);
  inlineActionStatusBySrc.set(src, { ...status, ...patch }), hoveredTarget?.src === src && renderInlineActionMenu();
}
function showToast(message, tone) {
  if (isBlockedPage()) return;
  const toastKey = `${tone}:${message}`,
    now = Date.now();
  if ((clearToastHideTimer(), toastState && lastToastKey === toastKey && now - lastToastAt < 900)) {
    toastHideTimer = window.setTimeout(() => {
      (toastState = null), (lastToastKey = ""), (toastHideTimer = null), renderToast();
    }, 2200);
    return;
  }
  (lastToastKey = toastKey),
    (lastToastAt = now),
    (toastState = { message: message, tone: tone }),
    renderToast(),
    (toastHideTimer = window.setTimeout(() => {
      (toastState = null), (lastToastKey = ""), (toastHideTimer = null), renderToast();
    }, 2200));
}
function clearHoveredTarget() {
  clearHoverHideTimer(), clearInlineMenuRepositionTimers(), (hoveredElement = null), (hoveredTarget = null), (hoverPoint = null), (isInlineMenuHovered = !1), renderInlineActionMenu();
}
function suppressHoverFor(durationMs = 900) {
  suppressHoverUntil = Date.now() + durationMs;
}
function isHoverSuppressed() {
  return Date.now() < suppressHoverUntil;
}
function scheduleHoverClear() {
  clearHoverHideTimer(),
    (hoverHideTimer = window.setTimeout(() => {
      isInlineMenuHovered || clearHoveredTarget();
    }, 120));
}
function setHoveredTarget(element, target, point) {
  clearHoverHideTimer();
  const targetChanged = hoveredElement !== element || hoveredTarget?.src !== target.src;
  if (((hoveredElement = element), (hoveredTarget = target), (hoverPoint = point), targetChanged)) {
    renderInlineActionMenu(), scheduleInlineMenuReposition(element, target.src);
    return;
  }
  positionInlineActionMenu();
}
