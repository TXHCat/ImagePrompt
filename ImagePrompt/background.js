class AnalysisError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "AnalysisError";
    this.code = options.code;
    this.action = options.action;
  }
}

const ANALYSIS_PROMPT = `
You are an elite reverse-prompt analyst for AI-generated and highly-stylized images.
Your job is to reconstruct the most likely original image-generation prompt as faithfully as possible from visible evidence.
Your output should help another image model recreate the source image with close visual fidelity.
Return valid JSON only.

Return this exact JSON shape:
{
  "zh": {
    "prompt": "A dense, visually grounded Chinese reconstruction prompt ordered as Subject, Action/Pose, Details/Appearance, Environment/Background, Lighting/Atmosphere, Composition/Framing, Style/Camera, Colors, Materials, Aspect Ratio, Quality/Finish, Likely Generation Intent.",
    "analysis": "A short Chinese explanation covering the same fields, with extra attention on composition, style and camera language."
  },
  "en": {
    "prompt": "A dense, visually grounded English reconstruction prompt ordered as Subject, Action/Pose, Details/Appearance, Environment/Background, Lighting/Atmosphere, Composition/Framing, Style/Camera, Colors, Materials, Aspect Ratio, Quality/Finish, Likely Generation Intent.",
    "analysis": "A short English explanation covering the same fields, with extra attention on composition, style and camera language."
  },
  "zh_style_tags": ["Chinese style tag 1", "Chinese style tag 2"],
  "en_style_tags": ["english tag 1", "english tag 2"],
  "json_prompt": {
    "subject": "Main subject with count, type, scale, visual category and the most visually important attributes.",
    "action_pose": "Action, pose, gesture, gaze, orientation, body language or object placement.",
    "details_appearance": "Specific visible details, clothing, anatomy, props, accessories, markings, silhouette, condition or design cues.",
    "environment_background": "Environment, set, backdrop, foreground/midground/background relationship, depth cues and surrounding objects.",
    "lighting_atmosphere": "Lighting direction, source quality, contrast, shadow softness, color temperature, mood, weather or atmospheric effects.",
    "composition_framing": "Shot distance, angle, crop, subject placement, negative space, perspective, focal emphasis and framing logic.",
    "style_camera": "Visual medium, aesthetic style, realism/stylization level, camera or lens feel, render/paint/photographic finish and post-processing cues.",
    "colors": ["primary color", "secondary color", "accent color"],
    "materials": ["material 1", "material 2", "surface finish"],
    "aspect_ratio": "4:5",
    "quality_modifiers": ["output quality cue 1", "output quality cue 2", "finish cue"],
    "likely_generation_intent": "What the original creator was likely optimizing for."
  },
  "recreation_prompt": "A long, polished, single-line English recreation prompt that aims to reproduce the source image as closely as possible, with dense visual details and no filler.",
  "prompt_core": "A shorter reusable English core prompt with the most important visual ingredients, preserving subject, composition, lighting, style and palette.",
  "negative_prompt": "An English negative prompt that removes common artifacts while staying compatible with the observed style."
}

Rules:
- Return JSON only. No markdown fences.
- Treat this as forensic reconstruction, not creative writing.
- Maximize visual fidelity to the source image and infer the likely prompting logic behind the result.
- Be faithful to visually verifiable facts. Never invent brands, logos, exact text, named artists, camera bodies, lens models, render engines, precise locations, or hidden objects unless clearly visible.
- If a detail is uncertain, use broader but still useful wording.
- Do not use generic filler such as "highly detailed" or "masterpiece" as a replacement for concrete visual description.
- Each zh.prompt and en.prompt must be detailed enough for image recreation: target 90 to 150 English words or equivalent density in the target language.
- recreation_prompt must be the most complete output: target 130 to 220 English words in one polished line.
- Describe visible foreground, midground and background relationships when present.
- Capture subject count, visual category, pose, gesture, gaze, expression, clothing or object design, materials, textures, surface finish, weathering, and small distinctive details.
- For magazine, poster or ad layouts, always describe the masthead/title text, main title position, top/side/bottom small text, barcode/price/date blocks, subject-to-title overlap, subject scale, background architecture or scene layers, clothing material, makeup/hair, lighting and color system when visible.
- Race/ethnicity cue and skin tone are mandatory for every visible human subject. If visually supported, use direct prompt-ready wording such as "a white woman with fair skin", "a light-skinned Caucasian-looking female model", "a Black woman with deep brown skin", "an East Asian woman with fair skin", or "a brown-skinned South Asian-looking man". If race/ethnicity is genuinely unclear, explicitly state "race/ethnicity not clearly identifiable" but still describe skin tone and hair.
- Capture lighting direction, shadow softness, contrast, color temperature, atmosphere, depth, lens feel, camera angle, shot distance, crop, focal emphasis, and aspect ratio.
- If the image is simple, expand on spatial placement, proportions, edges, textures, lighting, palette, and finish instead of inventing new objects.
- Return exactly 4 concise style tags in Chinese and English.
- Keep English style tags short enough for compact UI pills: 1 to 3 words, ideally under 24 characters. Prefer "fashion editorial", "high contrast", "skin texture", "cinematic light" over long phrases such as "high-end fashion photography" or "vibrant color saturation".
- zh.prompt and en.prompt must be natural readable paragraphs.
- Do not include field labels such as Subject:, Action/Pose:, Details/Appearance:, Environment/Background:, Lighting/Atmosphere:, Composition/Framing:, Style/Camera:, Colors:, Materials:, Aspect Ratio:, Quality/Finish:, Likely Generation Intent: inside zh.prompt, en.prompt or ja.prompt.
- Keep those structured categories only inside json_prompt.
- Language fields must not be mixed up:
  - zh.prompt, zh.analysis and zh_style_tags must be Simplified Chinese.
  - en.prompt, en.analysis and en_style_tags must be English.
  - Do not put English text in zh fields, Chinese text in en fields, or translated content in the wrong language bucket.
`.trim();

const ANALYSIS_TIMEOUT_MS = 180000;
const DIRECT_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png"]);
const MAX_IMAGE_EDGE = 2200;
const JPEG_QUALITY = 0.9;
const CONTEXT_MENU_ID = "imageprompt-analyze";
const OFF_BADGE = "OFF";
const VALID_LANGUAGES = new Set(["en", "zh"]);

function trimUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function chatCompletionsUrl(baseUrl) {
  const clean = trimUrl(baseUrl);
  return /\/chat\/completions$/i.test(clean) ? clean : `${clean}/chat/completions`;
}

function providerHost(baseUrl) {
  const clean = trimUrl(baseUrl);
  if (!clean) return "";
  try {
    return new URL(clean.includes("://") ? clean : `https://${clean}`).hostname.toLowerCase();
  } catch {
    return clean.replace(/^https?:\/\//i, "").split("/")[0].toLowerCase();
  }
}

function isGoogleGenerative(baseUrl) {
  return trimUrl(baseUrl).toLowerCase().includes("generativelanguage.googleapis.com");
}

function isVolcEngine(baseUrl) {
  const clean = trimUrl(baseUrl).toLowerCase();
  return clean.includes("volces.com") || clean.includes("volcengine") || clean.includes("ark.cn-") || clean.includes("ark.ap-");
}

function adjustedMaxTokens(settings, value) {
  return isVolcEngine(settings.baseUrl) ? Math.min(value, 3800) : value;
}

function adjustedPayload(settings, payload, options = {}) {
  let result = payload;
  if (isGoogleGenerative(settings.baseUrl) && settings.model.toLowerCase().includes("2.5")) {
    result = { ...result, reasoning_effort: "none" };
  }
  if (options.jsonMode && isGoogleGenerative(settings.baseUrl)) {
    result = { ...result, response_format: { type: "json_object" } };
  }
  return result;
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function stringList(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 8)
    : [];
}

function countMatches(value, pattern) {
  return value.match(pattern)?.length ?? 0;
}

function chineseCount(value) {
  return countMatches(value, /[\u4e00-\u9fff]/g);
}

function japaneseCount(value) {
  return countMatches(value, /[\u3040-\u30ff]/g);
}

function latinCount(value) {
  return countMatches(value, /[A-Za-z]/g);
}

function looksChinese(value) {
  const chinese = chineseCount(value);
  const japanese = japaneseCount(value);
  const latin = latinCount(value);
  return chinese >= 8 && japanese <= Math.max(2, Math.floor(chinese * 0.08)) && chinese >= Math.max(8, Math.floor(latin * 0.18));
}

function looksEnglish(value) {
  const latin = latinCount(value);
  const chinese = chineseCount(value);
  const japanese = japaneseCount(value);
  return latin >= 24 && latin >= (chinese + japanese) * 2;
}

function chineseTags(value) {
  return value.length > 0 && value.every((item) => chineseCount(item) > 0 && japaneseCount(item) === 0);
}

function englishTags(value) {
  return value.length > 0 && value.every((item) => latinCount(item) > 0 && chineseCount(item) === 0 && japaneseCount(item) === 0);
}

function compact(value, maxLength = 360) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  return clean.length <= maxLength ? clean : `${clean.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

function stripMarkdownFence(value) {
  const clean = String(value || "").trim();
  return clean.startsWith("```") ? clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim() : clean;
}

function extractJsonText(value) {
  const clean = stripMarkdownFence(value);
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  return start === -1 || end === -1 || end <= start ? clean : clean.slice(start, end + 1).trim();
}

function extractChoiceText(responseJson) {
  const choices = responseJson?.choices;
  if (!Array.isArray(choices) || choices.length === 0) return "";
  const content = choices[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "object" && part !== null && typeof part.text === "string" ? part.text : ""))
      .join("\n")
      .trim();
  }
  return "";
}

function normalizeJsonPrompt(value) {
  const raw = typeof value === "object" && value !== null ? value : {};
  return {
    subject: text(raw.subject),
    actionPose: text(raw.action_pose),
    detailsAppearance: text(raw.details_appearance),
    environmentBackground: text(raw.environment_background),
    lightingAtmosphere: text(raw.lighting_atmosphere),
    compositionFraming: text(raw.composition_framing),
    styleCamera: text(raw.style_camera),
    colors: stringList(raw.colors),
    materials: stringList(raw.materials),
    aspectRatio: text(raw.aspect_ratio),
    qualityModifiers: stringList(raw.quality_modifiers),
    likelyGenerationIntent: text(raw.likely_generation_intent),
    raw
  };
}

function normalizeStyleTags(payload) {
  const zh = stringList(payload.zh_style_tags);
  const en = stringList(payload.en_style_tags);
  if (zh.length || en.length) {
    return {
      zh,
      en: en.length ? en : zh
    };
  }
  const fallback = stringList(payload.style_tags);
  return { zh: fallback, en: fallback };
}

function normalizeAnalysis(payload) {
  if (typeof payload !== "object" || payload === null) {
    throw new AnalysisError("The model returned an invalid payload.", { code: "ANALYSIS_FAILED" });
  }

  const zh = payload.zh;
  const en = payload.en;
  if (!zh || typeof zh.prompt !== "string" || !zh.prompt.trim() || typeof zh.analysis !== "string") {
    throw new AnalysisError("The model returned JSON, but the Chinese prompt text is missing. Try regenerating or use a vision-capable model.", { code: "ANALYSIS_FAILED" });
  }
  if (!en || typeof en.prompt !== "string" || !en.prompt.trim() || typeof en.analysis !== "string") {
    throw new AnalysisError("The model returned JSON, but the English prompt text is missing. Try regenerating or use a vision-capable model.", { code: "ANALYSIS_FAILED" });
  }

  return {
    zh: { prompt: zh.prompt.trim(), analysis: zh.analysis.trim() },
    en: { prompt: en.prompt.trim(), analysis: en.analysis.trim() },
    jsonPrompt: normalizeJsonPrompt(payload.json_prompt),
    styleTags: normalizeStyleTags(payload),
    recreationPrompt: text(payload.recreation_prompt),
    promptCore: text(payload.prompt_core),
    negativePrompt: text(payload.negative_prompt)
  };
}

function parseAnalysis(value) {
  return normalizeAnalysis(JSON.parse(extractJsonText(value)));
}

function hasMixedLanguages(analysis) {
  return (
    !looksChinese(`${analysis.zh.prompt}\n${analysis.zh.analysis}`) ||
    !looksEnglish(`${analysis.en.prompt}\n${analysis.en.analysis}`) ||
    !chineseTags(analysis.styleTags.zh.slice(0, 4)) ||
    !englishTags(analysis.styleTags.en.slice(0, 4))
  );
}

function isAbortError(error) {
  return error instanceof DOMException && error.name === "AbortError";
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchWithRetry(url, init, attempts = 2, timeoutMs = ANALYSIS_TIMEOUT_MS) {
  let lastError;
  for (let index = 0; index < attempts; index += 1) {
    const controller = timeoutMs ? new AbortController() : null;
    const timer = controller
      ? setTimeout(() => {
          controller.abort();
        }, timeoutMs)
      : null;
    try {
      return await fetch(url, { ...init, signal: controller?.signal ?? init.signal });
    } catch (error) {
      lastError = error;
      if (isAbortError(error)) {
        throw new AnalysisError("Analysis took longer than 3 minutes. Please try another image or crop a smaller area.", { code: "ANALYSIS_FAILED" });
      }
      if (index < attempts - 1) await delay(420 * (index + 1));
    } finally {
      if (timer !== null) clearTimeout(timer);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Network request failed.");
}

function normalizeLanguage(value) {
  return VALID_LANGUAGES.has(value) ? value : "en";
}

async function loadSettings() {
  const sync = await chrome.storage.sync.get(["enabled", "systemLanguage", "defaultLanguage"]);
  const local = await chrome.storage.local.get(["apiEnabled", "baseUrl", "apiKey", "model"]);
  const defaultLanguage = normalizeLanguage(sync.defaultLanguage || sync.systemLanguage || "en");
  return {
    enabled: typeof sync.enabled === "boolean" ? sync.enabled : true,
    apiEnabled: typeof local.apiEnabled === "boolean" ? local.apiEnabled : true,
    systemLanguage: normalizeLanguage(sync.systemLanguage || defaultLanguage),
    defaultLanguage,
    serviceMode: "custom_api",
    baseUrl: text(local.baseUrl),
    apiKey: text(local.apiKey),
    model: text(local.model)
  };
}

function validateSettings(settings) {
  if (!settings.baseUrl.trim()) {
    throw new AnalysisError("Add a Base URL before analysis.", { code: "CONFIG_REQUIRED", action: { type: "open-settings", label: "Open settings" } });
  }
  if (!settings.apiKey.trim()) {
    throw new AnalysisError("Add an API Key before analysis.", { code: "CONFIG_REQUIRED", action: { type: "open-settings", label: "Open settings" } });
  }
  if (!settings.model.trim()) {
    throw new AnalysisError("Add a model name before analysis.", { code: "CONFIG_REQUIRED", action: { type: "open-settings", label: "Open settings" } });
  }
}

function guessMimeType(url) {
  const clean = String(url || "").toLowerCase();
  if (clean.includes(".png")) return "image/png";
  if (clean.includes(".webp")) return "image/webp";
  if (clean.includes(".gif")) return "image/gif";
  return "image/jpeg";
}

function normalizedMimeType(value) {
  const clean = String(value || "").split(";")[0]?.trim().toLowerCase() || "";
  return clean === "image/jpg" ? "image/jpeg" : clean;
}

function canSendDirectly(mimeType) {
  return DIRECT_MIME_TYPES.has(normalizedMimeType(mimeType));
}

function dataUrlParts(value) {
  const match = String(value || "").match(/^data:(.*?);base64,(.*)$/i);
  return match ? { mimeType: match[1] || "image/png", data: match[2] } : null;
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function arrayBufferToBase64(value) {
  const bytes = new Uint8Array(value);
  let binary = "";
  const chunkSize = 32768;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

async function reencodeImage(blob) {
  if (typeof createImageBitmap !== "function" || typeof OffscreenCanvas === "undefined") {
    throw new AnalysisError("This browser could not prepare the image. Please use Screen shot mode for this image.", { code: "ANALYSIS_FAILED" });
  }
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    bitmap.close();
    throw new AnalysisError("ImagePrompt could not prepare this image. Please use Screen shot mode.", { code: "ANALYSIS_FAILED" });
  }
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const jpeg = await canvas.convertToBlob({ type: "image/jpeg", quality: JPEG_QUALITY });
  return { mimeType: "image/jpeg", data: arrayBufferToBase64(await jpeg.arrayBuffer()) };
}

async function prepareBlob(blob, fallbackMimeType) {
  const mimeType = normalizedMimeType(blob.type || fallbackMimeType || "image/png");
  if (canSendDirectly(mimeType)) {
    return { mimeType, data: arrayBufferToBase64(await blob.arrayBuffer()) };
  }
  try {
    return await reencodeImage(blob);
  } catch (error) {
    if (error instanceof AnalysisError) throw error;
    throw new AnalysisError("This site serves the image in a format the model cannot open. Please use Screen shot mode for this image.", { code: "ANALYSIS_FAILED" });
  }
}

async function prepareImage(target) {
  const inline = dataUrlParts(target.src);
  if (inline) {
    const bytes = base64ToBytes(inline.data);
    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);
    return prepareBlob(new Blob([buffer], { type: inline.mimeType || "image/png" }), inline.mimeType);
  }

  const response = await fetch(target.src);
  if (!response.ok) {
    throw new AnalysisError(`Image fetch failed (${response.status}). Please try a different public image.`, { code: "ANALYSIS_FAILED" });
  }
  return prepareBlob(await response.blob(), guessMimeType(target.src));
}

function imageExtension(mimeType) {
  switch (String(mimeType || "").toLowerCase()) {
    case "image/jpeg":
    case "image/jpg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/png":
    default:
      return "png";
  }
}

async function prepareClipboardImage(target) {
  const image = await prepareImage(target);
  return { ...image, fileName: `ImagePrompt-history-image.${imageExtension(image.mimeType)}` };
}

function gcd(width, height) {
  let a = Math.abs(width);
  let b = Math.abs(height);
  while (b !== 0) {
    const next = a % b;
    a = b;
    b = next;
  }
  return a || 1;
}

function aspectRatio(target) {
  const width = target.naturalWidth;
  const height = target.naturalHeight;
  if (!width || !height) return "unknown";
  const divisor = gcd(width, height);
  return `${Math.round(width / divisor)}:${Math.round(height / divisor)}`;
}

function normalizedImageMetadata(target = {}, options = {}) {
  const safeTarget = target && typeof target === "object" ? target : {};
  const width = Number(safeTarget.naturalWidth) || 0;
  const height = Number(safeTarget.naturalHeight) || 0;
  const metadataTarget = { naturalWidth: width, naturalHeight: height };
  const pageUrl = typeof safeTarget.pageUrl === "string" && safeTarget.pageUrl.trim() ? safeTarget.pageUrl.trim() : (options.missingPageUrl ?? "");
  const alt = typeof safeTarget.alt === "string" && safeTarget.alt.trim() ? safeTarget.alt.trim() : "N/A";
  return {
    width,
    height,
    pageUrl,
    alt,
    aspectRatio: aspectRatio(metadataTarget)
  };
}

function buildImageMetadataLines(target = {}, options = {}) {
  const metadata = normalizedImageMetadata(target, options);
  return [
    `Page URL: ${metadata.pageUrl}`,
    `Alt text: ${metadata.alt}`,
    `Image size: ${metadata.width || "unknown"}x${metadata.height || "unknown"}`,
    `Aspect ratio: ${metadata.aspectRatio}`
  ];
}

function buildReversePromptText(target = {}, options = {}) {
  return [
    ANALYSIS_PROMPT,
    "",
    "Analyze this image and output bilingual Chinese and English prompt JSON with recreation_prompt, prompt_core and negative_prompt.",
    "Prioritize accurate visual grounding, compositional logic and likely prompt reconstruction over creativity.",
    "Make the prompt detailed, concrete, and reproduction-oriented. Avoid short summaries.",
    ...buildImageMetadataLines(target, options)
  ].join("\n");
}

function manualReversePrompt(target = {}) {
  return buildReversePromptText(target, { missingPageUrl: "N/A" });
}

async function postChatCompletions(settings, payload, retries = 1) {
  const response = await fetchWithRetry(
    chatCompletionsUrl(settings.baseUrl),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.apiKey.trim()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    },
    retries,
    ANALYSIS_TIMEOUT_MS
  );
  if (!response.ok) {
    const body = await response.text();
    throw new AnalysisError(`Custom API request failed (${response.status}) ${body || response.statusText}`.trim(), {
      code: "ANALYSIS_FAILED",
      action: { type: "open-settings", label: "Open settings" }
    });
  }
  return response.json();
}

async function repairJson(settings, rawText) {
  const prompt = [
    "Repair the following ImagePrompt response into valid JSON.",
    "Return valid JSON only. No markdown fences.",
    "Use the exact ImagePrompt schema from the original request.",
    "Do not add new visual details. Preserve existing prompt text, close broken strings safely, and fill missing required fields concisely.",
    "",
    rawText.slice(0, 18000)
  ].join("\n");
  const payload = adjustedPayload(
    settings,
    {
      model: settings.model.trim(),
      temperature: 0,
      max_tokens: adjustedMaxTokens(settings, 2600),
      messages: [{ role: "user", content: prompt }]
    },
    { jsonMode: true }
  );
  const json = await postChatCompletions(settings, payload);
  const repaired = extractChoiceText(json);
  if (!repaired) {
    throw new AnalysisError("The custom API returned no repair text.", { code: "ANALYSIS_FAILED" });
  }
  return parseAnalysis(repaired);
}

async function repairLanguages(settings, rawText) {
  const prompt = [
    "Repair the following ImagePrompt JSON so every language bucket is correct.",
    "Return valid JSON only. No markdown fences.",
    "Do not add new visual details. Only translate or move existing content into the correct fields.",
    "Required language mapping:",
    "- zh.prompt, zh.analysis and zh_style_tags: Simplified Chinese.",
    "- en.prompt, en.analysis and en_style_tags: English.",
    "- json_prompt, recreation_prompt, prompt_core and negative_prompt: English.",
    "Return the exact ImagePrompt schema from the original request.",
    "Return exactly 4 style tags for Chinese and English.",
    "",
    rawText.slice(0, 24000)
  ].join("\n");
  const payload = adjustedPayload(
    settings,
    {
      model: settings.model.trim(),
      temperature: 0,
      max_tokens: adjustedMaxTokens(settings, 5200),
      messages: [{ role: "user", content: prompt }]
    },
    { jsonMode: true }
  );
  const json = await postChatCompletions(settings, payload);
  const repaired = extractChoiceText(json);
  if (!repaired) {
    throw new AnalysisError("The custom API returned no language repair text.", { code: "ANALYSIS_FAILED" });
  }
  const analysis = parseAnalysis(repaired);
  if (hasMixedLanguages(analysis)) {
    throw new AnalysisError("The custom API returned prompt JSON with mixed-up language fields after repair.", { code: "ANALYSIS_FAILED" });
  }
  return analysis;
}

async function analyzeWithCustomApi(settings, target, image) {
  validateSettings(settings);
  const prompt = buildReversePromptText(target, { missingPageUrl: "" });
  const payload = adjustedPayload(
    settings,
    {
      model: settings.model.trim(),
      temperature: 0.18,
      max_tokens: adjustedMaxTokens(settings, 8192),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${image.mimeType};base64,${image.data}` } }
          ]
        }
      ]
    },
    { jsonMode: true }
  );

  const json = await postChatCompletions(settings, payload);
  const rawText = extractChoiceText(json);
  const extracted = extractJsonText(rawText);
  if (!extracted) {
    throw new AnalysisError("The custom API returned no prompt text. Check that the model supports image input and that the Base URL uses an OpenAI-compatible chat completions endpoint.", { code: "ANALYSIS_FAILED" });
  }

  try {
    const analysis = parseAnalysis(extracted);
    return hasMixedLanguages(analysis) ? repairLanguages(settings, rawText || extracted) : analysis;
  } catch (error) {
    try {
      const repaired = await repairJson(settings, rawText || extracted);
      return hasMixedLanguages(repaired) ? repairLanguages(settings, JSON.stringify(repaired)) : repaired;
    } catch {
      throw new AnalysisError(`The model responded, but ImagePrompt could not read a valid prompt JSON from it. ${error instanceof Error ? error.message : "Unknown JSON parse error"}. Response preview: ${compact(extracted)}`, { code: "ANALYSIS_FAILED" });
    }
  }
}

async function runAnalysis(target) {
  const settings = await loadSettings();
  if (settings.apiEnabled === false) {
    throw new AnalysisError("API analysis is disabled. Enable API enabled or use the no-API workflow.", { code: "API_DISABLED" });
  }
  validateSettings(settings);
  const image = await prepareImage(target);
  return analyzeWithCustomApi(settings, target, image);
}

async function testConnection(settings) {
  validateSettings(settings);
  const prompt = [
    "This is an ImagePrompt custom API compatibility test.",
    "You will receive a small inline image so ImagePrompt can verify this model accepts image input.",
    "Return valid JSON only.",
    "Return exactly this JSON shape with non-empty string values:",
    '{"zh":{"prompt":"一个连接测试提示词","analysis":"一个连接测试说明"},"en":{"prompt":"one English prompt","analysis":"one English analysis"},"zh_style_tags":["测试"],"en_style_tags":["minimal"],"json_prompt":{"subject":"connection test","action_pose":"static","details_appearance":"simple","environment_background":"plain","lighting_atmosphere":"neutral","composition_framing":"centered","style_camera":"minimal test","colors":["white"],"materials":["digital"],"aspect_ratio":"1:1","quality_modifiers":["simple"],"likely_generation_intent":"connection test"},"recreation_prompt":"A minimal connection test prompt.","prompt_core":"connection test","negative_prompt":"noise"}'
  ].join("\n");
  const payload = adjustedPayload(
    settings,
    {
      model: settings.model.trim(),
      temperature: 0,
      max_tokens: 1600,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAFklEQVR4nGP4TyFgGDVg1IBRA4aLAQBdePwur/3haQAAAABJRU5ErkJggg==" } }
          ]
        }
      ]
    },
    { jsonMode: true }
  );
  const json = await postChatCompletions(settings, payload);
  const rawText = extractChoiceText(json);
  if (!rawText) {
    throw new AnalysisError("Custom API responded, but no message text was returned. Check whether this model supports OpenAI-compatible vision chat completions.", { code: "ANALYSIS_FAILED" });
  }
  try {
    parseAnalysis(rawText);
  } catch (error) {
    throw new AnalysisError(`Custom API responded, but it did not return the prompt JSON ImagePrompt needs. ${error instanceof Error ? error.message : "Unknown JSON parse error"}. Response preview: ${compact(rawText)}`, { code: "ANALYSIS_FAILED" });
  }
}

function isAnalysisError(error) {
  return error instanceof AnalysisError;
}

function runtimeErrorMessage(fallback) {
  return chrome.runtime.lastError?.message || fallback;
}

function sendTabMessage(tabId, message, frameId) {
  return new Promise((resolve, reject) => {
    const callback = () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve();
    };
    if (typeof frameId === "number") {
      chrome.tabs.sendMessage(tabId, message, { frameId }, callback);
      return;
    }
    chrome.tabs.sendMessage(tabId, message, callback);
  });
}

const CONTENT_SCRIPT_FILES = [
  "content/00-i18n.js",
  "content/01-state.js",
  "content/02-styles.js",
  "content/03-history.js",
  "content/04-targets.js",
  "content/05-render.js",
  "content/06-manual.js",
  "content/07-screenshot.js",
  "content/08-actions.js",
  "content/09-analysis.js",
  "content/99-bootstrap.js"
];

async function sendTabMessageWithRetry(tabId, message, frameId, attempts = 4) {
  let lastError;
  for (let index = 0; index < attempts; index += 1) {
    try {
      await sendTabMessage(tabId, message, frameId);
      return;
    } catch (error) {
      lastError = error;
      if (index < attempts - 1) await delay(120 * (index + 1));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Failed to send message to tab.");
}

async function openPanel(tabId, srcUrl, frameId, preferLatest = false, autoSaveToHistory = false, analyzeCurrentPage = false, centerPanel = false) {
  const message = {
    type: "OPEN_PANEL",
    payload: { srcUrl, preferLatest, autoSaveToHistory, analyzeCurrentPage, centerPanel }
  };
  try {
    await sendTabMessage(tabId, message, frameId);
  } catch {
    await chrome.scripting.executeScript({
      target: typeof frameId === "number" ? { tabId, frameIds: [frameId] } : { tabId },
      files: CONTENT_SCRIPT_FILES
    });
    await sendTabMessageWithRetry(tabId, message, frameId);
  }
}

function captureVisibleTab(windowId) {
  return new Promise((resolve, reject) => {
    const options = { format: "png" };
    const callback = (dataUrl) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      if (!dataUrl) {
        reject(new Error("Could not capture the visible tab."));
        return;
      }
      resolve(dataUrl);
    };
    if (typeof windowId === "number") {
      chrome.tabs.captureVisibleTab(windowId, options, callback);
      return;
    }
    chrome.tabs.captureVisibleTab(options, callback);
  });
}

function refreshContextMenu(enabled) {
  chrome.contextMenus.removeAll(() => {
    chrome.runtime.lastError;
    if (!enabled) return;
    chrome.contextMenus.create(
      {
        id: CONTEXT_MENU_ID,
        title: "Analyze image with ImagePrompt",
        contexts: ["image", "page"]
      },
      () => {
        chrome.runtime.lastError;
      }
    );
  });
}

async function refreshEnabledState() {
  const settings = await loadSettings();
  refreshContextMenu(settings.enabled);
  await chrome.action.setBadgeText({ text: settings.enabled ? "" : OFF_BADGE });
  await chrome.action.setBadgeBackgroundColor({ color: settings.enabled ? "#00000000" : "#2b313d" });
}

async function openExtensionPopup() {
  try {
    if (typeof chrome.action.openPopup === "function") {
      await chrome.action.openPopup();
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

async function openSettingsPage() {
  if (typeof chrome.runtime.openOptionsPage === "function") {
    await chrome.runtime.openOptionsPage();
    return true;
  }
  await chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
  return true;
}

async function ensureLocalDefaults() {
  const [sync, local] = await Promise.all([
    chrome.storage.sync.get(["enabled", "systemLanguage", "defaultLanguage"]),
    chrome.storage.local.get(["serviceMode", "apiEnabled"])
  ]);
  const syncPatch = {};
  if (typeof sync.enabled !== "boolean") syncPatch.enabled = true;
  if (!VALID_LANGUAGES.has(sync.defaultLanguage)) syncPatch.defaultLanguage = "en";
  if (!VALID_LANGUAGES.has(sync.systemLanguage)) syncPatch.systemLanguage = syncPatch.defaultLanguage || sync.defaultLanguage || "en";

  const localPatch = {};
  if (local.serviceMode !== "custom_api") localPatch.serviceMode = "custom_api";
  if (typeof local.apiEnabled !== "boolean") localPatch.apiEnabled = true;

  await Promise.all([
    Object.keys(syncPatch).length ? chrome.storage.sync.set(syncPatch) : Promise.resolve(),
    Object.keys(localPatch).length ? chrome.storage.local.set(localPatch) : Promise.resolve()
  ]);
}

refreshEnabledState();

chrome.runtime.onInstalled.addListener(() => {
  (async () => {
    await ensureLocalDefaults();
    await refreshEnabledState();
  })();
});

chrome.runtime.onStartup.addListener(() => {
  refreshEnabledState();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && Object.prototype.hasOwnProperty.call(changes, "enabled")) {
    refreshEnabledState();
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !tab?.id) return;
  (async () => {
    if (!(await loadSettings()).enabled) return;
    await openPanel(tab.id, info.srcUrl, typeof info.frameId === "number" ? info.frameId : undefined, false, Boolean(info.srcUrl));
  })();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "RUN_ANALYSIS") {
    (async () => {
      try {
        sendResponse({ ok: true, data: await runAnalysis(message.payload.target) });
      } catch (error) {
        const response = isAnalysisError(error)
          ? { ok: false, error: error.message, code: error.code, action: error.action }
          : { ok: false, error: error instanceof Error ? error.message : "Analysis failed. Please try again in a moment." };
        sendResponse(response);
      }
    })();
    return true;
  }

  if (message.type === "FETCH_CLIPBOARD_IMAGE") {
    (async () => {
      try {
        sendResponse({ ok: true, data: await prepareClipboardImage(message.payload.target) });
      } catch (error) {
        sendResponse({ ok: false, error: error instanceof Error ? error.message : "Could not prepare this image for copying." });
      }
    })();
    return true;
  }

  if (message.type === "CAPTURE_VISIBLE_TAB") {
    (async () => {
      try {
        sendResponse({ ok: true, data: { dataUrl: await captureVisibleTab(sender.tab?.windowId) } });
      } catch (error) {
        sendResponse({ ok: false, error: error instanceof Error ? error.message : "Could not capture the current page." });
      }
    })();
    return true;
  }

  if (message.type === "GET_MANUAL_REVERSE_PROMPT") {
    try {
      sendResponse({ ok: true, data: { prompt: manualReversePrompt(message.payload?.target) } });
    } catch (error) {
      sendResponse({ ok: false, error: error instanceof Error ? error.message : "Could not build the prompt." });
    }
    return true;
  }

  if (message.type === "TEST_CONNECTION") {
    (async () => {
      try {
        const settings = await loadSettings();
        await testConnection(settings);
        sendResponse({ ok: true, data: { ok: true } });
      } catch (error) {
        const response = isAnalysisError(error)
          ? { ok: false, error: error.message, code: error.code, action: error.action }
          : { ok: false, error: error instanceof Error ? error.message : "Connection test failed." };
        sendResponse(response);
      }
    })();
    return true;
  }

  if (message.type === "OPEN_SETTINGS" || message.type === "OPEN_POPUP") {
    (async () => {
      try {
        const opened = await openSettingsPage();
        sendResponse({ ok: true, data: { opened: true, options: opened } });
      } catch (error) {
        sendResponse({ ok: false, error: error instanceof Error ? error.message : runtimeErrorMessage("Failed to open settings.") });
      }
    })();
    return true;
  }

  if (message.type === "OPEN_ACTIVE_PANEL") {
    (async () => {
      try {
        if (!(await loadSettings()).enabled) throw new Error("The extension is currently turned off. Enable it in the popup first.");
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) throw new Error("Could not find the current tab.");
        await openPanel(tab.id, undefined, undefined, true, false, true, true);
        sendResponse({ ok: true, data: { opened: true } });
      } catch (error) {
        sendResponse({ ok: false, error: error instanceof Error ? error.message : "Failed to open the panel." });
      }
    })();
    return true;
  }

  return false;
});
