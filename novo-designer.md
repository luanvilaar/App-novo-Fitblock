preciso de uma novo designer para todo o site, a home page precisa parece com apenas uma tela de login de app fitness premium minimalista usando as paletas de cores de referencia enexado

parte 2 cuidar de todo designer da dashborad do treiandor e todas as outras telas , o contratutor de treino deve ter uma pegada minimalista

parte 3 o dashboard do aluno/atleta cuidar na reestilizaca de todas ass telas sendo fiel as cores e a tipografia escolhida

aproveitar vamos excluir a sessão social , uma especie de twitter na dashboard do aluno

use o codigo abaixo para referencia estetica , lembrando que o site não é pra ser um site 100% dark mode , ele elementros na cor clara anexada a paleta de cores.





<body>
    <div id="root"><div class="min-h-screen bg-background relative"><div class="relative h-screen w-full"><div dir="ltr" data-orientation="horizontal" class="w-full h-full"><div role="tablist" aria-orientation="horizontal" class="h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground hidden" tabindex="0" data-orientation="horizontal" style="outline: none;"><button type="button" role="tab" aria-selected="true" aria-controls="radix-:r0:-content-preview" data-state="active" id="radix-:r0:-trigger-preview" class="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm" tabindex="-1" data-orientation="horizontal" data-radix-collection-item="">Preview</button><button type="button" role="tab" aria-selected="false" aria-controls="radix-:r0:-content-code" data-state="inactive" id="radix-:r0:-trigger-code" class="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm" tabindex="-1" data-orientation="horizontal" data-radix-collection-item="">Code</button></div><div data-state="inactive" data-orientation="horizontal" role="tabpanel" aria-labelledby="radix-:r0:-trigger-code" hidden="" id="radix-:r0:-content-code" tabindex="0" class="ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 m-0 p-0 h-full"></div><div data-state="active" data-orientation="horizontal" role="tabpanel" aria-labelledby="radix-:r0:-trigger-preview" id="radix-:r0:-content-preview" tabindex="0" class="ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 m-0 p-0 h-full" style=""><div class="h-full w-full"><iframe title="HTML Preview" class="w-full h-screen border-0" sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin" srcdoc="&lt;html lang=&quot;en&quot; class=&quot;scroll-smooth&quot;&gt;&lt;head&gt;
&lt;script id=&quot;aura-supabase-token-firewall&quot;&gt;(function () {
  if (window.__AURA_SUPABASE_FIREWALL__) return;
  window.__AURA_SUPABASE_FIREWALL__ = true;

  var SUPABASE_HOST = &quot;hoirqrkdgbmvpwutwuwj.supabase.co&quot;;
  var BLOCKED_KEY_PATTERNS = [
    /^sb-[a-z0-9-]+-auth-token$/i,
    /^supabase\.auth\.token$/i
  ];

  function isBlockedStorageKey(key) {
    if (typeof key !== &quot;string&quot;) return false;
    for (var i = 0; i &lt; BLOCKED_KEY_PATTERNS.length; i++) {
      if (BLOCKED_KEY_PATTERNS[i].test(key)) return true;
    }
    return false;
  }

  function toAbsoluteUrl(input) {
    try {
      return new URL(input, window.location.href);
    } catch {
      return null;
    }
  }

  function isSupabaseDestination(input) {
    var parsed = toAbsoluteUrl(input);
    if (!parsed) return false;
    if (SUPABASE_HOST &amp;&amp; parsed.host === SUPABASE_HOST) return true;
    return parsed.host.endsWith(&quot;.supabase.co&quot;);
  }

  function pathLooksSensitive(input) {
    var parsed = toAbsoluteUrl(input);
    if (!parsed) return false;
    return /^\/(auth|rest|functions)\/v1\//.test(parsed.pathname || &quot;&quot;);
  }

  function headersContainAuth(headersLike) {
    if (!headersLike) return false;

    try {
      if (typeof Headers !== &quot;undefined&quot; &amp;&amp; headersLike instanceof Headers) {
        return !!(headersLike.get(&quot;authorization&quot;) || headersLike.get(&quot;apikey&quot;));
      }
    } catch {}

    if (Array.isArray(headersLike)) {
      for (var i = 0; i &lt; headersLike.length; i++) {
        var pair = headersLike[i] || [];
        var name = String(pair[0] || &quot;&quot;).toLowerCase();
        if (name === &quot;authorization&quot; || name === &quot;apikey&quot;) return true;
      }
      return false;
    }

    if (typeof headersLike === &quot;object&quot;) {
      var keys = Object.keys(headersLike);
      for (var j = 0; j &lt; keys.length; j++) {
        var k = keys[j].toLowerCase();
        if (k === &quot;authorization&quot; || k === &quot;apikey&quot;) return true;
      }
    }
    return false;
  }

  function requestLooksSensitive(input, init, extraHeaders) {
    var url = &quot;&quot;;
    try {
      if (typeof input === &quot;string&quot;) {
        url = input;
      } else if (input &amp;&amp; typeof input.url === &quot;string&quot;) {
        url = input.url;
      }
    } catch {}

    var headers =
      (init &amp;&amp; init.headers) ||
      (input &amp;&amp; input.headers) ||
      extraHeaders ||
      null;
    var hasAuthHeaders = headersContainAuth(headers);
    if (hasAuthHeaders) return true;

    if (!url) return false;
    if (isSupabaseDestination(url) &amp;&amp; pathLooksSensitive(url)) return true;
    return false;
  }

  function patchStorage(storage, storageName) {
    if (!storage) return;
    var proto = Object.getPrototypeOf(storage);
    if (!proto || proto.__auraSupabaseFirewallPatched) return;

    var rawGetItem = proto.getItem;
    var rawSetItem = proto.setItem;
    var rawRemoveItem = proto.removeItem;
    var rawClear = proto.clear;
    var rawKey = proto.key;
    var rawLengthDescriptor = Object.getOwnPropertyDescriptor(proto, &quot;length&quot;);
    var rawLengthGet = rawLengthDescriptor &amp;&amp; rawLengthDescriptor.get;

    function getRawLength(instance) {
      try {
        if (rawLengthGet) return Number(rawLengthGet.call(instance) || 0);
      } catch {}
      try {
        return Number(instance.length || 0);
      } catch {}
      return 0;
    }

    function getVisibleKeys(instance) {
      var visible = [];
      var total = getRawLength(instance);
      for (var i = 0; i &lt; total; i++) {
        var currentKey = rawKey.call(instance, i);
        if (currentKey &amp;&amp; !isBlockedStorageKey(currentKey)) {
          visible.push(currentKey);
        }
      }
      return visible;
    }

    function maskBlockedKeyProperty(instance, keyName) {
      if (!keyName || !isBlockedStorageKey(keyName)) return;
      try {
        Object.defineProperty(instance, keyName, {
          configurable: true,
          enumerable: false,
          get: function () {
            return null;
          },
          set: function () {
            return true;
          }
        });
      } catch {}
    }

    function syncBlockedKeyProperties(instance) {
      var total = getRawLength(instance);
      for (var i = 0; i &lt; total; i++) {
        var k = rawKey.call(instance, i);
        if (k) maskBlockedKeyProperty(instance, k);
      }
    }

    proto.getItem = function (key) {
      syncBlockedKeyProperties(this);
      if (isBlockedStorageKey(String(key))) return null;
      return rawGetItem.call(this, key);
    };

    proto.setItem = function (key, value) {
      if (isBlockedStorageKey(String(key))) return;
      return rawSetItem.call(this, key, value);
    };

    proto.removeItem = function (key) {
      if (isBlockedStorageKey(String(key))) return;
      return rawRemoveItem.call(this, key);
    };

    proto.clear = function () {
      if (typeof rawClear !== &quot;function&quot;) return;

      // Preserve blocked keys across clear() to prevent auth token/session wipe.
      var preservedBlockedEntries = [];
      var total = getRawLength(this);
      for (var i = 0; i &lt; total; i++) {
        var blockedKey = rawKey.call(this, i);
        if (blockedKey &amp;&amp; isBlockedStorageKey(blockedKey)) {
          preservedBlockedEntries.push([
            blockedKey,
            rawGetItem.call(this, blockedKey),
          ]);
        }
      }

      rawClear.call(this);

      for (var j = 0; j &lt; preservedBlockedEntries.length; j++) {
        var entry = preservedBlockedEntries[j];
        var key = entry[0];
        var value = entry[1];
        if (typeof key === &quot;string&quot; &amp;&amp; typeof value === &quot;string&quot;) {
          rawSetItem.call(this, key, value);
        }
      }

      syncBlockedKeyProperties(this);
    };

    proto.key = function (index) {
      syncBlockedKeyProperties(this);
      var visible = getVisibleKeys(this);
      return visible[index] || null;
    };

    try {
      Object.defineProperty(proto, &quot;length&quot;, {
        configurable: true,
        enumerable: false,
        get: function () {
          syncBlockedKeyProperties(this);
          return getVisibleKeys(this).length;
        }
      });
    } catch {}

    var proxyStorage = null;
    try {
      proxyStorage = new Proxy(storage, {
        get: function (target, prop) {
          if (typeof prop === &quot;string&quot; &amp;&amp; isBlockedStorageKey(prop)) return null;
          if (prop === &quot;length&quot;) return getVisibleKeys(target).length;
          if (prop === &quot;key&quot;) {
            return function (index) {
              var visible = getVisibleKeys(target);
              return visible[index] || null;
            };
          }
          if (prop === &quot;clear&quot;) {
            return function () {
              if (typeof rawClear !== &quot;function&quot;) return;

              var preservedBlockedEntries = [];
              var total = getRawLength(target);
              for (var i = 0; i &lt; total; i++) {
                var blockedKey = rawKey.call(target, i);
                if (blockedKey &amp;&amp; isBlockedStorageKey(blockedKey)) {
                  preservedBlockedEntries.push([
                    blockedKey,
                    rawGetItem.call(target, blockedKey),
                  ]);
                }
              }

              rawClear.call(target);

              for (var j = 0; j &lt; preservedBlockedEntries.length; j++) {
                var entry = preservedBlockedEntries[j];
                var key = entry[0];
                var value = entry[1];
                if (typeof key === &quot;string&quot; &amp;&amp; typeof value === &quot;string&quot;) {
                  rawSetItem.call(target, key, value);
                }
              }

              syncBlockedKeyProperties(target);
            };
          }

          var value = target[prop];
          if (typeof value === &quot;function&quot;) return value.bind(target);
          return value;
        },
        set: function (target, prop, value) {
          if (typeof prop === &quot;string&quot; &amp;&amp; isBlockedStorageKey(prop)) return true;
          target[prop] = value;
          return true;
        },
        has: function (target, prop) {
          if (typeof prop === &quot;string&quot; &amp;&amp; isBlockedStorageKey(prop)) return false;
          return prop in target;
        },
        deleteProperty: function (target, prop) {
          if (typeof prop === &quot;string&quot; &amp;&amp; isBlockedStorageKey(prop)) return true;
          try {
            delete target[prop];
          } catch {}
          return true;
        },
        ownKeys: function (target) {
          return getVisibleKeys(target);
        },
        getOwnPropertyDescriptor: function (target, prop) {
          if (typeof prop === &quot;string&quot; &amp;&amp; isBlockedStorageKey(prop)) {
            return undefined;
          }
          if (prop === &quot;length&quot;) {
            return {
              configurable: true,
              enumerable: false,
              value: getVisibleKeys(target).length,
              writable: false
            };
          }
          return Object.getOwnPropertyDescriptor(target, prop);
        }
      });
    } catch {}

    try {
      if (proxyStorage) {
        Object.defineProperty(window, storageName, {
          configurable: true,
          enumerable: true,
          get: function () {
            return proxyStorage;
          }
        });
      }
    } catch {}

    syncBlockedKeyProperties(storage);
    proto.__auraSupabaseFirewallPatched = true;
  }

  function patchCookieAccess() {
    try {
      var cookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, &quot;cookie&quot;);
      if (!cookieDescriptor || !cookieDescriptor.configurable) return;

      Object.defineProperty(document, &quot;cookie&quot;, {
        configurable: true,
        enumerable: false,
        get: function () {
          return &quot;&quot;;
        },
        set: function () {
          return true;
        }
      });
    } catch {}
  }

  function patchFetch() {
    if (typeof window.fetch !== &quot;function&quot;) return;
    var rawFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      if (requestLooksSensitive(input, init, null)) {
        return Promise.reject(new Error(&quot;Blocked by Aura security policy&quot;));
      }
      return rawFetch(input, init);
    };
  }

  function patchXHR() {
    if (typeof XMLHttpRequest === &quot;undefined&quot;) return;
    var rawOpen = XMLHttpRequest.prototype.open;
    var rawSetHeader = XMLHttpRequest.prototype.setRequestHeader;
    var rawSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
      this.__auraRequestUrl = String(url || &quot;&quot;);
      this.__auraHeaders = {};
      return rawOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
      if (!this.__auraHeaders) this.__auraHeaders = {};
      this.__auraHeaders[String(name || &quot;&quot;).toLowerCase()] = String(value || &quot;&quot;);
      return rawSetHeader.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function () {
      if (requestLooksSensitive(this.__auraRequestUrl || &quot;&quot;, null, this.__auraHeaders || null)) {
        throw new Error(&quot;Blocked by Aura security policy&quot;);
      }
      return rawSend.apply(this, arguments);
    };
  }

  function patchBeacon() {
    if (typeof navigator.sendBeacon !== &quot;function&quot;) return;
    var rawBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function (url, data) {
      if (requestLooksSensitive(url, null, null)) return false;
      return rawBeacon(url, data);
    };
  }

  function patchWebSocket() {
    if (typeof WebSocket === &quot;undefined&quot;) return;
    var RawWebSocket = WebSocket;
    window.WebSocket = function (url, protocols) {
      if (requestLooksSensitive(String(url || &quot;&quot;), null, null)) {
        throw new Error(&quot;Blocked by Aura security policy&quot;);
      }
      return new RawWebSocket(url, protocols);
    };
    window.WebSocket.prototype = RawWebSocket.prototype;
  }

  patchStorage(window.localStorage, &quot;localStorage&quot;);
  patchStorage(window.sessionStorage, &quot;sessionStorage&quot;);
  patchCookieAccess();
  patchFetch();
  patchXHR();
  patchBeacon();
  patchWebSocket();
})();&lt;/script&gt;&lt;meta charset=&quot;UTF-8&quot;&gt;
&lt;meta name=&quot;viewport&quot; content=&quot;width=device-width, initial-scale=1.0&quot;&gt;
&lt;title&gt;KOR | Unrelenting Algorithmic Growth&lt;/title&gt;
&lt;meta name=&quot;description&quot; content=&quot;Mathematical capital compounding. Strip emotion, execute with certainty.&quot;&gt;
&lt;script src=&quot;https://cdn.tailwindcss.com&quot;&gt;&lt;/script&gt;
&lt;script src=&quot;https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js&quot;&gt;&lt;/script&gt;
&lt;link rel=&quot;preconnect&quot; href=&quot;https://fonts.googleapis.com&quot;&gt;
&lt;link rel=&quot;preconnect&quot; href=&quot;https://fonts.gstatic.com&quot; crossorigin=&quot;&quot;&gt;
&lt;link href=&quot;https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600&amp;amp;display=swap&quot; rel=&quot;stylesheet&quot;&gt;
&lt;style&gt;
:root {
--bg-base: #030303;
--bg-panel: #0A0A0A;
--border-tech: rgba(255, 255, 255, 0.1);
--border-highlight: rgba(255, 255, 255, 0.3);
--accent-growth: #00E676; /* Terminal Green */
--accent-risk: #FF1744;
}
body {
font-family: 'Inter Tight', sans-serif;
background-color: var(--bg-base);
color: #A1A1AA;
overflow-x: hidden;
-webkit-font-smoothing: antialiased;
}
/* Swiss Tech Utilities */
.tech-border {
border: 1px solid var(--border-tech);
}
.tech-border-b {
border-bottom: 1px solid var(--border-tech);
}
.tech-panel {
background-color: var(--bg-panel);
border: 1px solid var(--border-tech);
position: relative;
}
/* Complex Chamfered Buttons */
.btn-cut {
clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
position: relative;
overflow: hidden;
transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
display: inline-flex;
align-items: center;
justify-content: center;
}
.btn-cut::before {
content: '';
position: absolute;
top: 0; left: 0; width: 100%; height: 100%;
background: repeating-linear-gradient(
45deg,
transparent,
transparent 4px,
rgba(0,0,0,0.1) 4px,
rgba(0,0,0,0.1) 8px
);
opacity: 0;
transition: opacity 0.4s ease;
}
.btn-cut:hover::before {
opacity: 1;
}
.btn-cut-outline {
clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
background: transparent;
border: 1px solid white;
transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.btn-cut-outline:hover {
background: white;
color: black;
}
/* UI Grid Pattern Overlay */
.bg-tech-grid {
background-size: 60px 60px;
background-image:
linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
}
/* Crosshairs for corners */
.crosshair::before, .crosshair::after, .crosshair-b::before, .crosshair-b::after {
content: '';
position: absolute;
background: var(--border-highlight);
}
.crosshair::before { top: -4px; left: -1px; width: 3px; height: 9px; }
.crosshair::after { top: -1px; left: -4px; width: 9px; height: 3px; }
/* Details Accordion */
details &gt; summary { list-style: none; }
details &gt; summary::-webkit-details-marker { display: none; }
/* High-fidelity charts */
.terminal-glow {
box-shadow: 0 0 20px rgba(0, 230, 118, 0.1);
}
/* Hide scrollbar */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
&lt;/style&gt;&lt;!-- aura-ga4-start --&gt;
&lt;script async=&quot;&quot; src=&quot;https://www.googletagmanager.com/gtag/js?id=G-2M6V79H761&quot;&gt;&lt;/script&gt;
&lt;script&gt;
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-2M6V79H761');
&lt;/script&gt;
&lt;!-- aura-ga4-end --&gt;
&lt;/head&gt;
&lt;body class=&quot;selection:bg-white selection:text-black&quot;&gt;

    &lt;!-- WebGL Simulated Canvas Background --&gt;
    &lt;canvas id=&quot;hero-canvas&quot; class=&quot;fixed inset-0 z-0 pointer-events-none opacity-40&quot;&gt;&lt;/canvas&gt;
    
    &lt;div class=&quot;fixed inset-0 bg-tech-grid z-0 pointer-events-none&quot;&gt;&lt;/div&gt;

    &lt;!-- A. Navigation (Minimal Structural) --&gt;
    &lt;nav class=&quot;fixed top-0 left-0 w-full z-50 tech-panel border-t-0 border-l-0 border-r-0 backdrop-blur-md bg-[#030303]/80&quot;&gt;
        &lt;div class=&quot;w-full max-w-[1600px] mx-auto flex items-stretch justify-between h-16 px-6&quot;&gt;
            &lt;div class=&quot;flex items-center gap-4 tech-border-r pr-6&quot;&gt;
                &lt;!-- SVG Logo --&gt;
                &lt;svg viewBox=&quot;0 0 100 100&quot; class=&quot;w-6 h-6 shrink-0&quot;&gt;
                    &lt;path d=&quot;M10 10 L40 10 L40 40 L70 40 L70 10 L90 10 L90 90 L70 90 L70 60 L40 60 L40 90 L10 90 Z&quot; fill=&quot;white&quot;&gt;&lt;/path&gt;
                &lt;/svg&gt;
                &lt;span class=&quot;text-white font-semibold text-xl tracking-tight uppercase&quot;&gt;KOR&lt;/span&gt;
            &lt;/div&gt;
            &lt;div class=&quot;hidden md:flex items-stretch flex-1 px-8 gap-8&quot;&gt;
                &lt;a href=&quot;#algorithms&quot; class=&quot;text-xs font-semibold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest flex items-center border-b-2 border-transparent hover:border-white&quot;&gt;Architecture&lt;/a&gt;
                &lt;a href=&quot;#performance&quot; class=&quot;text-xs font-semibold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest flex items-center border-b-2 border-transparent hover:border-white&quot;&gt;Alpha Data&lt;/a&gt;
                &lt;a href=&quot;#terminal&quot; class=&quot;text-xs font-semibold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest flex items-center border-b-2 border-transparent hover:border-white&quot;&gt;Live Terminal&lt;/a&gt;
            &lt;/div&gt;
            &lt;div class=&quot;flex items-center pl-6 tech-border-l&quot;&gt;
                &lt;a href=&quot;#apply&quot; class=&quot;btn-cut bg-white text-black px-6 py-2 text-xs uppercase tracking-widest font-semibold&quot;&gt;
                    Initialize
                &lt;/a&gt;
            &lt;/div&gt;
        &lt;/div&gt;
    &lt;/nav&gt;

    &lt;!-- B. Hero Section: Aggressive Growth --&gt;
    &lt;section class=&quot;relative min-h-[90vh] flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden z-10&quot;&gt;
        &lt;div class=&quot;max-w-[1600px] w-full px-6 flex flex-col items-center text-center relative z-10&quot;&gt;
            
            &lt;div class=&quot;inline-flex items-center gap-3 px-4 py-2 tech-border bg-[#030303] mb-12&quot;&gt;
                &lt;div class=&quot;w-2 h-2 bg-[#00E676] rounded-none animate-pulse&quot;&gt;&lt;/div&gt;
                &lt;span class=&quot;text-xs font-mono uppercase tracking-widest text-zinc-300&quot;&gt;System Nominal. Market Active.&lt;/span&gt;
            &lt;/div&gt;
            
            &lt;h1 class=&quot;text-5xl md:text-7xl lg:text-9xl font-semibold tracking-tighter text-white leading-none max-w-6xl mb-8 uppercase&quot;&gt;
                Compound Wealth.&lt;br&gt;
                &lt;span class=&quot;text-zinc-700&quot;&gt;Ruthlessly.&lt;/span&gt;
            &lt;/h1&gt;
            &lt;p class=&quot;text-base md:text-lg text-zinc-400 max-w-2xl mb-16 tracking-tight leading-relaxed&quot;&gt;
                Humans hesitate. Algorithms don't. KOR deploys pure mathematical certainty to multiply your capital with zero emotional interference. Secure your legacy through unfeeling execution.
            &lt;/p&gt;

            &lt;div class=&quot;flex flex-col sm:flex-row gap-6&quot;&gt;
                &lt;a href=&quot;#apply&quot; class=&quot;btn-cut bg-white text-black px-10 py-4 text-sm uppercase tracking-widest font-semibold flex items-center gap-3&quot;&gt;
                    Deploy Capital &lt;iconify-icon icon=&quot;solar:arrow-right-linear&quot;&gt;&lt;/iconify-icon&gt;
                &lt;/a&gt;
                &lt;a href=&quot;#performance&quot; class=&quot;btn-cut-outline text-white px-10 py-4 text-sm uppercase tracking-widest font-semibold bg-transparent border border-white/20&quot;&gt;
                    View Execution Logic
                &lt;/a&gt;
            &lt;/div&gt;
        &lt;/div&gt;
    &lt;/section&gt;

    &lt;!-- C. High-Fidelity Dashboard Preview (The &quot;Astonishing UI&quot;) --&gt;
    &lt;section id=&quot;terminal&quot; class=&quot;relative z-20 px-6 pb-32&quot;&gt;
        &lt;div class=&quot;max-w-[1400px] mx-auto&quot;&gt;
            &lt;div class=&quot;tech-panel p-1&quot;&gt;
                &lt;div class=&quot;bg-[#030303] w-full h-full flex flex-col md:flex-row border border-white/5&quot;&gt;
                    
                    &lt;!-- Left Sidebar: Tickers --&gt;
                    &lt;div class=&quot;w-full md:w-64 tech-border-r p-4 flex flex-col gap-4 font-mono text-xs&quot;&gt;
                        &lt;div class=&quot;text-zinc-500 uppercase tracking-widest mb-2 border-b border-white/10 pb-2 flex justify-between&quot;&gt;
                            &lt;span&gt;Asset&lt;/span&gt;&lt;span&gt;Delta&lt;/span&gt;
                        &lt;/div&gt;
                        &lt;div class=&quot;flex justify-between items-center group cursor-pointer&quot;&gt;
                            &lt;span class=&quot;text-white&quot;&gt;SYS.EQT&lt;/span&gt;
                            &lt;span class=&quot;text-[#00E676]&quot;&gt;+14.2%&lt;/span&gt;
                        &lt;/div&gt;
                        &lt;div class=&quot;flex justify-between items-center group cursor-pointer&quot;&gt;
                            &lt;span class=&quot;text-white&quot;&gt;SYS.DEBT&lt;/span&gt;
                            &lt;span class=&quot;text-[#00E676]&quot;&gt;+8.9%&lt;/span&gt;
                        &lt;/div&gt;
                        &lt;div class=&quot;flex justify-between items-center group cursor-pointer&quot;&gt;
                            &lt;span class=&quot;text-zinc-500&quot;&gt;SYS.HEDGE&lt;/span&gt;
                            &lt;span class=&quot;text-zinc-500&quot;&gt;-1.2%&lt;/span&gt;
                        &lt;/div&gt;
                        &lt;div class=&quot;flex justify-between items-center group cursor-pointer&quot;&gt;
                            &lt;span class=&quot;text-white&quot;&gt;SYS.QNT&lt;/span&gt;
                            &lt;span class=&quot;text-[#00E676]&quot;&gt;+22.1%&lt;/span&gt;
                        &lt;/div&gt;
                        &lt;div class=&quot;mt-auto pt-4 border-t border-white/10 text-zinc-600&quot;&gt;
                            &amp;gt; PING: 12ms&lt;br&gt;
                            &amp;gt; NODE: NYC_04
                        &lt;/div&gt;
                    &lt;/div&gt;

                    &lt;!-- Center: Main Chart --&gt;
                    &lt;div class=&quot;flex-1 p-6 relative flex flex-col&quot;&gt;
                        &lt;div class=&quot;flex justify-between items-end mb-8&quot;&gt;
                            &lt;div&gt;
                                &lt;h3 class=&quot;text-3xl font-semibold text-white tracking-tight uppercase&quot;&gt;Net Capital&lt;/h3&gt;
                                &lt;p class=&quot;text-xs font-mono text-zinc-500 mt-1&quot;&gt;AGGREGATED YIELD CURVE&lt;/p&gt;
                            &lt;/div&gt;
                            &lt;div class=&quot;text-right&quot;&gt;
                                &lt;span class=&quot;block text-4xl font-semibold text-[#00E676] tracking-tight&quot;&gt;$42.8M&lt;/span&gt;
                                &lt;span class=&quot;text-xs font-mono text-white/50 bg-white/10 px-2 py-1 mt-2 inline-block&quot;&gt;LIVE AUM&lt;/span&gt;
                            &lt;/div&gt;
                        &lt;/div&gt;

                        &lt;!-- Complex SVG Chart --&gt;
                        &lt;div class=&quot;flex-1 w-full min-h-[300px] relative border-b border-l border-white/10&quot;&gt;
                            &lt;!-- Grid lines --&gt;
                            &lt;div class=&quot;absolute inset-0 flex flex-col justify-between opacity-20 pointer-events-none&quot;&gt;
                                &lt;div class=&quot;w-full h-px bg-white&quot;&gt;&lt;/div&gt;
                                &lt;div class=&quot;w-full h-px bg-white&quot;&gt;&lt;/div&gt;
                                &lt;div class=&quot;w-full h-px bg-white&quot;&gt;&lt;/div&gt;
                                &lt;div class=&quot;w-full h-px bg-white&quot;&gt;&lt;/div&gt;
                            &lt;/div&gt;
                            &lt;svg class=&quot;absolute inset-0 w-full h-full overflow-visible terminal-glow&quot; preserveAspectRatio=&quot;none&quot; viewBox=&quot;0 0 100 100&quot;&gt;
                                &lt;defs&gt;
                                    &lt;linearGradient id=&quot;chart-grad&quot; x1=&quot;0&quot; y1=&quot;0&quot; x2=&quot;0&quot; y2=&quot;1&quot;&gt;
                                        &lt;stop offset=&quot;0%&quot; stop-color=&quot;#00E676&quot; stop-opacity=&quot;0.2&quot;&gt;&lt;/stop&gt;
                                        &lt;stop offset=&quot;100%&quot; stop-color=&quot;#00E676&quot; stop-opacity=&quot;0&quot;&gt;&lt;/stop&gt;
                                    &lt;/linearGradient&gt;
                                &lt;/defs&gt;
                                &lt;path d=&quot;M0 80 Q 20 70, 40 40 T 70 30 L 100 10 L 100 100 L 0 100 Z&quot; fill=&quot;url(#chart-grad)&quot;&gt;&lt;/path&gt;
                                &lt;path d=&quot;M0 80 Q 20 70, 40 40 T 70 30 L 100 10&quot; fill=&quot;none&quot; stroke=&quot;#00E676&quot; stroke-width=&quot;0.5&quot; vector-effect=&quot;non-scaling-stroke&quot;&gt;&lt;/path&gt;
                                &lt;!-- Crosshair --&gt;
                                &lt;line x1=&quot;70&quot; y1=&quot;0&quot; x2=&quot;70&quot; y2=&quot;100&quot; stroke=&quot;white&quot; stroke-width=&quot;0.5&quot; stroke-dasharray=&quot;2 2&quot; vector-effect=&quot;non-scaling-stroke&quot; class=&quot;opacity-30&quot;&gt;&lt;/line&gt;
                                &lt;circle cx=&quot;70&quot; cy=&quot;30&quot; r=&quot;1.5&quot; fill=&quot;black&quot; stroke=&quot;#00E676&quot; stroke-width=&quot;0.5&quot; vector-effect=&quot;non-scaling-stroke&quot;&gt;&lt;/circle&gt;
                            &lt;/svg&gt;
                            &lt;!-- Tooltip --&gt;
                            &lt;div class=&quot;absolute top-[20%] left-[72%] bg-white text-black font-mono text-xs px-2 py-1 z-10 clip-path-poly&quot;&gt;
                                VOL: +3.4%
                            &lt;/div&gt;
                        &lt;/div&gt;
                    &lt;/div&gt;

                    &lt;!-- Right Sidebar: Execution Logs --&gt;
                    &lt;div class=&quot;w-full md:w-80 tech-border-l bg-[#050505] p-4 font-mono text-xs flex flex-col&quot;&gt;
                        &lt;div class=&quot;text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2&quot;&gt;
                            &lt;div class=&quot;w-1.5 h-1.5 bg-white&quot;&gt;&lt;/div&gt; Execution Feed
                        &lt;/div&gt;
                        &lt;div class=&quot;flex-1 overflow-hidden relative&quot;&gt;
                            &lt;div class=&quot;absolute inset-0 bg-gradient-to-b from-transparent to-[#050505] z-10 pointer-events-none&quot;&gt;&lt;/div&gt;
                            &lt;div class=&quot;space-y-3 opacity-80 animate-[slideUp_10s_linear_infinite]&quot;&gt;
                                &lt;div&gt;&lt;span class=&quot;text-zinc-600&quot;&gt;14:02:01&lt;/span&gt; &lt;span class=&quot;text-white&quot;&gt;SELL 400 TSLA&lt;/span&gt; &lt;span class=&quot;text-[#00E676]&quot;&gt;FILLED&lt;/span&gt;&lt;/div&gt;
                                &lt;div&gt;&lt;span class=&quot;text-zinc-600&quot;&gt;14:02:05&lt;/span&gt; &lt;span class=&quot;text-zinc-400&quot;&gt;REBALANCING EQ MATRIX&lt;/span&gt;&lt;/div&gt;
                                &lt;div&gt;&lt;span class=&quot;text-zinc-600&quot;&gt;14:03:12&lt;/span&gt; &lt;span class=&quot;text-white&quot;&gt;BUY 1200 JPM&lt;/span&gt; &lt;span class=&quot;text-[#00E676]&quot;&gt;FILLED&lt;/span&gt;&lt;/div&gt;
                                &lt;div&gt;&lt;span class=&quot;text-zinc-600&quot;&gt;14:04:00&lt;/span&gt; &lt;span class=&quot;text-zinc-400&quot;&gt;SCANNING ARB OPPS&lt;/span&gt;&lt;/div&gt;
                                &lt;div&gt;&lt;span class=&quot;text-zinc-600&quot;&gt;14:04:45&lt;/span&gt; &lt;span class=&quot;text-white&quot;&gt;EXEC HARVEST_0x9A&lt;/span&gt; &lt;span class=&quot;text-[#00E676]&quot;&gt;SAVED $4k&lt;/span&gt;&lt;/div&gt;
                                &lt;div&gt;&lt;span class=&quot;text-zinc-600&quot;&gt;14:05:01&lt;/span&gt; &lt;span class=&quot;text-zinc-400&quot;&gt;AWAITING MACRO TICK&lt;/span&gt;&lt;/div&gt;
                            &lt;/div&gt;
                        &lt;/div&gt;
                    &lt;/div&gt;

                &lt;/div&gt;
            &lt;/div&gt;
        &lt;/div&gt;
    &lt;/section&gt;

    &lt;!-- D. Social Proof: Institutional Trust --&gt;
    &lt;section class=&quot;py-12 border-y border-white/10 relative z-20 bg-black&quot;&gt;
        &lt;div class=&quot;max-w-[1600px] mx-auto px-6 w-full flex flex-col md:flex-row justify-between items-center gap-10 font-mono text-xs uppercase tracking-widest&quot;&gt;
            &lt;div class=&quot;text-zinc-500&quot;&gt;Infrastructure integrated with:&lt;/div&gt;
            &lt;div class=&quot;flex flex-wrap justify-center gap-12 text-zinc-400&quot;&gt;
                &lt;span class=&quot;flex items-center gap-2 hover:text-white transition-colors cursor-default&quot;&gt;&lt;iconify-icon icon=&quot;solar:server-square-linear&quot; width=&quot;18&quot;&gt;&lt;/iconify-icon&gt; AWS KMS&lt;/span&gt;
                &lt;span class=&quot;flex items-center gap-2 hover:text-white transition-colors cursor-default&quot;&gt;&lt;iconify-icon icon=&quot;solar:banknotes-linear&quot; width=&quot;18&quot;&gt;&lt;/iconify-icon&gt; PLAID NET&lt;/span&gt;
                &lt;span class=&quot;flex items-center gap-2 hover:text-white transition-colors cursor-default&quot;&gt;&lt;iconify-icon icon=&quot;solar:chart-square-linear&quot; width=&quot;18&quot;&gt;&lt;/iconify-icon&gt; BBG DATA&lt;/span&gt;
                &lt;span class=&quot;flex items-center gap-2 hover:text-white transition-colors cursor-default&quot;&gt;&lt;iconify-icon icon=&quot;solar:shield-keyhole-linear&quot; width=&quot;18&quot;&gt;&lt;/iconify-icon&gt; SOC2 T-II&lt;/span&gt;
            &lt;/div&gt;
        &lt;/div&gt;
    &lt;/section&gt;

    &lt;!-- E. Execution Metrics (Impact) --&gt;
    &lt;section class=&quot;py-24 bg-[#050505] tech-border-b relative z-20&quot;&gt;
        &lt;div class=&quot;max-w-[1600px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-0 border border-white/10&quot;&gt;
            
            &lt;div class=&quot;p-12 tech-border-b md:tech-border-b-0 md:tech-border-r group relative overflow-hidden bg-[#0A0A0A]&quot;&gt;
                &lt;div class=&quot;absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out&quot;&gt;&lt;/div&gt;
                &lt;div class=&quot;relative z-10&quot;&gt;
                    &lt;div class=&quot;text-xs uppercase tracking-widest text-zinc-500 font-mono mb-4&quot;&gt;Metric.01 // Managed&lt;/div&gt;
                    &lt;div class=&quot;text-6xl md:text-7xl font-semibold text-white tracking-tighter mb-2&quot;&gt;$2.4B&lt;/div&gt;
                    &lt;p class=&quot;text-sm text-zinc-400&quot;&gt;Capital deployed autonomously across global markets.&lt;/p&gt;
                &lt;/div&gt;
            &lt;/div&gt;

            &lt;div class=&quot;p-12 tech-border-b md:tech-border-b-0 md:tech-border-r group relative overflow-hidden bg-[#0A0A0A]&quot;&gt;
                &lt;div class=&quot;absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out&quot;&gt;&lt;/div&gt;
                &lt;div class=&quot;relative z-10&quot;&gt;
                    &lt;div class=&quot;text-xs uppercase tracking-widest text-zinc-500 font-mono mb-4&quot;&gt;Metric.02 // Speed&lt;/div&gt;
                    &lt;div class=&quot;text-6xl md:text-7xl font-semibold text-[#00E676] tracking-tighter mb-2&quot;&gt;12ms&lt;/div&gt;
                    &lt;p class=&quot;text-sm text-zinc-400&quot;&gt;Average execution latency from macro signal to trade.&lt;/p&gt;
                &lt;/div&gt;
            &lt;/div&gt;

            &lt;div class=&quot;p-12 group relative overflow-hidden bg-[#0A0A0A]&quot;&gt;
                &lt;div class=&quot;absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out&quot;&gt;&lt;/div&gt;
                &lt;div class=&quot;relative z-10&quot;&gt;
                    &lt;div class=&quot;text-xs uppercase tracking-widest text-zinc-500 font-mono mb-4&quot;&gt;Metric.03 // Uptime&lt;/div&gt;
                    &lt;div class=&quot;text-6xl md:text-7xl font-semibold text-white tracking-tighter mb-2&quot;&gt;99.9%&lt;/div&gt;
                    &lt;p class=&quot;text-sm text-zinc-400&quot;&gt;Fault-tolerant structural reliability.&lt;/p&gt;
                &lt;/div&gt;
            &lt;/div&gt;

        &lt;/div&gt;
    &lt;/section&gt;

    &lt;!-- F. Value Proposition: System Architecture (Bento) --&gt;
    &lt;section id=&quot;algorithms&quot; class=&quot;py-32 relative z-20&quot;&gt;
        &lt;div class=&quot;max-w-[1600px] mx-auto px-6&quot;&gt;
            &lt;div class=&quot;mb-16 flex flex-col md:flex-row justify-between items-end gap-6&quot;&gt;
                &lt;div&gt;
                    &lt;h2 class=&quot;text-4xl md:text-6xl font-semibold text-white tracking-tight mb-4 uppercase&quot;&gt;System Architecture&lt;/h2&gt;
                    &lt;p class=&quot;text-lg text-zinc-400 max-w-xl&quot;&gt;Flawless execution driven by proprietary logic structures. No fluff. Just math.&lt;/p&gt;
                &lt;/div&gt;
                &lt;div class=&quot;text-xs font-mono text-zinc-500 border border-white/10 px-4 py-2 bg-[#050505]&quot;&gt;
                    VERSION: CORE_OS_2.4
                &lt;/div&gt;
            &lt;/div&gt;

            &lt;!-- Harsh Bento Grid --&gt;
            &lt;div class=&quot;grid grid-cols-1 md:grid-cols-3 gap-0 border border-white/10 bg-[#0A0A0A]&quot;&gt;
                
                &lt;!-- Card 1 --&gt;
                &lt;div class=&quot;md:col-span-2 p-10 tech-border-b md:tech-border-r relative overflow-hidden group&quot;&gt;
                    &lt;div class=&quot;relative z-10 w-full max-w-lg mb-12&quot;&gt;
                        &lt;div class=&quot;flex items-center gap-2 mb-4&quot;&gt;
                            &lt;iconify-icon icon=&quot;solar:cpu-linear&quot; width=&quot;24&quot; class=&quot;text-white&quot;&gt;&lt;/iconify-icon&gt;
                            &lt;h3 class=&quot;text-2xl font-semibold text-white tracking-tight uppercase&quot;&gt;Algorithmic Rebalancing&lt;/h3&gt;
                        &lt;/div&gt;
                        &lt;p class=&quot;text-sm text-zinc-400 leading-relaxed&quot;&gt;Continuous asset weight optimization based on real-time volatility indices and predictive macro models. Drifting allocations are corrected instantly.&lt;/p&gt;
                    &lt;/div&gt;

                    &lt;!-- Stark Data Block --&gt;
                    &lt;div class=&quot;flex flex-col gap-1 w-full max-w-md font-mono text-xs&quot;&gt;
                        &lt;div class=&quot;flex justify-between text-zinc-500 border-b border-white/10 pb-1 mb-2&quot;&gt;
                            &lt;span&gt;ASSET CLASS&lt;/span&gt;&lt;span&gt;TARGET&lt;/span&gt;&lt;span&gt;ACTUAL&lt;/span&gt;
                        &lt;/div&gt;
                        &lt;div class=&quot;flex justify-between text-white&quot;&gt;
                            &lt;span class=&quot;w-1/3&quot;&gt;EQUITIES&lt;/span&gt;&lt;span class=&quot;w-1/3 text-center&quot;&gt;60.0%&lt;/span&gt;&lt;span class=&quot;w-1/3 text-right text-[#00E676]&quot;&gt;60.1%&lt;/span&gt;
                        &lt;/div&gt;
                        &lt;div class=&quot;w-full bg-[#030303] h-2 mt-1 mb-3 border border-white/10&quot;&gt;&lt;div class=&quot;bg-white h-full w-[60%]&quot;&gt;&lt;/div&gt;&lt;/div&gt;
                        
                        &lt;div class=&quot;flex justify-between text-white&quot;&gt;
                            &lt;span class=&quot;w-1/3&quot;&gt;FIXED_INC&lt;/span&gt;&lt;span class=&quot;w-1/3 text-center&quot;&gt;30.0%&lt;/span&gt;&lt;span class=&quot;w-1/3 text-right text-[#00E676]&quot;&gt;29.9%&lt;/span&gt;
                        &lt;/div&gt;
                        &lt;div class=&quot;w-full bg-[#030303] h-2 mt-1 mb-3 border border-white/10&quot;&gt;&lt;div class=&quot;bg-white h-full w-[30%]&quot;&gt;&lt;/div&gt;&lt;/div&gt;
                    &lt;/div&gt;
                &lt;/div&gt;

                &lt;!-- Card 2 --&gt;
                &lt;div class=&quot;p-10 tech-border-b relative overflow-hidden&quot;&gt;
                    &lt;div class=&quot;relative z-10&quot;&gt;
                        &lt;div class=&quot;flex items-center gap-2 mb-4&quot;&gt;
                            &lt;iconify-icon icon=&quot;solar:shield-warning-linear&quot; width=&quot;24&quot; class=&quot;text-white&quot;&gt;&lt;/iconify-icon&gt;
                            &lt;h3 class=&quot;text-2xl font-semibold text-white tracking-tight uppercase&quot;&gt;Risk Barrier&lt;/h3&gt;
                        &lt;/div&gt;
                        &lt;p class=&quot;text-sm text-zinc-400 leading-relaxed mb-8&quot;&gt;Dynamic stop-losses and volatility scaling. Capital preservation is mathematically prioritized.&lt;/p&gt;
                        
                        &lt;div class=&quot;w-full aspect-video bg-[#030303] border border-white/10 relative flex items-center justify-center overflow-hidden&quot;&gt;
                            &lt;!-- Simulated Waveform --&gt;
                            &lt;div class=&quot;absolute inset-0 flex items-end gap-1 p-2 opacity-50&quot;&gt;
                                &lt;div class=&quot;w-full bg-white h-[20%]&quot;&gt;&lt;/div&gt;
                                &lt;div class=&quot;w-full bg-white h-[40%]&quot;&gt;&lt;/div&gt;
                                &lt;div class=&quot;w-full bg-white h-[30%]&quot;&gt;&lt;/div&gt;
                                &lt;div class=&quot;w-full bg-white h-[60%]&quot;&gt;&lt;/div&gt;
                                &lt;div class=&quot;w-full bg-[#FF1744] h-[80%]&quot;&gt;&lt;/div&gt;
                                &lt;div class=&quot;w-full bg-white h-[40%]&quot;&gt;&lt;/div&gt;
                                &lt;div class=&quot;w-full bg-white h-[50%]&quot;&gt;&lt;/div&gt;
                            &lt;/div&gt;
                            &lt;div class=&quot;absolute top-2 left-2 text-[10px] font-mono text-[#FF1744] bg-[#FF1744]/10 px-1 border border-[#FF1744]/20&quot;&gt;VOL. BREACH DETECTED -&amp;gt; HALT&lt;/div&gt;
                        &lt;/div&gt;
                    &lt;/div&gt;
                &lt;/div&gt;

                &lt;!-- Card 3 --&gt;
                &lt;div class=&quot;p-10 md:tech-border-r relative overflow-hidden flex flex-col justify-between&quot;&gt;
                     &lt;div&gt;
                        &lt;div class=&quot;flex items-center gap-2 mb-4&quot;&gt;
                            &lt;iconify-icon icon=&quot;solar:bolt-linear&quot; width=&quot;24&quot; class=&quot;text-white&quot;&gt;&lt;/iconify-icon&gt;
                            &lt;h3 class=&quot;text-2xl font-semibold text-white tracking-tight uppercase&quot;&gt;Tax Harvest&lt;/h3&gt;
                        &lt;/div&gt;
                        &lt;p class=&quot;text-sm text-zinc-400 mb-6&quot;&gt;Automated realization of capital losses to offset gains, scanning every lot across all accounts instantly.&lt;/p&gt;
                     &lt;/div&gt;
                     &lt;div class=&quot;text-4xl font-semibold text-white tracking-tight border-t border-white/10 pt-4&quot;&gt;
                        +1.8% &lt;span class=&quot;text-xs font-mono text-zinc-500 uppercase block mt-1&quot;&gt;Avg Annual Alpha&lt;/span&gt;
                     &lt;/div&gt;
                &lt;/div&gt;

                &lt;!-- Card 4 --&gt;
                &lt;div class=&quot;md:col-span-2 p-10 flex items-center justify-between bg-[linear-gradient(45deg,transparent,rgba(255,255,255,0.02))]&quot;&gt;
                     &lt;div class=&quot;max-w-md&quot;&gt;
                        &lt;h3 class=&quot;text-2xl font-semibold text-white tracking-tight uppercase mb-2&quot;&gt;Custom Parameters&lt;/h3&gt;
                        &lt;p class=&quot;text-sm text-zinc-400&quot;&gt;Define your structural limits. Let the engine handle the execution latency. Override manually via terminal if necessary.&lt;/p&gt;
                     &lt;/div&gt;
                     &lt;a href=&quot;#apply&quot; class=&quot;hidden sm:inline-flex btn-cut-outline px-6 py-3 border border-white text-white text-xs uppercase font-semibold tracking-widest hover:bg-white hover:text-black&quot;&gt;
                        View Docs
                     &lt;/a&gt;
                &lt;/div&gt;

            &lt;/div&gt;
        &lt;/div&gt;
    &lt;/section&gt;

    &lt;!-- G. Alpha Strategies (Evidence) --&gt;
    &lt;section id=&quot;performance&quot; class=&quot;py-24 relative z-20&quot;&gt;
        &lt;div class=&quot;max-w-[1200px] mx-auto px-6&quot;&gt;
            &lt;h2 class=&quot;text-3xl font-semibold text-white tracking-tight mb-8 uppercase&quot;&gt;Proven Alpha Strategies&lt;/h2&gt;
            
            &lt;div class=&quot;border-t border-white/10&quot;&gt;
                
                &lt;!-- Strategy 1 --&gt;
                &lt;div class=&quot;group relative flex flex-col sm:flex-row sm:items-center justify-between py-8 border-b border-white/10 cursor-pointer hover:bg-white/[0.02] transition-colors -mx-6 px-6&quot;&gt;
                    &lt;div class=&quot;flex flex-col md:flex-row md:items-center gap-2 md:gap-8 w-full md:w-auto mb-4 sm:mb-0&quot;&gt;
                        &lt;h4 class=&quot;text-xl font-semibold text-white tracking-tight uppercase w-48 group-hover:pl-2 transition-all&quot;&gt;Quantum Yield&lt;/h4&gt;
                        &lt;p class=&quot;text-sm text-zinc-500 md:max-w-md&quot;&gt;Autonomous dividend harvesting across global large-cap equities. Pure cashflow optimization.&lt;/p&gt;
                    &lt;/div&gt;
                    &lt;div class=&quot;flex items-center gap-8 self-start sm:self-auto font-mono text-xs&quot;&gt;
                        &lt;div class=&quot;text-right&quot;&gt;
                            &lt;span class=&quot;block text-zinc-500 mb-1&quot;&gt;TRG_APY&lt;/span&gt;
                            &lt;span class=&quot;text-base text-white&quot;&gt;11.4%&lt;/span&gt;
                        &lt;/div&gt;
                        &lt;div class=&quot;text-right w-24&quot;&gt;
                            &lt;span class=&quot;block text-zinc-500 mb-1&quot;&gt;VOLATILITY&lt;/span&gt;
                            &lt;span class=&quot;text-[#00E676]&quot;&gt;MODERATE&lt;/span&gt;
                        &lt;/div&gt;
                    &lt;/div&gt;
                &lt;/div&gt;

                &lt;!-- Strategy 2 --&gt;
                &lt;div class=&quot;group relative flex flex-col sm:flex-row sm:items-center justify-between py-8 border-b border-white/10 cursor-pointer hover:bg-white/[0.02] transition-colors -mx-6 px-6&quot;&gt;
                    &lt;div class=&quot;flex flex-col md:flex-row md:items-center gap-2 md:gap-8 w-full md:w-auto mb-4 sm:mb-0&quot;&gt;
                        &lt;h4 class=&quot;text-xl font-semibold text-white tracking-tight uppercase w-48 group-hover:pl-2 transition-all&quot;&gt;Neural Credit&lt;/h4&gt;
                        &lt;p class=&quot;text-sm text-zinc-500 md:max-w-md&quot;&gt;Algorithmic allocation in over-collateralized private debt structures. High predictability.&lt;/p&gt;
                    &lt;/div&gt;
                    &lt;div class=&quot;flex items-center gap-8 self-start sm:self-auto font-mono text-xs&quot;&gt;
                        &lt;div class=&quot;text-right&quot;&gt;
                            &lt;span class=&quot;block text-zinc-500 mb-1&quot;&gt;TRG_APY&lt;/span&gt;
                            &lt;span class=&quot;text-base text-white&quot;&gt;8.9%&lt;/span&gt;
                        &lt;/div&gt;
                        &lt;div class=&quot;text-right w-24&quot;&gt;
                            &lt;span class=&quot;block text-zinc-500 mb-1&quot;&gt;VOLATILITY&lt;/span&gt;
                            &lt;span class=&quot;text-white&quot;&gt;LOW&lt;/span&gt;
                        &lt;/div&gt;
                    &lt;/div&gt;
                &lt;/div&gt;

                &lt;!-- Strategy 3 --&gt;
                &lt;div class=&quot;group relative flex flex-col sm:flex-row sm:items-center justify-between py-8 border-b border-white/10 cursor-pointer hover:bg-white/[0.02] transition-colors -mx-6 px-6&quot;&gt;
                    &lt;div class=&quot;flex flex-col md:flex-row md:items-center gap-2 md:gap-8 w-full md:w-auto mb-4 sm:mb-0&quot;&gt;
                        &lt;h4 class=&quot;text-xl font-semibold text-white tracking-tight uppercase w-48 group-hover:pl-2 transition-all&quot;&gt;Arb Vertex&lt;/h4&gt;
                        &lt;p class=&quot;text-sm text-zinc-500 md:max-w-md&quot;&gt;High-frequency exploitation of cross-border ETF latency. Aggressive capital multiplication.&lt;/p&gt;
                    &lt;/div&gt;
                    &lt;div class=&quot;flex items-center gap-8 self-start sm:self-auto font-mono text-xs&quot;&gt;
                        &lt;div class=&quot;text-right&quot;&gt;
                            &lt;span class=&quot;block text-zinc-500 mb-1&quot;&gt;TRG_APY&lt;/span&gt;
                            &lt;span class=&quot;text-base text-white&quot;&gt;22.1%&lt;/span&gt;
                        &lt;/div&gt;
                        &lt;div class=&quot;text-right w-24&quot;&gt;
                            &lt;span class=&quot;block text-zinc-500 mb-1&quot;&gt;VOLATILITY&lt;/span&gt;
                            &lt;span class=&quot;text-[#FF1744]&quot;&gt;HIGH&lt;/span&gt;
                        &lt;/div&gt;
                    &lt;/div&gt;
                &lt;/div&gt;

            &lt;/div&gt;
        &lt;/div&gt;
    &lt;/section&gt;

    &lt;!-- H. Deployment Tiers (Pricing) --&gt;
    &lt;section class=&quot;py-32 relative z-20 bg-black tech-border-y&quot;&gt;
        &lt;div class=&quot;max-w-[1600px] mx-auto px-6&quot;&gt;
            &lt;div class=&quot;text-center mb-20&quot;&gt;
                &lt;h2 class=&quot;text-4xl md:text-5xl font-semibold text-white tracking-tight mb-4 uppercase&quot;&gt;Deployment Tiers&lt;/h2&gt;
                &lt;p class=&quot;text-lg text-zinc-400&quot;&gt;Institutional infrastructure, scaled to your capital weight.&lt;/p&gt;
            &lt;/div&gt;

            &lt;div class=&quot;grid grid-cols-1 md:grid-cols-3 gap-0 border border-white/10 max-w-6xl mx-auto&quot;&gt;
                
                &lt;!-- Tier 1 --&gt;
                &lt;div class=&quot;p-10 tech-border-b md:tech-border-b-0 md:tech-border-r flex flex-col h-[32rem] bg-[#050505]&quot;&gt;
                    &lt;h3 class=&quot;text-lg font-semibold text-white tracking-tight mb-2 uppercase&quot;&gt;Professional&lt;/h3&gt;
                    &lt;p class=&quot;text-sm text-zinc-500 mb-8&quot;&gt;For individual quants and elite retail.&lt;/p&gt;
                    &lt;div class=&quot;mb-8 flex-1&quot;&gt;
                        &lt;span class=&quot;text-5xl font-semibold text-white tracking-tighter&quot;&gt;$2k&lt;/span&gt;
                        &lt;span class=&quot;text-xs font-mono text-zinc-500&quot;&gt;/MO&lt;/span&gt;
                    &lt;/div&gt;
                    &lt;ul class=&quot;space-y-4 mb-10 text-xs font-mono text-zinc-400&quot;&gt;
                        &lt;li class=&quot;flex items-center gap-3&quot;&gt;&lt;span class=&quot;w-1 h-1 bg-white&quot;&gt;&lt;/span&gt; UP TO $5M DEPLOYMENT&lt;/li&gt;
                        &lt;li class=&quot;flex items-center gap-3&quot;&gt;&lt;span class=&quot;w-1 h-1 bg-white&quot;&gt;&lt;/span&gt; STANDARD API LIMITS&lt;/li&gt;
                        &lt;li class=&quot;flex items-center gap-3 text-zinc-600&quot;&gt;&lt;span class=&quot;w-1 h-1 bg-zinc-600&quot;&gt;&lt;/span&gt; NO CUSTOM LOGIC&lt;/li&gt;
                    &lt;/ul&gt;
                    &lt;a href=&quot;#apply&quot; class=&quot;btn-cut-outline w-full py-4 text-center text-xs uppercase tracking-widest text-white font-semibold block&quot;&gt;Initialize&lt;/a&gt;
                &lt;/div&gt;

                &lt;!-- Tier 2 (Highlighted) --&gt;
                &lt;div class=&quot;p-10 tech-border-b md:tech-border-b-0 md:tech-border-r flex flex-col h-[32rem] bg-white text-black relative&quot;&gt;
                    &lt;div class=&quot;absolute top-0 right-0 bg-black text-white text-[10px] uppercase font-mono px-3 py-1&quot;&gt;Standard Issue&lt;/div&gt;
                    &lt;h3 class=&quot;text-lg font-semibold tracking-tight mb-2 uppercase&quot;&gt;Family Office&lt;/h3&gt;
                    &lt;p class=&quot;text-sm text-zinc-600 mb-8&quot;&gt;Full autonomous capacity with direct engineering support.&lt;/p&gt;
                    &lt;div class=&quot;mb-8 flex-1&quot;&gt;
                        &lt;span class=&quot;text-6xl font-semibold tracking-tighter&quot;&gt;$14k&lt;/span&gt;
                        &lt;span class=&quot;text-xs font-mono text-zinc-500&quot;&gt;/MO&lt;/span&gt;
                    &lt;/div&gt;
                    &lt;ul class=&quot;space-y-4 mb-10 text-xs font-mono font-semibold&quot;&gt;
                        &lt;li class=&quot;flex items-center gap-3&quot;&gt;&lt;span class=&quot;w-1 h-1 bg-black&quot;&gt;&lt;/span&gt; UP TO $50M DEPLOYMENT&lt;/li&gt;
                        &lt;li class=&quot;flex items-center gap-3&quot;&gt;&lt;span class=&quot;w-1 h-1 bg-black&quot;&gt;&lt;/span&gt; UNLIMITED WEBSOCKETS&lt;/li&gt;
                        &lt;li class=&quot;flex items-center gap-3&quot;&gt;&lt;span class=&quot;w-1 h-1 bg-black&quot;&gt;&lt;/span&gt; CUSTOM NEURAL LOGIC&lt;/li&gt;
                    &lt;/ul&gt;
                    &lt;a href=&quot;#apply&quot; class=&quot;btn-cut bg-black text-white w-full py-4 text-center text-xs uppercase tracking-widest font-semibold block hover:bg-zinc-800&quot;&gt;Deploy Protocol&lt;/a&gt;
                &lt;/div&gt;

                &lt;!-- Tier 3 --&gt;
                &lt;div class=&quot;p-10 flex flex-col h-[32rem] bg-[#050505]&quot;&gt;
                    &lt;h3 class=&quot;text-lg font-semibold text-white tracking-tight mb-2 uppercase&quot;&gt;Institutional&lt;/h3&gt;
                    &lt;p class=&quot;text-sm text-zinc-500 mb-8&quot;&gt;For hedge funds and corporate treasuries.&lt;/p&gt;
                    &lt;div class=&quot;mb-8 flex-1&quot;&gt;
                        &lt;span class=&quot;text-4xl font-semibold text-white tracking-tighter uppercase&quot;&gt;Contact&lt;/span&gt;
                    &lt;/div&gt;
                    &lt;ul class=&quot;space-y-4 mb-10 text-xs font-mono text-zinc-400&quot;&gt;
                        &lt;li class=&quot;flex items-center gap-3&quot;&gt;&lt;span class=&quot;w-1 h-1 bg-white&quot;&gt;&lt;/span&gt; UNLIMITED DEPLOYMENT&lt;/li&gt;
                        &lt;li class=&quot;flex items-center gap-3&quot;&gt;&lt;span class=&quot;w-1 h-1 bg-white&quot;&gt;&lt;/span&gt; ON-PREMISE ENGINE&lt;/li&gt;
                        &lt;li class=&quot;flex items-center gap-3&quot;&gt;&lt;span class=&quot;w-1 h-1 bg-white&quot;&gt;&lt;/span&gt; DEDICATED QUANT DEV&lt;/li&gt;
                    &lt;/ul&gt;
                    &lt;a href=&quot;#apply&quot; class=&quot;btn-cut-outline w-full py-4 text-center text-xs uppercase tracking-widest text-white font-semibold block&quot;&gt;Commence Dialogue&lt;/a&gt;
                &lt;/div&gt;

            &lt;/div&gt;
        &lt;/div&gt;
    &lt;/section&gt;

    &lt;!-- I. Security Fabric --&gt;
    &lt;section class=&quot;py-16 relative z-20&quot;&gt;
        &lt;div class=&quot;max-w-[1200px] mx-auto px-6 text-center&quot;&gt;
            &lt;h2 class=&quot;text-xs font-mono uppercase tracking-widest text-zinc-500 mb-12&quot;&gt;Security Fabric&lt;/h2&gt;
            
            &lt;div class=&quot;grid grid-cols-2 md:grid-cols-4 gap-0 border border-white/10 bg-[#0A0A0A]&quot;&gt;
                &lt;div class=&quot;aspect-square tech-border-r tech-border-b md:tech-border-b-0 flex flex-col items-center justify-center gap-4 hover:bg-white/5 transition-colors&quot;&gt;
                    &lt;iconify-icon icon=&quot;solar:shield-check-linear&quot; width=&quot;32&quot; class=&quot;text-white&quot;&gt;&lt;/iconify-icon&gt;
                    &lt;span class=&quot;text-xs font-mono text-zinc-400 tracking-tight&quot;&gt;SIPC INSURED&lt;/span&gt;
                &lt;/div&gt;
                &lt;div class=&quot;aspect-square tech-border-r tech-border-b md:tech-border-b-0 flex flex-col items-center justify-center gap-4 hover:bg-white/5 transition-colors&quot;&gt;
                    &lt;iconify-icon icon=&quot;solar:lock-password-linear&quot; width=&quot;32&quot; class=&quot;text-white&quot;&gt;&lt;/iconify-icon&gt;
                    &lt;span class=&quot;text-xs font-mono text-zinc-400 tracking-tight&quot;&gt;AES-256 CRYPTO&lt;/span&gt;
                &lt;/div&gt;
                &lt;div class=&quot;aspect-square tech-border-r flex flex-col items-center justify-center gap-4 hover:bg-white/5 transition-colors&quot;&gt;
                    &lt;iconify-icon icon=&quot;solar:banknotes-linear&quot; width=&quot;32&quot; class=&quot;text-white&quot;&gt;&lt;/iconify-icon&gt;
                    &lt;span class=&quot;text-xs font-mono text-zinc-400 tracking-tight&quot;&gt;FINRA MEMBER&lt;/span&gt;
                &lt;/div&gt;
                &lt;div class=&quot;aspect-square flex flex-col items-center justify-center gap-4 hover:bg-white/5 transition-colors&quot;&gt;
                    &lt;iconify-icon icon=&quot;solar:server-minimalistic-linear&quot; width=&quot;32&quot; class=&quot;text-white&quot;&gt;&lt;/iconify-icon&gt;
                    &lt;span class=&quot;text-xs font-mono text-zinc-400 tracking-tight&quot;&gt;AIRGAPPED KEYS&lt;/span&gt;
                &lt;/div&gt;
            &lt;/div&gt;
        &lt;/div&gt;
    &lt;/section&gt;

    &lt;!-- J. FAQ Parameters --&gt;
    &lt;section class=&quot;py-24 relative z-20 bg-black&quot;&gt;
        &lt;div class=&quot;max-w-4xl mx-auto px-6&quot;&gt;
            &lt;h2 class=&quot;text-3xl font-semibold text-white tracking-tight mb-12 uppercase&quot;&gt;Operational Parameters&lt;/h2&gt;
            
            &lt;div class=&quot;border-t border-white/10&quot;&gt;
                &lt;details class=&quot;group border-b border-white/10 py-6&quot; open=&quot;&quot;&gt;
                    &lt;summary class=&quot;flex justify-between items-center font-semibold cursor-pointer text-zinc-300 group-open:text-white transition-colors text-lg tracking-tight uppercase&quot;&gt;
                        Wash-Sale Rule Handling
                        &lt;iconify-icon icon=&quot;solar:add-square-linear&quot; width=&quot;24&quot; class=&quot;group-open:hidden&quot;&gt;&lt;/iconify-icon&gt;
                        &lt;iconify-icon icon=&quot;solar:minus-square-linear&quot; width=&quot;24&quot; class=&quot;hidden group-open:block&quot;&gt;&lt;/iconify-icon&gt;
                    &lt;/summary&gt;
                    &lt;div class=&quot;pt-4 text-zinc-400 text-sm leading-relaxed overflow-hidden font-mono&quot;&gt;
                        &amp;gt; KOR'S ENGINE NATIVELY IDENTIFIES PROXY ASSETS THAT MIRROR THE RISK/RETURN PROFILE OF THE HARVESTED ASSET WITHOUT VIOLATING THE 30-DAY WASH-SALE RULE. CAPITAL IS TEMPORARILY PARKED IN HIGHLY CORRELATED ETFS BEFORE SWEEPING BACK TO TARGET ALLOCATIONS.
                    &lt;/div&gt;
                &lt;/details&gt;

                &lt;details class=&quot;group border-b border-white/10 py-6&quot;&gt;
                    &lt;summary class=&quot;flex justify-between items-center font-semibold cursor-pointer text-zinc-300 group-open:text-white transition-colors text-lg tracking-tight uppercase&quot;&gt;
                        Manual Overrides
                        &lt;iconify-icon icon=&quot;solar:add-square-linear&quot; width=&quot;24&quot; class=&quot;group-open:hidden&quot;&gt;&lt;/iconify-icon&gt;
                        &lt;iconify-icon icon=&quot;solar:minus-square-linear&quot; width=&quot;24&quot; class=&quot;hidden group-open:block&quot;&gt;&lt;/iconify-icon&gt;
                    &lt;/summary&gt;
                    &lt;div class=&quot;pt-4 text-zinc-400 text-sm leading-relaxed overflow-hidden font-mono&quot;&gt;
                        &amp;gt; WHILE DESIGNED FOR AUTONOMY, FAMILY OFFICE AND INSTITUTIONAL TIERS GRANT MANUAL OVERRIDE CAPABILITIES VIA API OR TERMINAL DASHBOARD, ALLOWING FOR EXACT ALLOCATION LOCKS.
                    &lt;/div&gt;
                &lt;/details&gt;

                &lt;details class=&quot;group border-b border-white/10 py-6&quot;&gt;
                    &lt;summary class=&quot;flex justify-between items-center font-semibold cursor-pointer text-zinc-300 group-open:text-white transition-colors text-lg tracking-tight uppercase&quot;&gt;
                        Custodial Structure
                        &lt;iconify-icon icon=&quot;solar:add-square-linear&quot; width=&quot;24&quot; class=&quot;group-open:hidden&quot;&gt;&lt;/iconify-icon&gt;
                        &lt;iconify-icon icon=&quot;solar:minus-square-linear&quot; width=&quot;24&quot; class=&quot;hidden group-open:block&quot;&gt;&lt;/iconify-icon&gt;
                    &lt;/summary&gt;
                    &lt;div class=&quot;pt-4 text-zinc-400 text-sm leading-relaxed overflow-hidden font-mono&quot;&gt;
                        &amp;gt; KOR IS STRICTLY NON-CUSTODIAL. WE EXECUTE LOGIC LAYER API CALLS TO YOUR EXISTING PRIME BROKERAGE USING RESTRICTED, IP-WHITELISTED EXECUTION-ONLY KEYS. YOUR CAPITAL NEVER LEAVES YOUR ACCOUNTS.
                    &lt;/div&gt;
                &lt;/details&gt;
            &lt;/div&gt;
        &lt;/div&gt;
    &lt;/section&gt;

    &lt;!-- K. Contact / Lead Capture --&gt;
    &lt;section id=&quot;apply&quot; class=&quot;py-32 relative z-20 flex justify-center tech-border-t&quot;&gt;
        &lt;div class=&quot;max-w-[800px] w-full px-6&quot;&gt;
            &lt;div class=&quot;tech-panel p-1 border border-white/20&quot;&gt;
                &lt;div class=&quot;bg-[#030303] p-10 md:p-16 relative&quot;&gt;
                    &lt;div class=&quot;absolute top-4 left-4 crosshair&quot;&gt;&lt;/div&gt;
                    &lt;div class=&quot;absolute bottom-4 right-4 crosshair-b&quot;&gt;&lt;/div&gt;
                    
                    &lt;div class=&quot;mb-12&quot;&gt;
                        &lt;h2 class=&quot;text-3xl font-semibold text-white tracking-tight mb-2 uppercase&quot;&gt;Terminal Access Request&lt;/h2&gt;
                        &lt;p class=&quot;text-xs font-mono text-zinc-500&quot;&gt;INITIATE ONBOARDING PROTOCOL. ENTER ENTITY DATA.&lt;/p&gt;
                    &lt;/div&gt;

                    &lt;form class=&quot;space-y-8 relative z-10&quot;&gt;
                        &lt;div class=&quot;grid grid-cols-1 md:grid-cols-2 gap-8&quot;&gt;
                            &lt;div class=&quot;relative&quot;&gt;
                                &lt;label for=&quot;name&quot; class=&quot;block text-xs font-mono text-zinc-500 mb-2&quot;&gt;&amp;gt; ENTITY_NAME&lt;/label&gt;
                                &lt;input type=&quot;text&quot; id=&quot;name&quot; class=&quot;w-full bg-[#0A0A0A] border border-white/10 p-3 text-white font-mono text-sm focus:outline-none focus:border-white transition-colors rounded-none&quot; required=&quot;&quot;&gt;
                            &lt;/div&gt;

                            &lt;div class=&quot;relative&quot;&gt;
                                &lt;label for=&quot;email&quot; class=&quot;block text-xs font-mono text-zinc-500 mb-2&quot;&gt;&amp;gt; SECURE_COMMS (EMAIL)&lt;/label&gt;
                                &lt;input type=&quot;email&quot; id=&quot;email&quot; class=&quot;w-full bg-[#0A0A0A] border border-white/10 p-3 text-white font-mono text-sm focus:outline-none focus:border-white transition-colors rounded-none&quot; required=&quot;&quot;&gt;
                            &lt;/div&gt;
                        &lt;/div&gt;

                        &lt;div class=&quot;relative&quot;&gt;
                            &lt;label for=&quot;aum&quot; class=&quot;block text-xs font-mono text-zinc-500 mb-2&quot;&gt;&amp;gt; EST_AUM_DEPLOYMENT&lt;/label&gt;
                            &lt;div class=&quot;relative&quot;&gt;
                                &lt;select id=&quot;aum&quot; class=&quot;w-full bg-[#0A0A0A] border border-white/10 p-3 text-white font-mono text-sm focus:outline-none focus:border-white transition-colors rounded-none appearance-none cursor-pointer&quot;&gt;
                                    &lt;option value=&quot;&quot; disabled=&quot;&quot; selected=&quot;&quot; hidden=&quot;&quot;&gt;SELECT_RANGE&lt;/option&gt;
                                    &lt;option value=&quot;tier1&quot; class=&quot;bg-[#0A0A0A] text-white&quot;&gt;UNDER $5M&lt;/option&gt;
                                    &lt;option value=&quot;tier2&quot; class=&quot;bg-[#0A0A0A] text-white&quot;&gt;$5M - $50M&lt;/option&gt;
                                    &lt;option value=&quot;tier3&quot; class=&quot;bg-[#0A0A0A] text-white&quot;&gt;$50M+&lt;/option&gt;
                                &lt;/select&gt;
                                &lt;div class=&quot;absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white&quot;&gt;
                                    &lt;iconify-icon icon=&quot;solar:alt-arrow-down-linear&quot;&gt;&lt;/iconify-icon&gt;
                                &lt;/div&gt;
                            &lt;/div&gt;
                        &lt;/div&gt;

                        &lt;button type=&quot;submit&quot; class=&quot;btn-cut bg-white text-black w-full py-4 text-xs uppercase tracking-widest font-semibold hover:bg-zinc-200 mt-4&quot;&gt;
                            Execute Request
                        &lt;/button&gt;
                    &lt;/form&gt;
                &lt;/div&gt;
            &lt;/div&gt;
        &lt;/div&gt;
    &lt;/section&gt;

    &lt;!-- L. Footer --&gt;
    &lt;footer class=&quot;relative w-full border-t border-white/10 bg-black pt-20 pb-12 z-20 overflow-hidden&quot;&gt;
        &lt;!-- Massive Background Text --&gt;
        &lt;div class=&quot;absolute bottom-0 left-0 w-full flex justify-center z-0 select-none pointer-events-none&quot;&gt;
            &lt;h1 class=&quot;text-[25vw] font-bold text-white/[0.02] leading-[0.75] tracking-tighter m-0 p-0 uppercase&quot;&gt;KOR&lt;/h1&gt;
        &lt;/div&gt;

        &lt;div class=&quot;max-w-[1600px] mx-auto px-6 relative z-10&quot;&gt;
            &lt;div class=&quot;grid grid-cols-2 md:grid-cols-4 gap-12 mb-20&quot;&gt;
                
                &lt;div&gt;
                    &lt;div class=&quot;flex items-center gap-2 mb-6 text-white&quot;&gt;
                        &lt;svg viewBox=&quot;0 0 100 100&quot; class=&quot;w-6 h-6 shrink-0&quot;&gt;&lt;path d=&quot;M10 10 L40 10 L40 40 L70 40 L70 10 L90 10 L90 90 L70 90 L70 60 L40 60 L40 90 L10 90 Z&quot; fill=&quot;currentColor&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
                        &lt;span class=&quot;font-semibold text-xl tracking-tight uppercase&quot;&gt;KOR&lt;/span&gt;
                    &lt;/div&gt;
                    &lt;p class=&quot;text-xs text-zinc-500 leading-relaxed font-mono uppercase&quot;&gt;
                        SYS_STATUS: ONLINE&lt;br&gt;
                        NODE: GLOBAL_EDGE
                    &lt;/p&gt;
                &lt;/div&gt;

                &lt;div&gt;
                    &lt;h4 class=&quot;text-xs font-mono tracking-widest text-white mb-6 uppercase&quot;&gt;Engine&lt;/h4&gt;
                    &lt;ul class=&quot;space-y-4 text-xs text-zinc-500 uppercase font-semibold&quot;&gt;
                        &lt;li&gt;&lt;a href=&quot;#&quot; class=&quot;hover:text-white transition-colors&quot;&gt;Yield Architecture&lt;/a&gt;&lt;/li&gt;
                        &lt;li&gt;&lt;a href=&quot;#&quot; class=&quot;hover:text-white transition-colors&quot;&gt;Neural Strategies&lt;/a&gt;&lt;/li&gt;
                        &lt;li&gt;&lt;a href=&quot;#&quot; class=&quot;hover:text-white transition-colors&quot;&gt;Risk Parameters&lt;/a&gt;&lt;/li&gt;
                    &lt;/ul&gt;
                &lt;/div&gt;

                &lt;div&gt;
                    &lt;h4 class=&quot;text-xs font-mono tracking-widest text-white mb-6 uppercase&quot;&gt;Infrastructure&lt;/h4&gt;
                    &lt;ul class=&quot;space-y-4 text-xs text-zinc-500 uppercase font-semibold&quot;&gt;
                        &lt;li&gt;&lt;a href=&quot;#&quot; class=&quot;hover:text-white transition-colors&quot;&gt;API Docs&lt;/a&gt;&lt;/li&gt;
                        &lt;li&gt;&lt;a href=&quot;#&quot; class=&quot;hover:text-white transition-colors&quot;&gt;Socket Feeds&lt;/a&gt;&lt;/li&gt;
                        &lt;li&gt;&lt;a href=&quot;#&quot; class=&quot;hover:text-white transition-colors&quot;&gt;Security&lt;/a&gt;&lt;/li&gt;
                    &lt;/ul&gt;
                &lt;/div&gt;

                &lt;div&gt;
                    &lt;h4 class=&quot;text-xs font-mono tracking-widest text-white mb-6 uppercase&quot;&gt;Entity&lt;/h4&gt;
                    &lt;ul class=&quot;space-y-4 text-xs text-zinc-500 uppercase font-semibold&quot;&gt;
                        &lt;li&gt;&lt;a href=&quot;#&quot; class=&quot;hover:text-white transition-colors&quot;&gt;Protocol Terms&lt;/a&gt;&lt;/li&gt;
                        &lt;li&gt;&lt;a href=&quot;#&quot; class=&quot;hover:text-white transition-colors&quot;&gt;Privacy&lt;/a&gt;&lt;/li&gt;
                        &lt;li&gt;&lt;a href=&quot;#&quot; class=&quot;hover:text-white transition-colors&quot;&gt;Contact&lt;/a&gt;&lt;/li&gt;
                    &lt;/ul&gt;
                &lt;/div&gt;

            &lt;/div&gt;

            &lt;div class=&quot;pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4&quot;&gt;
                &lt;p class=&quot;text-xs text-zinc-600 font-mono uppercase&quot;&gt;© 2024 KOR Algorithmic Systems. All execution rights reserved.&lt;/p&gt;
            &lt;/div&gt;
        &lt;/div&gt;
    &lt;/footer&gt;

    &lt;!-- Canvas Animation Script --&gt;
    &lt;script&gt;
        const canvas = document.getElementById('hero-canvas');
        const ctx = canvas.getContext('2d');
        let width, height, particles;

        function init() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            particles = [];
            // Particle density
            const numParticles = Math.floor((width * height) / 12000);
            
            for(let i=0; i&lt;numParticles; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: (Math.random() - 0.5) * 0.4,
                    size: Math.random() * 1.5 + 0.5
                });
            }
        }

        function animate() {
            requestAnimationFrame(animate);
            ctx.clearRect(0, 0, width, height);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 0.5;
            
            particles.forEach(p =&gt; {
                p.x += p.vx; 
                p.y += p.vy;
                
                // Wrap around edges
                if(p.x &lt; 0) p.x = width;
                if(p.x &gt; width) p.x = 0;
                if(p.y &lt; 0) p.y = height;
                if(p.y &gt; height) p.y = 0;
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // Connect nearby particles
            for(let i=0; i&lt;particles.length; i++) {
                for(let j=i+1; j&lt;particles.length; j++) {
                    let dx = particles[i].x - particles[j].x;
                    let dy = particles[i].y - particles[j].y;
                    let dist = Math.sqrt(dx*dx + dy*dy);
                    
                    if(dist &lt; 100) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
        }

        window.addEventListener('resize', init);
        init();
        animate();
    &lt;/script&gt;

&lt;script data-img-fallback-handler&gt;!function(){var f=[&quot;https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/917d6f93-fb36-439a-8c48-884b67b35381_1600w.jpg&quot;,&quot;https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/4734259a-bad7-422f-981e-ce01e79184f2_1600w.jpg&quot;,&quot;https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/c543a9e1-f226-4ced-80b0-feb8445a75b9_1600w.jpg&quot;,&quot;https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/5bab247f-35d9-400d-a82b-fd87cfe913d2_1600w.webp&quot;,&quot;https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/30104e3c-5eea-4b93-93e9-5313698a7156_1600w.webp&quot;],h=new Set;function g(s){for(var x=0,i=0;i&lt;s.length;i++)x=(x&lt;&lt;5)-x+s.charCodeAt(i)|0;return f[Math.abs(x)%f.length]}function r(t){var s=t.src;if(s&amp;&amp;!h.has(s)){h.add(s);t.src=g(s)}}window.addEventListener(&quot;error&quot;,function(e){var t=e.target;if(t&amp;&amp;t.tagName===&quot;IMG&quot;)r(t)},!0);function c(){document.querySelectorAll(&quot;img&quot;).forEach(function(i){if(i.complete&amp;&amp;!i.naturalWidth&amp;&amp;i.src)r(i)})}if(document.readyState===&quot;loading&quot;)document.addEventListener(&quot;DOMContentLoaded&quot;,c);else c()}()&lt;/script&gt;&lt;/body&gt;&lt;/html&gt;"></iframe></div></div><div class="fixed bottom-4 right-4 z-50"><div class="group bg-neutral-900 transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] border border-white/5 rounded-xl p-1 px-2 h-10 flex items-center gap-0 shadow-strong shine overflow-hidden"><a href="https://aura.build" class="flex items-center gap-1 hover:opacity-80 transition-opacity" data-state="closed"><img src="/logo-aura-gray.svg" alt="Aura Logo" class="h-5 w-5 mix-blend-screen"><span class="text-[11px] font-medium text-neutral-300 mr-2">Made in Aura</span></a></div></div></div></div></div><div role="region" aria-label="Notifications (F8)" tabindex="-1" style="pointer-events: none;"><ol tabindex="-1" class="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex max-h-screen flex-col-reverse p-4 max-w-[420px]"></ol></div></div>
  

</body>