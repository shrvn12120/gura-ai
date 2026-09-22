(function () {
  "use strict";

  /*
   * ============================================================
   * Explore Guraidhoo AI  Embeddable Chat Widget
   * ============================================================
   *
   * Usage:
   *
   * <script
   *   src="http://localhost:3000/widget.js"
   *   data-title="explore-guraidhoo-website"
   *   data-url="http://localhost:3000"
   *   data-mode="light"
   * ></script>
   *
   * Optional:
   *
   * data-title="explore-guraidhoo-website"
   * data-subtitle="How can we help?"
   * data-icon-color="#7c3aed"
   * data-position="bottom-right"
   *
   * ============================================================
   */

  /*
   * ------------------------------------------------------------
   * Prevent duplicate initialization
   * ------------------------------------------------------------
   */

  if (window.__AI_CHAT_WIDGET_LOADED__) {
    return;
  }

  window.__AI_CHAT_WIDGET_LOADED__ = true;

  /*
   * ------------------------------------------------------------
   * Find current script
   * ------------------------------------------------------------
   */

  const script =
    document.currentScript ||
    document.querySelector('script[src*="/widget.js"]');

  if (!script) {
    // console.error("[AI Widget] Could not find widget.js script.");

    return;
  }

  /*
   * ------------------------------------------------------------
   * Configuration
   * ------------------------------------------------------------
   */

  const config = {
    agentId: script.getAttribute("data-agent") || "guraidhoo",

    title: script.getAttribute("data-title") || "AI Concierge",

    subtitle: script.getAttribute("data-subtitle") || "How can I help?",

    color: script.getAttribute("data-icon-color") || "#03fcb1",

    position: script.getAttribute("data-position") || "bottom-right",

    baseUrl:
      script.getAttribute("data-url") || "https://ai.devemm.com",
    colorSchema:script.getAttribute("data-mode") || "dark",
   
  };

  /*
   * ------------------------------------------------------------
   * Validate position
   * ------------------------------------------------------------
   */

  if (config.position !== "bottom-left" && config.position !== "bottom-right") {
    config.position = "bottom-right";
  }

  /*
   * ------------------------------------------------------------
   * Initialize
   * ------------------------------------------------------------
   */

  function initializeWidget() {
    /*
     * Prevent duplicate initialization
     */

    if (document.getElementById("ai-widget-root")) {
      return;
    }

    /*
     * ----------------------------------------------------------
     * Create Shadow DOM
     * ----------------------------------------------------------
     *
     * Shadow DOM gives the widget CSS isolation.
     *
     * A customer's:
     *
     * button {}
     *
     * div {}
     *
     * * {}
     *
     * styles won't easily break the widget.
     *
     */

    const host = document.createElement("div");

    host.id = "ai-widget-root";

    host.style.position = "fixed";

    host.style.zIndex = "2147483647";

    host.style.width = "0";

    host.style.height = "0";

    host.style.overflow = "visible";

    document.body.appendChild(host);

    const shadow = host.attachShadow({
      mode: "open",
    });

    /*
     * ----------------------------------------------------------
     * Styles
     * ----------------------------------------------------------
     */

    const style = document.createElement("style");

    style.textContent = `

      :host {
        all: initial;
      }


      * {
        box-sizing: border-box;
      }


      /*
       * --------------------------------------------------------
       * Launcher position
       * --------------------------------------------------------
       */

      .widget-wrapper {

        position: fixed;

        z-index: 2147483647;

        bottom: 20px;

        display: flex;

        flex-direction: column;

        align-items: flex-end;

        gap: 12px;

        font-family:
          -apple-system,
          BlinkMacSystemFont,
          "Inter",
          "Segoe UI",
          Roboto,
          Helvetica,
          Arial,
          sans-serif;

      }


      .widget-overlay {

        position: fixed;

        inset: 0;

        z-index: 2147483646;

        background: rgba(15, 23, 42, 0.18);

        backdrop-filter: blur(6px);

        -webkit-backdrop-filter: blur(6px);

        opacity: 0;

        visibility: hidden;

        pointer-events: none;

        transition:
          opacity .2s ease,
          visibility .2s ease;

      }


      .widget-overlay.open {

        opacity: 1;

        visibility: visible;

        pointer-events: auto;

      }


      .widget-wrapper.bottom-right {

        right: 20px;

      }


      .widget-wrapper.bottom-left {

        left: 20px;

        align-items: flex-start;

      }


      /*
       * --------------------------------------------------------
       * Chat container
       * --------------------------------------------------------
       */

      .chat-container {

        position: relative;

        width: 10px;

        height: 10px;

        max-width:
          calc(100vw - 30px);

        max-height:
          calc(100vh - 100px);

        background: #ffffff;

        border-radius: 22px;

        overflow: hidden;





        box-shadow:
          0 25px 70px
          rgba(0, 0, 0, 0.20);

        opacity: 0;

        visibility: hidden;

        pointer-events: none;

        transform:
          translateY(15px)
          scale(.97);

        transform-origin:
          bottom right;

        transition:
          opacity .2s ease,
          transform .2s ease,
          visibility .2s ease;

      }


      .bottom-left
      .chat-container {

        transform-origin:
          bottom left;

      }


      .chat-container.open {
       width: 390px;

        height: 650px;

        opacity: 1;

        visibility: visible;

        pointer-events: auto;

        transform:
          translateY(0)
          scale(1);

      }


      /*
       * --------------------------------------------------------
       * Iframe
       * --------------------------------------------------------
       */

      .chat-iframe {

        display: block;

        width: 100%;

        height: 100%;

        border: 0;
        background: #ffffff;

      }


      /*
       * --------------------------------------------------------
       * Launcher
       * --------------------------------------------------------
       */

      .chat-close {
        
        position: absolute;

        top: 14px;

        right: 14px;

        z-index: 2;

        width: 32px;

        height: 32px;

        border: 1px solid rgba(15, 23, 42, 0.08);

        border-radius: 50%;

        background: rgba(255, 255, 255, 0.92);

        color: #111827;

        display: none;

        align-items: center;

        justify-content: center;

        cursor: pointer;

        padding: 0;

        margin: 0;

        box-shadow:
          0 8px 18px
          rgba(15, 23, 42, 0.12);

      }


      .chat-close svg {

        width: 15px;

        height: 15px;

      }


      .launcher {

        position: relative;

        width: 52px;

        height: 52px;

        border: 0;

        border-radius: 50%;

        background:
          linear-gradient(
            135deg,
            ${config.color},
            #4f46e5
          );

        color: #ffffff;

        display: flex;

        align-items: center;

        justify-content: center;

        cursor: pointer;

        padding: 0;

        margin: 0;

        outline: none;

        box-shadow:
          0 10px 30px
          rgba(0, 0, 0, .18);

        transition:
          transform .2s ease,
          box-shadow .2s ease;

        -webkit-tap-highlight-color:
          transparent;

      }


      .launcher:hover {

        transform:
          translateY(-2px);

        box-shadow:
          0 14px 35px
          rgba(0, 0, 0, .22);

      }


      .launcher:active {

        transform:
          scale(.95);

      }


      .launcher svg {

        width: 27px;

        height: 27px;

        pointer-events: none;

      }


      /*
       * --------------------------------------------------------
       * Notification
       * --------------------------------------------------------
       */

      .notification {

        position: absolute;

        top: 0;

        right: 0;

        width: 15px;

        height: 15px;

        border-radius: 50%;

        background: #ef4444;

        border:
          2px solid #ffffff;

        display: none;

      }


      /*
       * --------------------------------------------------------
       * Mobile
       * --------------------------------------------------------
       */

      @media (max-width: 600px) {

        .widget-wrapper {

          right: 14px;

          left: auto;

          bottom: 14px;

        }


        .widget-wrapper.bottom-left {

          right: auto;

          left: 14px;

        }


        .chat-container {

          position: fixed;

          inset: 0;

          width: 100vw;

          height: 100dvh;

          max-width: none;

          max-height: none;

          border-radius: 0;

          border: 0;
          padding-bottom: 70px;
          background: rgba(15, 23, 42, 0.18);

          transform:
            translateY(20px);

        }


        .chat-container.open {
        width: 100%;
        height: 100%;

          transform:
            translateY(0);

        }


        .launcher {

          width: 48px;

          height: 48px;

        }

      }

    `;

    shadow.appendChild(style);

    /*
     * ----------------------------------------------------------
     * Wrapper
     * ----------------------------------------------------------
     */

    const overlay = document.createElement("div");

    overlay.className = "widget-overlay";

    overlay.addEventListener("click", closeWidget);

    shadow.appendChild(overlay);

    const wrapper = document.createElement("div");

    wrapper.className = "widget-wrapper " + config.position;

    /*
     * ----------------------------------------------------------
     * Chat container
     * ----------------------------------------------------------
     */

    const chatContainer = document.createElement("div");

    chatContainer.className = "chat-container";

    /*
     * ----------------------------------------------------------
     * Iframe
     * ----------------------------------------------------------
     */

    const iframe = document.createElement("iframe");

    iframe.className = "chat-iframe";

    iframe.title = config.title;

    iframe.setAttribute("allow", "clipboard-write");

    iframe.setAttribute("loading", "lazy");

    /*
     * ----------------------------------------------------------
     * Build embed URL
     * ----------------------------------------------------------
     */

    const iframeUrl = new URL(config.baseUrl);

    if (config.agentId) {
      iframeUrl.searchParams.set("agent", config.agentId);
    }

    if (config.colorSchema) {
      iframeUrl.searchParams.set("mode", config.colorSchema);
    }

    if (config.token) {
      iframeUrl.searchParams.set("lan", config.token);
    }

    iframe.src = iframeUrl.toString();

    /*
     * ----------------------------------------------------------
     * Chat icon
     * ----------------------------------------------------------
     */

    const chatIcon = `

      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >

        <path
          d="
            M21 11.5
            a8.38 8.38 0 0 1-.9 3.8
            8.5 8.5 0 0 1-7.6 4.7
            8.38 8.38 0 0 1-3.8-.9
            L3 21l1.9-5.7
            A8.38 8.38 0 0 1 4 11.5
            8.5 8.5 0 0 1 8.7 3.9
            8.38 8.38 0 0 1 12.5 3
            a8.5 8.5 0 0 1 8.5 8.5
          "
        />

      </svg>

    `;

    /*
     * ----------------------------------------------------------
     * Close icon
     * ----------------------------------------------------------
     */

    const closeIcon = `

      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >

        <path d="M18 6 6 18" />

        <path d="m6 6 12 12" />

      </svg>

    `;

    const launcher = document.createElement("button");

    launcher.className = "launcher";

    launcher.type = "button";


    launcher.setAttribute("aria-label", "Open chat");

    launcher.innerHTML = chatIcon;

    const closeButton = document.createElement("button");

    closeButton.type = "button";

    closeButton.className = "chat-close";

    closeButton.setAttribute("aria-label", "Close chat");

    closeButton.innerHTML = closeIcon;

    closeButton.addEventListener("click", closeWidget);

    chatContainer.appendChild(closeButton);
    chatContainer.appendChild(iframe);

    /*
     * ----------------------------------------------------------
     * Notification dot
     * ----------------------------------------------------------
     */

    const notification = document.createElement("span");

    notification.className = "notification";

    launcher.appendChild(notification);

    /*
     * ----------------------------------------------------------
     * Add elements
     * ----------------------------------------------------------
     */

    wrapper.appendChild(chatContainer);

    wrapper.appendChild(launcher);

    shadow.appendChild(wrapper);

    /*
     * ----------------------------------------------------------
     * Widget state
     * ----------------------------------------------------------
     */

    let isOpen = false;

    /*
     * ----------------------------------------------------------
     * Open
     * ----------------------------------------------------------
     */

    function openWidget() {
      isOpen = true;

      chatContainer.classList.add("open");

      overlay.classList.add("open");

      launcher.setAttribute("aria-label", "Close AI chat");

      launcher.innerHTML = closeIcon;

      launcher.appendChild(notification);

      notification.style.display = "none";
    }

    /*
     * ----------------------------------------------------------
     * Close
     * ----------------------------------------------------------
     */

    function closeWidget() {
      isOpen = false;

      chatContainer.classList.remove("open");

      overlay.classList.remove("open");

      launcher.setAttribute("aria-label", "Open AI chat");

      launcher.innerHTML = chatIcon;

      launcher.appendChild(notification);
    }

    /*
     * ----------------------------------------------------------
     * Toggle
     * ----------------------------------------------------------
     */

    function toggleWidget() {
      if (isOpen) {
        closeWidget();
      } else {
        openWidget();
      }
    }

    /*
     * ----------------------------------------------------------
     * Launcher click
     * ----------------------------------------------------------
     */

    launcher.addEventListener("click", toggleWidget);

    /*
     * ----------------------------------------------------------
     * Escape key
     * ----------------------------------------------------------
     */

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen) {
        closeWidget();
      }
    });

    /*
     * ----------------------------------------------------------
     * Listen for iframe messages
     * ----------------------------------------------------------
     *
     * This allows the embedded chat application to control
     * the outer widget later.
     *
     * Example:
     *
     * window.parent.postMessage({
     *   type: "AI_WIDGET_CLOSE"
     * }, "https://ai.devemm.com");
     *
     */

    window.addEventListener("message", function (event) {
      /*
       * Only accept messages from our own domain
       */

      if (event.origin !== config.baseUrl) {
        return;
      }

      const data = event.data;

      if (!data) {
        return;
      }

      /*
       * Close widget
       */

      if (data.type === "AI_WIDGET_CLOSE") {
        closeWidget();
      }

      /*
       * Open widget
       */

      if (data.type === "AI_WIDGET_OPEN") {
        openWidget();
      }

      /*
       * Show notification
       */

      if (data.type === "AI_WIDGET_NOTIFICATION") {
        if (!isOpen) {
          notification.style.display = "block";
        }
      }
    });

    /*
     * ----------------------------------------------------------
     * Public API
     * ----------------------------------------------------------
     */

    window.GuraidhooAI = {
      open: openWidget,

      close: closeWidget,

      toggle: toggleWidget,

      isOpen: function () {
        return isOpen;
      },

      agentId: config.agentId,
    };

  }

  /*
   * ------------------------------------------------------------
   * DOM ready handling
   * ------------------------------------------------------------
   *
   * This makes the script safe in:
   *
   * <head>
   *
   * <body>
   *
   * dynamically inserted scripts
   *
   * without requiring defer.
   *
   * ------------------------------------------------------------
   */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeWidget, {
      once: true,
    });
  } else {
    initializeWidget();
  }
})();
