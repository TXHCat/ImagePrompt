// ImagePrompt content module: screenshot and sharing

function clearCopyGlowTimer() {
  copyGlowTimer !== null && (window.clearTimeout(copyGlowTimer), (copyGlowTimer = null));
}
function flashCopyGlow(options) {
  clearCopyGlowTimer(),
    (isCopyGlowActive = !0),
    options?.renderImmediately !== !1 &&
      (captureHistoryScroll(), capturePromptEditorScroll(), renderPanel()),
    (copyGlowTimer = window.setTimeout(() => {
      (copyGlowTimer = null),
        (isCopyGlowActive = !1),
        captureHistoryScroll(),
        capturePromptEditorScroll(),
        renderPanel();
    }, 1100));
}
function resetPanelState(options) {
  removeShareCardOverlay(),
    (panelState = {
      status: "hidden",
      language: activeLanguage,
      analysis: null,
      error: "",
      errorCode: null,
      errorAction: null,
      copied: !1,
    }),
    clearCopyGlowTimer(),
    removeHistoryFlyover(),
    (isCopyGlowActive = !1),
    clearHistoryRailEnter(),
    (historyRailOpen = !1),
    (pendingAnalysisRequest = null),
    (setupState = {
      baseUrl: "",
      apiKey: "",
      model: "",
      apiEnabled: !0,
      error: "",
      isSaving: !1,
      manualResult: "",
    }),
    (pendingHistoryId = null),
    (preloadedHistoryIds = new Set()),
    (selectedHistoryId = null),
    clearPromptDrafts(),
    (panelAnchor = null),
    (currentTarget = null),
    (targetPoint = null),
    (panelPosition = null),
    (expandedPanelWidth = null),
    options?.preserveSessionMode || (panelMode = "hidden"),
    clearPanelDrag(),
    stopLoadingProgress(),
    resetPromptDraftAnimation(""),
    clearResultEntry(),
    renderPanel();
}
function updatePanelState(patch) {
  (panelState = { ...panelState, ...patch }), renderPanel();
}
function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? !1;
}
function animatePanelModeExit(mode) {
  const panel = panelLayer?.querySelector(".panel");
  return !panel || prefersReducedMotion() || mode === "expand"
    ? Promise.resolve()
    : (panel.classList.remove("mode-expand", "mode-collapse"),
      panel.classList.add(
        mode === "collapse" ? "mode-exit-collapse" : "mode-exit-expand",
      ),
      new Promise((resolve) => {
        let finished = !1;
        const finish = () => {
            finished ||
              ((finished = !0),
              panel.removeEventListener("animationend", finish),
              window.clearTimeout(timeoutId),
              resolve());
          },
          timeoutId = window.setTimeout(finish, 130);
        panel.addEventListener("animationend", finish);
      }));
}
function animateHistoryRailExit() {
  const historyRail = historyRailElement();
  if (!historyRail || prefersReducedMotion()) return Promise.resolve();
  historyRail.classList.remove("is-entering", "is-exiting"),
    historyRail.getAnimations().forEach((animation) => {
      animation.cancel();
    }),
    (historyRail.style.transformOrigin = "left center"),
    (historyRail.style.willChange = "transform, clip-path, opacity");
  const animation = historyRail.animate(
    [
      {
        opacity: 1,
        transform: "scaleX(1)",
        clipPath: "inset(0 0 0 0 round 28px)",
        offset: 0,
      },
      {
        opacity: 1,
        transform: "scaleX(1.025)",
        clipPath: "inset(0 0 0 0 round 28px)",
        offset: 0.34,
      },
      {
        opacity: 0,
        transform: "scaleX(0.68)",
        clipPath: "inset(0 52% 0 0 round 28px)",
        offset: 1,
      },
    ],
    { duration: 320, easing: "cubic-bezier(0.4, 0, 0.18, 1)", fill: "both" },
  );
  return new Promise((resolve) => {
    let finished = !1;
    const finish = () => {
        finished || ((finished = !0), (historyRail.style.willChange = ""), window.clearTimeout(timeoutId), resolve());
      },
      timeoutId = window.setTimeout(finish, 380);
    animation.finished.then(finish).catch(finish);
  });
}
async function copyPromptToClipboard() {
  const promptText = currentPromptText();
  promptText &&
    (await copyTextToClipboard(promptText),
    captureHistoryScroll(),
    capturePromptEditorScroll(),
    flashCopyGlow({ renderImmediately: !1 }),
    updatePanelState({ copied: !0 }));
}
function shareCardLanguage() {
  return panelState.language === "zh" ? panelState.language : "en";
}
function shareCardPrompt() {
  return panelState.analysis ? promptForLanguage(panelState.analysis, shareCardLanguage()).trim() : "";
}
function shareCardTags() {
  return panelState.analysis
    ? (panelState.analysis.styleTags[shareCardLanguage()] ?? []).filter(Boolean).slice(0, 4)
    : [];
}
function roundedRectPath(canvasContext, left, top, width, height, radius) {
  const cornerRadius = Math.min(radius, width / 2, height / 2);
  canvasContext.beginPath();
  canvasContext.moveTo(left + cornerRadius, top);
  canvasContext.lineTo(left + width - cornerRadius, top);
  canvasContext.quadraticCurveTo(left + width, top, left + width, top + cornerRadius);
  canvasContext.lineTo(left + width, top + height - cornerRadius);
  canvasContext.quadraticCurveTo(left + width, top + height, left + width - cornerRadius, top + height);
  canvasContext.lineTo(left + cornerRadius, top + height);
  canvasContext.quadraticCurveTo(left, top + height, left, top + height - cornerRadius);
  canvasContext.lineTo(left, top + cornerRadius);
  canvasContext.quadraticCurveTo(left, top, left + cornerRadius, top);
  canvasContext.closePath();
}
function drawImageCover(canvasContext, image, left, top, width, height) {
  const sourceAspectRatio = image.naturalWidth / image.naturalHeight,
    targetAspectRatio = width / height;
  let sourceX = 0,
    sourceY = 0,
    sourceWidth = image.naturalWidth,
    sourceHeight = image.naturalHeight;
  if (sourceAspectRatio > targetAspectRatio) {
    sourceWidth = image.naturalHeight * targetAspectRatio;
    sourceX = (image.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight = image.naturalWidth / targetAspectRatio;
    sourceY = (image.naturalHeight - sourceHeight) / 2;
  }
  canvasContext.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, left, top, width, height);
}
function tokenizeSharePrompt(promptText) {
  return (
    collapseWhitespace(promptText)
      .slice(0, 1800)
      .match(
        /[\u3040-\u30ff\u3400-\u9fff]|[^\s\u3040-\u30ff\u3400-\u9fff]+/g,
      ) ?? []
  );
}
function appendPromptToken(currentText, nextToken) {
  if (!currentText) return nextToken;
  const shouldJoinWithoutSpace =
    /^[\u3040-\u30ff\u3400-\u9fff]/.test(nextToken) ||
    /[\u3040-\u30ff\u3400-\u9fff]$/.test(currentText);
  return shouldJoinWithoutSpace ? `${currentText}${nextToken}` : `${currentText} ${nextToken}`;
}
function wrapCanvasText(canvasContext, promptText, maxWidth, maxLines) {
  const tokens = tokenizeSharePrompt(promptText),
    lines = [];
  let currentLine = "";
  for (const token of tokens) {
    const candidateLine = appendPromptToken(currentLine, token);
    if (canvasContext.measureText(candidateLine).width <= maxWidth) {
      currentLine = candidateLine;
      continue;
    }
    if (currentLine) {
      lines.push(currentLine);
      currentLine = token;
    } else {
      lines.push(token);
      currentLine = "";
    }
    if (lines.length >= maxLines)
      break;
  }
  if (
    (currentLine && lines.length < maxLines && lines.push(currentLine),
    lines.length === maxLines && tokens.length > tokenizeSharePrompt(lines.join("")).length)
  ) {
    let finalLine = lines[maxLines - 1] ?? "";
    while (finalLine.length > 0 && canvasContext.measureText(`${finalLine}...`).width > maxWidth) {
      finalLine = finalLine.slice(0, -1).trim();
    }
    lines[maxLines - 1] = `${finalLine}...`;
  }
  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    if (/^[。！？.!?,，、；;：:]/.test(lines[lineIndex] ?? "")) {
      lines[lineIndex - 1] = `${lines[lineIndex - 1]}${lines[lineIndex]}`;
      lines.splice(lineIndex, 1);
      lineIndex -= 1;
    }
  }
  return lines;
}
function loadImageForCanvas(imageUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    (image.onload = () => resolve(image)),
      (image.onerror = () => reject(new Error("Could not load image for share card."))),
      (image.src = imageUrl);
  });
}
async function fetchImagePayload(target) {
  const response = await chrome.runtime.sendMessage({
    type: "FETCH_CLIPBOARD_IMAGE",
    payload: { target: target },
  });
  if (!response?.ok || !response.data)
    throw new Error(
      response && !response.ok ? response.error : "Could not prepare image for share card.",
    );
  return response.data;
}
function fitTagChips(canvasContext, tags, maxWidth, initialFontSize, gap) {
  for (let fontSize = initialFontSize; fontSize >= 16; fontSize -= 1) {
    canvasContext.font = `400 ${fontSize}px Inter, Arial, sans-serif`;
    const visibleTags = [],
      tagWidths = [];
    let usedWidth = 0;
    for (const tag of tags) {
      const tagWidth = Math.ceil(canvasContext.measureText(tag).width + 34),
        nextWidth = usedWidth + (visibleTags.length > 0 ? gap : 0) + tagWidth;
      if (nextWidth > maxWidth) continue;
      visibleTags.push(tag);
      tagWidths.push(tagWidth);
      usedWidth = nextWidth;
      if (visibleTags.length >= 4) break;
    }
    if (visibleTags.length > 0) return { tags: visibleTags, widths: tagWidths, fontSize: fontSize };
  }
  return { tags: [], widths: [], fontSize: 16 };
}
async function renderShareCard(target) {
  const imagePayload = await fetchImagePayload(target),
    imageElement = await loadImageForCanvas(`data:${imagePayload.mimeType};base64,${imagePayload.data}`),
    canvas = document.createElement("canvas"),
    canvasWidth = 1080,
    cardX = 86,
    cardY = 58,
    cardWidth = 908,
    contentX = 146,
    textWidth = 788,
    imageX = 146,
    imageY = 136,
    imageWidth = 788,
    defaultImageHeight = 818,
    minimumImageHeight = 650,
    dividerGap = 22,
    promptTitleGap = 54,
    lineHeight = 27,
    tagGap = 14,
    tags =
      shareCardTags().length > 0
        ? shareCardTags()
        : [
            "cinematic lighting",
            "fashion editorial",
            "low-angle perspective",
            "high detail",
          ];
  canvas.width = canvasWidth;
  const canvasContext = canvas.getContext("2d");
  if (!canvasContext) throw new Error("Could not create share card.");
  canvasContext.font = "400 21px Inter, Arial, sans-serif";
  const measureLayout = (shareItem, shareIndex) => {
    const promptLinesForLayout = wrapCanvasText(canvasContext, shareCardPrompt(), textWidth, shareIndex),
      dividerY = imageY + shareItem + 34,
      promptTitleY = dividerY + dividerGap,
      promptTextY = promptTitleY + promptTitleGap,
      tagY = promptTextY + promptLinesForLayout.length * lineHeight + 30,
      bottomLineY = tagY + 66,
      footerY = bottomLineY + 22,
      cardHeight = footerY - cardY + 52,
      canvasHeight = Math.max(1440, cardY + cardHeight + 64);
    return {
      lines: promptLinesForLayout,
      imageH: shareItem,
      dividerY: dividerY,
      promptTitleY: promptTitleY,
      promptTextY: promptTextY,
      tagY: tagY,
      bottomLineY: bottomLineY,
      footerY: footerY,
      cardH: cardHeight,
      height: canvasHeight,
    };
  };
  let promptFontSize = 15,
    layout = measureLayout(defaultImageHeight, promptFontSize);
  for (
    layout.height > 1620 && (layout = measureLayout(Math.max(minimumImageHeight, defaultImageHeight - (layout.height - 1620)), promptFontSize));
    layout.height > 1680 && promptFontSize > 9;

  )
    (promptFontSize -= 1), (layout = measureLayout(minimumImageHeight, promptFontSize));
  const tagLayout = fitTagChips(canvasContext, tags, textWidth, 21, tagGap),
    {
      lines: promptLines,
      imageH: imageHeight,
      dividerY: dividerY,
      promptTitleY: promptTitleY,
      promptTextY: promptTextY,
      tagY: tagY,
      bottomLineY: bottomLineY,
      footerY: footerBaselineY,
      cardH: cardHeight,
      height: canvasHeight,
    } = layout;
  (canvas.height = canvasHeight),
    canvasContext.save(),
    (canvasContext.filter = "blur(22px) saturate(1.16)"),
    drawImageCover(canvasContext, imageElement, -42, -42, canvasWidth + 84, canvasHeight + 84),
    canvasContext.restore();
  const overlayGradient = canvasContext.createLinearGradient(0, 0, 0, canvasHeight);
  overlayGradient.addColorStop(0, "rgba(0, 0, 0, 0.16)"),
    overlayGradient.addColorStop(0.58, "rgba(0, 0, 0, 0.08)"),
    overlayGradient.addColorStop(1, "rgba(0, 0, 0, 0.24)"),
    (canvasContext.fillStyle = overlayGradient),
    canvasContext.fillRect(0, 0, canvasWidth, canvasHeight),
    roundedRectPath(canvasContext, cardX, cardY, cardWidth, cardHeight, 72);
  const cardGradient = canvasContext.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + cardHeight);
  cardGradient.addColorStop(0, "rgba(255, 255, 255, 0.28)"),
    cardGradient.addColorStop(0.4, "rgba(255, 255, 255, 0.1)"),
    cardGradient.addColorStop(1, "rgba(255, 255, 255, 0.18)"),
    (canvasContext.fillStyle = cardGradient),
    canvasContext.fill(),
    (canvasContext.strokeStyle = "rgba(255, 255, 255, 0.72)"),
    (canvasContext.lineWidth = 2),
    canvasContext.stroke(),
    canvasContext.save(),
    roundedRectPath(canvasContext, cardX + 1, cardY + 1, cardWidth - 2, cardHeight - 2, 72),
    canvasContext.clip();
  const highlightGradient = canvasContext.createRadialGradient(cardX + 130, cardY + 60, 10, cardX + 130, cardY + 60, 520);
  highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.2)"),
    highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)"),
    (canvasContext.fillStyle = highlightGradient),
    canvasContext.fillRect(cardX, cardY, cardWidth, cardHeight),
    canvasContext.restore(),
    (canvasContext.fillStyle = "rgba(248, 251, 255, 0.94)"),
    (canvasContext.textBaseline = "top"),
    (canvasContext.font = "500 26px Inter, Arial, sans-serif"),
    canvasContext.fillText("IMAGEPROMPT", contentX + 14, 90),
    canvasContext.save(),
    roundedRectPath(canvasContext, imageX, imageY, imageWidth, imageHeight, 34),
    canvasContext.clip(),
    drawImageCover(canvasContext, imageElement, imageX, imageY, imageWidth, imageHeight),
    canvasContext.restore(),
    roundedRectPath(canvasContext, imageX, imageY, imageWidth, imageHeight, 34),
    (canvasContext.strokeStyle = "rgba(255, 255, 255, 0.78)"),
    (canvasContext.lineWidth = 2),
    canvasContext.stroke(),
    canvasContext.beginPath(),
    canvasContext.moveTo(contentX, dividerY),
    canvasContext.lineTo(contentX + textWidth, dividerY),
    (canvasContext.strokeStyle = "rgba(255, 255, 255, 0.78)"),
    (canvasContext.lineWidth = 2),
    canvasContext.stroke(),
    (canvasContext.shadowColor = "rgba(0, 0, 0, 0.18)"),
    (canvasContext.shadowBlur = 12),
    (canvasContext.fillStyle = "#ff6a00"),
    (canvasContext.font = "500 40px Inter, Arial, sans-serif"),
    canvasContext.fillText("Prompt", contentX, promptTitleY),
    (canvasContext.shadowBlur = 0),
    (canvasContext.fillStyle = "rgba(255, 255, 255, 0.94)"),
    (canvasContext.font = "400 21px Inter, Arial, sans-serif");
  let promptLineY = promptTextY;
  for (const shareItem of promptLines) canvasContext.fillText(shareItem, contentX, promptLineY), (promptLineY += lineHeight);
  (canvasContext.font = `400 ${tagLayout.fontSize}px Inter, Arial, sans-serif`),
    (canvasContext.textBaseline = "middle");
  let tagCursorX = contentX;
  tagLayout.tags.forEach((shareItem, shareIndex) => {
    const promptLinesForLayout = tagLayout.widths[shareIndex] ?? 160;
    roundedRectPath(canvasContext, tagCursorX, tagY, promptLinesForLayout, 43, 22),
      (canvasContext.fillStyle = "rgba(255, 255, 255, 0.08)"),
      canvasContext.fill(),
      (canvasContext.strokeStyle = "rgba(255, 255, 255, 0.62)"),
      (canvasContext.lineWidth = 1.3),
      canvasContext.stroke(),
      (canvasContext.fillStyle = "rgba(255, 255, 255, 0.92)"),
      canvasContext.fillText(shareItem, tagCursorX + 17, tagY + 21.5),
      (tagCursorX += promptLinesForLayout + tagGap);
  }),
    (canvasContext.textBaseline = "top"),
    canvasContext.beginPath(),
    canvasContext.moveTo(contentX, bottomLineY),
    canvasContext.lineTo(contentX + textWidth, bottomLineY),
    (canvasContext.strokeStyle = "rgba(255, 255, 255, 0.48)"),
    (canvasContext.lineWidth = 1.4),
    canvasContext.stroke(),
    (canvasContext.fillStyle = "rgba(255, 255, 255, 0.86)"),
    (canvasContext.font = "400 22px Inter, Arial, sans-serif");
  const footerText = "imageprompt.local";
  return (
    canvasContext.fillText(footerText, (canvasWidth - canvasContext.measureText(footerText).width) / 2, footerBaselineY),
    canvas.toDataURL("image/png")
  );
}
function removeShareCardOverlay() {
  shareCardOverlay?.remove(), (shareCardOverlay = null);
}
async function openShareCard() {
  if (!(!panelState.analysis || !currentTarget || isShareCardRendering)) {
    isShareCardRendering = !0;
    try {
      const dataUrl = await renderShareCard(currentTarget),
        downloadLink = document.createElement("a");
      (downloadLink.href = dataUrl),
        (downloadLink.download = `imageprompt-${Date.now()}.png`),
        document.body.appendChild(downloadLink),
        downloadLink.click(),
        downloadLink.remove(),
        showToast("Share card downloaded.", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not create share card.",
        "error",
      );
    } finally {
      isShareCardRendering = !1;
    }
  }
}
async function handleResultScreenshotAction() {
  if (panelState.status !== "success") return;
  const settings = await loadApiSettings();
  if (!settings.apiEnabled) {
    capturePanelPosition(),
      await showNoApiWorkflow(
        { srcUrl: currentTarget?.src, preferLatest: !1, options: {} },
        {
          target: currentTarget ?? null,
          anchor: panelAnchor ?? null,
          point: targetPoint ?? null,
          message: "",
          preservePosition: !0,
        },
      ),
      await renderNoApiWorkflowNow();
    return;
  }
  if (!currentTarget) return;
  const baseTarget = currentTarget,
    selectedRect = await withHiddenPanelOverlays([panelLayer, inlineActionLayer, toastLayer], () =>
      selectScreenshotRegion(),
    );
  selectedRect && (await analyzeScreenshotRegion(selectedRect, baseTarget));
}
async function analyzeScreenshotRegion(selectedRect, baseTarget) {
  try {
    const screenshotTarget = await captureScreenshotTarget(selectedRect, baseTarget);
    analyzeAndSaveToHistory(screenshotTarget).catch((error) => {
      showToast(
        error instanceof Error ? error.message : "Screenshot analysis failed.",
        "error",
      );
    });
  } catch (error) {
    showToast(error instanceof Error ? error.message : "Screenshot capture failed.", "error");
  }
}
async function minimizePanel() {
  if (!(panelState.status === "hidden" || isPanelModeAnimating)) {
    isPanelModeAnimating = !0;
    try {
      const anchorPoint = panelAnchorPoint();
      capturePanelPosition(),
        await Promise.all([animatePanelModeExit("collapse"), animateHistoryRailExit()]),
        positionPanelAroundAnchor(anchorPoint, "minimized"),
        (panelTransitionMode = "collapse"),
        (panelMode = "minimized"),
        renderPanel(),
        await savePanelSession("minimized");
    } finally {
      isPanelModeAnimating = !1;
    }
  }
}
async function expandPanel() {
  if (!isPanelModeAnimating) {
    isPanelModeAnimating = !0;
    try {
      const anchorPoint = panelAnchorPoint();
      await animatePanelModeExit("expand"),
        (expandedPanelWidth = null),
        positionPanelAroundAnchor(anchorPoint, "expanded"),
        (panelTransitionMode = "expand"),
        (panelMode = "expanded"),
        (historyRailOpen = !1),
        clearHistoryRailEnter(),
        renderPanel(),
        await savePanelSession("expanded");
    } finally {
      isPanelModeAnimating = !1;
    }
  }
}
async function toggleInlineActions() {
  inlineActionsEnabled = !inlineActionsEnabled;
  const toggleCard = panelLayer?.querySelector(".minimized-toggle-card");
  toggleCard &&
    (toggleCard.classList.add("is-animating"),
    toggleCard.classList.toggle("is-active", inlineActionsEnabled),
    toggleCard.setAttribute("aria-pressed", inlineActionsEnabled ? "true" : "false"),
    window.setTimeout(() => {
      toggleCard.classList.remove("is-animating");
    }, 460)),
    inlineActionsEnabled ? renderInlineActionMenu() : clearHoveredTarget(),
    window.setTimeout(() => {
      savePanelSession(panelMode);
    }, 360);
}
async function closeSharedPanel() {
  panelState.status === "loading" &&
    ((activeRequestId = Math.max(activeRequestId + 1, Date.now())),
    activeHistoryRequest &&
      (removeHistoryPlaceholder(activeHistoryRequest.placeholderId),
      (activeHistoryRequest = null))),
    capturePanelPosition(),
    (inlineActionsEnabled = !1),
    (recentlyClosedHoverSrc = hoveredTarget?.src ?? recentlyClosedHoverSrc),
    clearHoveredTarget(),
    await savePanelSession("hidden"),
    resetPanelState();
}
async function requestAnalysisFromBackground(target) {
  const response = await chrome.runtime.sendMessage({
    type: "RUN_ANALYSIS",
    payload: { target: target },
  });
  if (!response.ok)
    throw new ContentRuntimeError(response.error, { code: response.code ?? null, action: response.action ?? null });
  return response.data;
}
function waitAnimationFrames(frameCount = 2) {
  return new Promise((resolve) => {
    const waitNextFrame = (remainingFrames) => {
      if (remainingFrames <= 0) {
        resolve();
        return;
      }
      window.requestAnimationFrame(() => waitNextFrame(remainingFrames - 1));
    };
    waitNextFrame(frameCount);
  });
}
function loadImageElement(imageUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    (image.onload = () => resolve(image)),
      (image.onerror = () => reject(new Error("Could not read the page screenshot."))),
      (image.src = imageUrl);
  });
}
function canvasToPngDataUrl(canvas, mimeType = "image/jpeg", quality = 0.84) {
  return new Promise((resolve, reject) => {
    try {
      resolve(canvas.toDataURL(mimeType, quality));
    } catch {
      reject(new Error("Could not prepare the screenshot crop."));
    }
  });
}
async function captureVisibleTabScreenshot() {
  const captureMessage = chrome.runtime.sendMessage({ type: "CAPTURE_VISIBLE_TAB" }),
    timeout = new Promise((resolve, reject) => {
      window.setTimeout(
        () => reject(new Error("Screenshot capture timed out. Please try again.")),
        8e3,
      );
    }),
    response = await Promise.race([captureMessage, timeout]);
  if (!response.ok) throw new Error(response.error);
  return response.data.dataUrl;
}
function rectFromPoints(startPoint, endPoint) {
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1,
    viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1,
    left = clamp(Math.min(startPoint.x, endPoint.x), 0, viewportWidth),
    top = clamp(Math.min(startPoint.y, endPoint.y), 0, viewportHeight),
    right = clamp(Math.max(startPoint.x, endPoint.x), 0, viewportWidth),
    bottom = clamp(Math.max(startPoint.y, endPoint.y), 0, viewportHeight);
  return {
    left: left,
    top: top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}
function positionScreenshotBox(boxElement, rect) {
  boxElement.classList.toggle("is-visible", rect.width > 0 && rect.height > 0),
    (boxElement.style.left = `${Math.round(rect.left)}px`),
    (boxElement.style.top = `${Math.round(rect.top)}px`),
    (boxElement.style.width = `${Math.round(rect.width)}px`),
    (boxElement.style.height = `${Math.round(rect.height)}px`);
}
function positionScreenshotActions(actionsElement, selectedRect) {
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1,
    viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1,
    actionsWidth = actionsElement.offsetWidth || 142,
    actionsHeight = actionsElement.offsetHeight || 42,
    centerX = clamp(selectedRect.left + selectedRect.width / 2, actionsWidth / 2 + 12, viewportWidth - actionsWidth / 2 - 12),
    belowTop = selectedRect.top + selectedRect.height + 12,
    aboveTop = selectedRect.top - actionsHeight - 12,
    top = belowTop + actionsHeight <= viewportHeight - 12 ? belowTop : clamp(aboveTop, 12, viewportHeight - actionsHeight - 12);
  actionsElement.style.left = `${Math.round(centerX)}px`;
  actionsElement.style.top = `${Math.round(top)}px`;
}
function screenshotRetryLabel() {
  switch (activeLanguage) {
    case "zh":
      return "重试";
    case "en":
    default:
      return "Retry";
  }
}
function screenshotConfirmLabel() {
  switch (activeLanguage) {
    case "zh":
      return "确认";
    case "en":
    default:
      return "Confirm";
  }
}
function isElementVisible(element) {
  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
}
async function withHiddenPanelOverlays(elements, callback) {
  const visibleElements = elements.filter((element) => element instanceof HTMLElement && isElementVisible(element)),
    previousVisibility = visibleElements.map((element) => element.style.visibility);
  visibleElements.forEach((element) => {
    element.style.visibility = "hidden";
  });
  try {
    return await waitAnimationFrames(2), await callback();
  } finally {
    visibleElements.forEach((element, index) => {
      element.style.visibility = previousVisibility[index] ?? "";
    });
  }
}
function selectScreenshotRegion() {
  if ((ensureContentRoot(), !screenshotLayer || isScreenshotSelecting)) return Promise.resolve(null);
  const layer = screenshotLayer;
  return new Promise((resolve) => {
    isScreenshotSelecting = true;
    const controls = renderScreenshotSelectionLayer(layer);
    if (!controls) {
      finishScreenshotSelection(layer, resolve, null);
      return;
    }
    bindScreenshotSelectionControls(layer, controls, resolve);
  });
}

function renderScreenshotSelectionLayer(layer) {
  layer.innerHTML = `
      <div class="screenshot-selection-backdrop">
        <div class="screenshot-selection-hint">Drag to capture the area to analyze</div>
        <div class="screenshot-selection-box" aria-hidden="true"></div>
        <div class="screenshot-selection-actions" aria-label="Confirm screenshot area">
          <button type="button" class="screenshot-selection-action" data-screenshot-action="retry">${escapeHtml(screenshotRetryLabel())}</button>
          <button type="button" class="screenshot-selection-action is-primary" data-screenshot-action="confirm">${escapeHtml(screenshotConfirmLabel())}</button>
        </div>
        <button type="button" class="screenshot-selection-cancel" aria-label="Cancel screenshot">${closeIcon()}</button>
      </div>
    `;
  layer.classList.add("is-active");
  const controls = {
    backdrop: layer.querySelector(".screenshot-selection-backdrop"),
    box: layer.querySelector(".screenshot-selection-box"),
    actions: layer.querySelector(".screenshot-selection-actions"),
    retryButton: layer.querySelector('[data-screenshot-action="retry"]'),
    confirmButton: layer.querySelector('[data-screenshot-action="confirm"]'),
    cancelButton: layer.querySelector(".screenshot-selection-cancel"),
  };
  return Object.values(controls).every(Boolean) ? controls : null;
}

function bindScreenshotSelectionControls(layer, controls, resolve) {
  let dragStart = null,
    selectedRect = null,
    finished = false;
  const hideActions = () => controls.actions.classList.remove("is-visible"),
    showActions = (rect) => {
      controls.actions.classList.add("is-visible");
      window.requestAnimationFrame(() =>
        positionScreenshotActions(controls.actions, rect),
      );
    },
    removeDragListeners = () => {
      window.removeEventListener("pointermove", handleMove, true);
      window.removeEventListener("pointerup", handleUp, true);
      window.removeEventListener("pointercancel", handleCancel, true);
    },
    finish = (rect) => {
      if (finished) return;
      finished = true;
      removeDragListeners();
      window.removeEventListener("keydown", handleEscape, true);
      finishScreenshotSelection(layer, resolve, rect);
    };
  function handleMove(event) {
    if (!dragStart) return;
    event.preventDefault();
    event.stopPropagation();
    selectedRect = rectFromPoints(dragStart, {
      x: event.clientX,
      y: event.clientY,
    });
    positionScreenshotBox(controls.box, selectedRect);
  }
  function handleUp(event) {
    if (!dragStart) return;
    event.preventDefault();
    event.stopPropagation();
    removeDragListeners();
    const rect = rectFromPoints(dragStart, {
      x: event.clientX,
      y: event.clientY,
    });
    dragStart = null;
    if (rect.width < 18 || rect.height < 18) {
      selectedRect = null;
      controls.box.classList.remove("is-visible");
      hideActions();
      return;
    }
    selectedRect = rect;
    positionScreenshotBox(controls.box, rect);
    showActions(rect);
  }
  function handleCancel(event) {
    event.preventDefault();
    event.stopPropagation();
    removeDragListeners();
    dragStart = null;
    selectedRect = null;
    controls.box.classList.remove("is-visible");
    hideActions();
  }
  function handleEscape(event) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    finish(null);
  }
  controls.backdrop.onpointerdown = (event) => {
    const target = event.target;
    if (
      event.button !== 0 ||
      (target instanceof Element &&
        target.closest(
          ".screenshot-selection-cancel, .screenshot-selection-actions",
        ))
    )
      return;
    event.preventDefault();
    event.stopPropagation();
    hideActions();
    dragStart = { x: event.clientX, y: event.clientY };
    selectedRect = rectFromPoints(dragStart, dragStart);
    positionScreenshotBox(controls.box, selectedRect);
    window.addEventListener("pointermove", handleMove, true);
    window.addEventListener("pointerup", handleUp, true);
    window.addEventListener("pointercancel", handleCancel, true);
  };
  controls.retryButton.onclick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    removeDragListeners();
    dragStart = null;
    selectedRect = null;
    controls.box.classList.remove("is-visible");
    hideActions();
  };
  controls.confirmButton.onclick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (selectedRect && selectedRect.width >= 18 && selectedRect.height >= 18)
      finish(selectedRect);
  };
  controls.cancelButton.onclick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    finish(null);
  };
  window.addEventListener("keydown", handleEscape, true);
}

function finishScreenshotSelection(layer, resolve, rect) {
  isScreenshotSelecting = false;
  layer.classList.remove("is-active");
  layer.innerHTML = "";
  resolve(rect);
}
async function captureWithScreenshotShield(captureCallback) {
  return withHiddenPanelOverlays([panelLayer, inlineActionLayer, toastLayer], async () => {
    const layer = screenshotLayer;
    if (!layer) return captureCallback();
    const previousClassName = layer.className,
      previousHtml = layer.innerHTML,
      previousOpacity = layer.style.opacity,
      previousPointerEvents = layer.style.pointerEvents;
    (layer.className = `${previousClassName} is-active is-capture-shield`),
      (layer.style.opacity = "0"),
      (layer.style.pointerEvents = "auto"),
      (layer.innerHTML =
        '<div class="screenshot-capture-hover-shield" aria-hidden="true"></div>');
    try {
      return await waitAnimationFrames(2), await captureCallback();
    } finally {
      (layer.className = previousClassName),
        (layer.innerHTML = previousHtml),
        (layer.style.opacity = previousOpacity),
        (layer.style.pointerEvents = previousPointerEvents);
    }
  });
}
function screenshotTargetMetadata(baseTarget = {}) {
  const target = baseTarget && typeof baseTarget == "object" ? baseTarget : {};
  return { ...target, pageUrl: window.location.href };
}
async function cropScreenshotCapture(screenshotDataUrl, selectedRect, baseTarget) {
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1,
    viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1,
    screenshotImage = await loadImageElement(screenshotDataUrl),
    scaleX = screenshotImage.naturalWidth / viewportWidth,
    scaleY = screenshotImage.naturalHeight / viewportHeight,
    sourceX = Math.round(selectedRect.left * scaleX),
    sourceY = Math.round(selectedRect.top * scaleY),
    sourceWidth = Math.max(1, Math.round(selectedRect.width * scaleX)),
    sourceHeight = Math.max(1, Math.round(selectedRect.height * scaleY)),
    outputScale = Math.min(1, 1280 / Math.max(sourceWidth, sourceHeight)),
    outputWidth = Math.max(1, Math.round(sourceWidth * outputScale)),
    outputHeight = Math.max(1, Math.round(sourceHeight * outputScale)),
    canvas = document.createElement("canvas");
  (canvas.width = outputWidth), (canvas.height = outputHeight);
  const canvasContext = canvas.getContext("2d");
  if (!canvasContext) throw new Error("Could not prepare the screenshot crop.");
  canvasContext.drawImage(screenshotImage, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, outputWidth, outputHeight);
  const croppedDataUrl = await canvasToPngDataUrl(canvas);
  return { ...screenshotTargetMetadata(baseTarget), src: croppedDataUrl, naturalWidth: outputWidth, naturalHeight: outputHeight };
}
async function captureScreenshotTarget(selectedRect, baseTarget) {
  const screenshotDataUrl = await captureWithScreenshotShield(() =>
    captureVisibleTabScreenshot(),
  );
  return cropScreenshotCapture(screenshotDataUrl, selectedRect, baseTarget);
}
function base64ToArrayBuffer(base64Text) {
  const binaryText = atob(base64Text),
    buffer = new ArrayBuffer(binaryText.length),
    bytes = new Uint8Array(buffer);
  for (let index = 0; index < binaryText.length; index += 1) bytes[index] = binaryText.charCodeAt(index);
  return buffer;
}
function clipboardPayloadToBlob(payload) {
  return new Blob([base64ToArrayBuffer(payload.data)], { type: payload.mimeType });
}
function targetForHistoryImage(entryId) {
  const historyEntry = historyItems.find((entry) => entry.id === entryId);
  if (historyEntry)
    return {
      src: historyEntry.imageSrc,
      pageUrl: historyEntry.pageUrl,
      naturalWidth: historyEntry.imageWidth,
      naturalHeight: historyEntry.imageHeight,
    };
  const failedEntry = failedHistoryItems.find((entry) => entry.id === entryId && entry.status === "failed");
  return failedEntry
    ? {
        src: failedEntry.imageSrc,
        alt: failedEntry.alt,
        pageUrl: failedEntry.pageUrl,
        naturalWidth: failedEntry.imageWidth,
        naturalHeight: failedEntry.imageHeight,
      }
    : null;
}
function preloadHistoryImages(limit = 8) {
  const failedIds = failedHistoryItems
      .filter((entry) => entry.status === "failed")
      .map((entry) => entry.id),
    historyIds = historyItems.map((entry) => entry.id);
  [...failedIds, ...historyIds].slice(0, limit).forEach((entryId) => {
    loadHistoryImagePayload(entryId);
  });
}
function loadHistoryImagePayload(entryId) {
  const cachedPayload = historyImageCache.get(entryId);
  if (cachedPayload) return Promise.resolve(cachedPayload);
  const existingLoad = historyImageLoadPromises.get(entryId);
  if (existingLoad) return existingLoad;
  const target = targetForHistoryImage(entryId);
  if (!target) return Promise.resolve(null);
  const loadPromise = chrome.runtime
    .sendMessage({ type: "FETCH_CLIPBOARD_IMAGE", payload: { target: target } })
    .then((response) => (response.ok ? (historyImageCache.set(entryId, response.data), response.data) : null))
    .catch(() => null)
    .finally(() => {
      historyImageLoadPromises.delete(entryId);
    });
  return historyImageLoadPromises.set(entryId, loadPromise), loadPromise;
}
async function blobToPngClipboardBlob(blob) {
  const bitmap = await createImageBitmap(blob),
    canvas = document.createElement("canvas");
  (canvas.width = bitmap.width), (canvas.height = bitmap.height);
  const canvasContext = canvas.getContext("2d");
  if (!canvasContext)
    throw (bitmap.close(), new Error("Could not prepare image for clipboard."));
  return (
    canvasContext.drawImage(bitmap, 0, 0),
    bitmap.close(),
    new Promise((resolve, reject) => {
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) {
          reject(new Error("Could not prepare image for clipboard."));
          return;
        }
        resolve(pngBlob);
      }, "image/png");
    })
  );
}
async function copyImageToClipboard(payload) {
  if (!navigator.clipboard?.write || typeof ClipboardItem > "u")
    throw new Error("Image clipboard is not available in this browser.");
  const sourceBlob = clipboardPayloadToBlob(payload),
    pngBlob = sourceBlob.type === "image/png" ? sourceBlob : await blobToPngClipboardBlob(sourceBlob);
  await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })]);
}
async function copyHistoryImageToClipboard(entryId) {
  const payload = await loadHistoryImagePayload(entryId);
  if (!payload) throw new Error("Could not prepare this history image.");
  await copyImageToClipboard(payload);
}
function shouldIgnoreHistoryCopyShortcut(event) {
  if (
    event.defaultPrevented ||
    !historyRailOpen ||
    panelState.status === "hidden" ||
    !selectedHistoryId ||
    !(event.ctrlKey || event.metaKey) ||
    event.shiftKey ||
    event.altKey ||
    event.key.toLowerCase() !== "c"
  )
    return !0;
  const targetElement = event.target;
  if (targetElement instanceof HTMLInputElement || targetElement instanceof HTMLTextAreaElement)
    return (
      typeof targetElement.selectionStart == "number" &&
      typeof targetElement.selectionEnd == "number" &&
      targetElement.selectionStart !== targetElement.selectionEnd
    );
  if (targetElement instanceof HTMLSelectElement) return !0;
  const selection = window.getSelection(),
    hasSelection = !!(selection && !selection.isCollapsed && selection.toString().trim()),
    isPanelSelection = !!(selection?.anchorNode instanceof Node && panelLayer?.contains(selection.anchorNode));
  return hasSelection && !isPanelSelection;
}
function handleHistoryCopyShortcut(event) {
  if (shouldIgnoreHistoryCopyShortcut(event) || !selectedHistoryId) return;
  event.preventDefault(), event.stopPropagation();
  const entryId = selectedHistoryId;
  copyHistoryImageToClipboard(entryId)
    .then(() => {
      showToast("History image copied", "success");
    })
    .catch((error) => {
      loadHistoryImagePayload(entryId),
        showToast(
          error instanceof Error
            ? error.message
            : "Preparing image. Press Ctrl+C again.",
          "error",
        );
    });
}
