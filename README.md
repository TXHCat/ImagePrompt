# ImagePrompt

ImagePrompt is a Chrome/Chromium extension that analyzes webpage images and turns them into structured image-generation prompts.

It supports a configurable OpenAI-compatible vision API, and also provides a no-API workflow for manually sending an image and prompt to a model, then importing the result back into the extension.

## Features

- Analyze images from webpages through a floating image action menu.
- Open the analysis panel from the extension popup or the right-click menu.
- Generate bilingual prompt output in English and Simplified Chinese.
- Show structured prompt data, style tags, recreation prompt, prompt core, and negative prompt.
- Save prompt history locally in Chrome storage.
- Use no-API mode by copying a screenshot and GPT prompt, then importing the model result.
- Configure interface language, API mode, floating menu, Base URL, API Key, and Model.
- Test API compatibility before running analysis.

## Install Locally

1. Open `chrome://extensions` in Chrome or a Chromium-based browser.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `ImagePrompt/` extension directory inside this repository.

The directory to load is:

```text
ImagePrompt/
```

## Configuration

Open the extension popup or options page and configure:

- **Base URL**: OpenAI-compatible API base URL, for example `https://api.openai.com/v1`
- **API Key**: API key for your provider
- **Model**: vision-capable chat model name
- **API enabled**: whether ImagePrompt should call the configured API directly
- **Overlay and analysis**: whether the webpage floating menu is enabled
- **Interface language**: English or Simplified Chinese

## Test Connection

The **Test connection** button sends a real OpenAI-compatible `/chat/completions` request with a small inline test image.

The test passes only when the configured model:

- accepts image input,
- returns a message,
- returns valid JSON in the schema ImagePrompt expects.

## No-API Mode

When API analysis is disabled or unavailable, ImagePrompt can help you run the workflow manually:

1. Copy the screenshot.
2. Copy the GPT prompt.
3. Send both to a vision-capable model.
4. Paste the model result back into ImagePrompt.
5. Import the result to display and save the prompt.

## Local Data

ImagePrompt stores settings and history in Chrome storage.

Stored locally:

- API settings
- interface settings
- prompt history
- latest analysis snapshot

When API analysis is used, ImagePrompt sends the selected image, page URL, alt text, dimensions, and prompt instructions to the Base URL you configure.

## Development

Run the local verification script from the repository root:

```bash
node verify-local-extension.mjs
```

Expected result:

```text
ImagePrompt local extension verification passed.
```

## Repository Layout

```text
ImagePrompt/
  background.js
  manifest.json
  popup.html
  popup.js
  options.html
  options.js
  settings-shared.js
  privacy.html
  content/
  icons/
verify-local-extension.mjs
```

## License

MIT License. See [LICENSE](LICENSE).
