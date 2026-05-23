// ImagePrompt content module: i18n

if (!globalThis.__imagetopromptV2Loaded__) {
  var LOADING_STEPS = {
      en: [
        "Reading the image",
        "Extracting visual style",
        "Building your prompt",
      ],
      zh: ["正在读取图片", "正在提取视觉风格", "正在生成提示词"],
    },
    CONTENT_TEXT = {
      en: {
        analysisImage: "Analyze image",
        analysisResult: "Prompt",
        apiSetupTitle: "Analysis setup",
        manualSetupTitle: "No API mode",
        showAnalysisResult: "Show result",
        apiSetupDescription:
          "Fill in Base URL, API key, and model once. After saving, analysis will continue for the current image.",
        manualSetupDescription:
          "Copy the image and GPT prompt, paste the GPT result below, then import the result to get the image prompt.",
        apiConfigDescription:
          "If you have an image analysis model API, fill in Base URL, API key, and model below. After saving, analysis will continue for the current image.",
        apiSetupBaseUrl: "Base URL",
        apiSetupApiKey: "API key",
        apiSetupModel: "Model",
        apiSetupSave: "Save and start analysis",
        apiSetupSaving: "Saving...",
        manualScreenshot: "Screenshot",
        copyManualScreenshot: "Copy screenshot",
        manualScreenshotCopied: "Screenshot copied",
        manualScreenshotCopyError: "Could not copy screenshot.",
        manualScreenshotCaptureError: "Could not capture screenshot.",
        copyManualPrompt: "Copy GPT prompt",
        manualPromptCopied: "GPT prompt copied",
        manualPromptCopyError: "Could not copy GPT prompt.",
        gptResultPaste: "Paste GPT result",
        gptResultPlaceholder: "Paste GPT JSON or prompt text here.",
        importGptResult: "Import result",
        gptResultRequired: "Paste a GPT result first.",
        gptResultInvalid: "Could not read this GPT result.",
        gptResultImported: "GPT result imported",
        apiSetupBaseUrlPlaceholder: "https://api.openai.com/v1",
        apiSetupApiKeyPlaceholder: "sk-...",
        apiSetupModelPlaceholder:
          "gpt-4.1-mini / gemini-2.5-flash / qwen-vl-max",
        retry: "Regenerate",
        openSettings: "Open settings",
        copy: "Copy",
        copied: "Copied",
        openAction: "Open",
        promptAction: "Prompt",
        promptLoading: "Analyzing",
        saveAction: "Save",
        saveLoading: "Saving",
        saveDone: "Saved",
        saveRetry: "Retry save",
        saveSuccessToast: "Added to history",
        minimizePanel: "Collapse",
        expandPanel: "Expand",
        inlineActionsTitle: "Overlay and analysis",
        inlineActionsOn: "Hide floating menu",
        inlineActionsOff: "Show floating menu",
        closeSharedPanel: "Close panel",
        actionMenuLabel: "Image quick actions",
        history: "History",
        historyLabel: "History",
        deleteHistory: "Delete this history item",
        clearAllHistory: "Clear all",
        closeHistory: "Close history",
        emptyHistory: "No history yet",
        savingHistory: "Analyzing",
        failedHistory: "Failed",
        missingLatestAnalysis:
          "There is no latest analysis to open yet. Run one analysis first.",
        missingImage:
          "No usable image URL was found. Right-click a normal webpage image and try again.",
      },
      zh: {
        analysisImage: "分析图片",
        analysisResult: "分析结果",
        apiSetupTitle: "分析设置",
        manualSetupTitle: "无 API 模式",
        showAnalysisResult: "查看分析结果",
        apiSetupDescription:
          "在卡片里填写 Base URL、API Key 和 Model。保存后会继续分析当前图片。",
        manualSetupDescription:
          "复制图片和复制GPT提示词并将GPT结果粘贴到下方，导入结果获得图片提示词。",
        apiConfigDescription:
          "如果有可用的图片分析模型API，在下方里填写 Base URL、API Key 和 Model。保存后会继续分析当前图片。",
        apiSetupBaseUrl: "Base URL",
        apiSetupApiKey: "API Key",
        apiSetupModel: "Model",
        apiSetupSave: "保存并开始分析",
        apiSetupSaving: "保存中...",
        manualScreenshot: "截图",
        copyManualScreenshot: "复制截图",
        manualScreenshotCopied: "截图已复制",
        manualScreenshotCopyError: "无法复制截图。",
        manualScreenshotCaptureError: "无法获取截图。",
        copyManualPrompt: "复制 GPT 提示词",
        manualPromptCopied: "GPT 提示词已复制",
        manualPromptCopyError: "无法复制 GPT 提示词。",
        gptResultPaste: "粘贴 GPT 结果",
        gptResultPlaceholder: "粘贴 GPT 返回的 JSON 或提示词文本。",
        importGptResult: "导入结果",
        gptResultRequired: "请先粘贴 GPT 结果。",
        gptResultInvalid: "无法读取这段 GPT 结果。",
        gptResultImported: "GPT 结果已导入",
        apiSetupBaseUrlPlaceholder: "https://api.openai.com/v1",
        apiSetupApiKeyPlaceholder: "sk-...",
        apiSetupModelPlaceholder:
          "gpt-4.1-mini / gemini-2.5-flash / qwen-vl-max",
        retry: "重新生成",
        openSettings: "打开设置",
        copy: "复制",
        copied: "已复制",
        openAction: "打开",
        promptAction: "提示词",
        promptLoading: "分析中",
        saveAction: "保存",
        saveLoading: "保存中",
        saveDone: "已保存",
        saveRetry: "重试保存",
        saveSuccessToast: "已加入历史记录",
        minimizePanel: "收起",
        expandPanel: "展开",
        inlineActionsTitle: "悬浮与分析",
        inlineActionsOn: "隐藏悬浮菜单",
        inlineActionsOff: "显示悬浮菜单",
        closeSharedPanel: "关闭面板",
        actionMenuLabel: "图片快捷操作",
        history: "历史",
        historyLabel: "历史",
        deleteHistory: "删除这条历史记录",
        clearAllHistory: "清空",
        closeHistory: "关闭历史",
        emptyHistory: "暂无历史记录",
        savingHistory: "分析中",
        failedHistory: "失败",
        missingLatestAnalysis: "还没有可打开的最近分析，请先运行一次分析。",
        missingImage: "没有拿到可用图片地址，请右键普通网页图片后再试一次。",
      },
    },
    EXTENSION_TITLE = "ImagePrompt - v0.1",
    skipApiConfigCheck = !1,
    METRIC_ANIMATION_MS = 900,
    RESULT_ENTER_MS = 920,
    HISTORY_RAIL_ENTER_MS = 520;
}
function languageTabOrder(language) {
  return language === "zh" ? ["zh", "en", "json"] : ["en", "zh", "json"];
}
function languageTabLabel(language) {
  switch (language) {
    case "zh":
      return "中";
    case "json":
      return "JSON";
    case "en":
    default:
      return "EN";
  }
}
