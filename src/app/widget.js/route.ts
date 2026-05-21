import { NextResponse } from "next/server";

const widgetSource = `(function () {
  if (window.__rpWidgetLoaded) return;
  window.__rpWidgetLoaded = true;

  var currentScript = document.currentScript;
  var origin;
  try {
    origin = new URL(currentScript.src).origin;
  } catch (e) {
    origin = window.location.origin;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c];
    });
  }

  function makeRoot(host, css) {
    var shadow = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
    var styleEl = document.createElement("style");
    styleEl.textContent = css;
    shadow.appendChild(styleEl);
    var root = document.createElement("div");
    root.className = "rp-root";
    shadow.appendChild(root);
    return root;
  }

  async function loadAndRender(host) {
    var toolId = host.getAttribute("data-rp-tool");
    if (!toolId) return;
    host.setAttribute("data-rp-mounted", "1");

    var configRes = await fetch(origin + "/api/tools/" + encodeURIComponent(toolId) + "/config");
    if (!configRes.ok) {
      host.innerHTML = '<div style="color:#dc2626;font-family:sans-serif">Reflection Pool: tool not found.</div>';
      return;
    }
    var config = await configRes.json();
    if (config.type !== "REFLECTION") {
      host.innerHTML = '<div style="color:#dc2626;font-family:sans-serif">Reflection Pool: quiz embed coming soon.</div>';
      return;
    }

    var cssRes = await fetch(origin + "/api/tools/" + encodeURIComponent(toolId) + "/css");
    var css = cssRes.ok ? await cssRes.text() : "";

    var root = makeRoot(host, css);
    renderReflection(root, toolId, config);
  }

  function renderReflection(root, toolId, config) {
    var promptIndex = 0;
    var prompts = config.prompts || [];
    var localItems = [];
    var remoteItems = [];

    function template() {
      var prompt = prompts[promptIndex];
      if (!prompt) {
        return '<p class="rp-muted">No prompts are active for this tool yet.</p>';
      }
      return (
        '<p class="rp-prompt">' + escapeHtml(prompt.text) + '</p>' +
        '<form data-rp-form>' +
        '<textarea data-rp-body placeholder="Share your reflection…" minlength="8" maxlength="2000" required></textarea>' +
        '<div class="rp-row">' +
        '<input data-rp-name type="text" placeholder="Your name (optional)" maxlength="60" />' +
        '<button type="submit" data-rp-submit>Submit</button>' +
        '</div>' +
        '<p data-rp-error class="rp-error" style="display:none"></p>' +
        '<p data-rp-success class="rp-success" style="display:none">Thanks — your reflection is pending review.</p>' +
        '</form>' +
        '<div data-rp-ticker class="rp-ticker" style="display:none"><div class="rp-ticker-track" data-rp-track></div></div>'
      );
    }

    function render() {
      root.innerHTML = template();
      var form = root.querySelector('[data-rp-form]');
      if (!form) return;
      form.addEventListener('submit', onSubmit);
      refreshTicker();
    }

    function buildTickerItems() {
      var ids = {};
      var merged = [];
      for (var i = 0; i < localItems.length; i++) {
        ids[localItems[i].id] = true;
        merged.push(localItems[i]);
      }
      for (var j = 0; j < remoteItems.length; j++) {
        if (!ids[remoteItems[j].id]) merged.push(remoteItems[j]);
      }
      return merged.slice(0, 40);
    }

    function refreshTicker() {
      var items = buildTickerItems();
      var ticker = root.querySelector('[data-rp-ticker]');
      var track = root.querySelector('[data-rp-track]');
      if (!ticker || !track) return;
      if (items.length === 0) {
        ticker.style.display = 'none';
        return;
      }
      ticker.style.display = '';
      var html = '';
      var doubled = items.concat(items);
      for (var i = 0; i < doubled.length; i++) {
        var item = doubled[i];
        html +=
          '<span class="rp-ticker-item">“' + escapeHtml(item.body) + '”' +
          '<span class="rp-author">— ' + escapeHtml(item.authorName) + '</span></span>';
      }
      track.innerHTML = html;
    }

    async function fetchApproved() {
      try {
        var res = await fetch(origin + '/api/tools/' + encodeURIComponent(toolId) + '/reflections', { cache: 'no-store' });
        if (!res.ok) return;
        var data = await res.json();
        remoteItems = data.items || [];
        refreshTicker();
      } catch (e) {}
    }

    async function onSubmit(e) {
      e.preventDefault();
      var bodyEl = root.querySelector('[data-rp-body]');
      var nameEl = root.querySelector('[data-rp-name]');
      var errEl = root.querySelector('[data-rp-error]');
      var okEl = root.querySelector('[data-rp-success]');
      var btn = root.querySelector('[data-rp-submit]');
      var body = (bodyEl.value || '').trim();
      errEl.style.display = 'none';
      okEl.style.display = 'none';
      if (body.length < 8) {
        errEl.textContent = 'Please write at least 8 characters.';
        errEl.style.display = '';
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Submitting…';
      try {
        var res = await fetch(origin + '/api/tools/' + encodeURIComponent(toolId) + '/reflections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            promptId: prompts[promptIndex].id,
            body: body,
            authorName: (nameEl.value || '').trim() || undefined,
          }),
        });
        if (!res.ok) {
          errEl.textContent = 'Could not submit. Please try again.';
          errEl.style.display = '';
          return;
        }
        var data = await res.json();
        localItems.unshift({
          id: data.reflection.id,
          authorName: data.reflection.authorName,
          body: data.reflection.body,
          createdAt: data.reflection.createdAt,
        });
        bodyEl.value = '';
        nameEl.value = '';
        okEl.style.display = '';
        refreshTicker();
        setTimeout(function () { okEl.style.display = 'none'; }, 4000);
      } catch (err) {
        errEl.textContent = 'Network error. Please try again.';
        errEl.style.display = '';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Submit';
      }
    }

    render();
    fetchApproved();
    setInterval(fetchApproved, 15000);

    if (prompts.length > 1) {
      setInterval(function () {
        promptIndex = (promptIndex + 1) % prompts.length;
        var p = root.querySelector('.rp-prompt');
        if (p) p.textContent = prompts[promptIndex].text;
      }, 25000);
    }
  }

  function mountAll() {
    var hosts = document.querySelectorAll('[data-rp-tool]:not([data-rp-mounted])');
    for (var i = 0; i < hosts.length; i++) {
      loadAndRender(hosts[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountAll);
  } else {
    mountAll();
  }
})();
`;

export async function GET() {
  return new NextResponse(widgetSource, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
