export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "zh", label: "中文" }
];

export const DEFAULTS = {
  enabled: true,
  apiEnabled: true,
  inlineActionsEnabled: true,
  language: "en",
  baseUrl: "",
  apiKey: "",
  model: ""
};

export const UI_TEXT = {
  en: {
    featureSwitches: "Feature switches",
    enabled: "Enabled",
    enabledDescription: "Page entry and context menu",
    apiEnabled: "API enabled",
    apiEnabledDescription: "Use Base URL, API Key, and Model to analyze images",
    inlineActionsEnabled: "Overlay and analysis",
    inlineActionsDescription: "Floating menu and image analysis entry",
    interfaceLanguage: "Interface language",
    baseUrl: "Base URL",
    apiKey: "API Key",
    model: "Model",
    save: "Save",
    testConnection: "Test connection",
    openPanel: "Open panel",
    saved: "Saved.",
    saveFailed: "Save failed.",
    connectionFailed: "Connection test failed.",
    connectionPassed: "Connection test passed.",
    panelOpened: "Panel opened.",
    panelOpenFailed: "Could not open the panel.",
    loadFailed: "ImagePrompt could not load settings."
  },
  zh: {
    featureSwitches: "功能开关",
    enabled: "插件启用",
    enabledDescription: "插件网页入口和右键菜单",
    apiEnabled: "API 分析",
    apiEnabledDescription: "使用 Base URL、API Key 和 Model 分析图片",
    inlineActionsEnabled: "悬浮与分析",
    inlineActionsDescription: "网页悬浮菜单和图片分析入口",
    interfaceLanguage: "界面语言",
    baseUrl: "Base URL",
    apiKey: "API Key",
    model: "Model",
    save: "保存",
    testConnection: "测试连接",
    openPanel: "打开面板",
    saved: "已保存。",
    saveFailed: "保存失败。",
    connectionFailed: "连接测试失败。",
    connectionPassed: "连接测试通过。",
    panelOpened: "面板已打开。",
    panelOpenFailed: "无法打开面板。",
    loadFailed: "ImagePrompt 无法加载设置。"
  }
};

export function escapeAttribute(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function optionMarkup(options, selected) {
  return options
    .map((option) => `<option value="${option.value}"${option.value === selected ? " selected" : ""}>${option.label}</option>`)
    .join("");
}

export function normalizeLanguage(value) {
  return LANGUAGE_OPTIONS.some((option) => option.value === value) ? value : DEFAULTS.language;
}

export function uiText(language) {
  return UI_TEXT[normalizeLanguage(language)] || UI_TEXT.en;
}

export async function loadSettings() {
  const sync = await chrome.storage.sync.get(["enabled", "systemLanguage", "defaultLanguage"]);
  const local = await chrome.storage.local.get(["apiEnabled", "baseUrl", "apiKey", "model", "sharedPanelSession"]);
  const session = local.sharedPanelSession && typeof local.sharedPanelSession === "object" ? local.sharedPanelSession : {};
  return {
    enabled: typeof sync.enabled === "boolean" ? sync.enabled : DEFAULTS.enabled,
    apiEnabled: typeof local.apiEnabled === "boolean" ? local.apiEnabled : DEFAULTS.apiEnabled,
    inlineActionsEnabled: typeof session.inlineActionsEnabled === "boolean" ? session.inlineActionsEnabled : DEFAULTS.inlineActionsEnabled,
    language: normalizeLanguage(sync.systemLanguage || sync.defaultLanguage),
    baseUrl: local.baseUrl || DEFAULTS.baseUrl,
    apiKey: local.apiKey || DEFAULTS.apiKey,
    model: local.model || DEFAULTS.model
  };
}

export function currentSettings(doc = document) {
  return {
    enabled: doc.getElementById("enabled").checked,
    apiEnabled: doc.getElementById("apiEnabled").checked,
    inlineActionsEnabled: doc.getElementById("inlineActionsEnabled").checked,
    language: normalizeLanguage(doc.getElementById("language").value),
    baseUrl: doc.getElementById("baseUrl").value.trim(),
    apiKey: doc.getElementById("apiKey").value.trim(),
    model: doc.getElementById("model").value.trim()
  };
}

export async function saveSettings(settings = currentSettings()) {
  await chrome.storage.sync.set({
    enabled: settings.enabled,
    systemLanguage: settings.language,
    defaultLanguage: settings.language
  });
  const session = await chrome.storage.local.get(["sharedPanelSession"]);
  const sharedPanelSession = session.sharedPanelSession && typeof session.sharedPanelSession === "object" ? session.sharedPanelSession : {};
  await chrome.storage.local.set({
    apiEnabled: settings.apiEnabled,
    baseUrl: settings.baseUrl,
    apiKey: settings.apiKey,
    model: settings.model,
    serviceMode: "custom_api",
    sharedPanelSession: {
      ...sharedPanelSession,
      inlineActionsEnabled: settings.inlineActionsEnabled,
      updatedAt: Date.now()
    }
  });
  return settings;
}

export function setStatus(message, tone = "", doc = document) {
  const status = doc.getElementById("status");
  status.textContent = message;
  status.className = `status${tone ? ` ${tone}` : ""}`;
}

export function setBusy(isBusy, doc = document) {
  for (const button of doc.querySelectorAll("button")) {
    button.disabled = isBusy;
  }
}

export function sendRuntimeMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(response);
    });
  });
}
