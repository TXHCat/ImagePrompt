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
        min-width: 760px;
        overflow-x: auto;
        color: #172033;
        background: #f7f8fb;
      }
      #root {
        width: 100%;
        min-width: 760px;
      }
      .page {
        width: min(1280px, calc(100% - 32px));
        min-width: 720px;
        max-width: 1280px;
        margin: 28px auto;
      }
      h1 {
        margin: 0 0 18px;
        font-size: 24px;
        line-height: 1.2;
      }
      .form {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
        min-width: 0;
        max-width: 100%;
        padding: 18px;
        border: 1px solid #d9e0ea;
        border-radius: 8px;
        background: #ffffff;
      }
      .toggle {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #344054;
      }
      .section-title {
        grid-column: 1 / -1;
        margin: 0;
        font-size: 15px;
        line-height: 1.35;
        font-weight: 750;
        color: #172033;
      }
      .switch-list {
        grid-column: 1 / -1;
        display: grid;
        gap: 10px;
        min-width: 0;
      }
      .switch-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        min-width: 0;
        padding: 12px 14px;
        border: 1px solid #e1e7f0;
        border-radius: 8px;
        background: #f9fbff;
      }
      .switch-copy {
        display: grid;
        gap: 3px;
        min-width: 0;
      }
      .switch-title {
        font-size: 13px;
        line-height: 1.35;
        font-weight: 750;
        color: #172033;
      }
      .switch-description {
        font-size: 12px;
        line-height: 1.45;
        color: #667085;
      }
      .toggle,
      .actions,
      .status {
        grid-column: 1 / -1;
      }
      label.field {
        display: grid;
        gap: 6px;
        min-width: 0;
        max-width: 100%;
        font-size: 13px;
        font-weight: 650;
        color: #344054;
      }
      input:not([type="checkbox"]),
      select {
        box-sizing: border-box;
        width: 100%;
        min-width: 0;
        max-width: 100%;
        height: 38px;
        border: 1px solid #ccd4e0;
        border-radius: 7px;
        padding: 0 11px;
        color: #172033;
        background: #ffffff;
        font-size: 14px;
        outline: none;
      }
      input:focus,
      select:focus {
        border-color: #2f6fed;
        box-shadow: 0 0 0 3px rgba(47, 111, 237, 0.14);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        min-width: 0;
        max-width: 100%;
      }
      button {
        width: max-content;
        max-width: 100%;
        min-height: 36px;
        border: 1px solid #ccd4e0;
        border-radius: 7px;
        padding: 8px 14px;
        background: #ffffff;
        color: #172033;
        font-size: 14px;
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
        min-height: 20px;
        font-size: 13px;
        line-height: 1.45;
        color: #475467;
      }
      .status.error {
        color: #b42318;
      }
      .status.success {
        color: #067647;
      }
      @media (max-width: 720px) {
        .page {
          width: min(1280px, calc(100% - 20px));
          min-width: 720px;
          margin: 16px auto;
        }
        .form {
          grid-template-columns: 1fr;
          padding: 14px;
        }
        .toggle,
        .actions,
        .status {
          grid-column: auto;
        }
      }
    </style>
    <main class="page">
      <h1>ImagePrompt</h1>
      <section class="form">
        <h2 class="section-title">${text.featureSwitches}</h2>
        <div class="switch-list">
          <label class="switch-item">
            <span class="switch-copy">
              <span class="switch-title">${text.enabled}</span>
              <span class="switch-description">${text.enabledDescription}</span>
            </span>
            <input id="enabled" type="checkbox"${settings.enabled ? " checked" : ""} />
          </label>
          <label class="switch-item">
            <span class="switch-copy">
              <span class="switch-title">${text.apiEnabled}</span>
              <span class="switch-description">${text.apiEnabledDescription}</span>
            </span>
            <input id="apiEnabled" type="checkbox"${settings.apiEnabled ? " checked" : ""} />
          </label>
          <label class="switch-item">
            <span class="switch-copy">
              <span class="switch-title">${text.inlineActionsEnabled}</span>
              <span class="switch-description">${text.inlineActionsDescription}</span>
            </span>
            <input id="inlineActionsEnabled" type="checkbox"${settings.inlineActionsEnabled ? " checked" : ""} />
          </label>
        </div>
        <label class="field">
          ${text.interfaceLanguage}
          <select id="language">${optionMarkup(LANGUAGE_OPTIONS, settings.language)}</select>
        </label>
        <label class="field">
          ${text.baseUrl}
          <input id="baseUrl" spellcheck="false" autocomplete="off" placeholder="https://api.openai.com/v1" value="${escapeAttribute(settings.baseUrl)}" />
        </label>
        <label class="field">
          ${text.apiKey}
          <input id="apiKey" type="password" spellcheck="false" autocomplete="off" placeholder="sk-..." value="${escapeAttribute(settings.apiKey)}" />
        </label>
        <label class="field">
          ${text.model}
          <input id="model" spellcheck="false" autocomplete="off" placeholder="gpt-4.1-mini / gpt-4o / local-vision-model" value="${escapeAttribute(settings.model)}" />
        </label>
        <div class="actions">
          <button id="save" class="primary" type="button">${text.save}</button>
          <button id="test" type="button">${text.testConnection}</button>
          <button id="openPanel" type="button">${text.openPanel}</button>
        </div>
        <div id="status" class="status" role="status"></div>
      </section>
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
