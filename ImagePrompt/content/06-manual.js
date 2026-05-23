// ImagePrompt content module: manual workflow

function manualBaseTarget() {
  return currentTarget && typeof currentTarget == "object"
    ? currentTarget
    : {
        src: "",
        pageUrl: window.location.href,
        naturalWidth: 0,
        naturalHeight: 0,
      };
}
function isManualScreenshotTarget(target) {
  return (
    target?.manualScreenshotTarget === !0 &&
    /^data:image\//i.test(String(target.src || ""))
  );
}
function screenshotClipboardPayload(target) {
  const dataUrlMatch = String(target?.src || "").match(/^data:(.*?);base64,(.*)$/i);
  return dataUrlMatch ? { mimeType: dataUrlMatch[1] || "image/png", data: dataUrlMatch[2] } : null;
}
async function startNoApiScreenshot(options = {}) {
  try {
    panelState.status !== "manual" &&
      (await showNoApiWorkflow(
        { srcUrl: currentTarget?.src, preferLatest: !1, options: {} },
        {
          target: currentTarget ?? null,
          anchor: panelAnchor ?? null,
          point: targetPoint ?? null,
          message: "",
        },
      ));
    const baseTarget = manualBaseTarget(),
      selectionRect = await withHiddenPanelOverlays([panelLayer, inlineActionLayer, toastLayer], () =>
        selectScreenshotRegion(),
      );
    if (!selectionRect) return;
    const screenshotTarget = await captureScreenshotTarget(selectionRect, baseTarget),
      manualTarget = {
        ...screenshotTarget,
        pageUrl: screenshotTarget.pageUrl || window.location.href,
        manualScreenshotTarget: !0,
      };
    (panelAnchor = null),
      (currentTarget = manualTarget),
      (targetPoint = null),
      (lastResolvedTarget = { element: null, target: manualTarget, point: null }),
      await showNoApiWorkflow(
        pendingAnalysisRequest ?? { srcUrl: manualTarget.src, preferLatest: !1, options: {} },
        { target: manualTarget, anchor: null, point: null, message: "" },
      ),
      options.copyAfter && (await copyNoApiScreenshot({ requireExisting: !0 }));
  } catch (error) {
    showToast(
      error instanceof Error
        ? error.message
        : localizedText.manualScreenshotCaptureError,
      "error",
    );
  }
}
async function copyNoApiScreenshot(options = {}) {
  try {
    if (!isManualScreenshotTarget(currentTarget)) {
      if (options.requireExisting)
        throw new Error(localizedText.manualScreenshotCopyError);
      await startNoApiScreenshot({ copyAfter: !0 });
      return;
    }
    const clipboardPayload = screenshotClipboardPayload(currentTarget);
    if (!clipboardPayload) throw new Error(localizedText.manualScreenshotCopyError);
    await copyImageToClipboard(clipboardPayload),
      showToast(localizedText.manualScreenshotCopied, "success");
  } catch (error) {
    showToast(
      error instanceof Error ? error.message : localizedText.manualScreenshotCopyError,
      "error",
    );
  }
}
async function copyManualReversePrompt() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "GET_MANUAL_REVERSE_PROMPT",
      payload: { target: currentTarget },
    });
    if (!response?.ok || !response.data?.prompt)
      throw new Error(response?.error || localizedText.manualPromptCopyError);
    await copyTextToClipboard(response.data.prompt),
      showToast(localizedText.manualPromptCopied, "success");
  } catch (error) {
    showToast(
      error instanceof Error ? error.message : localizedText.manualPromptCopyError,
      "error",
    );
  }
}
function normalizeManualText(rawText) {
  return typeof rawText == "string" ? rawText.trim() : "";
}
function stripManualJsonFence(rawText) {
  const cleanText = normalizeManualText(rawText),
    fencedJsonMatch = cleanText.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fencedJsonMatch ? fencedJsonMatch[1].trim() : cleanText;
}
function readManualJson(rawText) {
  const jsonText = stripManualJsonFence(rawText);
  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}
function manualArray(rawValue) {
  return Array.isArray(rawValue)
    ? rawValue.map(normalizeManualText).filter(Boolean)
    : typeof rawValue == "string"
      ? rawValue
          .split(/[,，]\s*/)
          .map(normalizeManualText)
          .filter(Boolean)
      : [];
}
function manualFirst(...candidates) {
  for (const candidate of candidates) {
    const cleanCandidate = normalizeManualText(candidate);
    if (cleanCandidate) return cleanCandidate;
  }
  return "";
}
function manualObject(rawValue) {
  return rawValue && typeof rawValue == "object" && !Array.isArray(rawValue) ? rawValue : {};
}
function manualLanguage(rawValue, fallbackPrompt) {
  const languageObject = manualObject(rawValue);
  return {
    prompt: manualFirst(languageObject.prompt, fallbackPrompt),
    analysis: manualFirst(languageObject.analysis, ""),
  };
}
function manualJsonPrompt(source = {}) {
  const rawJsonPrompt = manualObject(source.json_prompt ?? source.jsonPrompt ?? source.json),
    jsonPrompt = Object.keys(rawJsonPrompt).length ? rawJsonPrompt : manualObject(source);
  return {
    subject: manualFirst(jsonPrompt.subject, source.subject),
    actionPose: manualFirst(
      jsonPrompt.action_pose,
      jsonPrompt.actionPose,
      source.action_pose,
      source.actionPose,
    ),
    detailsAppearance: manualFirst(
      jsonPrompt.details_appearance,
      jsonPrompt.detailsAppearance,
      source.details_appearance,
      source.detailsAppearance,
    ),
    environmentBackground: manualFirst(
      jsonPrompt.environment_background,
      jsonPrompt.environmentBackground,
      source.environment_background,
      source.environmentBackground,
    ),
    lightingAtmosphere: manualFirst(
      jsonPrompt.lighting_atmosphere,
      jsonPrompt.lightingAtmosphere,
      source.lighting_atmosphere,
      source.lightingAtmosphere,
    ),
    compositionFraming: manualFirst(
      jsonPrompt.composition_framing,
      jsonPrompt.compositionFraming,
      source.composition_framing,
      source.compositionFraming,
    ),
    styleCamera: manualFirst(
      jsonPrompt.style_camera,
      jsonPrompt.styleCamera,
      source.style_camera,
      source.styleCamera,
    ),
    colors: manualArray(jsonPrompt.colors ?? source.colors),
    materials: manualArray(jsonPrompt.materials ?? source.materials),
    aspectRatio: manualFirst(
      jsonPrompt.aspect_ratio,
      jsonPrompt.aspectRatio,
      source.aspect_ratio,
      source.aspectRatio,
    ),
    qualityModifiers: manualArray(
      jsonPrompt.quality_modifiers ??
        jsonPrompt.qualityModifiers ??
        source.quality_modifiers ??
        source.qualityModifiers,
    ),
    likelyGenerationIntent: manualFirst(
      jsonPrompt.likely_generation_intent,
      jsonPrompt.likelyGenerationIntent,
      source.likely_generation_intent,
      source.likelyGenerationIntent,
    ),
    raw: Object.keys(rawJsonPrompt).length ? rawJsonPrompt : {},
  };
}
function parseManualGptResult(rawText) {
  const text = stripManualJsonFence(rawText);
  if (!text) throw new Error(localizedText.gptResultRequired);
  const parsedJson = readManualJson(text);
  const nestedChoice = parsedJson?.choices?.[0]?.message?.content;
  if (nestedChoice) return parseManualGptResult(nestedChoice);
  return parsedJson && typeof parsedJson == "object"
    ? manualResultFromObject(parsedJson)
    : manualResultFromText(text);
}

function manualResultFromObject(rawValue) {
  const source = Object.keys(manualObject(rawValue.data)).length
      ? manualObject(rawValue.data)
      : rawValue,
    fallbackPrompt = manualFirst(
      source.recreation_prompt,
      source.recreationPrompt,
      source.prompt,
      source.prompt_core,
      source.promptCore,
    ),
    promptCore = manualFirst(
      source.prompt_core,
      source.promptCore,
      fallbackPrompt,
    ),
    negativePrompt = manualFirst(source.negative_prompt, source.negativePrompt),
    chineseValue = manualLanguage(
      source.zh,
      manualFirst(
        source.zh,
        source.prompt_zh,
        source.zh_prompt,
        fallbackPrompt,
      ),
    ),
    englishValue = manualLanguage(
      source.en,
      manualFirst(
        source.en,
        source.prompt_en,
        source.en_prompt,
        fallbackPrompt,
        chineseValue.prompt,
      ),
    ),
    result = {
      zh: chineseValue,
      en: {
        prompt: englishValue.prompt || chineseValue.prompt,
        analysis: englishValue.analysis,
      },
      jsonPrompt: manualJsonPrompt(source),
      styleTags: {
        zh: manualArray(
          source.zh_style_tags ?? source.zhStyleTags ?? source.styleTags?.zh,
        ),
        en: manualArray(
          source.en_style_tags ?? source.enStyleTags ?? source.styleTags?.en,
        ),
      },
      recreationPrompt: manualFirst(
        source.recreation_prompt,
        source.recreationPrompt,
        fallbackPrompt,
        englishValue.prompt,
        chineseValue.prompt,
      ),
      promptCore: promptCore || fallbackPrompt || englishValue.prompt || chineseValue.prompt,
      negativePrompt,
    };
  fillManualResultFallbacks(result);
  if (!manualResultHasPrompt(result))
    throw new Error(localizedText.gptResultInvalid);
  return result;
}

function fillManualResultFallbacks(result) {
  if (!result.zh.prompt) result.zh.prompt = result.en.prompt;
  if (!result.zh.analysis) result.zh.analysis = result.zh.prompt;
  if (!result.en.analysis) result.en.analysis = result.en.prompt;
  if (!result.recreationPrompt)
    result.recreationPrompt = result.en.prompt || result.zh.prompt;
  if (!result.promptCore) result.promptCore = result.recreationPrompt;
}

function manualResultHasPrompt(result) {
  return Boolean(
    result.recreationPrompt ||
      result.promptCore ||
      result.zh.prompt ||
      result.en.prompt,
  );
}

function manualResultFromText(text) {
  return {
    zh: { prompt: text, analysis: "" },
    en: { prompt: text, analysis: "" },
    jsonPrompt: manualJsonPrompt({ prompt: text }),
    styleTags: { zh: [], en: [] },
    recreationPrompt: text,
    promptCore: text,
    negativePrompt: "",
  };
}
async function importManualGptResult() {
  const manualInput = panelLayer?.querySelector('[data-manual-field="gpt-result"]'),
    rawText = (manualInput?.value ?? setupState.manualResult ?? "").trim();
  if (!rawText) {
    (setupState = {
      ...setupState,
      manualResult: rawText,
      error: localizedText.gptResultRequired,
      isSaving: !1,
    }),
      renderPanel();
    return;
  }
  try {
    const parsedResult = parseManualGptResult(rawText),
      preferredLanguage = activeLanguage === "zh" ? "zh" : "en";
    restorePromptDrafts({});
    const promptText = manualFirst(promptForLanguage(parsedResult, preferredLanguage), parsedResult.recreationPrompt, parsedResult.promptCore);
    (renderedPromptDraft = promptText),
      (currentPromptDraft = promptText),
      (isPromptTyping = !1),
      (panelMode = "expanded"),
      capturePanelPosition(),
      (targetPoint = null),
      (expandedPanelWidth = null),
      clearResultEntry(),
      updatePanelState({
        status: "success",
        language: preferredLanguage,
        analysis: parsedResult,
        error: "",
        errorCode: null,
        errorAction: null,
        copied: !1,
      }),
      resetPromptDraftAnimation(promptText),
      saveCurrentAnalysisSnapshot(),
      currentTarget &&
        (await addAnalysisToHistory(currentTarget, parsedResult, {
          revealHistory: !0,
          animate: !1,
          selectEntry: !0,
        })),
      savePanelSession("expanded"),
      showToast(localizedText.gptResultImported, "success");
  } catch (error) {
    (setupState = {
      ...setupState,
      manualResult: rawText,
      error: error instanceof Error ? error.message : localizedText.gptResultInvalid,
      isSaving: !1,
    }),
      updatePanelState({
        status: "manual",
        analysis: null,
        error: "",
        copied: !1,
      });
  }
}
