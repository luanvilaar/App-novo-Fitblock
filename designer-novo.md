quero redesenhar todo o front and do site para a referencia dde codigo que vou adicionar, nao é para copiar e para usar como referencia e criar algo unico. 

nao quero um site dark mode, ele pode conter informacoes do dark mode porem o site em si deve ser claro.

entao faça este trabalho em tres etapas

primeira etapa tela de login o que seria a home page do site do nosso web app

segunda etapa toda as telas do treinador , o seu dashboard e todas as abas e ferramentas.

terceira e ultima etapa toda as telas do aluno , o seu dashboard e todas as abas e ferramentas.

<body>
    <div id="root"><div class="min-h-screen bg-background relative"><div class="relative h-screen w-full"><div dir="ltr" data-orientation="horizontal" class="w-full h-full"><div role="tablist" aria-orientation="horizontal" class="h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground hidden" tabindex="0" data-orientation="horizontal" style="outline: none;"><button type="button" role="tab" aria-selected="true" aria-controls="radix-:r0:-content-preview" data-state="active" id="radix-:r0:-trigger-preview" class="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm" tabindex="-1" data-orientation="horizontal" data-radix-collection-item="">Preview</button><button type="button" role="tab" aria-selected="false" aria-controls="radix-:r0:-content-code" data-state="inactive" id="radix-:r0:-trigger-code" class="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm" tabindex="-1" data-orientation="horizontal" data-radix-collection-item="">Code</button></div><div data-state="inactive" data-orientation="horizontal" role="tabpanel" aria-labelledby="radix-:r0:-trigger-code" hidden="" id="radix-:r0:-content-code" tabindex="0" class="ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 m-0 p-0 h-full"></div><div data-state="active" data-orientation="horizontal" role="tabpanel" aria-labelledby="radix-:r0:-trigger-preview" id="radix-:r0:-content-preview" tabindex="0" class="ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 m-0 p-0 h-full" style="animation-duration: 0s;"><div class="h-full w-full"><iframe title="HTML Preview" class="w-full h-screen border-0" sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin" srcdoc="&lt;html lang=&quot;en&quot; class=&quot;scroll-smooth&quot;&gt;&lt;head&gt;
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
&lt;title&gt;VEKTOR | Omniscient Spatial Intelligence&lt;/title&gt;
&lt;script src=&quot;https://cdn.tailwindcss.com&quot;&gt;&lt;/script&gt;
&lt;script src=&quot;https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js&quot;&gt;&lt;/script&gt;
&lt;link rel=&quot;preconnect&quot; href=&quot;https://fonts.googleapis.com&quot;&gt;
&lt;link rel=&quot;preconnect&quot; href=&quot;https://fonts.gstatic.com&quot; crossorigin=&quot;&quot;&gt;
&lt;link href=&quot;https://fonts.googleapis.com/css2?family=Inter:wght@400;500&amp;amp;family=JetBrains+Mono:wght@400;500;600&amp;amp;family=Space+Grotesk:wght@500;600&amp;amp;display=swap&quot; rel=&quot;stylesheet&quot;&gt;
&lt;style&gt;
/* Essential Keyframes &amp; Scrollbar overrides - All other styling is inline or Tailwind */
@keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
@keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
@keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 0.5; } 100% { transform: scale(2.5); opacity: 0; } }
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
::selection { background-color: #D4FF00; color: #0E0E0C; }
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
&lt;body class=&quot;font-['Inter'] text-[#0E0E0C] bg-[#F2F0EB] overflow-x-hidden selection:bg-[#D4FF00] selection:text-[#0E0E0C]&quot; style=&quot;font-size: clamp(0.9375rem, 1.1vw, 1.0625rem); line-height: 1.65;&quot;&gt;

    &lt;!-- Global Threat Ticker --&gt;
    &lt;div class=&quot;fixed bottom-0 left-0 w-full bg-[#0E0E0C] border-t border-[#6B6860]/30 z-[100] overflow-hidden flex items-center pointer-events-none&quot; style=&quot;height: clamp(1.5rem, 3vw, 2rem);&quot;&gt;
        &lt;div class=&quot;flex w-max&quot; style=&quot;animation: ticker 40s linear infinite;&quot;&gt;
            &lt;div class=&quot;flex items-center text-[#D4FF00] font-['JetBrains_Mono'] uppercase tracking-widest whitespace-nowrap&quot; style=&quot;font-size: clamp(0.625rem, 0.8vw, 0.75rem);&quot;&gt;
                &lt;span class=&quot;mx-8 flex items-center gap-3&quot;&gt;&lt;span class=&quot;w-1.5 h-1.5 bg-[#D4FF00] relative&quot;&gt;&lt;span class=&quot;absolute inset-0 bg-[#D4FF00]&quot; style=&quot;animation: pulse-ring 2s infinite;&quot;&gt;&lt;/span&gt;&lt;/span&gt;⬡ SECTOR 7 ALIVE · DENSITY +41%&lt;/span&gt;
                &lt;span class=&quot;mx-8 flex items-center gap-3&quot;&gt;&lt;span class=&quot;w-1.5 h-1.5 bg-[#D4FF00] relative&quot;&gt;&lt;span class=&quot;absolute inset-0 bg-[#D4FF00]&quot; style=&quot;animation: pulse-ring 2s infinite 0.5s;&quot;&gt;&lt;/span&gt;&lt;/span&gt;⬡ GRID 9 OBSCURED · INTERVENTION REQ&lt;/span&gt;
                &lt;span class=&quot;mx-8 flex items-center gap-3&quot;&gt;&lt;span class=&quot;w-1.5 h-1.5 bg-[#D4FF00] relative&quot;&gt;&lt;span class=&quot;absolute inset-0 bg-[#D4FF00]&quot; style=&quot;animation: pulse-ring 2s infinite 1s;&quot;&gt;&lt;/span&gt;&lt;/span&gt;⬡ ZONE ALPHA · FLUX NORMALIZED&lt;/span&gt;
                &lt;span class=&quot;mx-8 flex items-center gap-3&quot;&gt;&lt;span class=&quot;w-1.5 h-1.5 bg-[#D4FF00] relative&quot;&gt;&lt;span class=&quot;absolute inset-0 bg-[#D4FF00]&quot; style=&quot;animation: pulse-ring 2s infinite 1.5s;&quot;&gt;&lt;/span&gt;&lt;/span&gt;⬡ CORRIDOR B · ANOMALY DETECTED&lt;/span&gt;
                &lt;!-- Duplicate for seamless loop --&gt;
                &lt;span class=&quot;mx-8 flex items-center gap-3&quot;&gt;&lt;span class=&quot;w-1.5 h-1.5 bg-[#D4FF00] relative&quot;&gt;&lt;span class=&quot;absolute inset-0 bg-[#D4FF00]&quot; style=&quot;animation: pulse-ring 2s infinite;&quot;&gt;&lt;/span&gt;&lt;/span&gt;⬡ SECTOR 7 ALIVE · DENSITY +41%&lt;/span&gt;
                &lt;span class=&quot;mx-8 flex items-center gap-3&quot;&gt;&lt;span class=&quot;w-1.5 h-1.5 bg-[#D4FF00] relative&quot;&gt;&lt;span class=&quot;absolute inset-0 bg-[#D4FF00]&quot; style=&quot;animation: pulse-ring 2s infinite 0.5s;&quot;&gt;&lt;/span&gt;&lt;/span&gt;⬡ GRID 9 OBSCURED · INTERVENTION REQ&lt;/span&gt;
                &lt;span class=&quot;mx-8 flex items-center gap-3&quot;&gt;&lt;span class=&quot;w-1.5 h-1.5 bg-[#D4FF00] relative&quot;&gt;&lt;span class=&quot;absolute inset-0 bg-[#D4FF00]&quot; style=&quot;animation: pulse-ring 2s infinite 1s;&quot;&gt;&lt;/span&gt;&lt;/span&gt;⬡ ZONE ALPHA · FLUX NORMALIZED&lt;/span&gt;
                &lt;span class=&quot;mx-8 flex items-center gap-3&quot;&gt;&lt;span class=&quot;w-1.5 h-1.5 bg-[#D4FF00] relative&quot;&gt;&lt;span class=&quot;absolute inset-0 bg-[#D4FF00]&quot; style=&quot;animation: pulse-ring 2s infinite 1.5s;&quot;&gt;&lt;/span&gt;&lt;/span&gt;⬡ CORRIDOR B · ANOMALY DETECTED&lt;/span&gt;
            &lt;/div&gt;
        &lt;/div&gt;
    &lt;/div&gt;

    &lt;!-- Live Coordinate Stamp --&gt;
    &lt;div class=&quot;fixed bottom-10 left-6 z-[90] font-['JetBrains_Mono'] text-[#6B6860] mix-blend-difference pointer-events-none&quot; id=&quot;coord-stamp&quot; style=&quot;font-size: clamp(0.625rem, 0.8vw, 0.75rem);&quot;&gt;
        [SYS.ONLINE] 37.7749° N, 122.4194° W
    &lt;/div&gt;

    &lt;!-- Navigation --&gt;
    &lt;nav class=&quot;fixed top-0 left-0 w-full z-50 bg-[#F2F0EB]/90 backdrop-blur-xl border-b border-[#C8C4BB] transition-all duration-300&quot;&gt;
        &lt;div class=&quot;max-w-[1440px] mx-auto flex justify-between items-center h-[72px]&quot; style=&quot;padding: 0 clamp(1rem, 2vw, 1.5rem);&quot;&gt;
            &lt;a href=&quot;#&quot; class=&quot;flex items-center gap-3 text-[#0E0E0C] z-50 group&quot;&gt;
                &lt;!-- High-tech sharp V SVG --&gt;
                &lt;svg width=&quot;32&quot; height=&quot;32&quot; viewBox=&quot;0 0 32 32&quot; fill=&quot;none&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;&gt;
                    &lt;path d=&quot;M2 4L16 28L30 4H22L16 16L10 4H2Z&quot; fill=&quot;#0E0E0C&quot;&gt;&lt;/path&gt;
                    &lt;path d=&quot;M10 4L16 16L22 4H30L16 28L2 4H10Z&quot; stroke=&quot;#D4FF00&quot; stroke-width=&quot;1&quot; class=&quot;opacity-0 group-hover:opacity-100 transition-opacity duration-300&quot;&gt;&lt;/path&gt;
                &lt;/svg&gt;
                &lt;span class=&quot;font-['Space_Grotesk'] font-semibold tracking-tighter leading-none mt-1&quot; style=&quot;font-size: clamp(1.25rem, 1.5vw, 1.5rem);&quot;&gt;VEKTOR&lt;/span&gt;
            &lt;/a&gt;
            
            &lt;div class=&quot;hidden md:flex gap-8 font-['JetBrains_Mono'] font-medium uppercase tracking-widest text-[#6B6860] items-center&quot; style=&quot;font-size: clamp(0.625rem, 0.8vw, 0.75rem);&quot;&gt;
                &lt;a href=&quot;#platform&quot; class=&quot;hover:text-[#0E0E0C] transition-colors relative group&quot;&gt;
                    &lt;span class=&quot;absolute -bottom-1 left-0 w-0 h-[1px] bg-[#D4FF00] transition-all duration-300 group-hover:w-full&quot;&gt;&lt;/span&gt; Platform
                &lt;/a&gt;
                &lt;a href=&quot;#roi&quot; class=&quot;hover:text-[#0E0E0C] transition-colors relative group&quot;&gt;
                    &lt;span class=&quot;absolute -bottom-1 left-0 w-0 h-[1px] bg-[#D4FF00] transition-all duration-300 group-hover:w-full&quot;&gt;&lt;/span&gt; Impact
                &lt;/a&gt;
                &lt;a href=&quot;#applications&quot; class=&quot;hover:text-[#0E0E0C] transition-colors relative group&quot;&gt;
                    &lt;span class=&quot;absolute -bottom-1 left-0 w-0 h-[1px] bg-[#D4FF00] transition-all duration-300 group-hover:w-full&quot;&gt;&lt;/span&gt; Sectors
                &lt;/a&gt;
                &lt;a href=&quot;#evidence&quot; class=&quot;hover:text-[#0E0E0C] transition-colors relative group&quot;&gt;
                    &lt;span class=&quot;absolute -bottom-1 left-0 w-0 h-[1px] bg-[#D4FF00] transition-all duration-300 group-hover:w-full&quot;&gt;&lt;/span&gt; Proof
                &lt;/a&gt;
            &lt;/div&gt;

            &lt;div class=&quot;hidden md:block&quot;&gt;
                &lt;!-- Custom Geometric Button --&gt;
                &lt;button class=&quot;relative inline-flex items-center justify-center bg-[#0E0E0C] text-[#F2F0EB] font-['Space_Grotesk'] font-semibold uppercase tracking-wide overflow-hidden group transition-all hover:text-[#D4FF00]&quot; style=&quot;height: 48px; padding: 0 1.5rem; font-size: clamp(0.75rem, 1vw, 0.875rem); clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);&quot;&gt;
                    &lt;div class=&quot;absolute inset-0 bg-[#D4FF00]/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out&quot;&gt;&lt;/div&gt;
                    &lt;div class=&quot;absolute top-0 left-0 w-full h-[2px] bg-[#D4FF00] opacity-0 group-hover:opacity-100&quot; style=&quot;animation: scanline 2s linear infinite;&quot;&gt;&lt;/div&gt;
                    &lt;span class=&quot;relative z-10 flex items-center gap-2&quot;&gt;Deploy Radar &lt;iconify-icon icon=&quot;solar:radar-linear&quot; stroke-width=&quot;1.5&quot;&gt;&lt;/iconify-icon&gt;&lt;/span&gt;
                &lt;/button&gt;
            &lt;/div&gt;

            &lt;button class=&quot;md:hidden text-[#0E0E0C] text-2xl&quot;&gt;
                &lt;iconify-icon icon=&quot;solar:hamburger-menu-linear&quot; stroke-width=&quot;1.5&quot;&gt;&lt;/iconify-icon&gt;
            &lt;/button&gt;
        &lt;/div&gt;
    &lt;/nav&gt;

    &lt;!-- SECTION 1: HERO (WebGL-style Canvas + Dashboard) --&gt;
    &lt;section class=&quot;relative min-h-[100svh] flex items-center bg-[#0E0E0C] overflow-hidden&quot; style=&quot;padding-top: 104px; padding-bottom: clamp(5rem, 10vw, 10rem);&quot;&gt;
        &lt;!-- High-End Canvas Background --&gt;
        &lt;canvas id=&quot;hero-canvas&quot; class=&quot;absolute inset-0 w-full h-full z-0 opacity-80 pointer-events-auto&quot;&gt;&lt;/canvas&gt;
        
        &lt;div class=&quot;absolute inset-0 z-0 bg-gradient-to-b from-transparent to-[#0E0E0C] pointer-events-none&quot;&gt;&lt;/div&gt;

        &lt;div class=&quot;max-w-[1440px] mx-auto w-full relative z-10&quot; style=&quot;padding: 0 clamp(1rem, 2vw, 1.5rem);&quot;&gt;
            &lt;div class=&quot;grid grid-cols-1 lg:grid-cols-12 gap-12 items-center&quot;&gt;
                
                &lt;!-- Left Content --&gt;
                &lt;div class=&quot;lg:col-span-6 flex flex-col items-start text-[#F2F0EB]&quot;&gt;
                    &lt;div class=&quot;inline-flex items-center gap-2 border border-[#D4FF00]/30 bg-[#D4FF00]/10 text-[#D4FF00] px-3 py-1 font-['JetBrains_Mono'] uppercase tracking-widest mb-6&quot; style=&quot;font-size: clamp(0.625rem, 0.8vw, 0.75rem); clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);&quot;&gt;
                        &lt;iconify-icon icon=&quot;solar:target-linear&quot;&gt;&lt;/iconify-icon&gt; Unfair Advantage Online
                    &lt;/div&gt;
                    
                    &lt;h1 class=&quot;font-['Space_Grotesk'] font-semibold tracking-tight leading-none mb-6&quot; style=&quot;font-size: clamp(3rem, 6.5vw, 6rem);&quot;&gt;
                        Dominate Your Domain.&lt;br&gt;&lt;span class=&quot;text-[#D4FF00]&quot;&gt;Zero Blind Spots.&lt;/span&gt;
                    &lt;/h1&gt;
                    
                    &lt;p class=&quot;font-['Inter'] text-[#C8C4BB] max-w-xl mb-10&quot; style=&quot;font-size: clamp(1rem, 1.2vw, 1.125rem); line-height: 1.6;&quot;&gt;
                        While your competitors analyze yesterday's static maps, VEKTOR turns raw sensor feeds into live predictive engines. See the shift, measure the risk, and act before the market even knows what happened.
                    &lt;/p&gt;
                    
                    &lt;div class=&quot;flex flex-wrap gap-4 mb-12&quot;&gt;
                        &lt;!-- Primary Cut-Corner Button --&gt;
                        &lt;button class=&quot;relative inline-flex items-center justify-center bg-[#D4FF00] text-[#0E0E0C] font-['Space_Grotesk'] font-semibold uppercase tracking-wide overflow-hidden group transition-all shadow-[0_0_30px_rgba(212,255,0,0.2)] hover:shadow-[0_0_50px_rgba(212,255,0,0.4)]&quot; style=&quot;height: 64px; padding: 0 2rem; font-size: clamp(0.875rem, 1.1vw, 1rem); clip-path: polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px);&quot;&gt;
                            &lt;div class=&quot;absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-in-out&quot;&gt;&lt;/div&gt;
                            &lt;span class=&quot;relative z-10 flex items-center gap-2&quot;&gt;Command Your Terrain &lt;iconify-icon icon=&quot;solar:arrow-right-linear&quot; class=&quot;group-hover:translate-x-1 transition-transform&quot;&gt;&lt;/iconify-icon&gt;&lt;/span&gt;
                        &lt;/button&gt;
                    &lt;/div&gt;

                    &lt;div class=&quot;flex flex-wrap gap-x-8 gap-y-4 font-['JetBrains_Mono'] uppercase tracking-widest text-[#6B6860]&quot; style=&quot;font-size: clamp(0.625rem, 0.8vw, 0.75rem);&quot;&gt;
                        &lt;span class=&quot;flex items-center gap-2&quot;&gt;&lt;span class=&quot;w-1.5 h-1.5 bg-[#D4FF00]&quot;&gt;&lt;/span&gt; Millisecond Latency&lt;/span&gt;
                        &lt;span class=&quot;flex items-center gap-2&quot;&gt;&lt;span class=&quot;w-1.5 h-1.5 bg-[#D4FF00]&quot;&gt;&lt;/span&gt; AI-Fused Telemetry&lt;/span&gt;
                    &lt;/div&gt;
                &lt;/div&gt;

                &lt;!-- Right High-Fidelity Dashboard UI --&gt;
                &lt;div class=&quot;lg:col-span-6 relative w-full hidden lg:block&quot;&gt;
                    &lt;!-- Tech overlay frame --&gt;
                    &lt;div class=&quot;absolute -inset-4 border border-[#D4FF00]/20 pointer-events-none&quot; style=&quot;clip-path: polygon(24px 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%, 0 24px);&quot;&gt;&lt;/div&gt;
                    
                    &lt;div class=&quot;relative bg-[#1A1A18] border border-[#33312C] shadow-2xl flex flex-col group overflow-hidden&quot; style=&quot;min-height: 540px; clip-path: polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px);&quot;&gt;
                        
                        &lt;!-- Header --&gt;
                        &lt;div class=&quot;flex items-center justify-between px-4 py-3 border-b border-[#33312C] bg-[#0E0E0C]/80 backdrop-blur&quot;&gt;
                            &lt;div class=&quot;flex gap-2&quot;&gt;
                                &lt;div class=&quot;w-2 h-2 bg-[#D4FF00]/50&quot; style=&quot;clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);&quot;&gt;&lt;/div&gt;
                                &lt;div class=&quot;w-2 h-2 bg-[#D4FF00]&quot; style=&quot;clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);&quot;&gt;&lt;/div&gt;
                            &lt;/div&gt;
                            &lt;span class=&quot;font-['JetBrains_Mono'] uppercase tracking-widest text-[#C8C4BB]&quot; style=&quot;font-size: 10px;&quot;&gt;V-OS // ORBITAL FEED&lt;/span&gt;
                        &lt;/div&gt;

                        &lt;!-- Main UI Area --&gt;
                        &lt;div class=&quot;relative flex-1 bg-[#0E0E0C] overflow-hidden&quot;&gt;
                            &lt;!-- Faux Satellite Map --&gt;
                            &lt;img src=&quot;https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&amp;amp;w=1000&amp;amp;auto=format&amp;amp;fit=crop&quot; class=&quot;absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-screen scale-105 group-hover:scale-100 transition-transform duration-[2000ms] ease-out&quot;&gt;
                            
                            &lt;!-- Grid Overlay --&gt;
                            &lt;div class=&quot;absolute inset-0 opacity-20 bg-[linear-gradient(rgba(212,255,0,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(212,255,0,0.2)_1px,transparent_1px)]&quot; style=&quot;background-size: 40px 40px;&quot;&gt;&lt;/div&gt;

                            &lt;!-- Targeting Reticle --&gt;
                            &lt;div class=&quot;absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-[#D4FF00]/30 rounded-full flex items-center justify-center&quot;&gt;
                                &lt;div class=&quot;w-full h-[1px] bg-[#D4FF00]/20 absolute&quot;&gt;&lt;/div&gt;
                                &lt;div class=&quot;h-full w-[1px] bg-[#D4FF00]/20 absolute&quot;&gt;&lt;/div&gt;
                                &lt;div class=&quot;w-32 h-32 border border-[#D4FF00]/50 rounded-full flex items-center justify-center relative&quot;&gt;
                                    &lt;div class=&quot;absolute top-0 w-2 h-2 bg-[#D4FF00] -translate-y-1/2&quot;&gt;&lt;/div&gt;
                                    &lt;div class=&quot;absolute bottom-0 w-2 h-2 bg-[#D4FF00] translate-y-1/2&quot;&gt;&lt;/div&gt;
                                    &lt;div class=&quot;absolute left-0 w-2 h-2 bg-[#D4FF00] -translate-x-1/2&quot;&gt;&lt;/div&gt;
                                    &lt;div class=&quot;absolute right-0 w-2 h-2 bg-[#D4FF00] translate-x-1/2&quot;&gt;&lt;/div&gt;
                                &lt;/div&gt;
                            &lt;/div&gt;

                            &lt;!-- Data overlays --&gt;
                            &lt;div class=&quot;absolute top-6 left-6 flex flex-col gap-2 font-['JetBrains_Mono'] text-[#D4FF00]&quot; style=&quot;font-size: 10px;&quot;&gt;
                                &lt;div class=&quot;bg-[#0E0E0C]/80 px-2 py-1 border border-[#D4FF00]/30 backdrop-blur&quot;&gt;ALT: 420.5 KM&lt;/div&gt;
                                &lt;div class=&quot;bg-[#0E0E0C]/80 px-2 py-1 border border-[#D4FF00]/30 backdrop-blur&quot;&gt;VEL: 7.66 KM/S&lt;/div&gt;
                            &lt;/div&gt;

                            &lt;div class=&quot;absolute bottom-6 right-6 flex flex-col items-end gap-2 font-['JetBrains_Mono']&quot; style=&quot;font-size: 10px;&quot;&gt;
                                &lt;div class=&quot;flex items-center gap-2 text-[#F2F0EB] bg-[#0E0E0C]/80 px-2 py-1 border border-[#33312C]&quot;&gt;&lt;span class=&quot;w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse&quot;&gt;&lt;/span&gt; THERMAL SPIKE&lt;/div&gt;
                                &lt;div class=&quot;text-[#D4FF00] bg-[#0E0E0C]/80 px-2 py-1 border border-[#D4FF00]/30 backdrop-blur&quot;&gt;LOCK ACQUIRED&lt;/div&gt;
                            &lt;/div&gt;
                        &lt;/div&gt;

                        &lt;!-- Footer Metrics --&gt;
                        &lt;div class=&quot;flex border-t border-[#33312C] bg-[#1A1A18] text-[#F2F0EB] font-['JetBrains_Mono'] divide-x divide-[#33312C]&quot;&gt;
                            &lt;div class=&quot;flex-1 p-4 flex justify-between items-center&quot;&gt;
                                &lt;span class=&quot;text-[#6B6860] uppercase&quot; style=&quot;font-size: 10px;&quot;&gt;Bandwidth&lt;/span&gt;
                                &lt;span class=&quot;text-sm font-semibold&quot;&gt;1.4 TB/s&lt;/span&gt;
                            &lt;/div&gt;
                            &lt;div class=&quot;flex-1 p-4 flex justify-between items-center&quot;&gt;
                                &lt;span class=&quot;text-[#6B6860] uppercase&quot; style=&quot;font-size: 10px;&quot;&gt;Nodes&lt;/span&gt;
                                &lt;span class=&quot;text-[#D4FF00] text-sm font-semibold&quot;&gt;ACTIVE&lt;/span&gt;
                            &lt;/div&gt;
                        &lt;/div&gt;
                    &lt;/div&gt;
                &lt;/div&gt;

            &lt;/div&gt;
        &lt;/div&gt;
    &lt;/section&gt;

    &lt;!-- SECTION 2: MARQUEE &amp; TRUST METRICS --&gt;
    &lt;section class=&quot;bg-[#D4FF00] text-[#0E0E0C] border-y border-[#0E0E0C] overflow-hidden&quot; style=&quot;padding-top: clamp(2.5rem, 5vw, 4rem); padding-bottom: clamp(2.5rem, 5vw, 4rem);&quot;&gt;
        &lt;div class=&quot;max-w-[1440px] mx-auto w-full mb-12&quot; style=&quot;padding: 0 clamp(1rem, 2vw, 1.5rem);&quot;&gt;
            &lt;p class=&quot;font-['JetBrains_Mono'] uppercase tracking-widest font-semibold mb-4&quot; style=&quot;font-size: clamp(0.625rem, 0.8vw, 0.75rem);&quot;&gt;Trusted by Entities Demanding Absolute Certainty&lt;/p&gt;
        &lt;/div&gt;

        &lt;div class=&quot;w-full overflow-hidden flex items-center&quot;&gt;
            &lt;div class=&quot;flex w-max items-center font-['Space_Grotesk'] font-semibold uppercase tracking-tight gap-16 whitespace-nowrap opacity-80&quot; style=&quot;font-size: clamp(1.5rem, 3vw, 2.5rem); animation: ticker 30s linear infinite;&quot;&gt;
                &lt;span&gt;DEPARTMENT OF DEFENSE&lt;/span&gt;
                &lt;span&gt;&lt;iconify-icon icon=&quot;solar:star-fall-linear&quot;&gt;&lt;/iconify-icon&gt;&lt;/span&gt;
                &lt;span&gt;APEX INFRASTRUCTURE&lt;/span&gt;
                &lt;span&gt;&lt;iconify-icon icon=&quot;solar:star-fall-linear&quot;&gt;&lt;/iconify-icon&gt;&lt;/span&gt;
                &lt;span&gt;GLOBAL LOGISTICS CORP&lt;/span&gt;
                &lt;span&gt;&lt;iconify-icon icon=&quot;solar:star-fall-linear&quot;&gt;&lt;/iconify-icon&gt;&lt;/span&gt;
                &lt;span&gt;FEDERAL EMERGENCY AGENCY&lt;/span&gt;
                &lt;span&gt;&lt;iconify-icon icon=&quot;solar:star-fall-linear&quot;&gt;&lt;/iconify-icon&gt;&lt;/span&gt;
                &lt;span&gt;AEROSPACE COMMAND&lt;/span&gt;
                &lt;span&gt;&lt;iconify-icon icon=&quot;solar:star-fall-linear&quot;&gt;&lt;/iconify-icon&gt;&lt;/span&gt;
                &lt;!-- Duplicate --&gt;
                &lt;span&gt;DEPARTMENT OF DEFENSE&lt;/span&gt;
                &lt;span&gt;&lt;iconify-icon icon=&quot;solar:star-fall-linear&quot;&gt;&lt;/iconify-icon&gt;&lt;/span&gt;
                &lt;span&gt;APEX INFRASTRUCTURE&lt;/span&gt;
                &lt;span&gt;&lt;iconify-icon icon=&quot;solar:star-fall-linear&quot;&gt;&lt;/iconify-icon&gt;&lt;/span&gt;
                &lt;span&gt;GLOBAL LOGISTICS CORP&lt;/span&gt;
                &lt;span&gt;&lt;iconify-icon icon=&quot;solar:star-fall-linear&quot;&gt;&lt;/iconify-icon&gt;&lt;/span&gt;
                &lt;span&gt;FEDERAL EMERGENCY AGENCY&lt;/span&gt;
                &lt;span&gt;&lt;iconify-icon icon=&quot;solar:star-fall-linear&quot;&gt;&lt;/iconify-icon&gt;&lt;/span&gt;
                &lt;span&gt;AEROSPACE COMMAND&lt;/span&gt;
            &lt;/div&gt;
        &lt;/div&gt;
    &lt;/section&gt;

    &lt;!-- SECTION 3: THE PROBLEM (Aggressive Growth) --&gt;
    &lt;section class=&quot;bg-[#F2F0EB] border-b border-[#C8C4BB] relative&quot; style=&quot;padding-top: clamp(5rem, 10vw, 10rem); padding-bottom: clamp(5rem, 10vw, 10rem);&quot;&gt;
        &lt;div class=&quot;max-w-[1440px] mx-auto w-full&quot; style=&quot;padding: 0 clamp(1rem, 2vw, 1.5rem);&quot;&gt;
            
            &lt;div class=&quot;grid grid-cols-1 lg:grid-cols-2 gap-16 items-center&quot;&gt;
                &lt;div&gt;
                    &lt;div class=&quot;inline-flex items-center gap-2 border border-[#0E0E0C] text-[#0E0E0C] px-3 py-1 font-['JetBrains_Mono'] uppercase tracking-widest mb-8&quot; style=&quot;font-size: clamp(0.625rem, 0.8vw, 0.75rem); clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);&quot;&gt;
                        ◈ The Liability
                    &lt;/div&gt;
                    
                    &lt;h2 class=&quot;font-['Space_Grotesk'] font-semibold tracking-tight text-[#0E0E0C] leading-none mb-8&quot; style=&quot;font-size: clamp(2.25rem, 4.5vw, 4.5rem);&quot;&gt;
                        Flying Blind Costs Millions.
                    &lt;/h2&gt;
                    
                    &lt;p class=&quot;font-['Inter'] text-[#6B6860] mb-8&quot; style=&quot;font-size: clamp(1rem, 1.2vw, 1.25rem); line-height: 1.6;&quot;&gt;
                        Every unmonitored corridor, undocumented density shift, and unread terrain anomaly is a catastrophic failure waiting to happen. If you rely on historical data to manage physical assets, your response is already late.
                    &lt;/p&gt;

                    &lt;ul class=&quot;flex flex-col gap-6 font-['Inter'] text-[#0E0E0C]&quot;&gt;
                        &lt;li class=&quot;flex items-start gap-4&quot;&gt;
                            &lt;div class=&quot;mt-1 w-6 h-6 shrink-0 flex items-center justify-center bg-[#0E0E0C] text-[#D4FF00]&quot; style=&quot;clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);&quot;&gt;
                                &lt;iconify-icon icon=&quot;solar:danger-triangle-linear&quot; style=&quot;font-size: 12px;&quot;&gt;&lt;/iconify-icon&gt;
                            &lt;/div&gt;
                            &lt;div&gt;
                                &lt;strong class=&quot;font-semibold block mb-1&quot;&gt;Reactive Paralysis&lt;/strong&gt;
                                &lt;span class=&quot;text-[#6B6860] text-sm block&quot;&gt;Reacting to physical events costs 7x more than predicting them.&lt;/span&gt;
                            &lt;/div&gt;
                        &lt;/li&gt;
                        &lt;li class=&quot;flex items-start gap-4&quot;&gt;
                            &lt;div class=&quot;mt-1 w-6 h-6 shrink-0 flex items-center justify-center bg-[#0E0E0C] text-[#D4FF00]&quot; style=&quot;clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);&quot;&gt;
                                &lt;iconify-icon icon=&quot;solar:map-linear&quot; style=&quot;font-size: 12px;&quot;&gt;&lt;/iconify-icon&gt;
                            &lt;/div&gt;
                            &lt;div&gt;
                                &lt;strong class=&quot;font-semibold block mb-1&quot;&gt;Siloed Geodata&lt;/strong&gt;
                                &lt;span class=&quot;text-[#6B6860] text-sm block&quot;&gt;Spreadsheets cannot model three-dimensional, high-velocity space.&lt;/span&gt;
                            &lt;/div&gt;
                        &lt;/li&gt;
                    &lt;/ul&gt;
                &lt;/div&gt;

                &lt;!-- Aggressive Stat Graphic --&gt;
                &lt;div class=&quot;relative bg-[#0E0E0C] p-8 md:p-12 text-[#F2F0EB]&quot; style=&quot;clip-path: polygon(30px 0, 100% 0, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0 100%, 0 30px);&quot;&gt;
                    &lt;div class=&quot;absolute top-0 right-0 w-32 h-32 bg-[#D4FF00] opacity-10 blur-3xl&quot;&gt;&lt;/div&gt;
                    &lt;div class=&quot;absolute bottom-0 left-0 w-32 h-32 bg-red-500 opacity-10 blur-3xl&quot;&gt;&lt;/div&gt;
                    
                    &lt;span class=&quot;font-['JetBrains_Mono'] uppercase tracking-widest text-[#D4FF00] block mb-12&quot; style=&quot;font-size: 10px;&quot;&gt;// SYSTEMIC RISK ANALYSIS&lt;/span&gt;
                    
                    &lt;div class=&quot;mb-8&quot;&gt;
                        &lt;div class=&quot;text-[80px] md:text-[120px] font-['Space_Grotesk'] font-semibold leading-none text-red-500 tracking-tighter&quot;&gt;6.2&lt;span class=&quot;text-4xl&quot;&gt;hrs&lt;/span&gt;&lt;/div&gt;
                        &lt;p class=&quot;font-['JetBrains_Mono'] text-[#C8C4BB] uppercase mt-2 text-xs&quot;&gt;Average latency of standard enterprise GIS tools.&lt;/p&gt;
                    &lt;/div&gt;

                    &lt;div class=&quot;w-full h-[1px] bg-[#33312C] my-8&quot;&gt;&lt;/div&gt;

                    &lt;div&gt;
                        &lt;div class=&quot;text-[40px] md:text-[60px] font-['Space_Grotesk'] font-semibold leading-none text-[#D4FF00] tracking-tighter&quot;&gt;1.4&lt;span class=&quot;text-2xl&quot;&gt;sec&lt;/span&gt;&lt;/div&gt;
                        &lt;p class=&quot;font-['JetBrains_Mono'] text-[#C8C4BB] uppercase mt-2 text-xs&quot;&gt;VEKTOR predictive anomaly detection speed.&lt;/p&gt;
                    &lt;/div&gt;
                &lt;/div&gt;
            &lt;/div&gt;

        &lt;/div&gt;
    &lt;/section&gt;

    &lt;!-- SECTION 4: PLATFORM BENTO (High Fidelity) --&gt;
    &lt;section id=&quot;platform&quot; class=&quot;bg-[#0E0E0C] text-[#F2F0EB] relative&quot; style=&quot;padding-top: clamp(5rem, 10vw, 10rem); padding-bottom: clamp(5rem, 10vw, 10rem);&quot;&gt;
        &lt;!-- Subtle noise overlay --&gt;
        &lt;div class=&quot;absolute inset-0 opacity-[0.03] pointer-events-none&quot; style=&quot;background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');&quot;&gt;&lt;/div&gt;

        &lt;div class=&quot;max-w-[1440px] mx-auto w-full relative z-10&quot; style=&quot;padding: 0 clamp(1rem, 2vw, 1.5rem);&quot;&gt;
            
            &lt;div class=&quot;flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16&quot;&gt;
                &lt;div class=&quot;max-w-2xl&quot;&gt;
                    &lt;div class=&quot;inline-flex items-center gap-2 border border-[#D4FF00] text-[#D4FF00] px-3 py-1 font-['JetBrains_Mono'] uppercase tracking-widest mb-6&quot; style=&quot;font-size: clamp(0.625rem, 0.8vw, 0.75rem); clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);&quot;&gt;
                        ◈ The Platform
                    &lt;/div&gt;
                    &lt;h2 class=&quot;font-['Space_Grotesk'] font-semibold tracking-tight leading-none&quot; style=&quot;font-size: clamp(2.25rem, 4.5vw, 4rem);&quot;&gt;
                        The Omniscient Layer.
                    &lt;/h2&gt;
                &lt;/div&gt;
                &lt;p class=&quot;font-['Inter'] text-[#C8C4BB] max-w-md&quot; style=&quot;font-size: clamp(0.875rem, 1vw, 1rem);&quot;&gt;
                    A unified engine fusing real-time satellite imagery, ground-truth IoT, and algorithmic risk scoring into human-readable tactical briefings.
                &lt;/p&gt;
            &lt;/div&gt;

            &lt;!-- Complex Bento Grid --&gt;
            &lt;div class=&quot;grid grid-cols-1 md:grid-cols-3 gap-4 md:auto-rows-[320px]&quot;&gt;
                
                &lt;!-- Main Feature --&gt;
                &lt;div class=&quot;md:col-span-2 md:row-span-2 relative bg-[#1A1A18] border border-[#33312C] group overflow-hidden flex flex-col justify-between p-8&quot; style=&quot;clip-path: polygon(24px 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%, 0 24px);&quot;&gt;
                    &lt;div class=&quot;relative z-10 max-w-md pointer-events-none&quot;&gt;
                        &lt;iconify-icon icon=&quot;solar:layers-linear&quot; class=&quot;text-4xl text-[#D4FF00] mb-4&quot;&gt;&lt;/iconify-icon&gt;
                        &lt;h3 class=&quot;font-['Space_Grotesk'] font-semibold text-2xl mb-2&quot;&gt;Sub-Meter Terrain Parsing&lt;/h3&gt;
                        &lt;p class=&quot;text-[#C8C4BB] text-sm&quot;&gt;LiDAR + optical satellite fusion updated every 15 minutes. See physical changes instantly.&lt;/p&gt;
                    &lt;/div&gt;
                    
                    &lt;div class=&quot;absolute bottom-0 right-0 w-3/4 h-3/4 bg-[#0E0E0C] border-t border-l border-[#33312C] transition-transform duration-700 group-hover:translate-x-4 group-hover:translate-y-4 flex items-center justify-center overflow-hidden&quot; style=&quot;clip-path: polygon(20px 0, 100% 0, 100% 100%, 0 100%, 0 20px);&quot;&gt;
                        &lt;img src=&quot;https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&amp;amp;w=800&amp;amp;auto=format&amp;amp;fit=crop&quot; class=&quot;absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-luminosity&quot;&gt;
                        &lt;!-- Simulated Topographic lines via SVG --&gt;
                        &lt;svg class=&quot;absolute inset-0 w-full h-full opacity-30 text-[#D4FF00]&quot; viewBox=&quot;0 0 100 100&quot; preserveAspectRatio=&quot;none&quot;&gt;
                            &lt;path d=&quot;M0,50 Q25,30 50,50 T100,50&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;0.5&quot;&gt;&lt;/path&gt;
                            &lt;path d=&quot;M0,60 Q25,40 50,60 T100,60&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;0.5&quot;&gt;&lt;/path&gt;
                            &lt;path d=&quot;M0,70 Q25,50 50,70 T100,70&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;0.5&quot;&gt;&lt;/path&gt;
                        &lt;/svg&gt;
                    &lt;/div&gt;
                &lt;/div&gt;

                &lt;!-- Feature 2 --&gt;
                &lt;div class=&quot;relative bg-[#1A1A18] border border-[#33312C] group overflow-hidden p-8 flex flex-col justify-between&quot; style=&quot;clip-path: polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px);&quot;&gt;
                    &lt;div class=&quot;relative z-10&quot;&gt;
                        &lt;iconify-icon icon=&quot;solar:users-group-two-rounded-linear&quot; class=&quot;text-3xl text-[#6B6860] group-hover:text-[#D4FF00] transition-colors mb-4&quot;&gt;&lt;/iconify-icon&gt;
                        &lt;h3 class=&quot;font-['Space_Grotesk'] font-semibold text-xl mb-2&quot;&gt;Population Flux&lt;/h3&gt;
                        &lt;p class=&quot;text-[#C8C4BB] text-sm&quot;&gt;Live movement modeling across 200+ distinct signal types to predict crowding.&lt;/p&gt;
                    &lt;/div&gt;
                    &lt;!-- Abstract Heatmap Graphic --&gt;
                    &lt;div class=&quot;h-24 w-full mt-6 flex items-end gap-1 opacity-60&quot;&gt;
                        &lt;div class=&quot;w-full bg-[#33312C] h-[20%] group-hover:h-[40%] group-hover:bg-[#D4FF00] transition-all duration-300&quot;&gt;&lt;/div&gt;
                        &lt;div class=&quot;w-full bg-[#33312C] h-[40%] group-hover:h-[80%] group-hover:bg-red-500 transition-all duration-500&quot;&gt;&lt;/div&gt;
                        &lt;div class=&quot;w-full bg-[#33312C] h-[30%] group-hover:h-[60%] group-hover:bg-[#D4FF00] transition-all duration-300 delay-75&quot;&gt;&lt;/div&gt;
                        &lt;div class=&quot;w-full bg-[#33312C] h-[70%] group-hover:h-[100%] group-hover:bg-red-500 transition-all duration-500 delay-75&quot;&gt;&lt;/div&gt;
                        &lt;div class=&quot;w-full bg-[#33312C] h-[50%] group-hover:h-[30%] group-hover:bg-[#D4FF00] transition-all duration-300 delay-100&quot;&gt;&lt;/div&gt;
                    &lt;/div&gt;
                &lt;/div&gt;

                &lt;!-- Feature 3 --&gt;
                &lt;div class=&quot;relative bg-[#1A1A18] border border-[#33312C] group overflow-hidden p-8 flex flex-col justify-between&quot; style=&quot;clip-path: polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px);&quot;&gt;
                    &lt;div class=&quot;relative z-10&quot;&gt;
                        &lt;iconify-icon icon=&quot;solar:shield-warning-linear&quot; class=&quot;text-3xl text-[#6B6860] group-hover:text-[#D4FF00] transition-colors mb-4&quot;&gt;&lt;/iconify-icon&gt;
                        &lt;h3 class=&quot;font-['Space_Grotesk'] font-semibold text-xl mb-2&quot;&gt;Infrastructure Risk&lt;/h3&gt;
                        &lt;p class=&quot;text-[#C8C4BB] text-sm&quot;&gt;Algorithmic failure scoring mapped precisely to your high-value assets.&lt;/p&gt;
                    &lt;/div&gt;
                    &lt;div class=&quot;mt-6 font-['JetBrains_Mono'] text-xs text-[#6B6860]&quot;&gt;
                        &lt;div class=&quot;flex justify-between border-b border-[#33312C] py-2&quot;&gt;&lt;span&gt;NODE_01&lt;/span&gt;&lt;span class=&quot;text-[#D4FF00]&quot;&gt;SECURE&lt;/span&gt;&lt;/div&gt;
                        &lt;div class=&quot;flex justify-between border-b border-[#33312C] py-2&quot;&gt;&lt;span&gt;NODE_02&lt;/span&gt;&lt;span class=&quot;text-red-500&quot;&gt;CRITICAL&lt;/span&gt;&lt;/div&gt;
                        &lt;div class=&quot;flex justify-between py-2&quot;&gt;&lt;span&gt;NODE_03&lt;/span&gt;&lt;span class=&quot;text-[#D4FF00]&quot;&gt;SECURE&lt;/span&gt;&lt;/div&gt;
                    &lt;/div&gt;
                &lt;/div&gt;

            &lt;/div&gt;
        &lt;/div&gt;
    &lt;/section&gt;

    &lt;!-- SECTION 5: ROI / BUSINESS IMPACT (Conversion Focus) --&gt;
    &lt;section id=&quot;roi&quot; class=&quot;bg-[#D4FF00] text-[#0E0E0C] relative&quot; style=&quot;padding-top: clamp(5rem, 10vw, 8rem); padding-bottom: clamp(5rem, 10vw, 8rem);&quot;&gt;
        &lt;div class=&quot;max-w-[1440px] mx-auto w-full&quot; style=&quot;padding: 0 clamp(1rem, 2vw, 1.5rem);&quot;&gt;
            
            &lt;div class=&quot;text-center max-w-3xl mx-auto mb-16&quot;&gt;
                &lt;h2 class=&quot;font-['Space_Grotesk'] font-semibold tracking-tight leading-none mb-6&quot; style=&quot;font-size: clamp(2.25rem, 4vw, 3.5rem);&quot;&gt;
                    Growth Through Absolute Precision.
                &lt;/h2&gt;
                &lt;p class=&quot;font-['Inter'] text-[#0E0E0C]/80&quot; style=&quot;font-size: clamp(1rem, 1.2vw, 1.125rem);&quot;&gt;
                    VEKTOR doesn't just draw maps; we manufacture time. See the direct operational impact across our enterprise deployments.
                &lt;/p&gt;
            &lt;/div&gt;

            &lt;div class=&quot;grid grid-cols-1 md:grid-cols-3 gap-8&quot;&gt;
                &lt;div class=&quot;bg-[#F2F0EB] p-8 border border-[#0E0E0C] flex flex-col items-start transition-transform hover:-translate-y-2&quot; style=&quot;clip-path: polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px);&quot;&gt;
                    &lt;div class=&quot;text-5xl font-['Space_Grotesk'] font-semibold tracking-tighter mb-2&quot;&gt;3.4x&lt;/div&gt;
                    &lt;div class=&quot;w-8 h-[2px] bg-[#0E0E0C] mb-4&quot;&gt;&lt;/div&gt;
                    &lt;h4 class=&quot;font-['Space_Grotesk'] font-semibold text-xl mb-2&quot;&gt;Asset Utilization&lt;/h4&gt;
                    &lt;p class=&quot;text-sm text-[#6B6860]&quot;&gt;Increase in successful routing efficiency for field operations via dynamic avoidance.&lt;/p&gt;
                &lt;/div&gt;
                
                &lt;div class=&quot;bg-[#F2F0EB] p-8 border border-[#0E0E0C] flex flex-col items-start transition-transform hover:-translate-y-2&quot; style=&quot;clip-path: polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px);&quot;&gt;
                    &lt;div class=&quot;text-5xl font-['Space_Grotesk'] font-semibold tracking-tighter mb-2&quot;&gt;-81%&lt;/div&gt;
                    &lt;div class=&quot;w-8 h-[2px] bg-[#0E0E0C] mb-4&quot;&gt;&lt;/div&gt;
                    &lt;h4 class=&quot;font-['Space_Grotesk'] font-semibold text-xl mb-2&quot;&gt;Unplanned Downtime&lt;/h4&gt;
                    &lt;p class=&quot;text-sm text-[#6B6860]&quot;&gt;Reduction in critical infrastructure failure through predictive environmental tracking.&lt;/p&gt;
                &lt;/div&gt;

                &lt;div class=&quot;bg-[#F2F0EB] p-8 border border-[#0E0E0C] flex flex-col items-start transition-transform hover:-translate-y-2&quot; style=&quot;clip-path: polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px);&quot;&gt;
                    &lt;div class=&quot;text-5xl font-['Space_Grotesk'] font-semibold tracking-tighter mb-2&quot;&gt;$14M&lt;/div&gt;
                    &lt;div class=&quot;w-8 h-[2px] bg-[#0E0E0C] mb-4&quot;&gt;&lt;/div&gt;
                    &lt;h4 class=&quot;font-['Space_Grotesk'] font-semibold text-xl mb-2&quot;&gt;Avg. Annual Savings&lt;/h4&gt;
                    &lt;p class=&quot;text-sm text-[#6B6860]&quot;&gt;Calculated across Top 10 logistics and defense partners purely from optimized routing.&lt;/p&gt;
                &lt;/div&gt;
            &lt;/div&gt;

        &lt;/div&gt;
    &lt;/section&gt;

    &lt;!-- SECTION 6: APPLICATIONS (Horizontal Scroll) --&gt;
    &lt;section id=&quot;applications&quot; class=&quot;bg-[#F2F0EB] border-b border-[#C8C4BB] overflow-hidden&quot; style=&quot;padding-top: clamp(5rem, 10vw, 10rem); padding-bottom: clamp(5rem, 10vw, 10rem);&quot;&gt;
        &lt;div class=&quot;max-w-[1440px] mx-auto w-full mb-12&quot; style=&quot;padding: 0 clamp(1rem, 2vw, 1.5rem);&quot;&gt;
            &lt;div class=&quot;inline-flex items-center gap-2 border border-[#0E0E0C] text-[#0E0E0C] px-3 py-1 font-['JetBrains_Mono'] uppercase tracking-widest mb-6&quot; style=&quot;font-size: clamp(0.625rem, 0.8vw, 0.75rem); clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);&quot;&gt;
                ◈ Deployments
            &lt;/div&gt;
            &lt;h2 class=&quot;font-['Space_Grotesk'] font-semibold tracking-tight text-[#0E0E0C] max-w-2xl&quot; style=&quot;font-size: clamp(2.25rem, 4vw, 3.5rem); line-height: 1.1;&quot;&gt;
                Engineered for Entities Where Wrong is Not an Option.
            &lt;/h2&gt;
        &lt;/div&gt;

        &lt;div class=&quot;flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-6&quot; style=&quot;padding-left: max(1rem, calc((100vw - 1440px) / 2 + 1rem)); padding-right: 10vw; padding-bottom: 2rem;&quot;&gt;
            
            &lt;!-- Card 1 --&gt;
            &lt;div class=&quot;snap-center shrink-0 w-[300px] md:w-[400px] bg-white border border-[#C8C4BB] p-8 min-h-[400px] flex flex-col hover:border-[#0E0E0C] transition-colors group cursor-grab&quot; style=&quot;clip-path: polygon(24px 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%, 0 24px);&quot;&gt;
                &lt;div class=&quot;flex justify-between items-start mb-8 border-b border-[#C8C4BB] pb-4&quot;&gt;
                    &lt;span class=&quot;font-['JetBrains_Mono'] text-xs font-semibold uppercase tracking-widest text-[#0E0E0C]&quot;&gt;Defense &amp;amp; Intel&lt;/span&gt;
                    &lt;iconify-icon icon=&quot;solar:shield-bold-duotone&quot; class=&quot;text-2xl text-[#0E0E0C]&quot;&gt;&lt;/iconify-icon&gt;
                &lt;/div&gt;
                &lt;ul class=&quot;space-y-4 text-sm text-[#6B6860] flex-1&quot;&gt;
                    &lt;li class=&quot;flex items-start gap-2&quot;&gt;&lt;iconify-icon icon=&quot;solar:alt-arrow-right-linear&quot; class=&quot;mt-1 text-[#D4FF00] bg-[#0E0E0C] rounded-full p-0.5&quot;&gt;&lt;/iconify-icon&gt; Terrain advantage modeling&lt;/li&gt;
                    &lt;li class=&quot;flex items-start gap-2&quot;&gt;&lt;iconify-icon icon=&quot;solar:alt-arrow-right-linear&quot; class=&quot;mt-1 text-[#D4FF00] bg-[#0E0E0C] rounded-full p-0.5&quot;&gt;&lt;/iconify-icon&gt; Force movement simulation&lt;/li&gt;
                    &lt;li class=&quot;flex items-start gap-2&quot;&gt;&lt;iconify-icon icon=&quot;solar:alt-arrow-right-linear&quot; class=&quot;mt-1 text-[#D4FF00] bg-[#0E0E0C] rounded-full p-0.5&quot;&gt;&lt;/iconify-icon&gt; Contested zone mapping&lt;/li&gt;
                &lt;/ul&gt;
                &lt;div class=&quot;mt-8 font-['Space_Grotesk'] font-semibold uppercase tracking-wide text-[#0E0E0C] group-hover:text-[#D4FF00] group-hover:bg-[#0E0E0C] inline-flex items-center justify-between px-4 py-3 transition-all&quot; style=&quot;clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);&quot;&gt;
                    Explore Sector →
                &lt;/div&gt;
            &lt;/div&gt;

            &lt;!-- Card 2 --&gt;
            &lt;div class=&quot;snap-center shrink-0 w-[300px] md:w-[400px] bg-white border border-[#C8C4BB] p-8 min-h-[400px] flex flex-col hover:border-[#0E0E0C] transition-colors group cursor-grab&quot; style=&quot;clip-path: polygon(24px 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%, 0 24px);&quot;&gt;
                &lt;div class=&quot;flex justify-between items-start mb-8 border-b border-[#C8C4BB] pb-4&quot;&gt;
                    &lt;span class=&quot;font-['JetBrains_Mono'] text-xs font-semibold uppercase tracking-widest text-[#0E0E0C]&quot;&gt;Critical Infra&lt;/span&gt;
                    &lt;iconify-icon icon=&quot;solar:transmission-circle-bold-duotone&quot; class=&quot;text-2xl text-[#0E0E0C]&quot;&gt;&lt;/iconify-icon&gt;
                &lt;/div&gt;
                &lt;ul class=&quot;space-y-4 text-sm text-[#6B6860] flex-1&quot;&gt;
                    &lt;li class=&quot;flex items-start gap-2&quot;&gt;&lt;iconify-icon icon=&quot;solar:alt-arrow-right-linear&quot; class=&quot;mt-1 text-[#D4FF00] bg-[#0E0E0C] rounded-full p-0.5&quot;&gt;&lt;/iconify-icon&gt; Grid resilience mapping&lt;/li&gt;
                    &lt;li class=&quot;flex items-start gap-2&quot;&gt;&lt;iconify-icon icon=&quot;solar:alt-arrow-right-linear&quot; class=&quot;mt-1 text-[#D4FF00] bg-[#0E0E0C] rounded-full p-0.5&quot;&gt;&lt;/iconify-icon&gt; Cascade failure prediction&lt;/li&gt;
                    &lt;li class=&quot;flex items-start gap-2&quot;&gt;&lt;iconify-icon icon=&quot;solar:alt-arrow-right-linear&quot; class=&quot;mt-1 text-[#D4FF00] bg-[#0E0E0C] rounded-full p-0.5&quot;&gt;&lt;/iconify-icon&gt; Automated site geofencing&lt;/li&gt;
                &lt;/ul&gt;
                &lt;div class=&quot;mt-8 font-['Space_Grotesk'] font-semibold uppercase tracking-wide text-[#0E0E0C] group-hover:text-[#D4FF00] group-hover:bg-[#0E0E0C] inline-flex items-center justify-between px-4 py-3 transition-all&quot; style=&quot;clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);&quot;&gt;
                    Explore Sector →
                &lt;/div&gt;
            &lt;/div&gt;

            &lt;!-- Card 3 --&gt;
            &lt;div class=&quot;snap-center shrink-0 w-[300px] md:w-[400px] bg-white border border-[#C8C4BB] p-8 min-h-[400px] flex flex-col hover:border-[#0E0E0C] transition-colors group cursor-grab&quot; style=&quot;clip-path: polygon(24px 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%, 0 24px);&quot;&gt;
                &lt;div class=&quot;flex justify-between items-start mb-8 border-b border-[#C8C4BB] pb-4&quot;&gt;
                    &lt;span class=&quot;font-['JetBrains_Mono'] text-xs font-semibold uppercase tracking-widest text-[#0E0E0C]&quot;&gt;Urban Mobility&lt;/span&gt;
                    &lt;iconify-icon icon=&quot;solar:city-bold-duotone&quot; class=&quot;text-2xl text-[#0E0E0C]&quot;&gt;&lt;/iconify-icon&gt;
                &lt;/div&gt;
                &lt;ul class=&quot;space-y-4 text-sm text-[#6B6860] flex-1&quot;&gt;
                    &lt;li class=&quot;flex items-start gap-2&quot;&gt;&lt;iconify-icon icon=&quot;solar:alt-arrow-right-linear&quot; class=&quot;mt-1 text-[#D4FF00] bg-[#0E0E0C] rounded-full p-0.5&quot;&gt;&lt;/iconify-icon&gt; Density forecasting&lt;/li&gt;
                    &lt;li class=&quot;flex items-start gap-2&quot;&gt;&lt;iconify-icon icon=&quot;solar:alt-arrow-right-linear&quot; class=&quot;mt-1 text-[#D4FF00] bg-[#0E0E0C] rounded-full p-0.5&quot;&gt;&lt;/iconify-icon&gt; Mobility corridor analytics&lt;/li&gt;
                    &lt;li class=&quot;flex items-start gap-2&quot;&gt;&lt;iconify-icon icon=&quot;solar:alt-arrow-right-linear&quot; class=&quot;mt-1 text-[#D4FF00] bg-[#0E0E0C] rounded-full p-0.5&quot;&gt;&lt;/iconify-icon&gt; Zoning risk scoring&lt;/li&gt;
                &lt;/ul&gt;
                &lt;div class=&quot;mt-8 font-['Space_Grotesk'] font-semibold uppercase tracking-wide text-[#0E0E0C] group-hover:text-[#D4FF00] group-hover:bg-[#0E0E0C] inline-flex items-center justify-between px-4 py-3 transition-all&quot; style=&quot;clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);&quot;&gt;
                    Explore Sector →
                &lt;/div&gt;
            &lt;/div&gt;

            &lt;!-- Card 4 --&gt;
            &lt;div class=&quot;snap-center shrink-0 w-[300px] md:w-[400px] bg-white border border-[#C8C4BB] p-8 min-h-[400px] flex flex-col hover:border-[#0E0E0C] transition-colors group cursor-grab&quot; style=&quot;clip-path: polygon(24px 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%, 0 24px);&quot;&gt;
                &lt;div class=&quot;flex justify-between items-start mb-8 border-b border-[#C8C4BB] pb-4&quot;&gt;
                    &lt;span class=&quot;font-['JetBrains_Mono'] text-xs font-semibold uppercase tracking-widest text-[#0E0E0C]&quot;&gt;Disaster Response&lt;/span&gt;
                    &lt;iconify-icon icon=&quot;solar:medical-kit-bold-duotone&quot; class=&quot;text-2xl text-[#0E0E0C]&quot;&gt;&lt;/iconify-icon&gt;
                &lt;/div&gt;
                &lt;ul class=&quot;space-y-4 text-sm text-[#6B6860] flex-1&quot;&gt;
                    &lt;li class=&quot;flex items-start gap-2&quot;&gt;&lt;iconify-icon icon=&quot;solar:alt-arrow-right-linear&quot; class=&quot;mt-1 text-[#D4FF00] bg-[#0E0E0C] rounded-full p-0.5&quot;&gt;&lt;/iconify-icon&gt; Live perimeter tracking&lt;/li&gt;
                    &lt;li class=&quot;flex items-start gap-2&quot;&gt;&lt;iconify-icon icon=&quot;solar:alt-arrow-right-linear&quot; class=&quot;mt-1 text-[#D4FF00] bg-[#0E0E0C] rounded-full p-0.5&quot;&gt;&lt;/iconify-icon&gt; Evacuation corridor modeling&lt;/li&gt;
                    &lt;li class=&quot;flex items-start gap-2&quot;&gt;&lt;iconify-icon icon=&quot;solar:alt-arrow-right-linear&quot; class=&quot;mt-1 text-[#D4FF00] bg-[#0E0E0C] rounded-full p-0.5&quot;&gt;&lt;/iconify-icon&gt; Real-time resource routing&lt;/li&gt;
                &lt;/ul&gt;
                &lt;div class=&quot;mt-8 font-['Space_Grotesk'] font-semibold uppercase tracking-wide text-[#0E0E0C] group-hover:text-[#D4FF00] group-hover:bg-[#0E0E0C] inline-flex items-center justify-between px-4 py-3 transition-all&quot; style=&quot;clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);&quot;&gt;
                    Explore Sector →
                &lt;/div&gt;
            &lt;/div&gt;

        &lt;/div&gt;
    &lt;/section&gt;

    &lt;!-- SECTION 7: EVIDENCE / CASE STUDIES --&gt;
    &lt;section id=&quot;evidence&quot; class=&quot;bg-[#0E0E0C] text-[#F2F0EB]&quot;&gt;
        &lt;!-- Case 1 --&gt;
        &lt;div class=&quot;grid grid-cols-1 md:grid-cols-2 group border-b border-[#33312C]&quot;&gt;
            &lt;div class=&quot;relative min-h-[400px] overflow-hidden&quot;&gt;
                &lt;img src=&quot;https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&amp;amp;w=1000&amp;amp;auto=format&amp;amp;fit=crop&quot; class=&quot;absolute inset-0 w-full h-full object-cover grayscale opacity-40 group-hover:scale-105 group-hover:opacity-70 transition-all duration-[1500ms] ease-out&quot;&gt;
                &lt;div class=&quot;absolute inset-0 bg-[#0E0E0C] mix-blend-color&quot;&gt;&lt;/div&gt;
                &lt;!-- HUD element overlay --&gt;
                &lt;div class=&quot;absolute top-8 left-8 border border-[#D4FF00]/50 p-2 backdrop-blur-sm hidden md:block&quot; style=&quot;clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);&quot;&gt;
                    &lt;div class=&quot;font-['JetBrains_Mono'] text-[10px] text-[#D4FF00]&quot;&gt;TARGET: PORT_ROTTERDAM&lt;/div&gt;
                    &lt;div class=&quot;font-['JetBrains_Mono'] text-[10px] text-[#F2F0EB]&quot;&gt;STATUS: OPTIMIZED&lt;/div&gt;
                &lt;/div&gt;
            &lt;/div&gt;
            &lt;div class=&quot;flex flex-col justify-center bg-[#0E0E0C]&quot; style=&quot;padding: clamp(2rem, 5vw, 4rem);&quot;&gt;
                &lt;div class=&quot;font-['JetBrains_Mono'] text-xs text-[#6B6860] uppercase tracking-widest mb-4 flex items-center gap-3&quot;&gt;
                    &lt;span class=&quot;w-8 h-[1px] bg-[#6B6860]&quot;&gt;&lt;/span&gt; Port of Rotterdam
                &lt;/div&gt;
                &lt;h3 class=&quot;font-['Space_Grotesk'] font-semibold text-3xl md:text-4xl mb-6 text-[#F2F0EB] tracking-tight&quot;&gt;61% Reduction in Unplanned Logistics Events&lt;/h3&gt;
                &lt;p class=&quot;text-[#C8C4BB] text-sm md:text-base leading-relaxed mb-8&quot;&gt;Deploying VEKTOR's predictive risk mapping allowed port authorities to shift from reactive maintenance to automated asset geo-fencing, isolating high-stress nodes before failure cascades.&lt;/p&gt;
                &lt;a href=&quot;#&quot; class=&quot;font-['Space_Grotesk'] font-semibold uppercase tracking-wide text-[#D4FF00] hover:text-[#F2F0EB] transition-colors flex items-center gap-2 w-max text-sm group/link&quot;&gt;
                    Access Intelligence Brief &lt;iconify-icon icon=&quot;solar:arrow-right-linear&quot; class=&quot;group-hover/link:translate-x-1 transition-transform&quot;&gt;&lt;/iconify-icon&gt;
                &lt;/a&gt;
            &lt;/div&gt;
        &lt;/div&gt;

        &lt;!-- Case 2 --&gt;
        &lt;div class=&quot;grid grid-cols-1 md:grid-cols-2 group border-b border-[#33312C]&quot;&gt;
            &lt;div class=&quot;flex flex-col justify-center bg-[#1A1A18] order-2 md:order-1&quot; style=&quot;padding: clamp(2rem, 5vw, 4rem);&quot;&gt;
                &lt;div class=&quot;font-['JetBrains_Mono'] text-xs text-[#6B6860] uppercase tracking-widest mb-4 flex items-center gap-3&quot;&gt;
                    &lt;span class=&quot;w-8 h-[1px] bg-[#6B6860]&quot;&gt;&lt;/span&gt; Singapore Land Authority
                &lt;/div&gt;
                &lt;h3 class=&quot;font-['Space_Grotesk'] font-semibold text-3xl md:text-4xl mb-6 text-[#F2F0EB] tracking-tight&quot;&gt;Emergency Response Cut to 6.4 Minutes&lt;/h3&gt;
                &lt;p class=&quot;text-[#C8C4BB] text-sm md:text-base leading-relaxed mb-8&quot;&gt;Utilizing live population flux modeling, emergency routing was untethered from static maps. Routing algorithms now automatically bypass invisible bottlenecks.&lt;/p&gt;
                &lt;a href=&quot;#&quot; class=&quot;font-['Space_Grotesk'] font-semibold uppercase tracking-wide text-[#D4FF00] hover:text-[#F2F0EB] transition-colors flex items-center gap-2 w-max text-sm group/link&quot;&gt;
                    Access Intelligence Brief &lt;iconify-icon icon=&quot;solar:arrow-right-linear&quot; class=&quot;group-hover/link:translate-x-1 transition-transform&quot;&gt;&lt;/iconify-icon&gt;
                &lt;/a&gt;
            &lt;/div&gt;
            &lt;div class=&quot;relative min-h-[400px] overflow-hidden order-1 md:order-2&quot;&gt;
                &lt;img src=&quot;https://images.unsplash.com/photo-1542361345-89e58247f2d5?q=80&amp;amp;w=1000&amp;amp;auto=format&amp;amp;fit=crop&quot; class=&quot;absolute inset-0 w-full h-full object-cover grayscale opacity-40 group-hover:scale-105 group-hover:opacity-70 transition-all duration-[1500ms] ease-out&quot;&gt;
                &lt;div class=&quot;absolute inset-0 bg-[#0E0E0C] mix-blend-color&quot;&gt;&lt;/div&gt;
            &lt;/div&gt;
        &lt;/div&gt;
    &lt;/section&gt;

    &lt;!-- SECTION 8: ARCHITECTURE (Process) --&gt;
    &lt;section class=&quot;bg-[#F2F0EB] relative&quot; style=&quot;padding-top: clamp(5rem, 10vw, 10rem); padding-bottom: clamp(5rem, 10vw, 10rem);&quot;&gt;
        &lt;div class=&quot;max-w-[1440px] mx-auto w-full&quot; style=&quot;padding: 0 clamp(1rem, 2vw, 1.5rem);&quot;&gt;
            
            &lt;div class=&quot;text-center mb-20&quot;&gt;
                &lt;div class=&quot;inline-flex items-center gap-2 border border-[#0E0E0C] text-[#0E0E0C] px-3 py-1 font-['JetBrains_Mono'] uppercase tracking-widest mb-6&quot; style=&quot;font-size: clamp(0.625rem, 0.8vw, 0.75rem); clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);&quot;&gt;
                    ◈ The Pipeline
                &lt;/div&gt;
                &lt;h2 class=&quot;font-['Space_Grotesk'] font-semibold tracking-tight text-[#0E0E0C] max-w-3xl mx-auto&quot; style=&quot;font-size: clamp(2.25rem, 4vw, 3.5rem); line-height: 1.1;&quot;&gt;
                    From Raw Signal to Strategic Action in 4 Minutes.
                &lt;/h2&gt;
            &lt;/div&gt;

            &lt;div class=&quot;grid grid-cols-1 md:grid-cols-4 gap-8 relative&quot;&gt;
                &lt;!-- Connecting Line Desktop --&gt;
                &lt;div class=&quot;hidden md:block absolute top-6 left-0 w-full h-[2px] bg-[#C8C4BB] z-0&quot;&gt;&lt;/div&gt;

                &lt;div class=&quot;relative z-10 bg-white p-6 border border-[#C8C4BB] hover:border-[#0E0E0C] transition-colors group&quot; style=&quot;clip-path: polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px);&quot;&gt;
                    &lt;div class=&quot;w-12 h-12 bg-[#0E0E0C] text-[#F2F0EB] font-['JetBrains_Mono'] font-semibold flex items-center justify-center mb-6&quot; style=&quot;clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);&quot;&gt;01&lt;/div&gt;
                    &lt;h4 class=&quot;font-['Space_Grotesk'] font-semibold text-xl uppercase tracking-wide mb-3&quot;&gt;Ingest&lt;/h4&gt;
                    &lt;p class=&quot;text-sm text-[#6B6860]&quot;&gt;Connect satellite, LiDAR, IoT, and proprietary feeds via VEKTOR API. Sub-5-min onboarding.&lt;/p&gt;
                &lt;/div&gt;

                &lt;div class=&quot;relative z-10 bg-white p-6 border border-[#C8C4BB] hover:border-[#0E0E0C] transition-colors group&quot; style=&quot;clip-path: polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px);&quot;&gt;
                    &lt;div class=&quot;w-12 h-12 bg-[#0E0E0C] text-[#F2F0EB] font-['JetBrains_Mono'] font-semibold flex items-center justify-center mb-6&quot; style=&quot;clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);&quot;&gt;02&lt;/div&gt;
                    &lt;h4 class=&quot;font-['Space_Grotesk'] font-semibold text-xl uppercase tracking-wide mb-3&quot;&gt;Parse&lt;/h4&gt;
                    &lt;p class=&quot;text-sm text-[#6B6860]&quot;&gt;Fusion engine classifies 200+ spatial signals, removes noise, and flags anomalies autonomously.&lt;/p&gt;
                &lt;/div&gt;

                &lt;div class=&quot;relative z-10 bg-white p-6 border border-[#C8C4BB] hover:border-[#0E0E0C] transition-colors group&quot; style=&quot;clip-path: polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px);&quot;&gt;
                    &lt;div class=&quot;w-12 h-12 bg-[#0E0E0C] text-[#F2F0EB] font-['JetBrains_Mono'] font-semibold flex items-center justify-center mb-6&quot; style=&quot;clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);&quot;&gt;03&lt;/div&gt;
                    &lt;h4 class=&quot;font-['Space_Grotesk'] font-semibold text-xl uppercase tracking-wide mb-3&quot;&gt;Score&lt;/h4&gt;
                    &lt;p class=&quot;text-sm text-[#6B6860]&quot;&gt;Predictive scores applied across predefined custom zones. Immediate risk quantification.&lt;/p&gt;
                &lt;/div&gt;

                &lt;div class=&quot;relative z-10 bg-[#0E0E0C] p-6 text-[#F2F0EB] transition-transform hover:-translate-y-2 group&quot; style=&quot;clip-path: polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px);&quot;&gt;
                    &lt;div class=&quot;w-12 h-12 bg-[#D4FF00] text-[#0E0E0C] font-['JetBrains_Mono'] font-semibold flex items-center justify-center mb-6&quot; style=&quot;clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);&quot;&gt;04&lt;/div&gt;
                    &lt;h4 class=&quot;font-['Space_Grotesk'] font-semibold text-xl uppercase tracking-wide mb-3 text-[#D4FF00]&quot;&gt;Execute&lt;/h4&gt;
                    &lt;p class=&quot;text-sm text-[#C8C4BB]&quot;&gt;Narrative briefings and webhook alerts delivered instantly to operational tools.&lt;/p&gt;
                &lt;/div&gt;

            &lt;/div&gt;
        &lt;/div&gt;
    &lt;/section&gt;

    &lt;!-- SECTION 9: TRUST / SECURITY (Objections) --&gt;
    &lt;section class=&quot;bg-[#1A1A18] text-[#F2F0EB] border-t border-[#33312C]&quot; style=&quot;padding-top: clamp(5rem, 10vw, 8rem); padding-bottom: clamp(5rem, 10vw, 8rem);&quot;&gt;
        &lt;div class=&quot;max-w-[1440px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-16&quot; style=&quot;padding: 0 clamp(1rem, 2vw, 1.5rem);&quot;&gt;
            
            &lt;div class=&quot;lg:col-span-4&quot;&gt;
                &lt;div class=&quot;inline-flex items-center gap-2 border border-[#6B6860] text-[#C8C4BB] px-3 py-1 font-['JetBrains_Mono'] uppercase tracking-widest mb-6&quot; style=&quot;font-size: clamp(0.625rem, 0.8vw, 0.75rem); clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);&quot;&gt;
                    ◈ Military-Grade Baseline
                &lt;/div&gt;
                &lt;h2 class=&quot;font-['Space_Grotesk'] font-semibold tracking-tight leading-none mb-6&quot; style=&quot;font-size: clamp(2rem, 3.5vw, 3rem);&quot;&gt;
                    Engineered for Complete Sovereignty.
                &lt;/h2&gt;
                &lt;div class=&quot;flex gap-4 mt-8&quot;&gt;
                    &lt;div class=&quot;px-4 py-2 border border-[#33312C] font-['JetBrains_Mono'] text-xs text-[#6B6860]&quot;&gt;ISO 27001&lt;/div&gt;
                    &lt;div class=&quot;px-4 py-2 border border-[#33312C] font-['JetBrains_Mono'] text-xs text-[#6B6860]&quot;&gt;SOC 2 TYPE II&lt;/div&gt;
                    &lt;div class=&quot;px-4 py-2 border border-[#33312C] font-['JetBrains_Mono'] text-xs text-[#6B6860]&quot;&gt;ITAR&lt;/div&gt;
                &lt;/div&gt;
            &lt;/div&gt;

            &lt;div class=&quot;lg:col-span-8 flex flex-col gap-2&quot;&gt;
                &lt;details class=&quot;group border-b border-[#33312C] pb-6 mb-6&quot; open=&quot;&quot;&gt;
                    &lt;summary class=&quot;flex justify-between items-center cursor-pointer font-['Space_Grotesk'] font-semibold text-xl md:text-2xl hover:text-[#D4FF00] transition-colors outline-none list-none [&amp;amp;::-webkit-details-marker]:hidden&quot;&gt;
                        &quot;Is our intelligence sovereign and air-gapped?&quot;
                        &lt;iconify-icon icon=&quot;solar:alt-arrow-down-linear&quot; class=&quot;text-2xl text-[#6B6860] group-open:rotate-180 group-open:text-[#D4FF00] transition-transform&quot;&gt;&lt;/iconify-icon&gt;
                    &lt;/summary&gt;
                    &lt;div class=&quot;pt-6 text-[#C8C4BB] text-sm md:text-base pr-8 leading-relaxed&quot;&gt;
                        Absolute sovereignty is guaranteed. VEKTOR operates entirely within your preferred boundary—whether on-premise air-gapped hardware, or your dedicated sovereign cloud. No raw data or derived models ever ping external servers.
                    &lt;/div&gt;
                &lt;/details&gt;

                &lt;details class=&quot;group border-b border-[#33312C] pb-6 mb-6&quot;&gt;
                    &lt;summary class=&quot;flex justify-between items-center cursor-pointer font-['Space_Grotesk'] font-semibold text-xl md:text-2xl hover:text-[#D4FF00] transition-colors outline-none list-none [&amp;amp;::-webkit-details-marker]:hidden&quot;&gt;
                        &quot;How painful is integration with existing legacy GIS?&quot;
                        &lt;iconify-icon icon=&quot;solar:alt-arrow-down-linear&quot; class=&quot;text-2xl text-[#6B6860] group-open:rotate-180 group-open:text-[#D4FF00] transition-transform&quot;&gt;&lt;/iconify-icon&gt;
                    &lt;/summary&gt;
                    &lt;div class=&quot;pt-6 text-[#C8C4BB] text-sm md:text-base pr-8 leading-relaxed&quot;&gt;
                        We don't replace your stack; we supercharge it. VEKTOR provides native zero-code connectors for ESRI ArcGIS, QGIS, Palantir Foundry, and 14 standard enterprise platforms. Full integration averages 72 hours.
                    &lt;/div&gt;
                &lt;/details&gt;

                &lt;details class=&quot;group border-b border-[#33312C] pb-6 mb-6&quot;&gt;
                    &lt;summary class=&quot;flex justify-between items-center cursor-pointer font-['Space_Grotesk'] font-semibold text-xl md:text-2xl hover:text-[#D4FF00] transition-colors outline-none list-none [&amp;amp;::-webkit-details-marker]:hidden&quot;&gt;
                        &quot;Who owns the custom algorithmic models?&quot;
                        &lt;iconify-icon icon=&quot;solar:alt-arrow-down-linear&quot; class=&quot;text-2xl text-[#6B6860] group-open:rotate-180 group-open:text-[#D4FF00] transition-transform&quot;&gt;&lt;/iconify-icon&gt;
                    &lt;/summary&gt;
                    &lt;div class=&quot;pt-6 text-[#C8C4BB] text-sm md:text-base pr-8 leading-relaxed&quot;&gt;
                        You retain 100% intellectual property rights over any model trained on your proprietary data. VEKTOR explicitly disclaims all rights to derived intelligence.
                    &lt;/div&gt;
                &lt;/details&gt;
            &lt;/div&gt;
        &lt;/div&gt;
    &lt;/section&gt;

    &lt;!-- SECTION 10: CTA --&gt;
    &lt;section class=&quot;bg-[#0E0E0C] text-[#F2F0EB] relative flex items-center justify-center overflow-hidden&quot; style=&quot;min-height: 80svh; padding-top: clamp(5rem, 10vw, 10rem); padding-bottom: clamp(5rem, 10vw, 10rem);&quot;&gt;
        
        &lt;!-- Radar Sweep Background --&gt;
        &lt;div class=&quot;absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-20&quot;&gt;
            &lt;div class=&quot;w-[800px] h-[800px] border border-[#D4FF00] rounded-full absolute&quot;&gt;&lt;/div&gt;
            &lt;div class=&quot;w-[600px] h-[600px] border border-[#D4FF00] rounded-full absolute&quot;&gt;&lt;/div&gt;
            &lt;div class=&quot;w-[400px] h-[400px] border border-[#D4FF00] rounded-full absolute&quot;&gt;&lt;/div&gt;
            &lt;!-- Sweep line --&gt;
            &lt;div class=&quot;absolute w-[400px] h-[400px] origin-bottom-right bottom-1/2 right-1/2 bg-gradient-to-t from-transparent to-[#D4FF00] opacity-30&quot; style=&quot;animation: spin 4s linear infinite; clip-path: polygon(100% 100%, 0 0, 100% 0);&quot;&gt;&lt;/div&gt;
        &lt;/div&gt;

        &lt;div class=&quot;max-w-[800px] mx-auto text-center relative z-10 flex flex-col items-center px-4&quot;&gt;
            
            &lt;h2 class=&quot;font-['Space_Grotesk'] font-semibold tracking-tight leading-none mb-6&quot; style=&quot;font-size: clamp(3rem, 6vw, 5rem);&quot;&gt;
                The Map is Only the Beginning.
            &lt;/h2&gt;
            &lt;p class=&quot;font-['Inter'] text-[#C8C4BB] max-w-2xl mb-12&quot; style=&quot;font-size: clamp(1rem, 1.2vw, 1.25rem);&quot;&gt;
                Stop reacting. Start commanding. Request a briefing and we will demonstrate total spatial awareness tailored to your exact operational theater.
            &lt;/p&gt;

            &lt;form class=&quot;w-full max-w-xl flex flex-col md:flex-row gap-4 mb-8&quot; onsubmit=&quot;event.preventDefault(); alert('Briefing Requested.');&quot;&gt;
                &lt;input type=&quot;email&quot; placeholder=&quot;ENTER CLASSIFIED EMAIL&quot; required=&quot;&quot; class=&quot;flex-1 bg-[#1A1A18] border border-[#33312C] text-[#F2F0EB] px-6 py-4 font-['JetBrains_Mono'] text-sm focus:outline-none focus:border-[#D4FF00] placeholder-[#6B6860] transition-colors&quot; style=&quot;clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);&quot;&gt;
                
                &lt;button type=&quot;submit&quot; class=&quot;relative inline-flex items-center justify-center bg-[#D4FF00] text-[#0E0E0C] font-['Space_Grotesk'] font-semibold uppercase tracking-wide overflow-hidden group shrink-0&quot; style=&quot;height: 56px; padding: 0 2rem; clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);&quot;&gt;
                    &lt;div class=&quot;absolute inset-0 bg-white/30 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out&quot;&gt;&lt;/div&gt;
                    &lt;span class=&quot;relative z-10 flex items-center gap-2&quot;&gt;Request Briefing &lt;iconify-icon icon=&quot;solar:lock-keyhole-linear&quot;&gt;&lt;/iconify-icon&gt;&lt;/span&gt;
                &lt;/button&gt;
            &lt;/form&gt;

            &lt;div class=&quot;flex flex-wrap justify-center gap-x-6 gap-y-3 font-['JetBrains_Mono'] text-xs text-[#6B6860] uppercase tracking-widest&quot;&gt;
                &lt;span&gt;&lt;span class=&quot;text-[#D4FF00]&quot;&gt;◈&lt;/span&gt; Secure Demo&lt;/span&gt;
                &lt;span&gt;&lt;span class=&quot;text-[#D4FF00]&quot;&gt;◈&lt;/span&gt; NDA Default&lt;/span&gt;
                &lt;span&gt;&lt;span class=&quot;text-[#D4FF00]&quot;&gt;◈&lt;/span&gt; 2Hr SLA&lt;/span&gt;
            &lt;/div&gt;
        &lt;/div&gt;
    &lt;/section&gt;

    &lt;!-- FOOTER --&gt;
    &lt;footer class=&quot;bg-[#0E0E0C] text-[#F2F0EB] border-t border-[#33312C] relative z-50 pt-20 pb-12&quot;&gt;
        &lt;div class=&quot;max-w-[1440px] mx-auto w-full&quot; style=&quot;padding: 0 clamp(1rem, 2vw, 1.5rem);&quot;&gt;
            &lt;div class=&quot;grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16&quot;&gt;
                
                &lt;!-- Brand --&gt;
                &lt;div class=&quot;flex flex-col gap-6&quot;&gt;
                    &lt;a href=&quot;#&quot; class=&quot;flex items-center gap-3 text-[#F2F0EB] group&quot;&gt;
                        &lt;svg width=&quot;24&quot; height=&quot;24&quot; viewBox=&quot;0 0 32 32&quot; fill=&quot;none&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;&gt;
                            &lt;path d=&quot;M2 4L16 28L30 4H22L16 16L10 4H2Z&quot; fill=&quot;#F2F0EB&quot;&gt;&lt;/path&gt;
                            &lt;path d=&quot;M10 4L16 16L22 4H30L16 28L2 4H10Z&quot; stroke=&quot;#D4FF00&quot; stroke-width=&quot;1&quot; class=&quot;opacity-0 group-hover:opacity-100 transition-opacity&quot;&gt;&lt;/path&gt;
                        &lt;/svg&gt;
                        &lt;span class=&quot;font-['Space_Grotesk'] font-semibold text-lg tracking-tighter leading-none mt-1&quot;&gt;VEKTOR&lt;/span&gt;
                    &lt;/a&gt;
                    &lt;p class=&quot;font-['JetBrains_Mono'] text-[#6B6860] text-xs max-w-[200px]&quot;&gt;Omniscient Spatial Intelligence. Dominate your domain.&lt;/p&gt;
                &lt;/div&gt;

                &lt;!-- Links 1 --&gt;
                &lt;div class=&quot;flex flex-col gap-4&quot;&gt;
                    &lt;span class=&quot;font-['JetBrains_Mono'] text-xs uppercase tracking-widest text-[#6B6860] mb-2&quot;&gt;Platform&lt;/span&gt;
                    &lt;a href=&quot;#&quot; class=&quot;text-sm text-[#C8C4BB] hover:text-[#D4FF00] transition-colors w-max&quot;&gt;Core Engine&lt;/a&gt;
                    &lt;a href=&quot;#&quot; class=&quot;text-sm text-[#C8C4BB] hover:text-[#D4FF00] transition-colors w-max&quot;&gt;API Docs&lt;/a&gt;
                    &lt;a href=&quot;#&quot; class=&quot;text-sm text-[#C8C4BB] hover:text-[#D4FF00] transition-colors w-max flex items-center gap-2&quot;&gt;Network Status &lt;span class=&quot;w-1.5 h-1.5 rounded-full bg-[#D4FF00]&quot; style=&quot;animation: pulse-ring 2s infinite;&quot;&gt;&lt;/span&gt;&lt;/a&gt;
                &lt;/div&gt;

                &lt;!-- Links 2 --&gt;
                &lt;div class=&quot;flex flex-col gap-4&quot;&gt;
                    &lt;span class=&quot;font-['JetBrains_Mono'] text-xs uppercase tracking-widest text-[#6B6860] mb-2&quot;&gt;Company&lt;/span&gt;
                    &lt;a href=&quot;#&quot; class=&quot;text-sm text-[#C8C4BB] hover:text-[#D4FF00] transition-colors w-max&quot;&gt;About&lt;/a&gt;
                    &lt;a href=&quot;#&quot; class=&quot;text-sm text-[#C8C4BB] hover:text-[#D4FF00] transition-colors w-max&quot;&gt;Careers&lt;/a&gt;
                    &lt;a href=&quot;#&quot; class=&quot;text-sm text-[#C8C4BB] hover:text-[#D4FF00] transition-colors w-max&quot;&gt;Security&lt;/a&gt;
                &lt;/div&gt;

                &lt;!-- Form --&gt;
                &lt;div class=&quot;flex flex-col gap-4&quot;&gt;
                    &lt;span class=&quot;font-['JetBrains_Mono'] text-xs uppercase tracking-widest text-[#6B6860] mb-2&quot;&gt;Intel Feed&lt;/span&gt;
                    &lt;p class=&quot;text-xs text-[#C8C4BB] mb-2&quot;&gt;Weekly unclassified briefing on global spatial shifts.&lt;/p&gt;
                    &lt;form class=&quot;flex gap-2&quot; onsubmit=&quot;event.preventDefault();&quot;&gt;
                        &lt;input type=&quot;email&quot; placeholder=&quot;EMAIL&quot; class=&quot;w-full bg-[#1A1A18] border border-[#33312C] text-[#F2F0EB] px-3 py-2 font-['JetBrains_Mono'] text-xs focus:outline-none focus:border-[#D4FF00]&quot; style=&quot;clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);&quot;&gt;
                        &lt;button type=&quot;submit&quot; class=&quot;bg-[#33312C] text-[#F2F0EB] px-4 py-2 font-['JetBrains_Mono'] text-xs hover:bg-[#D4FF00] hover:text-[#0E0E0C] transition-colors&quot; style=&quot;clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);&quot;&gt;→&lt;/button&gt;
                    &lt;/form&gt;
                &lt;/div&gt;
            &lt;/div&gt;

            &lt;div class=&quot;border-t border-[#33312C] pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[#6B6860] font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest&quot;&gt;
                &lt;span&gt;© 2025 VEKTOR SYSTEMS. ALL RIGHTS RESERVED.&lt;/span&gt;
                &lt;div class=&quot;flex gap-6&quot;&gt;
                    &lt;a href=&quot;#&quot; class=&quot;hover:text-[#F2F0EB] transition-colors&quot;&gt;Privacy&lt;/a&gt;
                    &lt;a href=&quot;#&quot; class=&quot;hover:text-[#F2F0EB] transition-colors&quot;&gt;Terms&lt;/a&gt;
                &lt;/div&gt;
            &lt;/div&gt;
        &lt;/div&gt;
    &lt;/footer&gt;

    &lt;!-- Astonishing WebGL-style Canvas Script --&gt;
    &lt;script&gt;
        const canvas = document.getElementById('hero-canvas');
        const ctx = canvas.getContext('2d');
        
        let width, height;
        let points = [];
        let mouse = { x: -1000, y: -1000 };
        const spacing = 35; // Grid density
        let time = 0;

        function init() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = canvas.offsetHeight;
            points = [];

            const cols = Math.floor(width / spacing) + 2;
            const rows = Math.floor(height / spacing) + 2;

            for (let i = 0; i &lt; cols; i++) {
                for (let j = 0; j &lt; rows; j++) {
                    points.push({
                        x: i * spacing,
                        y: j * spacing,
                        baseX: i * spacing,
                        baseY: j * spacing,
                        phase: Math.random() * Math.PI * 2
                    });
                }
            }
        }

        function draw() {
            ctx.clearRect(0, 0, width, height);
            time += 0.02;

            // Radar Sweep Angle
            const sweepAngle = (time * 0.5) % (Math.PI * 2);

            points.forEach(p =&gt; {
                // Wave motion
                const wave = Math.sin(p.x * 0.01 + time) * Math.cos(p.y * 0.01 + time) * 15;
                p.x = p.baseX + Math.sin(p.phase + time) * 2;
                p.y = p.baseY + wave;

                // Mouse Repulsion
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist &lt; 150) {
                    const force = (150 - dist) / 150;
                    p.x -= (dx / dist) * force * 20;
                    p.y -= (dy / dist) * force * 20;
                }

                // Radar Illumination Logic
                const centerDx = p.x - width / 2;
                const centerDy = p.y - height / 2;
                let angle = Math.atan2(centerDy, centerDx);
                if (angle &lt; 0) angle += Math.PI * 2;
                
                let angleDiff = sweepAngle - angle;
                if (angleDiff &lt; 0) angleDiff += Math.PI * 2;

                // Default point
                let radius = 1;
                let opacity = 0.2;
                let color = '#C8C4BB'; // Default grid color

                // If caught in radar sweep
                if (angleDiff &lt; 0.3) {
                    radius = 2;
                    opacity = 1 - (angleDiff / 0.3);
                    color = '#D4FF00'; // Accent color
                }
                
                // If near mouse
                if(dist &lt; 100) {
                    radius = 2.5;
                    opacity = 0.8;
                    color = '#D4FF00';
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.globalAlpha = opacity;
                ctx.fill();
            });

            ctx.globalAlpha = 1;

            // Draw scanning line
            ctx.save();
            ctx.translate(width / 2, height / 2);
            ctx.rotate(sweepAngle);
            const gradient = ctx.createLinearGradient(0, 0, width, 0);
            gradient.addColorStop(0, 'rgba(212, 255, 0, 0.8)');
            gradient.addColorStop(1, 'rgba(212, 255, 0, 0)');
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(width, 0);
            ctx.lineTo(width, 50); // slight fan
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.globalAlpha = 0.05;
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(width, 0);
            ctx.strokeStyle = '#D4FF00';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.4;
            ctx.stroke();
            ctx.restore();

            requestAnimationFrame(draw);
        }

        window.addEventListener('resize', init);
        window.addEventListener('mousemove', (e) =&gt; {
            // Adjust for scroll position for absolute canvas
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });

        init();
        draw();
    &lt;/script&gt;

&lt;script data-img-fallback-handler&gt;!function(){var f=[&quot;https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/917d6f93-fb36-439a-8c48-884b67b35381_1600w.jpg&quot;,&quot;https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/4734259a-bad7-422f-981e-ce01e79184f2_1600w.jpg&quot;,&quot;https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/c543a9e1-f226-4ced-80b0-feb8445a75b9_1600w.jpg&quot;,&quot;https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/5bab247f-35d9-400d-a82b-fd87cfe913d2_1600w.webp&quot;,&quot;https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/30104e3c-5eea-4b93-93e9-5313698a7156_1600w.webp&quot;],h=new Set;function g(s){for(var x=0,i=0;i&lt;s.length;i++)x=(x&lt;&lt;5)-x+s.charCodeAt(i)|0;return f[Math.abs(x)%f.length]}function r(t){var s=t.src;if(s&amp;&amp;!h.has(s)){h.add(s);t.src=g(s)}}window.addEventListener(&quot;error&quot;,function(e){var t=e.target;if(t&amp;&amp;t.tagName===&quot;IMG&quot;)r(t)},!0);function c(){document.querySelectorAll(&quot;img&quot;).forEach(function(i){if(i.complete&amp;&amp;!i.naturalWidth&amp;&amp;i.src)r(i)})}if(document.readyState===&quot;loading&quot;)document.addEventListener(&quot;DOMContentLoaded&quot;,c);else c()}()&lt;/script&gt;&lt;/body&gt;&lt;/html&gt;"></iframe></div></div><div class="fixed bottom-4 right-4 z-50"><div class="group bg-neutral-900 transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] border border-white/5 rounded-xl p-1 px-2 h-10 flex items-center gap-0 shadow-strong shine overflow-hidden"><a href="https://aura.build" class="flex items-center gap-1 hover:opacity-80 transition-opacity" data-state="closed"><img src="/logo-aura-gray.svg" alt="Aura Logo" class="h-5 w-5 mix-blend-screen"><span class="text-[11px] font-medium text-neutral-300 mr-2">Made in Aura</span></a></div></div></div></div></div><div role="region" aria-label="Notifications (F8)" tabindex="-1" style="pointer-events: none;"><ol tabindex="-1" class="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex max-h-screen flex-col-reverse p-4 max-w-[420px]"></ol></div></div>
  

</body>