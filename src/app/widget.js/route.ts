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
    if (config.type !== "REFLECTION" && config.type !== "QUIZ") {
      host.innerHTML = '<div style="color:#dc2626;font-family:sans-serif">Reflection Pool: unsupported tool type.</div>';
      return;
    }

    var cssRes = await fetch(origin + "/api/tools/" + encodeURIComponent(toolId) + "/css");
    var css = cssRes.ok ? await cssRes.text() : "";

    var root = makeRoot(host, css);
    if (config.type === "QUIZ") {
      renderQuiz(root, toolId, config);
    } else {
      renderReflection(root, toolId, config);
    }
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

  function renderQuiz(root, toolId, config) {
    var quiz = config.quiz || {};
    var sourceQuestions = (quiz.questions || []).filter(function (q) {
      return q && Array.isArray(q.options) && q.options.length >= 2
        && typeof q.correctIndex === 'number'
        && q.correctIndex >= 0 && q.correctIndex < q.options.length;
    });
    var shouldShuffle = quiz.shuffle !== false;
    var questionCount = quiz.questionCount;

    function buildDeck() {
      var deck = sourceQuestions.slice();
      if (shouldShuffle) {
        for (var i = deck.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var tmp = deck[i]; deck[i] = deck[j]; deck[j] = tmp;
        }
      }
      if (questionCount && questionCount > 0) deck = deck.slice(0, questionCount);
      return deck;
    }

    var deck = buildDeck();
    var index = 0;
    var selected = null;
    var correctCount = 0;
    var finished = false;

    function renderEmpty() {
      root.innerHTML = '<p class="rp-muted">No questions are active for this tool yet.</p>';
    }

    function renderQuestion() {
      var q = deck[index];
      var html =
        '<p class="rp-quiz-progress">Question ' + (index + 1) + ' of ' + deck.length + '</p>' +
        '<p class="rp-quiz-question">' + escapeHtml(q.text) + '</p>' +
        '<div class="rp-quiz-options" role="list">';
      for (var i = 0; i < q.options.length; i++) {
        html += '<button type="button" role="listitem" class="rp-quiz-option" data-rp-option="' + i + '">' +
          escapeHtml(q.options[i]) + '</button>';
      }
      html += '</div><div data-rp-feedback></div>';
      root.innerHTML = html;
      var opts = root.querySelectorAll('[data-rp-option]');
      for (var k = 0; k < opts.length; k++) {
        opts[k].addEventListener('click', onPick);
      }
    }

    function renderScore() {
      var pct = Math.round((correctCount / deck.length) * 100);
      root.innerHTML =
        '<p class="rp-quiz-score">You scored <strong>' + correctCount + ' / ' + deck.length +
        '</strong> (' + pct + '%)</p>' +
        '<button type="button" class="rp-quiz-restart" data-rp-restart>Try again</button>';
      var btn = root.querySelector('[data-rp-restart]');
      if (btn) btn.addEventListener('click', onRestart);
    }

    function onPick(e) {
      if (selected !== null) return;
      var i = parseInt(e.currentTarget.getAttribute('data-rp-option'), 10);
      selected = i;
      var q = deck[index];
      if (i === q.correctIndex) correctCount++;
      var opts = root.querySelectorAll('[data-rp-option]');
      for (var k = 0; k < opts.length; k++) {
        var idx = parseInt(opts[k].getAttribute('data-rp-option'), 10);
        opts[k].disabled = true;
        if (idx === q.correctIndex) opts[k].className = 'rp-quiz-option correct';
        else if (idx === selected) opts[k].className = 'rp-quiz-option incorrect';
        else opts[k].className = 'rp-quiz-option dim';
      }
      var feedback = root.querySelector('[data-rp-feedback]');
      if (feedback) {
        var fb = '<div class="rp-quiz-feedback">';
        if (selected === q.correctIndex) {
          fb += '<p class="rp-success">Correct.</p>';
        } else {
          fb += '<p class="rp-error">Not quite — the answer is &ldquo;' +
            escapeHtml(q.options[q.correctIndex]) + '&rdquo;.</p>';
        }
        if (q.explanation) {
          fb += '<p class="rp-quiz-explanation">' + escapeHtml(q.explanation) + '</p>';
        }
        var nextLabel = (index + 1 >= deck.length) ? 'See score' : 'Next question';
        fb += '<button type="button" class="rp-quiz-next" data-rp-next>' + nextLabel + '</button></div>';
        feedback.outerHTML = fb;
      }
      var nextBtn = root.querySelector('[data-rp-next]');
      if (nextBtn) nextBtn.addEventListener('click', onNext);
    }

    function onNext() {
      if (index + 1 >= deck.length) {
        finished = true;
        renderScore();
        return;
      }
      index++;
      selected = null;
      renderQuestion();
    }

    function onRestart() {
      deck = buildDeck();
      index = 0;
      selected = null;
      correctCount = 0;
      finished = false;
      renderQuestion();
    }

    if (deck.length === 0) renderEmpty();
    else renderQuestion();
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
