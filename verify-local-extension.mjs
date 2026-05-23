import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.join(process.cwd(), "ImagePrompt");
const errors = [];

function fail(message) {
  errors.push(message);
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function assertNoPattern(rel, pattern, label) {
  const text = read(rel);
  if (pattern.test(text)) fail(`${rel} still contains ${label}`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function maskStringsAndComments(source) {
  let masked = "";
  let index = 0;
  let state = "code";
  let quote = "";
  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    if (state === "code") {
      if (char === "/" && next === "/") {
        masked += "  ";
        index += 2;
        state = "line-comment";
        continue;
      }
      if (char === "/" && next === "*") {
        masked += "  ";
        index += 2;
        state = "block-comment";
        continue;
      }
      if (char === "\"" || char === "'") {
        masked += " ";
        index += 1;
        quote = char;
        state = "string";
        continue;
      }
      if (char === "`") {
        masked += " ";
        index += 1;
        state = "template";
        continue;
      }
      masked += char;
      index += 1;
      continue;
    }
    if (state === "line-comment") {
      masked += char === "\n" ? "\n" : " ";
      if (char === "\n") state = "code";
      index += 1;
      continue;
    }
    if (state === "block-comment") {
      masked += char === "\n" ? "\n" : " ";
      if (char === "*" && next === "/") {
        masked += " ";
        index += 2;
        state = "code";
      } else {
        index += 1;
      }
      continue;
    }
    if (state === "string") {
      masked += char === "\n" ? "\n" : " ";
      if (char === "\\") {
        masked += next === "\n" ? "\n" : " ";
        index += 2;
        continue;
      }
      if (char === quote) state = "code";
      index += 1;
      continue;
    }
    if (state === "template") {
      masked += char === "\n" ? "\n" : " ";
      if (char === "\\") {
        masked += next === "\n" ? "\n" : " ";
        index += 2;
        continue;
      }
      if (char === "`") state = "code";
      index += 1;
      continue;
    }
  }
  return masked;
}

const compressedLocalNameDenylist = new Set([
  "e", "t", "n", "a", "i", "r", "o", "s", "c", "d", "g", "p", "x", "h", "u",
  "A", "P", "L", "I", "U", "V",
  "value", "secondaryValue", "candidateValue", "itemValue", "itemIndex",
  "resultValue", "optionValue", "stateValue", "contentValue", "detailValue",
  "groupValue", "htmlValue", "lineHeightValue", "gapValue", "positionValue",
  "listValue", "elementValue", "altValue", "xCoord",
  "en", "zh", "ve",
  "Rt", "ne", "we", "jt", "Dt", "st", "va", "Tn", "En", "xa", "rr", "wa", "or",
  "sr", "lr", "cr", "dr", "pr", "ur", "gr", "cl", "ya", "nr", "ol", "sl", "ar", "ir", "ll", "An", "kn", "rl"
]);

function isCompressedLocalName(name) {
  return compressedLocalNameDenylist.has(name) || /^[A-Z]$/.test(name) || /^[a-z]$/.test(name);
}

function lineNumberAt(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function scanDeclarationNames(maskedSource, source, rel) {
  const findings = [];
  const declarationPattern = /\b(?:const|let|var)\s+/g;
  let match;
  while ((match = declarationPattern.exec(maskedSource))) {
    let cursor = declarationPattern.lastIndex;
    let depth = 0;
    while (cursor < maskedSource.length) {
      while (/\s/.test(maskedSource[cursor] ?? "")) cursor += 1;
      const nameStart = cursor;
      const nameMatch = /^[A-Za-z_$][\w$]*/.exec(maskedSource.slice(cursor));
      if (nameMatch) {
        const name = nameMatch[0];
        if (isCompressedLocalName(name)) {
          findings.push(`${rel}:${lineNumberAt(source, nameStart)} declaration ${name}`);
        }
        cursor += name.length;
      }
      while (cursor < maskedSource.length) {
        const char = maskedSource[cursor];
        if (char === "{" || char === "(" || char === "[") depth += 1;
        else if (char === "}" || char === ")" || char === "]") depth = Math.max(0, depth - 1);
        else if (depth === 0 && (char === "," || char === ";")) break;
        cursor += 1;
      }
      if (maskedSource[cursor] === ",") {
        cursor += 1;
        continue;
      }
      break;
    }
  }
  return findings;
}

function splitParameterList(parameterList) {
  const parameters = [];
  let current = "";
  let depth = 0;
  for (const char of parameterList) {
    if (char === "{" || char === "(" || char === "[") depth += 1;
    else if (char === "}" || char === ")" || char === "]") depth = Math.max(0, depth - 1);
    if (char === "," && depth === 0) {
      parameters.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  parameters.push(current);
  return parameters;
}

function scanParameterNames(maskedSource, source, rel) {
  const findings = [];
  const scanNamedList = (pattern, label) => {
    let match;
    while ((match = pattern.exec(maskedSource))) {
      const list = match[1];
      for (const parameter of splitParameterList(list)) {
        const name = parameter.trim().replace(/^\.{3}/, "").replace(/\s*=.*$/, "");
        if (/^[A-Za-z_$][\w$]*$/.test(name) && isCompressedLocalName(name)) {
          findings.push(`${rel}:${lineNumberAt(source, match.index)} ${label} ${name}`);
        }
      }
    }
  };
  scanNamedList(/\bfunction\s+[A-Za-z_$][\w$]*\s*\(([^)]*)\)/g, "parameter");
  scanNamedList(/\bconstructor\s*\(([^)]*)\)/g, "constructor parameter");
  scanNamedList(/\(([^(){};]*)\)\s*=>/g, "arrow parameter");
  let match;
  const singleArrowPattern = /(?:^|[^\w$])([A-Za-z_$][\w$]*)\s*=>/g;
  while ((match = singleArrowPattern.exec(maskedSource))) {
    const name = match[1];
    if (isCompressedLocalName(name)) {
      findings.push(`${rel}:${lineNumberAt(source, match.index)} arrow parameter ${name}`);
    }
  }
  const catchPattern = /\bcatch\s*\(\s*([A-Za-z_$][\w$]*)\s*\)/g;
  while ((match = catchPattern.exec(maskedSource))) {
    const name = match[1];
    if (isCompressedLocalName(name)) {
      findings.push(`${rel}:${lineNumberAt(source, match.index)} catch parameter ${name}`);
    }
  }
  return findings;
}

// Manifest and extension package checks.
const manifest = JSON.parse(read("manifest.json"));
const expectedContentScripts = [
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
const manifestContentScripts = manifest.content_scripts?.[0]?.js ?? [];
assert(manifest.name === "ImagePrompt - Local Image to Prompt", "manifest name is not ImagePrompt");
assert(manifest.version === "0.1", "manifest version is not 0.1");
assert(manifest.action?.default_title === "ImagePrompt", "manifest action title is not ImagePrompt");
assert(!JSON.stringify(manifest).includes("PromptCard"), "manifest still contains old brand");
assert(!manifest.permissions?.includes("identity"), "manifest still requests identity permission");
assert(!Object.prototype.hasOwnProperty.call(manifest, "update_url"), "manifest still has update_url");
assert(JSON.stringify(manifestContentScripts) === JSON.stringify(expectedContentScripts), "manifest content scripts are not the expected ordered module list");
assert(!manifestContentScripts.includes("content.js"), "manifest still loads the monolithic content.js");
assert(manifestContentScripts.at(-1) === "content/99-bootstrap.js", "content bootstrap script must load last");
for (const rel of expectedContentScripts) {
  assert(fs.existsSync(path.join(root, rel)), `${rel} is missing`);
}

// Removed hosted-service artifacts and forbidden third-party remnants.
const scannedFiles = [
  "manifest.json",
  "background.js",
  "settings-shared.js",
  "popup.js",
  "popup.html",
  "options.js",
  "options.html",
  "privacy.html",
  ...expectedContentScripts
];

const removedFiles = [
  "support.html",
  "billing-success.html",
  "billing-cancel.html",
  "wechat-pay.html",
  "index.html",
  "site.js"
];

for (const rel of removedFiles) {
  assert(!fs.existsSync(path.join(root, rel)), `${rel} should be removed`);
}

assert(!fs.existsSync(path.join(root, "chunks")), "old chunks directory should be removed");

for (const rel of scannedFiles) {
  assertNoPattern(rel, /promptcard/gi, "old brand");
  assertNoPattern(rel, /swlpidccgyzvkuvghlac/g, "hosted Supabase project id");
  assertNoPattern(rel, /supabase/gi, "Supabase");
  assertNoPattern(rel, /launchWebAuthFlow/g, "Chrome identity auth flow");
  assertNoPattern(rel, /create-credit-order|load-dashboard|reset-credits-admin/g, "hosted billing/dashboard call");
  assertNoPattern(rel, /\bStripe\b|\bWeChat\b|Google sign-in|\bOTP\b/g, "login or billing wording");
}

// Background/service-worker behavior checks.
const background = read("background.js");
assert(/chat\/completions/.test(background), "background does not call chat/completions");
assert(/RUN_ANALYSIS/.test(background), "background no longer handles RUN_ANALYSIS");
assert(/TEST_CONNECTION/.test(background), "background no longer handles TEST_CONNECTION");
assert(/openOptionsPage/.test(background), "background does not open the full options page for settings");
assert(/manualReversePrompt/.test(background), "background does not expose a manual GPT reverse-prompt builder");
assert(/function buildImageMetadataLines\(/.test(background), "background does not centralize image metadata prompt lines");
assert(/function buildReversePromptText\(/.test(background), "background does not centralize reverse-prompt construction");
assert(/function manualReversePrompt\([\s\S]*buildReversePromptText/.test(background), "manual GPT prompt does not use the shared reverse-prompt builder");
assert(/function analyzeWithCustomApi\([\s\S]*buildReversePromptText/.test(background), "API analysis prompt does not use the shared reverse-prompt builder");
assert(/GET_MANUAL_REVERSE_PROMPT/.test(background), "background does not handle manual GPT prompt requests");
assert(/apiEnabled/.test(background), "background does not read or initialize the API enabled setting");
assert(/CONTENT_SCRIPT_FILES/.test(background), "background does not use the shared content module injection list");
for (const rel of expectedContentScripts) {
  assert(background.includes(`"${rel}"`), `background injection list is missing ${rel}`);
}
assert(!/Upload or paste the target image into GPT/.test(background), "manual GPT prompt still includes upload instructions in copied text");
assert(/VALID_LANGUAGES\s*=\s*new Set\(\["en",\s*"zh"\]\)/.test(background), "background still accepts Japanese as a UI language");
assert(!/"ja"\s*:|ja_style_tags|Japanese/.test(background), "background still asks the model for Japanese output");
assert(!/defaultGeneratorSite|GENERATOR_SITES|OPEN_GENERATOR_SITE|AUTOFILL_GENERATOR_PROMPT|openGeneratorSite|VALID_GENERATORS/.test(background), "background still contains generator site/default generator functionality");

// Shared settings module and popup checks.
const popup = read("popup.js");
const settingsSharedPath = path.join(root, "settings-shared.js");
const settingsShared = fs.existsSync(settingsSharedPath) ? read("settings-shared.js") : "";
const popupSurface = `${popup}\n${settingsShared}`;
assert(fs.existsSync(settingsSharedPath), "settings-shared.js is missing");
assert(/export const LANGUAGE_OPTIONS/.test(settingsShared), "settings shared module does not export language options");
assert(/export const DEFAULTS/.test(settingsShared), "settings shared module does not export defaults");
assert(/export const UI_TEXT/.test(settingsShared), "settings shared module does not export settings UI text");
assert(/export async function loadSettings/.test(settingsShared), "settings shared module does not export loadSettings");
assert(/export async function saveSettings/.test(settingsShared), "settings shared module does not export saveSettings");
assert(/export function currentSettings/.test(settingsShared), "settings shared module does not export currentSettings");
assert(/apiEnabled/.test(popupSurface), "popup does not persist API enabled");
assert(/from "\.\/settings-shared\.js"/.test(popup), "popup does not import the shared settings module");
assert(!/const DEFAULTS\s*=/.test(popup), "popup still owns shared settings defaults");
assert(!/const UI_TEXT\s*=/.test(popup), "popup still owns shared settings UI text");
assert(/API enabled/.test(popupSurface), "popup does not expose API enabled switch");
assert(/sharedPanelSession/.test(popupSurface), "popup does not read or write the shared panel session");
assert(/inlineActionsEnabled/.test(popupSurface), "popup does not persist the floating menu and analysis switch");
assert(/悬浮与分析/.test(popupSurface), "popup does not expose the floating menu and analysis switch");
assert(/Overlay and analysis/.test(popupSurface), "popup does not localize the floating menu and analysis switch for English");
assert(/uiText\(settings\.language\)/.test(popup), "popup does not render settings labels from the selected language");
assert(/Base URL/.test(popupSurface), "popup does not expose Base URL");
assert(/API Key/.test(popupSurface), "popup does not expose API Key");
assert(/Model/.test(popupSurface), "popup does not expose Model");
assert(/Open panel/.test(popupSurface), "popup does not expose Open panel");
assert(/body\s*\{[^}]*width:\s*720px[^}]*min-width:\s*720px[^}]*max-width:\s*720px/.test(popup), "popup body does not declare a fixed extension-popup width");
assert(!/100vw/.test(popup), "popup still uses viewport-relative width that can collapse in Chrome extension popups");
assert(!/value:\s*"ja"|日本語/.test(popup), "popup still exposes Japanese language selection");
assert(/\*,\s*\*::before,\s*\*::after/.test(popup), "popup does not apply universal border-box sizing");
assert(/\.actions\s*\{[\s\S]*display:\s*flex[\s\S]*flex-wrap:\s*wrap/.test(popup), "popup actions do not adapt button width to text");
assert(/\.actions\s*\{[^}]*min-width:\s*0[^}]*max-width:\s*100%/.test(popup), "popup actions can overflow the popup");
assert(/input:not\(\[type="checkbox"\]\),\s*select/.test(popup), "popup text inputs/selects should not share styles with checkboxes");
assert(!/input,\s*select\s*\{/.test(popup), "popup still applies text input styles to every input type");
assert(/button\s*\{[\s\S]*width:\s*max-content[\s\S]*max-width:\s*100%/.test(popup), "popup buttons do not size to their text content");
assert(/button\s*\{[\s\S]*white-space:\s*nowrap/.test(popup), "popup buttons can wrap onto multiple lines");
assert(!/button\s*\{[\s\S]*overflow-wrap:\s*anywhere/.test(popup), "popup buttons still allow breaking words anywhere");
assert(/input\[type="checkbox"\]/.test(popup), "popup checkbox is affected by full-width input styles");
assert(!/Default generator site|defaultGeneratorSite|GENERATOR_OPTIONS|jimeng|gemini|midjourney|lovart/.test(popup), "popup still exposes default generator site settings");

// Options-page checks.
const options = read("options.js");
const optionsSurface = `${options}\n${settingsShared}`;
assert(/apiEnabled/.test(optionsSurface), "options does not persist API enabled");
assert(/from "\.\/settings-shared\.js"/.test(options), "options does not import the shared settings module");
assert(!/const DEFAULTS\s*=/.test(options), "options still owns shared settings defaults");
assert(!/const UI_TEXT\s*=/.test(options), "options still owns shared settings UI text");
assert(/API enabled/.test(optionsSurface), "options does not expose API enabled switch");
assert(/sharedPanelSession/.test(optionsSurface), "options does not read or write the shared panel session");
assert(/inlineActionsEnabled/.test(optionsSurface), "options does not persist the floating menu and analysis switch");
assert(/功能开关/.test(optionsSurface), "options does not show a dedicated feature switch section");
assert(/Feature switches/.test(optionsSurface), "options does not localize the feature switch section for English");
assert(/悬浮与分析/.test(optionsSurface), "options does not expose the floating menu and analysis switch label");
assert(/Overlay and analysis/.test(optionsSurface), "options does not localize the floating menu and analysis switch for English");
assert(/网页悬浮菜单和图片分析入口/.test(optionsSurface), "options does not explain what the floating menu and analysis switch controls");
assert(/Floating menu and image analysis entry/.test(optionsSurface), "options does not localize the floating menu and analysis switch description for English");
assert(/uiText\(settings\.language\)/.test(options), "options does not render settings labels from the selected language");
assert(/id="inlineActionsEnabled"/.test(options), "options floating menu and analysis switch input is missing");
assert(/class="switch-list"/.test(options), "options feature switches are not grouped visibly");
assert(/class="switch-item"/.test(options), "options feature switch rows are not rendered as visible items");
assert(/body\s*\{[^}]*min-width:\s*760px[^}]*overflow-x:\s*auto/.test(options), "options body does not protect the settings page from tiny embedded viewports");
assert(/#root\s*\{[^}]*min-width:\s*760px/.test(options), "options root does not preserve a usable settings width");
assert(/\.page\s*\{[^}]*width:\s*min\(1280px,\s*calc\(100% - 32px\)\)[^}]*min-width:\s*720px[^}]*max-width:\s*1280px/.test(options), "options page does not use a stable non-100vw width");
assert(!/100vw/.test(options), "options still uses viewport-relative width that can collapse in embedded options views");
assert(!/width:\s*min\(1040px,\s*calc\(100% - 32px\)\)/.test(options), "options page still caps width at 1040px");
assert(/\.form\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(options), "options form is not using a wide two-column layout");
assert(/\.form\s*\{[\s\S]*min-width:\s*0/.test(options), "options form can overflow the page");
assert(/\.form\s*\{[^}]*max-width:\s*100%/.test(options), "options form is not constrained to the page width");
assert(/@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*\.form\s*\{[\s\S]*grid-template-columns:\s*1fr/.test(options), "options form does not collapse to one column on narrow screens");
assert(!/value:\s*"ja"|日本語/.test(options), "options still exposes Japanese language selection");
assert(/input:not\(\[type="checkbox"\]\),\s*select/.test(options), "options inputs still use a generic selector that affects checkbox sizing");
assert(/label\.field\s*\{[\s\S]*min-width:\s*0/.test(options), "options fields can be stretched by long input content");
assert(/label\.field\s*\{[^}]*max-width:\s*100%/.test(options), "options fields are not constrained inside their grid cells");
assert(/input:not\(\[type="checkbox"\]\),\s*select\s*\{[\s\S]*min-width:\s*0[\s\S]*max-width:\s*100%/.test(options), "options text inputs/selects are not constrained inside their grid cells");
assert(!/input,\s*select\s*\{/.test(options), "options still applies full-width input styles to every input type");
assert(!/input\[type="checkbox"\]\s*\{/.test(options), "options still uses a checkbox width workaround");
assert(/\.actions\s*\{[\s\S]*display:\s*flex[\s\S]*flex-wrap:\s*wrap/.test(options), "options actions do not adapt button width to text");
assert(/\.actions\s*\{[^}]*min-width:\s*0[^}]*max-width:\s*100%/.test(options), "options actions can overflow the form");
assert(/button\s*\{[\s\S]*width:\s*max-content[\s\S]*max-width:\s*100%/.test(options), "options buttons do not size to their text content");
assert(/button\s*\{[\s\S]*white-space:\s*nowrap/.test(options), "options buttons can wrap onto multiple lines");
assert(!/button\s*\{[\s\S]*overflow-wrap:\s*anywhere/.test(options), "options buttons still allow breaking words anywhere");
assert(!/Default generator site|defaultGeneratorSite|GENERATOR_OPTIONS|jimeng|gemini|midjourney|lovart/.test(options), "options still exposes default generator site settings");

// HTML entrypoint cache-busting checks.
const optionsHtml = read("options.html");
const popupHtml = read("popup.html");
assert(/options\.js\?v=0\.1/.test(optionsHtml), "options HTML does not version the options script URL");
assert(/popup\.js\?v=0\.1/.test(popupHtml), "popup HTML does not version the popup script URL");

// Content-panel behavior and workflow checks.
const content = expectedContentScripts.map((rel) => read(rel)).join("\n");

function contentCssRuleBlock(selectorPattern) {
  const match = new RegExp(`(?:^|\\n)\\s*${selectorPattern}\\s*\\{([\\s\\S]*?)\\n\\s*\\}`, "m").exec(content);
  return match ? match[1] : "";
}

function assertContentCssRule(selectorPattern, requiredPatterns, message) {
  const ruleBlock = contentCssRuleBlock(selectorPattern);
  assert(ruleBlock && requiredPatterns.every((pattern) => pattern.test(ruleBlock)), message);
}

function contentFunctionSlice(functionName) {
  const functionPattern = new RegExp(`\\b(?:async\\s+)?function\\s+${escapeRegExp(functionName)}\\s*\\(`);
  const match = functionPattern.exec(content);
  if (!match) return "";
  const rest = content.slice(match.index + 1);
  const nextMatch = /\n(?:async\s+)?function\s+[A-Za-z_$][\w$]*\s*\(/.exec(rest);
  return content.slice(match.index, nextMatch ? match.index + 1 + nextMatch.index : content.length);
}

function assertNoGenericHotspotNames(functionName) {
  const functionSource = contentFunctionSlice(functionName);
  assert(functionSource, `content hotspot ${functionName} is missing`);
  const blockedNames = ["value", "secondaryValue", "candidateValue", "itemValue", "itemIndex"].filter((name) =>
    new RegExp(`\\b${name}\\b`).test(functionSource)
  );
  assert(
    blockedNames.length === 0,
    `content hotspot ${functionName} still uses generic names: ${blockedNames.join(", ")}`
  );
}

for (const rel of expectedContentScripts) {
  const source = read(rel);
  const longestLine = Math.max(...source.split(/\r?\n/).map((line) => line.length));
  assert(longestLine <= 240, `${rel} still has a line longer than 240 characters`);
  const maskedSource = maskStringsAndComments(source);
  const compressedLocalFindings = [
    ...scanDeclarationNames(maskedSource, source, rel),
    ...scanParameterNames(maskedSource, source, rel)
  ];
  assert(
    compressedLocalFindings.length === 0,
    `content still declares compressed local names:\n${compressedLocalFindings.slice(0, 40).join("\n")}`
  );
}
const promptTokenFlow = content.slice(
  content.indexOf("function appendPromptToken"),
  content.indexOf("function loadImageForCanvas")
);
assert(promptTokenFlow && !/targetPoint/.test(promptTokenFlow), "content share prompt tokenization still contains targetPoint regex pollution");
assert(!/\$\{[A-Za-z_$][\w$]*:\s*[A-Za-z_$][\w$]*\}|\/itemIndex\b|\\stateValue\b|\/groupValue\b|overflow-hidden/.test(content), "content contains malformed rewrite artifacts");
[
  "roundedRectPath",
  "drawImageCover",
  "wrapCanvasText",
  "fitTagChips",
  "rectFromPoints",
  "positionScreenshotActions",
  "captureWithScreenshotShield",
  "cropScreenshotCapture",
  "closestImageElement",
  "resolveImageTarget",
  "renderInlineActionMenu",
  "animateHistoryFlyoverToCard",
  "showAnalysisEntry",
  "renderLanguageToggle",
  "historyThumbSize"
].forEach(assertNoGenericHotspotNames);
assert(/var\s+PANEL_WIDTH\s*=\s*360/.test(content), "content panel width is not set to 360px");
assert(/var\s+PANEL_WIDTH\s*=\s*360,\s*PANEL_HEIGHT\s*=\s*520,\s*MINIMIZED_PANEL_WIDTH\s*=\s*360/.test(content), "content minimized panel width is not constrained to 360px");
assert(/__imagetopromptV2Loaded__/.test(content), "content modules do not retain the duplicate-load guard");
assert(!/\b(?:H|ai|ln|gn|wi|Xs|Vs|dl)\b/.test(content), "content still contains stale renamed identifiers from active UI paths");
const remainingCompressedTopLevelFunctions = [
  "R", "on", "eo", "no", "ao", "$e", "ee", "ui", "ta", "it",
  "y", "Ra", "Tr", "ja", "Er", "Fn", "Da", "Oa", "Y", "_n", "Ir", "Un", "Cr", "Hr", "Mr", "Lr", "zr", "$r", "Ya", "jr", "St", "Dr", "_a", "Or", "Ua", "Ba", "Yr", "Fr", "me", "et", "Wa", "O", "_", "Bn", "qa", "Pt", "_r",
  "Eo", "mn", "Io", "Co", "Ho", "ia", "vi", "ce", "Mo", "Si", "Pi", "Lo", "zo", "rt", "Ht", "$o", "Ro", "jo", "Do", "Oo", "hn", "Yo", "Fo", "Ai", "ki", "Ti", "Ei", "ra", "_o", "Ii", "Uo", "Bo", "Wo", "bn", "oa", "qo", "Ci", "Hi", "No", "Mt", "ot", "E", "Mi", "sa", "Go", "Xo", "la", "te", "Vo", "Ko", "Li", "Jo", "zi", "Qo", "de", "$i", "yn", "Ri", "Zo", "es", "ts", "ji", "Di", "Oi", "Yi", "De", "is", "rs", "os",
  "_i", "Ui", "ye", "vn", "Bi", "ua", "Wi", "fs", "qi", "Lt", "Ni", "Gi", "ms", "hs", "bs", "ys", "xs", "vs", "Vi", "Ki", "Ls", "zs", "$s", "_s", "Us", "Oe", "Ns", "Gs",
  "ca", "ss", "cs", "ps", "$t"
];
for (const name of remainingCompressedTopLevelFunctions) {
  assert(
    !(new RegExp(`\\b(?:async\\s+)?function\\s+${escapeRegExp(name)}\\s*\\(`).test(content)),
    `content still declares compressed top-level function ${name}`
  );
}
const remainingCompressedSharedState = [
  "K", "_e", "m", "J", "ae", "Pe", "Ft",
  "dt", "pl", "ul", "gl",
  "pe", "B", "$n", "Ue", "j", "N", "ke", "Dn", "ut", "Te", "Ut", "gt", "ft", "Bt",
  "v", "C", "q", "F", "_t", "Rn", "pt", "jn", "Ha",
  "re", "Z", "ge", "oe", "Xt", "Ce", "He", "Vt", "La", "se",
  "We", "Wt", "qe", "mt", "Ne", "Ge", "qt", "On", "Xe", "Ee", "ht", "Ve", "Ma", "Yn", "ue", "ie", "Be", "Q"
];
const contentWithoutQuotedText = content
  .replace(/"(?:\\.|[^"\\])*"/g, "\"\"")
  .replace(/'(?:\\.|[^'\\])*'/g, "''")
  .replace(/`(?:\\.|[^`\\])*`/g, "``");
assert(
  !(new RegExp(`\\b(?:${remainingCompressedSharedState.map(escapeRegExp).join("|")})\\b`).test(contentWithoutQuotedText)),
  "content still contains compressed shared state names"
);
const expectedReadableContentNames = [
  "rootHost", "shadowRoot", "panelLayer", "inlineActionLayer", "toastLayer", "screenshotLayer", "isScreenshotSelecting",
  "panelMode", "panelPosition", "panelAnchor", "expandedPanelWidth", "dragPointerId", "dragOffset", "dragStartPoint", "hasDraggedPanel", "suppressPanelClickUntil",
  "hoveredElement", "hoveredTarget", "hoverPoint", "isInlineMenuHovered", "hoverHideTimer", "toastState", "toastHideTimer", "lastToastKey", "lastToastAt", "extensionEnabled",
  "historyLoadPromise", "historyLoaded", "isHistoryRailEntering", "pendingHistoryId", "preloadedHistoryIds", "historyFlyover", "historyScrollTop", "pendingHistoryScrollTop", "historyScrollRestoreTimer", "historyRailHeightFrame", "currentPromptDraft", "renderedPromptDraft", "promptDraftsByLanguage", "isPromptTyping",
  "clamp", "ensureContentRoot", "escapeHtml", "renderInlineActionMenu", "showToast", "savePanelSession", "applyExtensionEnabled", "loadExtensionEnabled", "isBlockedPage", "showAnalysisEntry", "renderHistoryButton", "renderScreenshotButton", "renderMinimizedPanel", "requestAnalysisFromBackground", "waitAnimationFrames", "handleUrlChange"
];
for (const name of expectedReadableContentNames) {
  assert(new RegExp(`\\b${escapeRegExp(name)}\\b`).test(content), `content is missing readable name ${name}`);
}
assert(/EXTENSION_TITLE/.test(content), "content title constant was not renamed to EXTENSION_TITLE");
assert(/function isBlockedPage\(/.test(content), "content blocked-page helper was not renamed");
assert(/function positionInlineActionMenu\(/.test(content), "content inline menu positioning helper was not renamed");
assert(/async function analyzeHoveredImage\(/.test(content), "content hover prompt action was not renamed");
assert(/async function openLatestOrAnalyzeHoveredImage\(/.test(content), "content hover open action was not renamed");
assert(/function isExtensionContextInvalidatedError\(/.test(content), "content does not detect invalidated extension contexts");
assert(/async function savePanelSession\([\s\S]*catch \([^)]+\)[\s\S]*isExtensionContextInvalidatedError/.test(content), "content panel session save does not handle invalidated extension contexts");
assert(/content module: i18n/.test(read("content/00-i18n.js")), "content i18n module is missing its responsibility marker");
assert(/content module: state/.test(read("content/01-state.js")), "content state module is missing its responsibility marker");
assert(/content module: styles/.test(read("content/02-styles.js")), "content styles module is missing its responsibility marker");
assert(/content module: history/.test(read("content/03-history.js")), "content history module is missing its responsibility marker");
assert(/content module: targets/.test(read("content/04-targets.js")), "content targets module is missing its responsibility marker");
assert(/content module: render/.test(read("content/05-render.js")), "content render module is missing its responsibility marker");
assert(/content module: manual workflow/.test(read("content/06-manual.js")), "content manual workflow module is missing its responsibility marker");
assert(/content module: screenshot and sharing/.test(read("content/07-screenshot.js")), "content screenshot module is missing its responsibility marker");
assert(/content module: actions/.test(read("content/08-actions.js")), "content actions module is missing its responsibility marker");
assert(/content module: analysis flow/.test(read("content/09-analysis.js")), "content analysis module is missing its responsibility marker");
assert(/content module: bootstrap/.test(read("content/99-bootstrap.js")), "content bootstrap module is missing its responsibility marker");
assert(/type:\s*"OPEN_SETTINGS"/.test(content), "content settings action does not request the full options page");
assert(!/type:"OPEN_POPUP"/.test(content), "content settings action still opens the narrow popup");
assert(/function normalizeLanguage\([^)]+\)\s*\{[\s\S]*"zh"[\s\S]*"en"[\s\S]*"en"/.test(content), "content language normalization still accepts Japanese");
assert(!/ja:\{analysisImage|case\s*"ja"|startsWith\("ja"\)|startsWith\("jp"\)|panelState\.language\s*===\s*"ja"/.test(content), "content panel still exposes Japanese UI language paths");
assert(/case\s*"json":\s*return\s*"JSON"/.test(content), "content JSON tab still uses the ambiguous J label");
assertContentCssRule("\\.panel-inner", [/box-sizing:\s*border-box/, /min-width:\s*0/, /max-width:\s*100%/], "content panel inner padding can make setup controls overflow the panel");
assert(/\.setup-shell\s*\{[\s\S]*min-width:\s*0/.test(content), "content setup shell can overflow the panel");
assert(/class="body body-setup"/.test(content), "content setup panel does not use a setup-specific body class");
assert(/function renderErrorPanel\(\)[\s\S]*return\s*`\s*<div class="body">/.test(content), "content error panel should not use the setup scrollbar class");
assert(/\.body-setup\s*\{[\s\S]*scrollbar-width:\s*none[\s\S]*-ms-overflow-style:\s*none/.test(content), "content setup panel does not hide standard scrollbars");
assertContentCssRule("\\.body-setup", [/min-width:\s*0/, /max-width:\s*100%/, /overflow-x:\s*hidden/], "content setup panel can overflow horizontally in English");
assert(/\.body-setup::-webkit-scrollbar\s*\{[\s\S]*display:\s*none/.test(content), "content setup panel does not hide WebKit scrollbars");
assert(/\.setup-form\s*\{[\s\S]*min-width:\s*0/.test(content), "content setup form can overflow the panel");
assert(/\.setup-field\s*\{[\s\S]*min-width:\s*0/.test(content), "content setup fields can overflow the panel");
assertContentCssRule("\\.setup-copy", [/max-width:\s*100%/, /overflow-wrap:\s*anywhere/], "content setup description can overflow on long English text");
assertContentCssRule("\\.setup-label", [/max-width:\s*100%/, /overflow-wrap:\s*anywhere/], "content setup labels can overflow on long English text");
assert(!/\.button-check\s*\{\s*\.button-check\s*\{/.test(content), "content CSS has a duplicated button-check selector that breaks following styles");
assert(!/@keyframes borderOrbit\s*\{\s*@keyframes borderOrbit\s*\{/.test(content), "content CSS has a duplicated borderOrbit keyframes block");
assertContentCssRule("\\.primary-button,\\s*\\.secondary-button", [/min-width:\s*0/, /max-width:\s*100%/, /white-space:\s*normal/, /overflow-wrap:\s*anywhere/], "content setup buttons can overflow on long English labels");
assert(/\.setup-actions\s*\{[\s\S]*display:\s*grid[\s\S]*min-width:\s*0/.test(content), "content setup actions are not constrained to the panel");
assert(/\.setup-actions \.primary-button\s*\{[\s\S]*min-width:\s*0[\s\S]*max-width:\s*100%/.test(content), "content setup button can overflow the panel");
assertContentCssRule("\\.setup-actions \\.primary-button,\\s*\\.setup-actions \\.secondary-button,\\s*\\.manual-import \\.secondary-button", [/padding-inline:\s*clamp\(/, /padding-block:\s*calc\(/], "content setup/manual buttons still use fixed padding that can overgrow English labels");
assertContentCssRule("\\.setup-input", [/padding-inline:\s*clamp\(/], "content setup inputs still use fixed horizontal padding in narrow English panels");
assert(/apiEnabled/.test(content), "content panel does not read the API enabled setting");
assert(/body-manual/.test(content), "content panel does not expose a separate no-API body state");
assert(/\.body-manual\s*\{[\s\S]*overflow-x:\s*hidden[\s\S]*max-width:\s*100%/.test(content), "content no-API body does not clip horizontal overflow");
assert(/\.body-manual \.setup-shell,\s*\.body-manual \.setup-actions,\s*\.body-manual \.manual-import\s*\{[\s\S]*width:\s*100%[\s\S]*overflow-x:\s*hidden/.test(content), "content no-API shell/actions/import area are not constrained to the panel");
assert(/\.body-manual \.setup-input\s*\{[\s\S]*overflow-wrap:\s*anywhere/.test(content), "content no-API inputs can overflow on long English text");
assert(/\.body-manual \.setup-textarea\s*\{[\s\S]*resize:\s*none[\s\S]*max-height:/.test(content), "content no-API paste field can be resized outside the panel");
assertContentCssRule("\\.setup-error", [/max-width:\s*100%/, /overflow-wrap:\s*anywhere/], "content setup error text can overflow on long English messages");
assert(/showAnalysisResult/.test(content), "content panel does not localize the no-API switch-to-result action");
assert(/manualResultState/.test(content), "content panel does not preserve an analysis result while showing the no-API workflow");
assert(/async function ensureManualResultState\(\)[\s\S]*await loadLatestSnapshot\(\)/.test(content), "content no-API mode does not load the latest saved result before rendering the switch-to-result button");
assert(/function manualResultButton/.test(content), "content panel does not render the no-API switch-to-result button");
assert(/data-action="show-analysis-result"/.test(content), "content no-API mode does not expose a switch-to-result button action");
assert(/manualScreenshot/.test(content), "content panel does not localize the no-API screenshot action");
assert(/copyManualScreenshot/.test(content), "content panel does not localize the no-API copy screenshot action");
assert(/copy-manual-screenshot/.test(content), "content panel does not expose the no-API copy screenshot action");
assert(/copyManualPrompt/.test(content), "content panel does not localize the manual GPT prompt copy action");
assert(/copy-manual-reverse-prompt/.test(content), "content panel does not expose the manual GPT prompt copy button");
assert(/GET_MANUAL_REVERSE_PROMPT/.test(content), "content panel does not request the manual GPT prompt from background");
assert(/function bindPanelInputs\(/.test(content), "content panel input binding is not split out");
assert(/function bindPanelActions\(/.test(content), "content panel action binding is not split out");
assert(/async function handlePanelAction\(/.test(content), "content panel action dispatch is not split out");
assert(/async function handlePanelModeAction\(/.test(content), "content panel mode actions are not split out");
assert(/async function handleSetupOrManualAction\(/.test(content), "content setup/manual actions are not split out");
assert(/async function handleResultAction\(/.test(content), "content result actions are not split out");
assert(/async function handleHistoryAction\(/.test(content), "content history actions are not split out");
assert(/async function handleRetryAction\(/.test(content), "content retry action is not split out");
assert(/function renderHeaderActions\(/.test(content), "content panel header action rendering is not split out");
assert(/function renderPanelBody\(/.test(content), "content panel body rendering is not split out");
assert(/function renderPanelTitle\(/.test(content), "content panel title rendering is not split out");
assert(/function renderPanel\(/.test(content), "content main render function was not renamed");
assert(/function renderHistoryRail\(/.test(content), "content history rail render function was not renamed");
assert(/function normalizeAnalysisResponse\(/.test(content), "content analysis normalization function was not renamed");
assert(/function normalizeJsonPrompt\(/.test(content), "content analysis normalization was not split into JSON prompt helper");
assert(/function manualResultFromObject\(/.test(content), "content manual GPT parsing was not split into object parser");
assert(/function manualResultFromText\(/.test(content), "content manual GPT parsing was not split into text parser");
const normalizeAnalysisFlow = content.slice(content.indexOf("function normalizeAnalysisResponse"), content.indexOf("function isPlainObject"));
const normalizeStyleTagsFlow = content.slice(content.indexOf("function normalizeStyleTags"), content.indexOf("function normalizeImageTarget"));
const manualObjectFlow = content.slice(content.indexOf("function manualResultFromObject"), content.indexOf("function fillManualResultFallbacks"));
assert(/zh:\s*chineseValue[\s\S]*en:\s*englishValue/.test(normalizeAnalysisFlow), "content analysis normalization does not preserve zh/en result keys");
assert(/zh:\s*chineseValue[\s\S]*en:\s*englishValue/.test(normalizeStyleTagsFlow), "content style tag normalization does not preserve zh/en keys");
assert(/zh:\s*chineseValue[\s\S]*en:\s*\{[\s\S]*englishValue/.test(manualObjectFlow), "content manual GPT object parser does not preserve zh/en result keys");
assert(!/source\.ja|styleTags\.ja|\["zh",\s*"en",\s*"ja"|is-system-ja/.test(content), "content still contains Japanese normalization remnants");
assert(/function renderScreenshotSelectionLayer\(/.test(content), "content screenshot selection rendering is not split out");
assert(/function bindScreenshotSelectionControls\(/.test(content), "content screenshot selection controls are not split out");
assert(/function screenshotTargetMetadata\(/.test(content), "content screenshot target metadata helper is missing");
const screenshotCropFlow = contentFunctionSlice("cropScreenshotCapture");
assert(/screenshotTargetMetadata\(baseTarget\)/.test(screenshotCropFlow), "content screenshot crop does not override stale base target metadata");
assert(/async function openAnalysisPanel\(/.test(content), "content analysis panel entrypoint was not renamed");
assert(/async function runApiAnalysis\(/.test(content), "content API analysis runner was not renamed");
assert(/async function finishApiLoadingProgress\(/.test(content), "content API loading transition helper should not shadow shared loading progress");
assert(/await finishApiLoadingProgress\(\)/.test(content), "content API analysis success path does not use the non-shadowing loading transition helper");
assert(!/async function finishLoadingProgress\(\)\s*\{\s*await finishLoadingProgress\(\)/.test(read("content/09-analysis.js")), "content analysis flow recursively shadows finishLoadingProgress");
assert(/function resolveAnalysisTarget\(/.test(content), "content analysis target resolution is not split out");
assert(/async function startApiAnalysis\(/.test(content), "content API analysis startup is not split out");
assert(/function showGenericApiError\(/.test(content), "content API error handling is not split out");
assert(!/function\s+(b|To|zt|ha|Xa|Rs|Ws|Os|Zt|Rr|Fa|ns|as)\b/.test(content), "content still contains key compressed function names");
assert(!/\bf\.|\bM\.|\bl\.|\bG\b|\bk\b|targetPoint\{/.test(content), "content still contains stale compressed globals or damaged template placeholders");
assert(/gptResultPaste/.test(content), "content panel does not localize GPT result paste UI");
assert(/data-manual-field="gpt-result"/.test(content), "content panel does not expose GPT result paste field");
assert(/import-manual-gpt-result/.test(content), "content panel does not expose GPT result import action");
assert(/parseManualGptResult/.test(content), "content panel does not parse pasted GPT results");
assert(/manualSetupDescription/.test(content), "content no-API card does not expose the manual GPT workflow description");
assert(/apiConfigDescription/.test(content), "content setup card does not expose the API configuration description");
assert(content.includes("复制图片和复制GPT提示词并将GPT结果粘贴到下方，导入结果获得图片提示词。"), "content setup card manual workflow copy is not updated");
assert(content.includes("如果有可用的图片分析模型API，在下方里填写 Base URL、API Key 和 Model。保存后会继续分析当前图片。"), "content setup card API configuration copy is not updated");
const setupRendererStart = content.indexOf("function renderApiSetupPanel()");
const manualRendererStart = content.indexOf("function renderNoApiPanel()");
const resultRendererStart = content.indexOf("function renderResultBody(");
const setupRenderer = setupRendererStart >= 0 && manualRendererStart > setupRendererStart ? content.slice(setupRendererStart, manualRendererStart) : "";
const manualRenderer = manualRendererStart >= 0 && resultRendererStart > manualRendererStart ? content.slice(manualRendererStart, resultRendererStart) : "";
assert(setupRendererStart >= 0, "content API setup renderer is missing");
assert(manualRendererStart >= 0, "content no-API renderer is missing");
assert(setupRenderer.includes('data-api-field="base-url"'), "content API setup renderer does not include Base URL");
assert(setupRenderer.includes('data-api-field="api-key"'), "content API setup renderer does not include API Key");
assert(setupRenderer.includes('data-api-field="model"'), "content API setup renderer does not include Model");
assert(!setupRenderer.includes('copy-manual-reverse-prompt'), "content API setup renderer still contains manual GPT prompt copy");
assert(!setupRenderer.includes('data-manual-field="gpt-result"'), "content API setup renderer still contains GPT result paste");
assert(!setupRenderer.includes('import-manual-gpt-result'), "content API setup renderer still contains manual GPT import");
assert(manualRenderer.includes('body body-setup body-manual'), "content no-API renderer does not use the manual body class");
assert(manualRenderer.indexOf('data-action="manual-select-screenshot"') < manualRenderer.indexOf('data-action="copy-manual-screenshot"'), "content no-API renderer does not put screenshot before copy screenshot");
assert(manualRenderer.indexOf('data-action="copy-manual-screenshot"') < manualRenderer.indexOf('data-action="copy-manual-reverse-prompt"'), "content no-API renderer does not put copy screenshot before GPT prompt");
assert(manualRenderer.indexOf('data-action="copy-manual-reverse-prompt"') < manualRenderer.indexOf('data-manual-field="gpt-result"'), "content no-API renderer does not put GPT prompt before paste GPT result");
assert(manualRenderer.indexOf('data-manual-field="gpt-result"') < manualRenderer.indexOf('data-action="import-manual-gpt-result"'), "content no-API renderer does not put paste GPT result before import result");
const analysisFlow = read("content/09-analysis.js");
assert(/apiEnabled/.test(analysisFlow) && /showNoApiWorkflow/.test(analysisFlow), "content analysis flow does not branch to no-API workflow when API is disabled");
assert(analysisFlow.indexOf("showNoApiWorkflow") > -1 && analysisFlow.indexOf("showNoApiWorkflow") < analysisFlow.indexOf("await startApiAnalysis"), "content API-disabled branch is not before RUN_ANALYSIS path");
const noApiScreenshotFlow = content.slice(content.indexOf("async function startNoApiScreenshot"), content.indexOf("async function copyNoApiScreenshot"));
assert(/await captureScreenshotTarget/.test(noApiScreenshotFlow), "content no-API screenshot flow does not crop a screenshot target");
assert(!/RUN_ANALYSIS|analyzeAndSaveToHistory\(/.test(noApiScreenshotFlow), "content no-API screenshot flow still triggers API analysis");
const noApiWorkflowFlow = content.slice(content.indexOf("async function showNoApiWorkflow"), content.indexOf("async function continuePendingAnalysis"));
assert(/captureManualResultState/.test(noApiWorkflowFlow), "content no-API workflow does not cache the current analysis result before clearing the panel");
assert(/await ensureManualResultState\(\)/.test(noApiWorkflowFlow), "content no-API workflow does not hydrate the switch-to-result state from the latest saved result");
const panelRenderFlow = content.slice(content.indexOf("function renderHeaderActions("), content.indexOf("function renderPanel(", content.indexOf("function renderHeaderActions(")));
assert(/panelState\.status === "manual"[\s\S]*manualResultButton\(\)/.test(panelRenderFlow), "content no-API mode does not place the switch-to-result button in the header action slot");
const actionHandlerFlow = read("content/08-actions.js");
assert(/show-analysis-result/.test(actionHandlerFlow) && /showManualResult/.test(actionHandlerFlow), "content no-API switch-to-result action is not wired to restore the analysis result");
const resultScreenshotFlow = content.slice(content.indexOf("async function handleResultScreenshotAction()"), content.indexOf("async function analyzeScreenshotRegion"));
assert(/apiEnabled/.test(resultScreenshotFlow) && /showNoApiWorkflow/.test(resultScreenshotFlow), "content result screenshot button does not return to the no-API workflow when API is disabled");
assert(!/startNoApiScreenshot/.test(resultScreenshotFlow), "content result screenshot button still starts screenshot selection when API is disabled");
assert(/renderNoApiWorkflowNow/.test(resultScreenshotFlow), "content result screenshot button does not force an immediate no-API panel refresh");
assert(/preservePosition:\s*(?:!0|true)/.test(resultScreenshotFlow), "content result screenshot button does not preserve the visible panel position when returning to no-API workflow");
const manualImportStart = content.indexOf("async function importManualGptResult");
const manualImportEnd = content.indexOf("\n}", manualImportStart);
const manualImportFlow = manualImportStart >= 0 ? content.slice(manualImportStart, manualImportEnd > manualImportStart ? manualImportEnd : content.length) : "";
assert(/updatePanelState\(\{[\s\S]*status:\s*"manual"/.test(manualImportFlow), "content manual import errors do not stay in the no-API workflow");
assert(/await addAnalysisToHistory\(currentTarget,\s*parsedResult,\s*\{[\s\S]*revealHistory:\s*!0[\s\S]*selectEntry:\s*!0/.test(manualImportFlow), "content manual import success does not add the imported result to history");
assert(!/copy-gpt-image-prompt/.test(content), "content result panel still exposes duplicate GPT image prompt copy action");
assert(!/copyGptImagePrompt|gptImagePromptCopied|gptImagePromptError/.test(content), "content still contains duplicate GPT image prompt copy flow");
assert(/\.footer\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*minmax\(0,\s*1fr\)/.test(content), "content result footer does not split language switcher and copy button into equal halves");
assert(!/\.footer\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*minmax\(0,\s*1fr\)\s*minmax\(0,\s*1fr\)/.test(content), "content result footer still uses three equal columns");
assert(!/defaultGeneratorSite|OPEN_GENERATOR_SITE|AUTOFILL_GENERATOR_PROMPT|open-generator-site|toggle-generator-menu|open-generator-site-direct|copyAndOpenPrefix|chooseGeneratorSite|generatorCopiedToastPrefix|generatorFallbackToastSuffix|generatorReadyToastSuffix|generatorOpenError|jimeng|midjourney|lovart/.test(content), "content still contains generator site/default generator functionality");
assert(!/\b(?:legacy|account|billing|balance|serviceMode)\b|is-auth-required|auth-primary-button/i.test(content), "content still contains hosted-service/account/auth remnants");
assert(!/shareIcon-|escapeHtml-|closeIcon-|screenshotIcon-|chevronIcon-|render[A-Za-z]+-|savePanelSession-|clearHoveredTarget-|renderInlineActionMenu-/.test(content), "content contains renamed function names inside CSS class text");

// Content runtime smoke checks for paths that static syntax cannot exercise.
function createSmokeElement(extra = {}) {
  const element = {
    tagName: extra.tagName || "DIV",
    src: extra.src || "",
    currentSrc: extra.currentSrc || extra.src || "",
    naturalWidth: extra.naturalWidth || 360,
    naturalHeight: extra.naturalHeight || 240,
    complete: extra.complete ?? true,
    alt: extra.alt || "",
    title: extra.title || "",
    style: { setProperty() {}, removeProperty() {} },
    classList: { add() {}, remove() {}, contains() { return false; }, toggle() {} },
    dataset: {},
    innerHTML: "",
    appendChild() {},
    append() {},
    remove() {},
    querySelector(selector) {
      return this.__queryMap?.[selector] ?? null;
    },
    querySelectorAll(selector) {
      return this.__queryAllMap?.[selector] ?? [];
    },
    addEventListener() {},
    removeEventListener() {},
    setAttribute() {},
    getAttribute(name) { return this[name] || ""; },
    closest() { return null; },
    getBoundingClientRect() {
      return { left: 20, top: 20, right: 380, bottom: 540, width: 360, height: 520 };
    },
    offsetWidth: 360,
    offsetHeight: 520,
    scrollTop: 0,
    isConnected: true
  };
  return Object.assign(element, extra);
}

function createSmokeStorageArea() {
  return {
    get(keys, callback) {
      const result = Array.isArray(keys)
        ? Object.fromEntries(keys.map((key) => [key, undefined]))
        : typeof keys === "string"
          ? { [keys]: undefined }
          : { ...(keys || {}) };
      if (typeof callback === "function") {
        callback(result);
        return undefined;
      }
      return Promise.resolve(result);
    },
    set(_value, callback) {
      if (typeof callback === "function") {
        callback();
        return undefined;
      }
      return Promise.resolve();
    }
  };
}

async function runContentVmSmoke() {
  let runtimeListenerCount = 0;
  let storageListenerCount = 0;
  let documentListenerCount = 0;
  let windowListenerCount = 0;
  function HTMLImageElement() {}
  const context = {
    console,
    setTimeout,
    clearTimeout,
    URL,
    Blob,
    atob: (value) => Buffer.from(value, "base64").toString("binary"),
    Image: function Image() {},
    HTMLImageElement,
    HTMLElement: function HTMLElement() {},
    HTMLInputElement: function HTMLInputElement() {},
    HTMLTextAreaElement: function HTMLTextAreaElement() {},
    HTMLSelectElement: function HTMLSelectElement() {},
    Element: function Element() {},
    Node: function Node() {},
    innerWidth: 1280,
    innerHeight: 800,
    scrollX: 0,
    scrollY: 0,
    location: { href: "https://example.com/page", protocol: "https:", hostname: "example.com", pathname: "/page" },
    history: { pushState() {}, replaceState() {} },
    window: null,
    document: {
      documentElement: createSmokeElement(),
      body: createSmokeElement(),
      createElement: createSmokeElement,
      querySelector() { return null; },
      querySelectorAll() { return []; },
      addEventListener() { documentListenerCount += 1; },
      removeEventListener() {},
      getElementById() { return null; },
      elementsFromPoint() { return []; },
      visibilityState: "visible"
    },
    navigator: { clipboard: {} },
    chrome: {
      runtime: {
        id: "test-extension",
        getURL: (value) => `chrome-extension://test/${value}`,
        onMessage: { addListener() { runtimeListenerCount += 1; } },
        sendMessage(_message, callback) {
          callback && callback({ ok: true });
          return Promise.resolve({ ok: true, data: {} });
        }
      },
      storage: {
        local: createSmokeStorageArea(),
        sync: createSmokeStorageArea(),
        onChanged: { addListener() { storageListenerCount += 1; } }
      }
    },
    addEventListener() { windowListenerCount += 1; },
    removeEventListener() {},
    dispatchEvent() {},
    CustomEvent: function CustomEvent(type) { this.type = type; },
    getComputedStyle() { return { display: "block", visibility: "visible", opacity: "1", backgroundImage: "none" }; },
    matchMedia() { return { matches: false }; },
    requestAnimationFrame(callback) { callback(0); return 1; },
    cancelAnimationFrame() {},
    performance: { now: () => 0 }
  };
  context.window = context;
  context.globalThis = context;
  Object.setPrototypeOf(context.document.documentElement, context.Element.prototype);
  Object.setPrototypeOf(context.document.body, context.Element.prototype);
  vm.createContext(context);
  for (let pass = 0; pass < 2; pass += 1) {
    for (const file of expectedContentScripts) {
      vm.runInContext(read(file), context, { filename: file });
    }
  }

  assert(context.appendPromptToken("图", "像") === "图像", "content smoke inserts spaces between CJK prompt tokens");
  assert(context.appendPromptToken("hello", "world") === "hello world", "content smoke does not insert spaces between Latin prompt tokens");
  const screenshotMetadata = context.screenshotTargetMetadata({
    src: "https://old.example/image.png",
    pageUrl: "https://old.example/stale-page",
    naturalWidth: 640,
    naturalHeight: 480
  });
  assert(screenshotMetadata.pageUrl === context.location.href, "content smoke screenshot target metadata does not use the current page URL");
  assert(screenshotMetadata.src === "https://old.example/image.png", "content smoke screenshot target metadata lost the base image source");

  context.panelLayer = createSmokeElement();
  context.panelMode = "expanded";
  context.panelState.status = "manual";
  context.panelState.language = "en";
  context.renderPanel();
  assert(context.panelLayer.innerHTML.includes("No API mode"), "content smoke did not render the no-API panel");

  context.panelState.status = "setup";
  context.renderPanel();
  assert(context.panelLayer.innerHTML.includes("Base URL"), "content smoke did not render the API setup panel");

  const normalizedApiResult = context.normalizeAnalysisResponse({
    zh: { prompt: "中文提示词", analysis: "中文分析" },
    en: { prompt: "English prompt", analysis: "English analysis" },
    jsonPrompt: { subject: "subject" },
    styleTags: { zh: ["电影感"], en: ["cinematic"] }
  });
  assert(normalizedApiResult?.zh?.prompt === "中文提示词", "content smoke normalized API result lost the zh prompt key");
  assert(normalizedApiResult?.en?.prompt === "English prompt", "content smoke normalized API result lost the en prompt key");
  assert(normalizedApiResult?.styleTags?.zh?.[0] === "电影感", "content smoke normalized style tags lost the zh key");
  assert(context.promptForLanguage(normalizedApiResult, "en") === "English prompt", "content smoke promptForLanguage cannot read normalized English prompt");

  context.panelState.status = "success";
  context.panelState.analysis = normalizedApiResult;
  context.renderedPromptDraft = "English prompt";
  context.currentPromptDraft = "English prompt";
  context.renderPanel();
  assert(context.panelLayer.innerHTML.includes("English prompt"), "content smoke did not render the success result panel");

  context.historyRailOpen = true;
  context.historyItems = [];
  context.failedHistoryItems = [];
  const emptyHistoryRail = context.renderHistoryRail();
  assert(emptyHistoryRail.includes("history-rail") && emptyHistoryRail.includes(context.localizedText.emptyHistory), "content smoke did not render the empty history rail");

  const image = Object.assign(new context.HTMLImageElement(), createSmokeElement({
    tagName: "IMG",
    src: "https://example.com/image.png",
    currentSrc: "https://example.com/image.png",
    naturalWidth: 640,
    naturalHeight: 480
  }));
  context.inlineActionLayer = createSmokeElement({
    querySelector() {
      return createSmokeElement({
        querySelectorAll() {
          return [createSmokeElement({ dataset: { inlineAction: "prompt" } }), createSmokeElement({ dataset: { inlineAction: "open" } })];
        }
      });
    }
  });
  context.extensionEnabled = true;
  context.inlineActionsEnabled = true;
  context.hoveredElement = image;
  context.hoveredTarget = { src: "https://example.com/image.png" };
  context.renderInlineActionMenu();
  assert(context.inlineActionLayer.innerHTML.includes('data-inline-action="prompt"'), "content smoke did not render the hover action menu");

  const screenshotControl = createSmokeElement();
  const screenshotLayer = createSmokeElement({
    __queryMap: {
      ".screenshot-selection-backdrop": screenshotControl,
      ".screenshot-selection-box": screenshotControl,
      ".screenshot-selection-actions": screenshotControl,
      '[data-screenshot-action="retry"]': screenshotControl,
      '[data-screenshot-action="confirm"]': screenshotControl,
      ".screenshot-selection-cancel": screenshotControl
    }
  });
  const screenshotControls = context.renderScreenshotSelectionLayer(screenshotLayer);
  assert(!!screenshotControls && screenshotLayer.innerHTML.includes("screenshot-selection-backdrop"), "content smoke did not render screenshot selection controls");

  context.chrome.storage.local.set = () => Promise.reject(new Error("Extension context invalidated."));
  await context.savePanelSession();
  assert(context.window.__imagetopromptV2Loaded__ === true, "content smoke did not retain the duplicate-load guard");
  assert(runtimeListenerCount === 1, "content smoke registered duplicate runtime listeners");
  assert(storageListenerCount === 1, "content smoke registered duplicate storage listeners");
  assert(documentListenerCount >= 5, "content smoke did not register expected document listeners");
  assert(windowListenerCount >= 2, "content smoke did not register expected window listeners");
}

try {
  await runContentVmSmoke();
} catch (error) {
  fail(`content VM smoke failed: ${error instanceof Error ? error.stack || error.message : String(error)}`);
}

// Icon asset checks.
function pngSize(rel) {
  const file = fs.readFileSync(path.join(root, rel));
  const signature = file.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") {
    fail(`${rel} is not a PNG`);
    return null;
  }
  return {
    width: file.readUInt32BE(16),
    height: file.readUInt32BE(20)
  };
}

for (const size of [16, 32, 48, 128]) {
  const rel = `icons/icon-${size}.png`;
  const dimensions = pngSize(rel);
  assert(dimensions?.width === size && dimensions?.height === size, `${rel} is not ${size}x${size}`);
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log("ImagePrompt local extension verification passed.");
