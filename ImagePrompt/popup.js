import {
  LANGUAGE_OPTIONS,
  UI_TEXT,
  escapeAttribute,
  loadSettings,
  optionMarkup,
  saveSettings,
  sendRuntimeMessage,
  setBusy,
  setStatus,
  uiText
} from "./settings-shared.js";

const root = document.getElementById("root");

function renderShell(settings) {
  const text = uiText(settings.language);
  root.innerHTML = `
    <style>
      :root {
        color-scheme: light;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        width: 720px;
        min-width: 720px;
        max-width: 720px;
        overflow-x: hidden;
        color: #172033;
        background: #f7f8fb;
      }
      .panel {
        width: 100%;
        max-width: 100%;
        padding: 16px;
        overflow: hidden;
      }
      .title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 12px;
        min-width: 0;
        margin-bottom: 14px;
      }
      h1 {
        margin: 0;
        min-width: 0;
        font-size: 18px;
        line-height: 1.2;
        font-weight: 750;
      }
      .toggle {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        font-size: 12px;
        color: #42526b;
        user-select: none;
      }
      .toggle-group {
        display: inline-flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 10px 14px;
        min-width: 0;
      }
      .grid {
        display: grid;
        gap: 10px;
        min-width: 0;
      }
      label {
        display: grid;
        gap: 5px;
        min-width: 0;
        font-size: 12px;
        font-weight: 650;
        color: #344054;
      }
      input:not([type="checkbox"]),
      select {
        box-sizing: border-box;
        width: 100%;
        min-width: 0;
        max-width: 100%;
        height: 34px;
        border: 1px solid #ccd4e0;
        border-radius: 7px;
        padding: 0 10px;
        color: #172033;
        background: #ffffff;
        font-size: 13px;
        outline: none;
      }
      input[type="checkbox"] {
        width: 16px;
        min-width: 16px;
        max-width: 16px;
        height: 16px;
        padding: 0;
        flex: 0 0 auto;
      }
      input:focus,
      select:focus {
        border-color: #2f6fed;
        box-shadow: 0 0 0 3px rgba(47, 111, 237, 0.14);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        min-width: 0;
        max-width: 100%;
        margin-top: 14px;
      }
      .actions .wide {
        flex: 0 0 auto;
      }
      button {
        width: max-content;
        max-width: 100%;
        min-height: 34px;
        border: 1px solid #ccd4e0;
        border-radius: 7px;
        padding: 7px 10px;
        background: #ffffff;
        color: #172033;
        font-size: 13px;
        line-height: 1.25;
        font-weight: 650;
        white-space: nowrap;
        cursor: pointer;
      }
      button.primary {
        border-color: #2f6fed;
        background: #2f6fed;
        color: #ffffff;
      }
      button:disabled {
        cursor: default;
        opacity: 0.58;
      }
      .status {
        min-height: 18px;
        margin-top: 10px;
        font-size: 12px;
        line-height: 1.45;
        color: #475467;
      }
      .status.error {
        color: #b42318;
      }
      .status.success {
        color: #067647;
      }
    </style>
    <main class="panel">
      <div class="title-row">
        <h1>ImagePrompt</h1>
        <div class="toggle-group">
          <label class="toggle">
            <input id="enabled" type="checkbox"${settings.enabled ? " checked" : ""} />
            ${text.enabled}
          </label>
          <label class="toggle">
            <input id="apiEnabled" type="checkbox"${settings.apiEnabled ? " checked" : ""} />
            ${text.apiEnabled}
          </label>
          <label class="toggle">
            <input id="inlineActionsEnabled" type="checkbox"${settings.inlineActionsEnabled ? " checked" : ""} />
            ${text.inlineActionsEnabled}
          </label>
        </div>
      </div>
      <section class="grid">
        <label>
          ${text.interfaceLanguage}
          <select id="language">${optionMarkup(LANGUAGE_OPTIONS, settings.language)}</select>
        </label>
        <label>
          ${text.baseUrl}
          <input id="baseUrl" spellcheck="false" autocomplete="off" placeholder="https://api.openai.com/v1" value="${escapeAttribute(settings.baseUrl)}" />
        </label>
        <label>
          ${text.apiKey}
          <input id="apiKey" type="password" spellcheck="false" autocomplete="off" placeholder="sk-..." value="${escapeAttribute(settings.apiKey)}" />
        </label>
        <label>
          ${text.model}
          <input id="model" spellcheck="false" autocomplete="off" placeholder="gpt-4.1-mini / gpt-4o / local-vision-model" value="${escapeAttribute(settings.model)}" />
        </label>
      </section>
      <section class="actions">
        <button id="save" class="primary" type="button">${text.save}</button>
        <button id="test" type="button">${text.testConnection}</button>
        <button id="openPanel" class="wide" type="button">${text.openPanel}</button>
      </section>
      <div id="status" class="status" role="status"></div>
    </main>
  `;
}

async function handleSave() {
  const text = uiText(document.getElementById("language")?.value);
  setBusy(true);
  try {
    await saveSettings();
    setStatus(text.saved, "success");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : text.saveFailed, "error");
  } finally {
    setBusy(false);
  }
}

async function handleTest() {
  const text = uiText(document.getElementById("language")?.value);
  setBusy(true);
  try {
    await saveSettings();
    const response = await sendRuntimeMessage({ type: "TEST_CONNECTION" });
    if (!response?.ok) throw new Error(response?.error || text.connectionFailed);
    setStatus(text.connectionPassed, "success");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : text.connectionFailed, "error");
  } finally {
    setBusy(false);
  }
}

async function handleOpenPanel() {
  const text = uiText(document.getElementById("language")?.value);
  setBusy(true);
  try {
    await saveSettings();
    const response = await sendRuntimeMessage({ type: "OPEN_ACTIVE_PANEL" });
    if (!response?.ok) throw new Error(response?.error || text.panelOpenFailed);
    setStatus(text.panelOpened, "success");
    window.setTimeout(() => window.close(), 250);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : text.panelOpenFailed, "error");
  } finally {
    setBusy(false);
  }
}

async function main() {
  renderShell(await loadSettings());
  document.getElementById("save").addEventListener("click", handleSave);
  document.getElementById("test").addEventListener("click", handleTest);
  document.getElementById("openPanel").addEventListener("click", handleOpenPanel);
}

main().catch((error) => {
  root.textContent = error instanceof Error ? error.message : UI_TEXT.en.loadFailed;
});
