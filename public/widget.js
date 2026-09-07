(function () {
  "use strict";

  /*
   * ============================================================
   * Guraidhoo AI / Aasandha AI Embeddable Chat Widget
   * ============================================================
   *
   * Usage:
   *
   * <script
   *   src="https://chat.aasandha.ai/widget.js"
   *   data-agent="aasandha"
   * ></script>
   *
   * Optional:
   *
   * data-title="Aasandha AI"
   * data-subtitle="How can we help?"
   * data-color="#7c3aed"
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
    document.querySelector(
      'script[src*="/widget.js"]'
    );


  if (!script) {
    console.error(
      "[AI Widget] Could not find widget.js script."
    );

    return;
  }


  /*
   * ------------------------------------------------------------
   * Configuration
   * ------------------------------------------------------------
   */

  const config = {

    agentId:
      script.getAttribute("data-agent") ||
      "guraidhoo",

    title:
      script.getAttribute("data-title") ||
      "AI Concierge",

    subtitle:
      script.getAttribute("data-subtitle") ||
      "How can I help?",

    color:
      script.getAttribute("data-color") ||
      "#7c3aed",

    position:
      script.getAttribute("data-position") ||
      "bottom-right",

    baseUrl: script.getAttribute("data-url"),

    token: script.getAttribute("data-token")

  };


  /*
   * ------------------------------------------------------------
   * Validate position
   * ------------------------------------------------------------
   */

  if (
    config.position !== "bottom-left" &&
    config.position !== "bottom-right"
  ) {

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

    if (
      document.getElementById(
        "ai-widget-root"
      )
    ) {

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

    const host =
      document.createElement("div");


    host.id =
      "ai-widget-root";


    host.style.position =
      "fixed";


    host.style.zIndex =
      "2147483647";


    host.style.width =
      "0";


    host.style.height =
      "0";


    host.style.overflow =
      "visible";


    document.body.appendChild(host);


    const shadow =
      host.attachShadow({
        mode: "open"
      });


    /*
     * ----------------------------------------------------------
     * Styles
     * ----------------------------------------------------------
     */

    const style =
      document.createElement("style");


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

        width: 390px;

        height: 650px;

        max-width:
          calc(100vw - 30px);

        max-height:
          calc(100vh - 100px);

        background: #ffffff;

        border-radius: 22px;

        overflow: hidden;

         border:
          2px solid #ffffff;



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

      .launcher {

        position: relative;

        width: 58px;

        height: 58px;

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

          transform:
            translateY(20px);

        }


        .chat-container.open {

          transform:
            translateY(0);

        }


        .launcher {

          width: 56px;

          height: 56px;

        }

      }

    `;


    shadow.appendChild(style);


    /*
     * ----------------------------------------------------------
     * Wrapper
     * ----------------------------------------------------------
     */

    const wrapper =
      document.createElement("div");


    wrapper.className =
      "widget-wrapper " +
      config.position;


    /*
     * ----------------------------------------------------------
     * Chat container
     * ----------------------------------------------------------
     */

    const chatContainer =
      document.createElement("div");


    chatContainer.className =
      "chat-container";


    /*
     * ----------------------------------------------------------
     * Iframe
     * ----------------------------------------------------------
     */

    const iframe =
      document.createElement("iframe");


    iframe.className =
      "chat-iframe";


    iframe.title =
      config.title;


    iframe.setAttribute(
      "allow",
      "clipboard-write"
    );


    iframe.setAttribute(
      "loading",
      "lazy"
    );


    /*
     * ----------------------------------------------------------
     * Build embed URL
     * ----------------------------------------------------------
     */

    const embedUrl =
      config.baseUrl+`?lan=${config.token}` 


    iframe.src =
      embedUrl;


    chatContainer.appendChild(
      iframe
    );


    /*
     * ----------------------------------------------------------
     * Launcher button
     * ----------------------------------------------------------
     */

    const launcher =
      document.createElement("button");


    launcher.className =
      "launcher";


    launcher.type =
      "button";


    launcher.setAttribute(
      "aria-label",
      "Open AI chat"
    );


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


    launcher.innerHTML =
      chatIcon;


    /*
     * ----------------------------------------------------------
     * Notification dot
     * ----------------------------------------------------------
     */

    const notification =
      document.createElement("span");


    notification.className =
      "notification";


    launcher.appendChild(
      notification
    );


    /*
     * ----------------------------------------------------------
     * Add elements
     * ----------------------------------------------------------
     */

    wrapper.appendChild(
      chatContainer
    );


    wrapper.appendChild(
      launcher
    );


    shadow.appendChild(
      wrapper
    );


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


      chatContainer.classList.add(
        "open"
      );


      launcher.setAttribute(
        "aria-label",
        "Close AI chat"
      );


      launcher.innerHTML =
        closeIcon;


      launcher.appendChild(
        notification
      );


      notification.style.display =
        "none";

    }


    /*
     * ----------------------------------------------------------
     * Close
     * ----------------------------------------------------------
     */

    function closeWidget() {

      isOpen = false;


      chatContainer.classList.remove(
        "open"
      );


      launcher.setAttribute(
        "aria-label",
        "Open AI chat"
      );


      launcher.innerHTML =
        chatIcon;


      launcher.appendChild(
        notification
      );

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

    launcher.addEventListener(
      "click",
      toggleWidget
    );


    /*
     * ----------------------------------------------------------
     * Escape key
     * ----------------------------------------------------------
     */

    document.addEventListener(
      "keydown",
      function (event) {

        if (
          event.key === "Escape" &&
          isOpen
        ) {

          closeWidget();

        }

      }
    );


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
     * }, "https://chat.aasandha.ai");
     *
     */

    window.addEventListener(
      "message",
      function (event) {

        /*
         * Only accept messages from our own domain
         */

        if (
          event.origin !==
          config.baseUrl
        ) {

          return;

        }


        const data =
          event.data;


        if (!data) {
          return;
        }


        /*
         * Close widget
         */

        if (
          data.type ===
          "AI_WIDGET_CLOSE"
        ) {

          closeWidget();

        }


        /*
         * Open widget
         */

        if (
          data.type ===
          "AI_WIDGET_OPEN"
        ) {

          openWidget();

        }


        /*
         * Show notification
         */

        if (
          data.type ===
          "AI_WIDGET_NOTIFICATION"
        ) {

          if (!isOpen) {

            notification.style.display =
              "block";

          }

        }

      }
    );


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

      agentId:
        config.agentId

    };


    /*
     * ----------------------------------------------------------
     * Debug
     * ----------------------------------------------------------
     */

    if (
      window.location.hostname ===
      "localhost"
    ) {
      console.log({cc: config.token})

      console.log(
        "[AI Widget] Initialized",
        config
      );

    }

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

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initializeWidget,
      {
        once: true
      }
    );

  } else {

    initializeWidget();

  }


})();