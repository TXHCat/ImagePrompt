// ImagePrompt content module: styles

if (!globalThis.__imagetopromptV2Loaded__) {
  var contentStyles = `
  :host {
    all: initial;
    position: fixed !important;
    inset: 0 !important;
    width: var(--imagetoprompt-vw, 100vw) !important;
    height: var(--imagetoprompt-vh, 100vh) !important;
    display: block !important;
    overflow: visible !important;
    z-index: 2147483646 !important;
    pointer-events: none !important;
    font-size: 16px !important;
    line-height: normal !important;
    direction: ltr !important;
    unicode-bidi: isolate !important;
    transform: none !important;
    zoom: 1 !important;
    contain: layout style size !important;
  }

  .overlay {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 2147483646;
    font-family: "SF Pro Display", "SF Pro Text", "Segoe UI Variable", sans-serif;
  }

  .image-action-overlay {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
  }

  .image-action-toast-layer {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    font-family: "SF Pro Display", "SF Pro Text", "Segoe UI Variable", sans-serif;
  }

  .screenshot-selection-layer {
    position: fixed;
    inset: 0;
    display: none;
    pointer-events: none;
    z-index: 2147483647;
    font-family: "SF Pro Display", "SF Pro Text", "Segoe UI Variable", sans-serif;
  }

  .screenshot-selection-layer.is-active {
    display: block;
    pointer-events: auto;
  }

  .screenshot-selection-layer.is-capture-shield {
    display: block;
    opacity: 0;
    pointer-events: auto;
  }

  .screenshot-capture-hover-shield {
    position: absolute;
    inset: 0;
    pointer-events: auto;
    background: transparent;
    cursor: default;
  }

  .screenshot-selection-backdrop {
    position: absolute;
    inset: 0;
    background-position: center;
    background-size: 100% 100%;
    background-repeat: no-repeat;
    cursor: crosshair;
    user-select: none;
    -webkit-user-select: none;
    isolation: isolate;
  }

  .screenshot-selection-backdrop::after {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(6, 8, 12, 0.28);
    pointer-events: none;
    z-index: 0;
  }

  .screenshot-selection-box {
    position: absolute;
    z-index: 1;
    box-sizing: border-box;
    display: none;
    border: 1.5px solid rgba(255, 111, 18, 0.96);
    border-radius: 8px;
    background: rgba(255, 111, 18, 0.08);
    box-shadow:
      0 0 0 9999px rgba(6, 8, 12, 0.46),
      0 0 0 1px rgba(255, 255, 255, 0.44),
      0 16px 36px rgba(0, 0, 0, 0.24),
      0 0 28px rgba(255, 111, 18, 0.28);
    pointer-events: none;
  }

  .screenshot-selection-box.is-visible {
    display: block;
  }

  .screenshot-selection-actions {
    position: absolute;
    z-index: 3;
    display: none;
    align-items: center;
    gap: 8px;
    transform: translateX(-50%);
    padding: 0;
    border-radius: 999px;
    border: 0;
    background: transparent;
    box-shadow: none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    pointer-events: auto;
  }

  .screenshot-selection-actions.is-visible {
    display: inline-flex;
  }

  .screenshot-selection-action {
    all: unset;
    min-width: 58px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    border: 1px solid rgba(248, 252, 255, 0.38);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.36), rgba(255, 255, 255, 0.16)),
      rgba(238, 244, 252, 0.18);
    color: rgba(255, 255, 255, 0.98);
    font-size: 12px;
    font-weight: 720;
    letter-spacing: 0.01em;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    box-shadow:
      0 10px 26px rgba(0, 0, 0, 0.16),
      inset 0 1px 0 rgba(255, 255, 255, 0.42),
      inset 0 -1px 0 rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(18px) saturate(1.08);
    -webkit-backdrop-filter: blur(18px) saturate(1.08);
  }

  .screenshot-selection-action.is-primary {
    border-color: rgba(255, 128, 34, 0.58);
    background:
      linear-gradient(180deg, rgba(255, 141, 48, 1), rgba(255, 102, 8, 0.98)),
      rgba(255, 111, 18, 0.98);
    color: rgba(255, 255, 255, 0.98);
    box-shadow:
      0 12px 28px rgba(255, 111, 18, 0.26),
      inset 0 1px 0 rgba(255, 220, 190, 0.36),
      inset 0 -1px 0 rgba(130, 45, 0, 0.14);
  }

  .screenshot-selection-action:hover {
    transform: translateY(-1px);
    border-color: rgba(238, 244, 255, 0.28);
  }

  .screenshot-selection-hint {
    position: absolute;
    z-index: 2;
    left: 50%;
    top: 18px;
    transform: translateX(-50%);
    padding: 9px 14px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background:
      linear-gradient(180deg, rgba(26, 29, 36, 0.84), rgba(10, 12, 18, 0.72)),
      rgba(0, 0, 0, 0.18);
    box-shadow:
      0 14px 30px rgba(0, 0, 0, 0.24),
      inset 0 1px 0 rgba(255, 255, 255, 0.18);
    color: rgba(248, 251, 255, 0.96);
    font-size: 12px;
    font-weight: 650;
    letter-spacing: 0.02em;
    pointer-events: none;
    white-space: nowrap;
  }

  .screenshot-selection-cancel {
    all: unset;
    position: absolute;
    z-index: 3;
    right: 18px;
    top: 18px;
    width: 38px;
    height: 38px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: rgba(20, 24, 32, 0.74);
    color: rgba(248, 251, 255, 0.94);
    cursor: pointer;
    box-shadow:
      0 12px 28px rgba(0, 0, 0, 0.24),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(18px) saturate(1.06);
    -webkit-backdrop-filter: blur(18px) saturate(1.06);
  }

  .screenshot-selection-cancel:hover {
    border-color: rgba(255, 111, 18, 0.5);
    color: rgba(255, 126, 34, 0.98);
  }

  .image-action-menu {
    --image-action-scale: 1;
    position: fixed;
    min-width: calc(74px * var(--image-action-scale));
    display: inline-flex;
    flex-direction: column;
    gap: calc(5px * var(--image-action-scale));
    padding: 0;
    border-radius: calc(16px * var(--image-action-scale));
    border: 0;
    background: transparent;
    box-shadow: none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    pointer-events: auto;
    transform-origin: top right;
    animation: imageActionMenuIn 0.18s cubic-bezier(0.22, 0.82, 0.2, 1) both;
  }

  .image-action-button {
    all: unset;
    position: relative;
    min-width: calc(64px * var(--image-action-scale));
    height: calc(28px * var(--image-action-scale));
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 calc(10px * var(--image-action-scale));
    border-radius: 999px;
    border: 1px solid rgba(239, 246, 255, 0.36);
    background:
      linear-gradient(180deg, rgba(18, 22, 30, 0.36), rgba(4, 7, 12, 0.45)),
      linear-gradient(180deg, rgba(255, 255, 255, 0.124), rgba(255, 255, 255, 0.034));
    box-shadow:
      0 10px 22px rgba(0, 0, 0, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.34),
      inset 0 -1px 0 rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(22px) saturate(1.18) contrast(1.04);
    -webkit-backdrop-filter: blur(22px) saturate(1.18) contrast(1.04);
    color: rgba(247, 250, 255, 0.96);
    font-size: calc(11px * var(--image-action-scale));
    font-weight: 580;
    letter-spacing: 0.02em;
    cursor: pointer;
    transition:
      transform 0.18s ease,
      border-color 0.18s ease,
      background 0.18s ease,
    color 0.18s ease,
      opacity 0.18s ease;
    overflow: hidden;
  }

  .image-action-button:hover {
    transform: translateY(-1px) scale(1.01);
    border-color: rgba(248, 251, 255, 0.46);
    background:
      linear-gradient(180deg, rgba(22, 26, 34, 0.38), rgba(5, 8, 14, 0.47)),
      linear-gradient(180deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.045));
  }

  .image-action-button[data-inline-action="prompt"]:hover {
    border-color: rgba(255, 111, 18, 0.42);
    color: rgba(255, 126, 34, 0.98);
  }

  .image-action-button:focus,
  .image-action-button:focus-visible,
  .image-action-button:active {
    outline: none;
  }

  .image-action-button.is-disabled {
    opacity: 0.68;
    cursor: progress;
    transform: none;
  }

  .image-action-button.is-success {
    border-color: rgba(214, 255, 230, 0.24);
    background:
      linear-gradient(180deg, rgba(169, 255, 205, 0.14), rgba(105, 220, 155, 0.06)),
      rgba(114, 235, 168, 0.08);
    color: rgba(235, 255, 242, 0.98);
  }

  .image-action-button.is-error {
    border-color: rgba(255, 217, 217, 0.24);
    background:
      linear-gradient(180deg, rgba(255, 177, 177, 0.14), rgba(255, 127, 127, 0.06)),
      rgba(255, 133, 133, 0.08);
  }

  .image-action-toast {
    position: fixed;
    right: 18px;
    bottom: 18px;
    max-width: min(320px, calc(var(--imagetoprompt-vw, 100vw) - 28px));
    padding: 12px 14px;
    border-radius: 18px;
    border: 1px solid rgba(239, 246, 255, 0.18);
    background:
      linear-gradient(180deg, rgba(28, 31, 39, 0.84), rgba(10, 13, 20, 0.72)),
      linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.04));
    box-shadow:
      0 18px 34px rgba(0, 0, 0, 0.24),
      inset 0 1px 0 rgba(255, 255, 255, 0.18);
    color: rgba(247, 250, 255, 0.96);
    font-size: 12px;
    line-height: 1.5;
    pointer-events: none;
    animation: imageActionToastIn 0.22s cubic-bezier(0.22, 0.82, 0.2, 1) both;
  }

  .image-action-toast.is-error {
    border-color: rgba(255, 205, 205, 0.22);
    color: rgba(255, 240, 240, 0.96);
  }

  .panel-shell {
    position: fixed;
    display: inline-flex;
    width: max-content;
    max-width: calc(var(--imagetoprompt-vw, 100vw) - 24px);
    align-items: flex-start;
    gap: ${INLINE_MENU_EDGE_PADDING}px;
    pointer-events: none;
  }

  .panel {
    position: relative;
    --panel-ui-scale: 1;
    width: min(${PANEL_WIDTH}px, calc(var(--imagetoprompt-vw, 100vw) - 24px));
    min-width: min(${PANEL_WIDTH}px, calc(var(--imagetoprompt-vw, 100vw) - 24px));
    flex: 0 0 auto;
    max-height: min(82vh, 680px);
    display: flex;
    overflow: visible;
    isolation: isolate;
    pointer-events: auto;
    color: rgba(247, 250, 255, 0.96);
    border-radius: calc(30px * var(--panel-ui-scale));
    border: 1px solid rgba(239, 246, 255, 0.38);
    background:
      linear-gradient(180deg, rgba(18, 22, 30, 0.38), rgba(4, 7, 12, 0.47)),
      linear-gradient(180deg, rgba(255, 255, 255, 0.136), rgba(255, 255, 255, 0.036));
    box-shadow:
      0 26px 62px rgba(0, 0, 0, 0.21),
      0 11px 26px rgba(0, 0, 0, 0.13),
      inset 0 1px 0 rgba(255, 255, 255, 0.43),
      inset 0 -1px 0 rgba(255, 255, 255, 0.07);
    backdrop-filter: blur(22px) saturate(1.2) contrast(1.04);
    -webkit-backdrop-filter: blur(22px) saturate(1.2) contrast(1.04);
  }

  .panel.dragging {
    transition: none !important;
    user-select: none;
    -webkit-user-select: none;
  }

  .panel.is-minimized {
    width: auto;
    min-width: 0;
    max-width: calc(var(--imagetoprompt-vw, 100vw) - 24px);
  }

  .panel.mode-expand {
    animation: panelModeExpand 0.28s cubic-bezier(0.17, 0.84, 0.22, 1) both;
    transform-origin: center top;
    will-change: transform, clip-path, opacity, border-radius, filter;
  }

  .panel.mode-expand .panel-inner {
    animation: panelModeContentReveal 0.18s cubic-bezier(0.2, 0.82, 0.22, 1) both;
    transform-origin: top center;
    will-change: transform, opacity, filter;
  }

  .panel.is-minimized.mode-collapse {
    animation: panelModeCollapse 0.16s cubic-bezier(0.2, 0.86, 0.22, 1) both;
    transform-origin: center center;
    will-change: transform, clip-path, opacity;
  }

  .panel.mode-exit-collapse {
    animation: panelModeExit 0.1s cubic-bezier(0.4, 0, 0.2, 1) both;
    transform-origin: center top;
    pointer-events: none;
    will-change: transform, clip-path, opacity;
  }

  .panel.mode-exit-expand {
    animation: none;
    transform-origin: center center;
    pointer-events: none;
    will-change: transform, opacity, filter, border-radius;
  }

  .panel::before {
    content: "";
    position: absolute;
    inset: 1px;
    border-radius: calc(29px * var(--panel-ui-scale));
    background: transparent;
    pointer-events: none;
  }

  .panel::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background:
      repeating-linear-gradient(
        0deg,
        rgba(255, 255, 255, 0.018) 0,
        rgba(255, 255, 255, 0.018) 1px,
        transparent 1px,
        transparent 3px
      ),
      repeating-linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.012) 0,
        rgba(255, 255, 255, 0.012) 1px,
        transparent 1px,
        transparent 4px
      );
    opacity: 0.16;
    pointer-events: none;
  }

  .panel.dragging .header {
    cursor: grabbing;
  }

  .ring-glow {
    position: absolute;
    inset: -10px;
    padding: 2px;
    border-radius: 38px;
    pointer-events: none;
    opacity: 0;
    z-index: 0;
    background:
      conic-gradient(
        from 180deg,
        transparent 0deg,
        transparent 52deg,
        rgba(255, 255, 255, 0.05) 74deg,
        rgba(255, 255, 255, 0.78) 92deg,
        rgba(255, 255, 255, 0.22) 108deg,
        transparent 138deg,
        transparent 360deg
      );
    filter: blur(9px);
    -webkit-mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
            mask-composite: exclude;
  }

  .ring-glow::before {
    content: "";
    position: absolute;
    inset: 9px;
    border-radius: 30px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    opacity: 0.65;
  }

  .panel.loading-glow .ring-glow {
    opacity: 0.92;
    animation: borderOrbit 2.2s linear infinite;
  }

  .panel.copy-glow .ring-glow {
    opacity: 1;
    animation: borderOrbitBurst 1.05s cubic-bezier(0.2, 0.78, 0.18, 1) both;
  }

  .glass-pill {
    display: none;
  }

  .panel-inner {
    position: relative;
    z-index: 1;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    min-height: 0;
    max-height: min(82vh, 680px);
    padding: 22px;
    text-shadow: 0 1px 10px rgba(0, 0, 0, 0.1);
  }

  .header {
    position: relative;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: calc(12px * var(--panel-ui-scale));
    margin-bottom: calc(8px * var(--panel-ui-scale));
    min-height: calc(96px * var(--panel-ui-scale));
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
  }

  .header.is-loading {
    min-height: calc(82px * var(--panel-ui-scale));
    margin-bottom: calc(6px * var(--panel-ui-scale));
  }

  .header.is-loading .header-copy {
    padding-right: calc(44px * var(--panel-ui-scale));
  }

  .header-copy {
    flex: 1 1 auto;
    min-width: 0;
    padding-top: 0;
    padding-right: calc(88px * var(--panel-ui-scale));
  }

  .title-row {
    display: flex;
    align-items: flex-start;
    position: relative;
    justify-content: flex-start;
    min-height: calc(28px * var(--panel-ui-scale));
    padding-right: calc(92px * var(--panel-ui-scale));
    margin-top: calc(17px * var(--panel-ui-scale));
  }

  .title-stack {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    gap: calc(3px * var(--panel-ui-scale));
    min-width: 0;
  }

  .title-shot-button {
    appearance: none;
    -webkit-appearance: none;
    border: 0;
    padding: 0;
    margin: 0;
    background: transparent;
    color: inherit;
    font-family: inherit;
    text-align: left;
    cursor: pointer;
    pointer-events: auto;
  }

  .title-screenshot-notice {
    box-sizing: border-box;
    position: relative;
    top: calc(-1px * var(--panel-ui-scale));
    min-width: calc(52px * var(--panel-ui-scale));
    height: calc(15px * var(--panel-ui-scale));
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 calc(6px * var(--panel-ui-scale));
    border-radius: 999px;
    border: 1px solid rgba(255, 139, 45, 0.64);
    background:
      linear-gradient(180deg, rgba(255, 134, 45, 0.34), rgba(255, 95, 12, 0.22)),
      rgba(255, 111, 18, 0.12);
    color: rgba(255, 244, 236, 0.92);
    font-size: calc(8px * var(--panel-ui-scale));
    font-weight: 780;
    line-height: 1;
    letter-spacing: 0;
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
    transition:
      border-color 0.18s ease,
      background 0.18s ease,
      color 0.18s ease,
      box-shadow 0.18s ease,
      transform 0.18s ease;
  }

  .title-shot-button:hover .title-screenshot-notice {
    border-color: rgba(255, 111, 18, 0.96);
    background:
      linear-gradient(180deg, rgba(255, 134, 45, 0.72), rgba(255, 95, 12, 0.44)),
      rgba(255, 111, 18, 0.2);
    color: #fff7ef;
    box-shadow:
      0 0 0 1px rgba(255, 111, 18, 0.12),
      0 calc(4px * var(--panel-ui-scale)) calc(14px * var(--panel-ui-scale)) rgba(255, 111, 18, 0.24);
    transform: translateY(calc(-1px * var(--panel-ui-scale)));
  }

  .title-controls {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    margin-top: calc(8px * var(--panel-ui-scale));
    margin-left: calc(-4px * var(--panel-ui-scale));
  }

  .usage-pill {
    position: absolute;
    top: 50%;
    right: calc(-13px * var(--panel-ui-scale));
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: calc(28px * var(--panel-ui-scale));
    min-width: calc(68px * var(--panel-ui-scale));
    max-width: calc(84px * var(--panel-ui-scale));
    padding: calc(5px * var(--panel-ui-scale)) calc(10px * var(--panel-ui-scale));
    border: 1px solid rgba(238, 244, 255, 0.12);
    border-radius: calc(12px * var(--panel-ui-scale));
    background: rgba(255, 255, 255, 0.012);
    box-shadow: none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }

  .title-row.has-screenshot-notice .usage-pill {
    top: calc(31px * var(--panel-ui-scale));
  }

  .usage-pill.is-guest,
  .usage-pill.is-free,
  .usage-pill.is-pro {
    border-color: rgba(238, 244, 255, 0.12);
    background: rgba(255, 255, 255, 0.012);
  }

  .usage-pill-text {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: calc(14px * var(--panel-ui-scale));
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.01em;
    color: rgba(248, 251, 255, 0.94);
    text-shadow: none;
    font-variant-numeric: tabular-nums;
    transition: color 0.18s ease, text-shadow 0.18s ease, transform 0.18s ease;
  }

  .usage-pill.is-rolling .usage-pill-text {
    color: #ff7a1a;
    text-shadow: 0 0 calc(16px * var(--panel-ui-scale)) rgba(255, 111, 18, 0.35);
    transform: translateY(calc(-1px * var(--panel-ui-scale)));
  }

  .header-actions {
    position: absolute;
    top: calc(-4px * var(--panel-ui-scale));
    right: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: calc(10px * var(--panel-ui-scale));
    flex-shrink: 0;
  }

  .header-top-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: calc(8px * var(--panel-ui-scale));
  }

  .header-secondary-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: calc(8px * var(--panel-ui-scale));
  }

  .header.is-loading .header-actions {
    top: calc(-8px * var(--panel-ui-scale));
    right: calc(7px * var(--panel-ui-scale));
  }

  .panel.is-system-zh .header.is-loading .header-actions {
    right: calc(-4px * var(--panel-ui-scale));
  }

  .header.is-loading .title {
    transform: translateY(calc(1px * var(--panel-ui-scale)));
  }

  .header.is-loading .close-button {
    width: calc(42px * var(--panel-ui-scale));
    min-width: calc(42px * var(--panel-ui-scale));
    height: calc(42px * var(--panel-ui-scale));
  }

  .eyebrow {
    font-size: calc(14px * var(--panel-ui-scale));
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(240, 247, 255, 0.74);
  }

  .title {
    position: relative;
    min-width: 0;
    white-space: nowrap;
    font-size: calc(28px * var(--panel-ui-scale));
    font-weight: 680;
    letter-spacing: -0.03em;
    line-height: 1;
  }

  .title.title-button {
    font-size: calc(31px * var(--panel-ui-scale));
    font-weight: 740;
    letter-spacing: -0.02em;
    line-height: 1;
    transform: translateY(calc(20px * var(--panel-ui-scale)));
  }

  .title-shot-button:focus,
  .title-shot-button:focus-visible,
  .title-shot-button:active,
  .title-button:focus,
  .title-button:focus-visible,
  .title-button:active {
    outline: none;
    box-shadow: none;
  }

  .close-button {
    width: calc(40px * var(--panel-ui-scale));
    min-width: calc(40px * var(--panel-ui-scale));
    height: calc(40px * var(--panel-ui-scale));
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 1px solid rgba(238, 244, 255, 0.12);
    border-radius: calc(12px * var(--panel-ui-scale));
    color: rgba(248, 251, 255, 0.92);
    background: rgba(255, 255, 255, 0.012);
    box-shadow: none;
    cursor: pointer;
    flex-shrink: 0;
    font-size: calc(16px * var(--panel-ui-scale));
    line-height: 1;
    text-shadow: none;
  }

  .close-button svg,
  .share-button svg,
  .screenshot-button svg,
  .minimized-icon-button svg {
    width: 15px;
    height: 15px;
    display: block;
    flex-shrink: 0;
    pointer-events: none;
  }

  .share-button svg {
    width: 18px;
    height: 18px;
  }

  .close-button[data-action="minimize-panel"] svg,
  .screenshot-button svg {
    width: calc(16px * var(--panel-ui-scale));
    height: calc(16px * var(--panel-ui-scale));
  }

  .close-button:hover,
  .share-button:hover,
  .screenshot-button:hover {
    color: rgba(255, 255, 255, 0.98);
    border-color: rgba(238, 244, 255, 0.22);
    background: rgba(255, 255, 255, 0.1);
  }

  .share-button,
  .screenshot-button {
    width: calc(40px * var(--panel-ui-scale));
    min-width: calc(40px * var(--panel-ui-scale));
    height: calc(40px * var(--panel-ui-scale));
  }

  .screenshot-button {
    color: #fff7ef;
    border-color: rgba(255, 111, 18, 0.56);
    background:
      linear-gradient(180deg, rgba(255, 126, 32, 0.34), rgba(255, 95, 12, 0.18)),
      rgba(255, 111, 18, 0.1);
    box-shadow:
      0 0 0 1px rgba(255, 111, 18, 0.12),
      0 calc(8px * var(--panel-ui-scale)) calc(18px * var(--panel-ui-scale)) rgba(255, 111, 18, 0.18);
  }

  .screenshot-button:hover {
    border-color: rgba(255, 111, 18, 0.8);
    background:
      linear-gradient(180deg, rgba(255, 126, 32, 0.46), rgba(255, 95, 12, 0.26)),
      rgba(255, 111, 18, 0.14);
  }

  .minimized-panel {
    box-sizing: border-box;
    width: ${MINIMIZED_PANEL_WIDTH}px;
    min-width: ${MINIMIZED_PANEL_WIDTH}px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
    cursor: grab;
  }

  .minimized-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .minimized-icon-button {
    all: unset;
    box-sizing: border-box;
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border-radius: 12px;
    border: 1px solid rgba(238, 244, 255, 0.12);
    background: rgba(255, 255, 255, 0.012);
    color: rgba(248, 251, 255, 0.92);
    cursor: pointer;
    font-size: 15px;
    line-height: 1;
    text-align: center;
    transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
  }

  .minimized-icon-button:hover {
    transform: translateY(-1px);
    border-color: rgba(238, 244, 255, 0.22);
    background: rgba(255, 255, 255, 0.1);
  }

  .minimized-icon-button.is-danger {
    color: rgba(255, 132, 132, 0.98);
    border-color: rgba(255, 110, 110, 0.24);
    background:
      linear-gradient(180deg, rgba(255, 83, 83, 0.16), rgba(255, 83, 83, 0.08)),
      rgba(255, 255, 255, 0.05);
  }

  .minimized-icon-button.is-danger:hover {
    border-color: rgba(255, 120, 120, 0.34);
    background:
      linear-gradient(180deg, rgba(255, 83, 83, 0.22), rgba(255, 83, 83, 0.12)),
      rgba(255, 255, 255, 0.06);
  }

  .minimized-icon-button.is-expand {
    border-color: rgba(238, 244, 255, 0.12);
    background: rgba(255, 255, 255, 0.012);
    box-shadow: none;
  }

  .minimized-icon-button.is-expand:hover {
    border-color: rgba(238, 244, 255, 0.22);
    background: rgba(255, 255, 255, 0.1);
  }

  .minimized-toggle-card {
    all: unset;
    box-sizing: border-box;
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 10px 8px 12px;
    border-radius: 16px;
    border: 1px solid rgba(238, 244, 255, 0.12);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04)),
      rgba(255, 255, 255, 0.04);
    color: rgba(247, 250, 255, 0.94);
    cursor: pointer;
    transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
  }

  .minimized-toggle-card:hover {
    transform: translateY(-1px);
    border-color: rgba(238, 244, 255, 0.2);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.11), rgba(255, 255, 255, 0.05)),
      rgba(255, 255, 255, 0.05);
  }

  .minimized-toggle-copy {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .minimized-toggle-title {
    font-size: 11px;
    font-weight: 650;
    line-height: 1.25;
    color: rgba(249, 251, 255, 0.96);
  }

  .minimized-toggle-switch {
    position: relative;
    width: 42px;
    min-width: 42px;
    height: 24px;
    border-radius: 999px;
    border: 1px solid rgba(236, 244, 255, 0.12);
    background: rgba(255, 255, 255, 0.12);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      inset 0 0 0 1px rgba(255, 255, 255, 0.015);
    overflow: hidden;
    transition:
      background 0.42s cubic-bezier(0.2, 0.78, 0.18, 1),
      border-color 0.42s cubic-bezier(0.2, 0.78, 0.18, 1),
      box-shadow 0.42s cubic-bezier(0.2, 0.78, 0.18, 1);
  }

  .minimized-toggle-switch::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.96);
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.22),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
    transition:
      transform 0.42s cubic-bezier(0.2, 0.86, 0.18, 1),
      width 0.42s cubic-bezier(0.2, 0.86, 0.18, 1),
      box-shadow 0.42s cubic-bezier(0.2, 0.86, 0.18, 1);
    transform: translateY(-50%);
  }

  .minimized-toggle-card.is-animating .minimized-toggle-switch::before {
    animation: toggleThumbMorph 0.42s cubic-bezier(0.2, 0.86, 0.18, 1) both;
  }

  .minimized-toggle-card.is-active .minimized-toggle-switch {
    border-color: rgba(255, 111, 18, 0.48);
    background: linear-gradient(180deg, rgba(255, 122, 31, 0.98), rgba(255, 98, 9, 0.92));
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      0 0 0 1px rgba(255, 111, 18, 0.1),
      0 10px 18px rgba(255, 111, 18, 0.18);
  }

  .minimized-toggle-card.is-active .minimized-toggle-switch::before {
    transform: translate(18px, -50%);
    box-shadow:
      0 3px 10px rgba(90, 31, 0, 0.24),
      inset 0 1px 0 rgba(255, 255, 255, 0.92);
  }

  .body {
    position: relative;
    display: grid;
    gap: calc(12px * var(--panel-ui-scale));
    flex: 1;
    min-height: 0;
    min-width: 0;
    overflow: auto;
    padding-right: 0;
    overscroll-behavior: contain;
  }

  .body-success {
    grid-template-rows: minmax(0, 1fr) auto;
    overflow: hidden;
  }

  .body-loading {
    overflow: hidden;
  }

  .body-setup {
    min-width: 0;
    max-width: 100%;
    overflow-x: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .body-setup::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }

  .body-manual {
    overflow-x: hidden;
    max-width: 100%;
  }

  .body-manual .setup-shell,
  .body-manual .setup-actions,
  .body-manual .manual-import {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
  }

  .body-manual .setup-input {
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .body-manual .setup-textarea {
    resize: none;
    max-height: calc(150px * var(--panel-ui-scale));
    overflow: auto;
  }

  .panel.result-enter {
    animation: panelWindowExpand 0.78s cubic-bezier(0.22, 0.82, 0.2, 1) both;
    transform-origin: center top;
    will-change: transform, clip-path, opacity;
  }

  .body.result-enter {
    animation: resultReveal 0.62s cubic-bezier(0.22, 0.82, 0.2, 1) both;
    animation-delay: 0.12s;
    transform-origin: top center;
  }

  .body::-webkit-scrollbar {
    width: 6px;
  }

  .body::-webkit-scrollbar-thumb {
    background: rgba(231, 241, 255, 0.24);
    border-radius: 999px;
  }

  .scroll-area {
    min-width: 0;
    min-height: 0;
    overflow: auto;
    margin-right: 0;
    padding-right: calc(4px * var(--panel-ui-scale));
    overscroll-behavior: contain;
  }

  .scroll-area.json-scroll {
    overflow: auto;
    max-height: min(38vh, 300px);
    margin-right: 0;
    padding-right: calc(4px * var(--panel-ui-scale));
  }

  .scroll-area::-webkit-scrollbar {
    width: 6px;
  }

  .scroll-area::-webkit-scrollbar-thumb {
    background: rgba(231, 241, 255, 0.24);
    border-radius: 999px;
  }

  .scroll-area.json-scroll::-webkit-scrollbar {
    width: 6px;
  }

  .scroll-area.json-scroll::-webkit-scrollbar-thumb {
    background: rgba(231, 241, 255, 0.24);
    border-radius: 999px;
  }

  .analysis {
    margin: 0 0 calc(10px * var(--panel-ui-scale));
    font-size: calc(13px * var(--panel-ui-scale));
    line-height: 1.7;
    color: rgba(246, 250, 255, 0.92);
  }

  .prompt {
    margin: 0;
    padding: 0;
    font-size: calc(13px * var(--panel-ui-scale));
    line-height: 1.78;
    white-space: pre-wrap;
    border-radius: 0;
    background: transparent;
    border: 0;
    box-shadow: none;
    color: rgba(248, 251, 255, 0.97);
  }

  .prompt-editor {
    display: block;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    min-height: 0;
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    resize: none;
    overflow: hidden;
    outline: none;
    appearance: none;
    -webkit-appearance: none;
    background: transparent;
    border: 0;
    box-shadow: none;
    color: rgba(248, 251, 255, 0.97);
    font: inherit;
    letter-spacing: inherit;
    text-align: left;
    caret-color: rgba(255, 255, 255, 0.95);
  }

  .prompt-editor.json-view {
    overflow: auto;
    padding-right: calc(4px * var(--panel-ui-scale));
    line-height: 1.62;
  }

  .prompt-editor.json-view::-webkit-scrollbar {
    display: block;
    width: 6px;
  }

  .prompt-editor.json-view::-webkit-scrollbar-thumb {
    background: rgba(231, 241, 255, 0.24);
    border-radius: 999px;
  }

  .prompt-editor::-webkit-resizer {
    display: none;
  }

  .prompt-editor::-webkit-scrollbar {
    display: none;
  }

  .prompt.typing {
    animation: promptReveal 0.42s cubic-bezier(0.22, 0.78, 0.2, 1) both;
    transform-origin: left center;
    will-change: opacity, filter, clip-path, transform;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: calc(6px * var(--panel-ui-scale));
    padding-right: calc(4px * var(--panel-ui-scale));
    max-height: calc(68px * var(--panel-ui-scale));
    overflow: hidden;
  }

  .success-meta {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: calc(12px * var(--panel-ui-scale));
  }

  .history-button {
    all: unset;
    box-sizing: border-box;
    width: calc(40px * var(--panel-ui-scale));
    min-width: calc(40px * var(--panel-ui-scale));
    height: calc(40px * var(--panel-ui-scale));
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: calc(12px * var(--panel-ui-scale));
    border: 1px solid transparent;
    background: transparent;
    box-shadow: none;
    color: rgba(246, 250, 255, 0.94);
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    transition: transform 0.2s ease, opacity 0.2s ease, border-color 0.2s ease, background 0.2s ease;
  }

  .history-button:hover {
    transform: translateY(-1px);
    border-color: rgba(236, 244, 255, 0.12);
    background: rgba(255, 255, 255, 0.012);
  }

  .history-button:focus,
  .history-button:focus-visible,
  .history-button:active {
    transform: none;
    outline: none;
  }

  .history-button.is-disabled {
    opacity: 0.62;
    cursor: progress;
    transform: none;
  }

  .history-button.is-active {
    border-color: rgba(236, 244, 255, 0.16);
    background: rgba(255, 255, 255, 0.08);
  }

  .history-button.is-opening {
    animation: historyButtonSpring 0.46s cubic-bezier(0.2, 0.86, 0.22, 1) both;
  }

  .history-button-icon {
    width: calc(27px * var(--panel-ui-scale));
    height: calc(27px * var(--panel-ui-scale));
    color: rgba(244, 249, 255, 0.94);
    opacity: 0.94;
  }

  .history-button-icon svg {
    width: 100%;
    height: 100%;
    display: block;
  }

  .history-button-icon img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: contain;
    transform: translateX(calc(-2px * var(--panel-ui-scale)));
  }

  .tag {
    padding: calc(5px * var(--panel-ui-scale)) calc(9px * var(--panel-ui-scale));
    border-radius: 999px;
    font-size: calc(14px * var(--panel-ui-scale));
    line-height: calc(18px * var(--panel-ui-scale));
    max-width: calc(205px * var(--panel-ui-scale));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    background: rgba(255, 255, 255, 0.07);
    color: rgba(245, 249, 255, 0.86);
    border: 1px solid rgba(226, 238, 255, 0.12);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .footer {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: stretch;
    gap: calc(10px * var(--panel-ui-scale));
    margin-top: calc(14px * var(--panel-ui-scale));
    padding-top: calc(14px * var(--panel-ui-scale));
    padding-right: 0;
    border-top: 0;
    flex-shrink: 0;
  }

  .footer::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 1px;
    background: rgba(226, 238, 255, 0.14);
    pointer-events: none;
  }

  .footer .toggle-group {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    height: calc(48px * var(--panel-ui-scale));
    min-height: calc(48px * var(--panel-ui-scale));
    gap: calc(2px * var(--panel-ui-scale));
    padding: calc(3px * var(--panel-ui-scale));
  }

  .footer .primary-button,
  .footer .secondary-button {
    width: 100%;
    min-width: 0;
    height: calc(48px * var(--panel-ui-scale));
    min-height: calc(48px * var(--panel-ui-scale));
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .footer .secondary-button {
    border: 1px solid rgba(238, 244, 255, 0.16);
    background: rgba(255, 255, 255, 0.08);
    color: rgba(248, 251, 255, 0.94);
    font-weight: 700;
  }

  .footer .toggle-option {
    flex: 1 1 0;
    min-width: 0;
    height: calc(42px * var(--panel-ui-scale));
    padding: 0 calc(8px * var(--panel-ui-scale));
    font-size: calc(14px * var(--panel-ui-scale));
  }

  .history-rail {
    position: relative;
    width: ${HISTORY_RAIL_WIDTH}px;
    flex: 0 0 auto;
    min-height: ${HISTORY_RAIL_MIN_HEIGHT}px;
    max-height: min(82vh, 680px);
    display: flex;
    overflow: hidden;
    pointer-events: auto;
    color: rgba(247, 250, 255, 0.96);
    user-select: none;
    border-radius: 28px;
    border: 1px solid rgba(239, 246, 255, 0.36);
    background:
      linear-gradient(180deg, rgba(18, 22, 30, 0.36), rgba(4, 7, 12, 0.45)),
      linear-gradient(180deg, rgba(255, 255, 255, 0.124), rgba(255, 255, 255, 0.034));
    box-shadow:
      0 24px 56px rgba(0, 0, 0, 0.19),
      0 11px 22px rgba(0, 0, 0, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.39),
      inset 0 -1px 0 rgba(255, 255, 255, 0.065);
    backdrop-filter: blur(22px) saturate(1.18) contrast(1.04);
    -webkit-backdrop-filter: blur(22px) saturate(1.18) contrast(1.04);
    opacity: 1;
    transform: none;
    transform-origin: left center;
  }

  .history-rail.is-entering {
    opacity: 0.74;
    transform: scaleX(0.7);
    animation: historyRailIn 0.62s cubic-bezier(0.22, 0.82, 0.2, 1) forwards;
    transform-origin: left center;
    will-change: transform, clip-path, opacity;
  }

  .history-rail.is-exiting {
    animation: historyRailOut 0.32s cubic-bezier(0.4, 0, 0.18, 1) both;
    pointer-events: none;
  }

  .history-rail::before {
    content: "";
    position: absolute;
    inset: 1px;
    border-radius: 27px;
    background: transparent;
    pointer-events: none;
  }

  .history-rail-inner {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    width: 100%;
    height: 100%;
    min-height: 0;
    padding: 16px 14px 14px;
    text-shadow: 0 1px 9px rgba(0, 0, 0, 0.09);
  }

  .history-rail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 12px;
    color: rgba(244, 248, 255, 0.88);
  }

  .history-rail-heading {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .history-title-row {
    display: flex;
    align-items: center;
    gap: 7px;
    min-width: 0;
  }

  .history-rail-title {
    font-size: 12px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .history-rail-count {
    font-size: 11px;
    color: rgba(233, 241, 255, 0.64);
  }

  .history-header-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 0 0 auto;
    align-self: flex-start;
  }

  .history-clear-button {
    all: unset;
    box-sizing: border-box;
    min-width: 40px;
    height: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
    border-radius: 999px;
    border: 1px solid rgba(255, 111, 18, 0.54);
    background:
      linear-gradient(180deg, rgba(255, 126, 32, 0.28), rgba(255, 92, 10, 0.2)),
      rgba(255, 111, 18, 0.1);
    color: rgba(255, 235, 222, 0.96);
    font-size: 8px;
    font-weight: 750;
    line-height: 1;
    cursor: pointer;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.14),
      0 8px 18px rgba(255, 111, 18, 0.16);
    transition:
      transform 0.18s ease,
      border-color 0.18s ease,
      background 0.18s ease;
  }

  .history-clear-button:hover {
    transform: translateY(-1px);
    border-color: rgba(255, 139, 45, 0.78);
    background:
      linear-gradient(180deg, rgba(255, 134, 45, 0.38), rgba(255, 95, 12, 0.28)),
      rgba(255, 111, 18, 0.14);
  }

  .history-list {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    gap: ${INLINE_MENU_CORNER_OFFSET}px;
    min-height: 0;
    overflow: auto;
    padding-right: 4px;
  }

  .history-list.has-selection .history-item:not(.is-selected) {
    opacity: 0.56;
    filter: saturate(0.84);
  }

  .history-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1 1 auto;
    min-height: 0;
    padding: 18px 10px;
    text-align: center;
    font-size: 12px;
    line-height: 1.5;
    color: rgba(233, 241, 255, 0.66);
  }

  .history-list::-webkit-scrollbar {
    width: 6px;
  }

  .history-list::-webkit-scrollbar-thumb {
    background: rgba(231, 241, 255, 0.24);
    border-radius: 999px;
  }

  .history-item {
    position: relative;
    align-self: center;
    width: min(100%, ${HISTORY_THUMB_MAX_WIDTH}px);
    opacity: 0.88;
    transition: opacity 0.2s ease, transform 0.2s ease, filter 0.2s ease;
  }

  .history-item.is-pending {
    opacity: 0.78;
  }

  .history-item.is-failed {
    opacity: 0.92;
  }

  .history-item.is-selected {
    opacity: 1;
  }

  .history-card-shell {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 22px;
    cursor: pointer;
    overflow: hidden;
    transition: transform 0.18s ease;
  }

  .history-card-shell:hover {
    transform: translateY(-1px);
  }

  .history-card-inner {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .history-card-face {
    position: relative;
    display: flex;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    border-radius: inherit;
    border: 1px solid rgba(229, 239, 255, 0.12);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02)),
      rgba(255, 255, 255, 0.018);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
    overflow: hidden;
  }

  .history-item.is-selected .history-card-face {
    border-color: rgba(243, 248, 255, 0.24);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.12);
  }

  .history-card-face.image-face {
    padding: 0;
    align-items: center;
    justify-content: center;
  }

  .history-card-face.image-face.is-placeholder::after {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(120deg, transparent 0%, rgba(255, 255, 255, 0.16) 32%, transparent 62%);
    transform: translateX(-120%);
    animation: historyPlaceholderSweep 1.5s ease-in-out infinite;
    pointer-events: none;
  }

  .history-card-face.image-face.is-placeholder.is-failed::after {
    animation: none;
    transform: none;
    background:
      linear-gradient(180deg, rgba(9, 10, 14, 0.08), rgba(9, 10, 14, 0.42)),
      rgba(255, 111, 18, 0.08);
  }

  .history-image-thumb {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
    border-radius: inherit;
    background:
      radial-gradient(circle at 50% 18%, rgba(255, 255, 255, 0.12), transparent 42%),
      rgba(8, 12, 18, 0.22);
  }

  .history-placeholder-badge {
    position: absolute;
    left: 10px;
    bottom: 10px;
    z-index: 2;
    padding: 4px 8px;
    border-radius: 999px;
    border: 1px solid rgba(237, 244, 255, 0.16);
    background:
      linear-gradient(180deg, rgba(20, 23, 30, 0.72), rgba(3, 5, 10, 0.62)),
      rgba(255, 255, 255, 0.04);
    color: rgba(248, 251, 255, 0.92);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.04em;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    pointer-events: none;
  }

  .history-placeholder-badge.is-failed {
    border-color: rgba(255, 111, 18, 0.42);
    background:
      linear-gradient(180deg, rgba(255, 111, 18, 0.28), rgba(120, 45, 12, 0.32)),
      rgba(8, 10, 16, 0.72);
    color: rgba(255, 246, 240, 0.98);
  }

  .history-delete-button {
    all: unset;
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 2;
    width: 22px;
    height: 22px;
    display: grid;
    place-items: center;
    border-radius: 0;
    background: transparent;
    border: 0;
    color: rgba(247, 250, 255, 0.88);
    cursor: pointer;
    transition: transform 0.18s ease, color 0.18s ease;
  }

  .history-delete-button:hover {
    transform: scale(1.04);
    color: rgba(255, 255, 255, 0.98);
  }

  .history-delete-button:focus,
  .history-delete-button:focus-visible,
  .history-delete-button:active {
    outline: none;
  }

  .history-close-button {
    all: unset;
    width: 22px;
    height: 22px;
    display: grid;
    place-items: center;
    border-radius: 0;
    border: 0;
    background: transparent;
    color: rgba(247, 250, 255, 0.84);
    cursor: pointer;
    transition: transform 0.18s ease, color 0.18s ease;
  }

  .history-close-button:hover {
    transform: scale(1.04);
    color: rgba(255, 255, 255, 0.98);
  }

  .history-flyover {
    position: fixed;
    left: 0;
    top: 0;
    pointer-events: none;
    perspective: 1600px;
    z-index: 2147483647;
  }

  .history-flyover-inner {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
  }

  .history-flyover-face {
    position: absolute;
    inset: 0;
    display: flex;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    overflow: hidden;
    border-radius: 24px;
    border: 1px solid rgba(241, 247, 255, 0.18);
    background:
      linear-gradient(180deg, rgba(20, 23, 30, 0.54), rgba(3, 5, 10, 0.46)),
      linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.03));
    box-shadow:
      0 24px 60px rgba(0, 0, 0, 0.24),
      inset 0 1px 0 rgba(255, 255, 255, 0.18);
  }

  .history-flyover-face.image-face {
    transform: rotateY(180deg);
  }

  .history-flyover-front-copy {
    margin: 0;
    padding: 18px 18px 20px;
    color: rgba(248, 251, 255, 0.96);
    font-size: 12px;
    line-height: 1.72;
    white-space: pre-wrap;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 10;
  }

  .history-flyover-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .footer.result-enter {
    animation: resultReveal 0.6s cubic-bezier(0.22, 0.82, 0.2, 1) both;
    animation-delay: 0.22s;
    transform-origin: top center;
  }

  .toggle-group {
    --toggle-pad: calc(3px * var(--panel-ui-scale));
    --toggle-gap: calc(3px * var(--panel-ui-scale));
    --toggle-indicator-width: calc((100% - calc(6px * var(--panel-ui-scale)) - calc(6px * var(--panel-ui-scale))) / 3);
    display: inline-flex;
    position: relative;
    align-items: center;
    gap: calc(3px * var(--panel-ui-scale));
    border: 1px solid rgba(226, 238, 255, 0.14);
    padding: calc(3px * var(--panel-ui-scale));
    min-height: calc(28px * var(--panel-ui-scale));
    background: rgba(255, 255, 255, 0.07);
    color: rgba(241, 247, 255, 0.86);
    font-size: calc(14px * var(--panel-ui-scale));
    border-radius: 999px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
    overflow: hidden;
  }

  .toggle-group::before {
    content: "";
    position: absolute;
    top: var(--toggle-pad);
    bottom: var(--toggle-pad);
    left: var(--toggle-pad);
    width: var(--toggle-indicator-width);
    border-radius: 999px;
    background: linear-gradient(180deg, rgba(231, 241, 255, 0.25), rgba(195, 216, 242, 0.14));
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.18),
      0 4px 12px rgba(57, 92, 136, 0.12);
    transform: translateX(0);
    transition:
      transform 0.44s cubic-bezier(0.2, 0.86, 0.18, 1),
      background 0.24s ease,
      box-shadow 0.24s ease;
    pointer-events: none;
  }

  .toggle-group[data-active-index="1"]::before {
    transform: translateX(calc(100% + var(--toggle-gap)));
  }

  .toggle-group[data-active-index="2"]::before {
    transform: translateX(calc((100% + var(--toggle-gap)) * 2));
  }

  .toggle-option {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: calc(30px * var(--panel-ui-scale));
    height: calc(24px * var(--panel-ui-scale));
    padding: 0 calc(10px * var(--panel-ui-scale));
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: rgba(241, 247, 255, 0.86);
    font-size: calc(14px * var(--panel-ui-scale));
    cursor: pointer;
    box-sizing: border-box;
    transition:
      color 0.24s ease,
      font-weight 0.24s ease,
      transform 0.24s cubic-bezier(0.2, 0.86, 0.18, 1);
  }

  .toggle-option.is-active {
    color: rgba(255, 255, 255, 0.98);
    font-weight: 600;
    background: transparent;
    box-shadow: none;
    transform: translateY(-0.5px);
  }

  .primary-button,
  .secondary-button {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    max-width: 100%;
    cursor: pointer;
    border-radius: 999px;
    font-size: calc(13px * var(--panel-ui-scale));
    line-height: 1.25;
    padding: calc(12px * var(--panel-ui-scale)) calc(18px * var(--panel-ui-scale));
    text-align: center;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
    transition: transform 0.18s ease, opacity 0.18s ease;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .primary-button {
    width: 100%;
    min-width: 0;
    min-height: calc(48px * var(--panel-ui-scale));
    padding-inline: calc(28px * var(--panel-ui-scale));
    color: rgba(14, 18, 24, 0.94);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(241, 244, 248, 0.92));
    border: 1px solid rgba(255, 255, 255, 0.68);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.78),
      inset 0 -1px 0 rgba(198, 206, 216, 0.42),
      0 8px 18px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(18px) saturate(1.02);
    -webkit-backdrop-filter: blur(18px) saturate(1.02);
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
    font-weight: 600;
  }

  .button-check {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: calc(8px * var(--panel-ui-scale));
    font-size: calc(13px * var(--panel-ui-scale));
    line-height: 1;
    color: rgba(20, 26, 34, 0.88);
    animation: checkPop 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .secondary-button {
    color: rgba(245, 249, 255, 0.86);
    background: rgba(255, 255, 255, 0.07);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .secondary-button:hover {
    transform: translateY(-1px);
  }

  .primary-button:hover {
    transform: translateY(-1px);
    outline: none;
    color: rgba(12, 16, 22, 0.96);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(244, 247, 250, 0.94));
    border: 1px solid rgba(255, 255, 255, 0.76);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.84),
      inset 0 -1px 0 rgba(198, 206, 216, 0.46),
      0 12px 24px rgba(0, 0, 0, 0.12);
  }

  .primary-button:active,
  .primary-button:focus,
  .primary-button:focus-visible {
    transform: none;
    outline: none;
    filter: none;
    opacity: 1;
    color: rgba(14, 18, 24, 0.94);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(241, 244, 248, 0.92));
    border: 1px solid rgba(255, 255, 255, 0.68);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.78),
      inset 0 -1px 0 rgba(198, 206, 216, 0.42),
      0 8px 18px rgba(0, 0, 0, 0.1);
  }

  .share-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(0, 0, 0, 0.38);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
  }

  .share-modal {
    width: min(520px, calc(100vw - 32px));
    max-height: min(92vh, 780px);
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 16px;
    border-radius: 26px;
    border: 1px solid rgba(238, 244, 255, 0.2);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.07)),
      rgba(18, 20, 24, 0.42);
    box-shadow:
      0 26px 80px rgba(0, 0, 0, 0.36),
      inset 0 1px 0 rgba(255, 255, 255, 0.26);
    color: rgba(248, 251, 255, 0.96);
    backdrop-filter: blur(26px) saturate(1.18);
    -webkit-backdrop-filter: blur(26px) saturate(1.18);
  }

  .share-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 2px 2px 0;
  }

  .share-modal-title {
    font-size: 15px;
    font-weight: 760;
    letter-spacing: 0.02em;
  }

  .share-modal-preview {
    width: 100%;
    min-height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: 18px;
    border: 1px solid rgba(238, 244, 255, 0.16);
    background: rgba(255, 255, 255, 0.06);
  }

  .share-modal-preview img {
    display: block;
    width: 100%;
    max-height: min(62vh, 620px);
    object-fit: contain;
    background: rgba(255, 255, 255, 0.03);
  }

  .share-modal-loading,
  .share-modal-error {
    padding: 36px 22px;
    font-size: 14px;
    line-height: 1.45;
    color: rgba(248, 251, 255, 0.76);
    text-align: center;
  }

  .share-modal-error {
    color: rgba(255, 214, 214, 0.94);
  }

  .share-modal-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .share-modal-action {
    appearance: none;
    -webkit-appearance: none;
    min-height: 44px;
    border-radius: 999px;
    border: 1px solid rgba(238, 244, 255, 0.18);
    background: rgba(255, 255, 255, 0.1);
    color: rgba(248, 251, 255, 0.94);
    font-size: 14px;
    font-weight: 760;
    cursor: pointer;
  }

  .share-modal-action.is-primary {
    border-color: rgba(255, 111, 18, 0.32);
    background: linear-gradient(180deg, rgba(255, 122, 31, 0.98), rgba(255, 98, 9, 0.92));
    color: rgba(20, 18, 16, 0.96);
  }

  .share-modal-action:hover {
    transform: translateY(-1px);
    border-color: rgba(238, 244, 255, 0.28);
  }

  .loading {
    display: grid;
    gap: calc(10px * var(--panel-ui-scale));
    align-items: center;
  }

  .progress-row {
    display: flex;
    align-items: center;
    gap: calc(12px * var(--panel-ui-scale));
    box-sizing: border-box;
    padding-right: calc(10px * var(--panel-ui-scale));
  }

  .panel.is-system-zh .progress-row {
    padding-right: calc(4px * var(--panel-ui-scale));
  }

  .progress-track {
    position: relative;
    flex: 1;
    height: calc(12px * var(--panel-ui-scale));
    overflow: hidden;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.012);
    border: 1px solid rgba(225, 238, 255, 0.14);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      inset 0 -1px 0 rgba(78, 112, 152, 0.12);
  }

  .progress-bar {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, rgba(240, 247, 255, 0.82), rgba(255, 255, 255, 0.98));
    box-shadow:
      0 0 18px rgba(255, 255, 255, 0.22),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
    transition: width 0.35s ease;
  }

  .progress-value {
    min-width: calc(40px * var(--panel-ui-scale));
    margin-right: calc(5px * var(--panel-ui-scale));
    text-align: right;
    font-size: calc(14px * var(--panel-ui-scale));
    font-variant-numeric: tabular-nums;
    color: rgba(246, 250, 255, 0.94);
  }

  .panel.is-system-zh .progress-value {
    margin-right: calc(-1px * var(--panel-ui-scale));
  }

  .loading-status {
    margin: 0;
    font-size: calc(13px * var(--panel-ui-scale));
    line-height: 1.6;
    color: rgba(244, 248, 255, 0.94);
    animation: loadingPulse 0.9s ease-in-out infinite;
  }

  .error-text {
    margin: 0;
    font-size: calc(13px * var(--panel-ui-scale));
    line-height: 1.6;
    color: rgba(241, 246, 253, 0.92);
    max-height: min(28vh, calc(180px * var(--panel-ui-scale)));
    overflow: auto;
    overflow-wrap: anywhere;
    word-break: break-word;
    padding-right: calc(4px * var(--panel-ui-scale));
    overscroll-behavior: contain;
  }

  .error-text::-webkit-scrollbar {
    width: 6px;
  }

  .error-text::-webkit-scrollbar-thumb {
    background: rgba(231, 241, 255, 0.24);
    border-radius: 999px;
  }

  .helper {
    display: flex;
    gap: calc(8px * var(--panel-ui-scale));
    margin-top: calc(10px * var(--panel-ui-scale));
  }

  .setup-shell {
    display: grid;
    gap: calc(12px * var(--panel-ui-scale));
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  }

  .setup-copy {
    margin: 0;
    max-width: 100%;
    box-sizing: border-box;
    font-size: calc(13px * var(--panel-ui-scale));
    line-height: 1.65;
    color: rgba(243, 248, 255, 0.9);
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .setup-form {
    display: grid;
    gap: calc(10px * var(--panel-ui-scale));
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  }

  .setup-field {
    display: grid;
    gap: calc(5px * var(--panel-ui-scale));
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  }

  .setup-label {
    display: block;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    padding: calc(2px * var(--panel-ui-scale)) 0 0 calc(4px * var(--panel-ui-scale));
    font-size: calc(14px * var(--panel-ui-scale));
    line-height: 1.45;
    letter-spacing: 0.03em;
    color: rgba(241, 247, 255, 0.76);
    overflow: visible;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .setup-input {
    display: block;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    height: calc(42px * var(--panel-ui-scale));
    padding-block: 0;
    padding-inline: clamp(calc(9px * var(--panel-ui-scale)), 4%, calc(13px * var(--panel-ui-scale)));
    border-radius: calc(12px * var(--panel-ui-scale));
    border: 1px solid rgba(226, 238, 255, 0.14);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.03)),
      rgba(255, 255, 255, 0.03);
    color: rgba(248, 251, 255, 0.96);
    font-size: calc(14px * var(--panel-ui-scale));
    outline: none;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }

  .setup-input::placeholder {
    color: rgba(228, 238, 252, 0.42);
  }

  .setup-textarea {
    min-height: calc(116px * var(--panel-ui-scale));
    height: auto;
    padding-top: calc(10px * var(--panel-ui-scale));
    padding-bottom: calc(10px * var(--panel-ui-scale));
    line-height: 1.45;
    resize: vertical;
  }

  .manual-import {
    display: grid;
    gap: calc(8px * var(--panel-ui-scale));
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  }

  .manual-import .secondary-button {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    min-height: calc(40px * var(--panel-ui-scale));
    box-sizing: border-box;
    border: 1px solid rgba(238, 244, 255, 0.16);
    border-radius: calc(12px * var(--panel-ui-scale));
    background: rgba(255, 255, 255, 0.08);
    color: rgba(248, 251, 255, 0.94);
    font-size: calc(13px * var(--panel-ui-scale));
    font-weight: 700;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .setup-input:focus,
  .setup-input:focus-visible {
    border-color: rgba(240, 246, 255, 0.28);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.04)),
      rgba(255, 255, 255, 0.04);
  }

  .setup-error {
    margin: 0;
    max-width: 100%;
    box-sizing: border-box;
    font-size: calc(14px * var(--panel-ui-scale));
    line-height: 1.55;
    color: rgba(255, 215, 215, 0.94);
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .setup-actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: calc(8px * var(--panel-ui-scale));
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    margin-top: calc(2px * var(--panel-ui-scale));
  }

  .setup-actions .primary-button {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .setup-actions .secondary-button {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    min-height: calc(40px * var(--panel-ui-scale));
    box-sizing: border-box;
    border: 1px solid rgba(238, 244, 255, 0.16);
    border-radius: calc(12px * var(--panel-ui-scale));
    background: rgba(255, 255, 255, 0.08);
    color: rgba(248, 251, 255, 0.94);
    font-size: calc(13px * var(--panel-ui-scale));
    font-weight: 700;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .setup-actions .primary-button,
  .setup-actions .secondary-button,
  .manual-import .secondary-button {
    padding-block: calc(10px * var(--panel-ui-scale));
    padding-inline: clamp(calc(10px * var(--panel-ui-scale)), 5%, calc(16px * var(--panel-ui-scale)));
  }

  .hidden {
    display: none;
  }

  @keyframes borderOrbit {
    0% {
      transform: rotate(0deg) scale(0.998);
      opacity: 0.56;
    }

    50% {
      opacity: 0.98;
    }

    100% {
      transform: rotate(360deg) scale(1.002);
      opacity: 0.56;
    }
  }

  @keyframes borderOrbitBurst {
    0% {
      transform: rotate(-8deg) scale(0.992);
      opacity: 0;
    }

    18% {
      opacity: 1;
    }

    72% {
      opacity: 0.92;
    }

    100% {
      transform: rotate(154deg) scale(1.006);
      opacity: 0;
    }
  }

  @keyframes panelWindowExpand {
    0% {
      opacity: 0.78;
      transform: translateY(-22px) scaleY(0.86) scaleX(0.992);
      clip-path: inset(0 0 32% 0 round 30px);
    }

    72% {
      opacity: 1;
      transform: translateY(4px) scaleY(1.022) scaleX(1);
      clip-path: inset(0 0 1% 0 round 30px);
    }

    100% {
      opacity: 1;
      transform: translateY(0) scaleY(1) scaleX(1);
      clip-path: inset(0 0 0 0 round 30px);
    }
  }

  @keyframes panelModeExpand {
    0% {
      opacity: 1;
      filter: blur(0.16px) saturate(1.05);
      border-radius: calc(999px * var(--panel-ui-scale));
      transform: translateY(-2px) scaleX(0.88) scaleY(0.18);
      clip-path: inset(0 0 76% 0 round 999px);
    }

    34% {
      opacity: 1;
      filter: blur(0.08px) saturate(1.04);
      border-radius: calc(68px * var(--panel-ui-scale));
      transform: translateY(0) scaleX(0.96) scaleY(0.58);
      clip-path: inset(0 0 37% 0 round 68px);
    }

    72% {
      opacity: 1;
      filter: blur(0) saturate(1.02);
      border-radius: calc(32px * var(--panel-ui-scale));
      transform: translateY(2px) scaleX(1.002) scaleY(1.018);
      clip-path: inset(0 0 0 0 round 32px);
    }

    88% {
      opacity: 1;
      filter: blur(0) saturate(1.01);
      border-radius: calc(30px * var(--panel-ui-scale));
      transform: translateY(-1px) scaleX(1) scaleY(0.996);
      clip-path: inset(0 0 0 0 round 30px);
    }

    100% {
      opacity: 1;
      filter: blur(0) saturate(1);
      border-radius: calc(30px * var(--panel-ui-scale));
      transform: translateY(0) scaleY(1) scaleX(1);
      clip-path: inset(0 0 0 0 round 30px);
    }
  }

  @keyframes panelModeContentReveal {
    0% {
      opacity: 0;
      filter: blur(2px);
      transform: translateY(-2px) scaleY(0.996);
    }

    38% {
      opacity: 0.42;
      filter: blur(1px);
      transform: translateY(-1px) scaleY(0.998);
    }

    100% {
      opacity: 1;
      filter: blur(0);
      transform: translateY(0) scaleY(1);
    }
  }

  @keyframes panelModeIslandCollapse {
    0% {
      opacity: 1;
      filter: blur(0) saturate(1);
      border-radius: calc(30px * var(--panel-ui-scale));
      transform: scaleX(1) scaleY(1);
      clip-path: inset(0 0 0 0 round 30px);
    }

    28% {
      opacity: 1;
      filter: blur(0.12px) saturate(1.02);
      border-radius: calc(42px * var(--panel-ui-scale));
      transform: scaleX(0.995) scaleY(0.76);
      clip-path: inset(0 0 24% 0 round 42px);
    }

    64% {
      opacity: 0.98;
      filter: blur(0.22px) saturate(1.05);
      border-radius: calc(100px * var(--panel-ui-scale));
      transform: scaleX(0.92) scaleY(0.28);
      clip-path: inset(0 0 68% 0 round 100px);
    }

    100% {
      opacity: 0.95;
      filter: blur(0.28px) saturate(1.06);
      border-radius: calc(999px * var(--panel-ui-scale));
      transform: scaleX(0.84) scaleY(0.13);
      clip-path: inset(0 0 83% 0 round 999px);
    }
  }

  @keyframes panelModeLiquidHandoff {
    0% {
      opacity: 1;
      filter: blur(0) saturate(1);
      border-radius: calc(999px * var(--panel-ui-scale));
      transform: scaleX(1) scaleY(1);
    }

    100% {
      opacity: 0.82;
      filter: blur(0.35px) saturate(1.08);
      border-radius: calc(999px * var(--panel-ui-scale));
      transform: scaleX(0.97) scaleY(0.96);
    }
  }

  @keyframes toggleThumbMorph {
    0% {
      width: 18px;
    }

    45% {
      width: 24px;
    }

    100% {
      width: 18px;
    }
  }

  @keyframes panelModeCollapse {
    0% {
      opacity: 0;
      transform: translateY(-10px) scaleY(0.955);
      clip-path: inset(0 0 14% 0 round 24px);
    }

    70% {
      opacity: 1;
      transform: translateY(2px) scaleY(1.012);
      clip-path: inset(0 0 1% 0 round 24px);
    }

    100% {
      opacity: 1;
      transform: translateY(0) scaleY(1);
      clip-path: inset(0 0 0 0 round 24px);
    }
  }

  @keyframes panelModeExit {
    0% {
      opacity: 1;
      transform: translateY(0) scaleY(1);
      clip-path: inset(0 0 0 0 round 30px);
    }

    100% {
      opacity: 0;
      transform: translateY(-8px) scaleY(0.965);
      clip-path: inset(0 0 12% 0 round 30px);
    }
  }

  @keyframes resultReveal {
    0% {
      opacity: 0;
      transform: translateY(-12px) scaleY(0.965);
    }

    72% {
      opacity: 1;
      transform: translateY(2px) scaleY(1.008);
    }

    100% {
      opacity: 1;
      transform: translateY(0) scaleY(1);
    }
  }

  @keyframes promptReveal {
    0% {
      opacity: 0;
      filter: blur(7px);
      transform: translateY(6px);
      clip-path: inset(0 100% 0 0 round 0);
    }

    45% {
      opacity: 0.72;
      filter: blur(3px);
    }

    100% {
      opacity: 1;
      filter: blur(0);
      transform: translateY(0);
      clip-path: inset(0 0 0 0 round 0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .panel.mode-expand,
    .panel.mode-expand .panel-inner,
    .panel.is-minimized.mode-collapse,
    .panel.mode-exit-collapse,
    .panel.mode-exit-expand,
    .panel.result-enter,
    .body.result-enter,
    .footer.result-enter,
    .history-rail.is-entering,
    .history-rail.is-exiting {
      animation: none;
    }
  }

  @keyframes checkPop {
    0% {
      opacity: 0;
      transform: scale(0.7);
    }

    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes historyButtonSpring {
    0% {
      transform: translateX(0) scaleX(1);
    }

    45% {
      transform: translateX(3px) scaleX(1.08);
    }

    72% {
      transform: translateX(-1px) scaleX(0.985);
    }

    100% {
      transform: translateX(0) scaleX(1);
    }
  }

  @keyframes historyRailIn {
    0% {
      opacity: 0.74;
      transform: scaleX(0.7);
      clip-path: inset(0 48% 0 0 round 28px);
    }

    68% {
      opacity: 1;
      transform: scaleX(1.045);
      clip-path: inset(0 0 0 0 round 28px);
    }

    100% {
      opacity: 1;
      transform: scaleX(1);
      clip-path: inset(0 0 0 0 round 28px);
    }
  }

  @keyframes historyRailOut {
    0% {
      opacity: 1;
      transform: scaleX(1);
      clip-path: inset(0 0 0 0 round 28px);
    }

    36% {
      opacity: 1;
      transform: scaleX(1.025);
      clip-path: inset(0 0 0 0 round 28px);
    }

    100% {
      opacity: 0;
      transform: scaleX(0.68);
      clip-path: inset(0 52% 0 0 round 28px);
    }
  }

  @keyframes promptParticleDrift {
    0% {
      transform: translateY(6px) translateX(-2px) scale(0.96);
    }

    100% {
      transform: translateY(-4px) translateX(2px) scale(1.03);
    }
  }

  @keyframes promptGlowPulse {
    0% {
      transform: scale(0.82);
    }

    100% {
      transform: scale(1.08);
    }
  }

  @keyframes titleBrushReveal {
    0% {
      width: 0;
    }

    100% {
      width: 100%;
    }
  }

  @keyframes titleBrushStroke {
    0% {
      opacity: 0;
      width: 0;
    }

    12% {
      opacity: 0.78;
    }

    88% {
      opacity: 0.48;
      width: 96%;
    }

    100% {
      opacity: 0.26;
      width: 100%;
    }
  }

  @keyframes historyPlaceholderSweep {
    0% {
      transform: translateX(-120%);
    }

    100% {
      transform: translateX(120%);
    }
  }

  @keyframes imageActionMenuIn {
    0% {
      opacity: 0;
      transform: translateY(-4px) scale(0.94);
    }

    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes imageActionToastIn {
    0% {
      opacity: 0;
      transform: translateY(10px) scale(0.96);
    }

    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;
}
