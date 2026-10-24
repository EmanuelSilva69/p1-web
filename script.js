'use strict';

/* =========================================================
   MemoFlash SVG — script.js
   JavaScript puro (ES6+): estado único + render explícito.
   Regra de segurança: todo dado passa ao DOM por .textContent.
   Nenhuma atribuição de strings de markup é permitida no código.
   ========================================================= */

/* ---------------- constantes ---------------- */

const SVG_NS = 'http://www.w3.org/2000/svg';
const STORAGE_KEY = 'memoflash-v1';

/* limites de layout do texto no SVG (viewBox 540x360) */
const MAX_LINE_CHARS = 38;
const TEXT_X = 56;
const TEXT_MAX_WIDTH = 418;
const TEXT_TOP = 118;
const TEXT_BOTTOM = 268;
const TEXT_CENTER_Y = (TEXT_TOP + TEXT_BOTTOM) / 2;
const FONT_START = 22;
const FONT_MIN = 14;

/* barra de progresso (medidor segmentado) */
const TRACK_X = 16;
const TRACK_WIDTH = 308;

/* cores das partículas: subconjunto vivo da paleta neo-brutalista */
const PARTICLE_TONES = ['#fde047', '#4ade80', '#fb7185', '#38bdf8'];

/* limites de segurança contra payloads maliciosos ou gigantes */
const MAX_TEXT_LENGTH = 600;
const MAX_CARDS = 200;
const MAX_STORAGE_CHARS = 262144; /* 256 KB, avaliado antes do JSON.parse */

/* caracteres sem uso legítimo: controles (exceto quebra de linha),
   zero-width e sobrescritas bidirecionais (spoofing) */
const STRIP_CHARS =
  // eslint-disable-next-line no-control-regex
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

/* permitido em svgEl: cada tag com seus atributos (defesa em profundidade —
   impede criar <script>, on*, href ou style a partir de dados dinâmicos) */
const SVG_ALLOWLIST = {
  tspan: { numeric: ['x', 'y', 'dy'], text: [] },
  circle: { numeric: ['cx', 'cy', 'r'], text: [] },
  g: { numeric: [], text: ['class'] }
};
const FORBIDDEN_ATTRS = ['on*', 'href', 'xlink:href', 'style'];
const SAFE_CLASS = /^[a-z0-9][a-z0-9 _-]*$/i;

const DEFAULT_CARDS = [
  {
    id: 'default-1',
    question: 'O que é HTML5 e qual é a sua função principal na web?',
    answer: 'HTML5 é a linguagem de marcação que estrutura o conteúdo das páginas, definindo significado como títulos, parágrafos, listas e links.',
    learned: false
  },
  {
    id: 'default-2',
    question: 'Qual é a diferença entre HTML, CSS e JavaScript?',
    answer: 'HTML organiza o conteúdo, CSS estiliza e posiciona os elementos e JavaScript adiciona comportamento e interatividade.',
    learned: false
  },
  {
    id: 'default-3',
    question: 'O que é um layout responsivo e quais técnicas o tornam possível?',
    answer: 'É um layout que se adapta a qualquer tela, usando media queries, unidades relativas, flexbox e grid.',
    learned: false
  },
  {
    id: 'default-4',
    question: 'Para que serve o localStorage no navegador?',
    answer: 'Guarda pares chave/valor no navegador, mantendo cartões e status de aprendizado mesmo depois de fechar a página.',
    learned: false
  }
];

const UI = {
  badgeFront: 'FRENTE (PERGUNTA)',
  badgeBack: 'VERSO (RESPOSTA)',
  mark: 'Marcar Aprendido',
  unmark: 'Desmarcar Aprendido',
  warnBoth: 'Preencha a pergunta e a resposta para adicionar um cartão.',
  warnQuestion: 'Escreva uma pergunta antes de adicionar o cartão.',
  warnAnswer: 'Escreva uma resposta antes de adicionar o cartão.',
  warnFull: `Baralho cheio: o limite é de ${MAX_CARDS} cartões. Exclua um cartão para poder adicionar outro.`,
  counter: (i, n) => `Cartão ${i} de ${n}`,
  counterEmpty: 'Nenhum cartão no baralho',
  progressCount: (learned, total) => `${learned} de ${total}`
};

/* ---------------- estado ---------------- */

let state = null;
let els = null;
let flipLocked = false;

/* ---------------- helpers de texto/segurança ---------------- */

/**
 * Remove o que não tem uso legítimo em texto de cartão: normaliza \r\n e \r
 * em \n, converte separadores de linha Unicode e apaga caracteres de controle
 * (exceto quebra de linha), zero-width e sobrescritas bidirecionais (spoofing).
 * Marcas HTML são mantidas: elas só chegam ao DOM via .textContent + CSP.
 */
function stripInvisible(value) {
  return String(value == null ? '' : value)
    .replace(/\r\n?/g, '\n')
    .replace(/[\u2028\u2029]/g, '\n')
    .replace(STRIP_CHARS, '');
}

/** Sanitização de entrada do formulário: sem lixo invisível, sem excesso de espaço, no máximo 600 caracteres. */
function sanitizeText(value) {
  return stripInvisible(value).trim().slice(0, MAX_TEXT_LENGTH);
}

/** Sanitização de carga do storage: sem trim, para não alterar textos já válidos. */
function sanitizeStored(value) {
  return stripInvisible(value).slice(0, MAX_TEXT_LENGTH);
}

/** true se o id do storage for seguro para reuso (nada de pontuação estranha). */
function isValidId(id) {
  return typeof id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(id);
}

/**
 * Cria um elemento SVG via createElementNS restrito a uma allowlist de tags e
 * atributos: recusa tags fora da lista, atributos de evento (on...), href,
 * xlink:href e style, e valores que não batem com o tipo esperado (número
 * finito ou classe segura). É a garantia estrutural de que nenhum caminho vira
 * <script>, handler ou URL.
 */
function svgEl(tag, attrs) {
  const spec = Object.prototype.hasOwnProperty.call(SVG_ALLOWLIST, tag)
    ? SVG_ALLOWLIST[tag]
    : null;
  if (spec === null) {
    throw new Error(`Elemento SVG não permitido: ${tag}`);
  }

  const node = document.createElementNS(SVG_NS, tag);
  if (attrs) {
    for (const key of Object.keys(attrs)) {
      const lower = key.toLowerCase();
      const forbidden = FORBIDDEN_ATTRS.some((f) =>
        f.endsWith('*') ? lower.startsWith(f.slice(0, -1)) : lower === f
      );
      if (forbidden) {
        throw new Error(`Atributo proibido em <${tag}>: ${key}`);
      }

      if (spec.numeric.includes(key)) {
        const num = Number(attrs[key]);
        if (!Number.isFinite(num)) {
          throw new Error(`Valor numérico inválido em <${tag}>: ${key}`);
        }
        node.setAttribute(key, String(num));
        continue;
      }

      if (spec.text.includes(key) && typeof attrs[key] === 'string' && SAFE_CLASS.test(attrs[key])) {
        node.setAttribute(key, attrs[key]);
        continue;
      }

      throw new Error(`Atributo não permitido em <${tag}>: ${key}`);
    }
  }
  return node;
}

/** Define um atributo numérico existente apenas se o valor for número finito. */
function setNumAttr(el, name, value) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`Valor numérico inválido em <${el.tagName}>: ${name}`);
  }
  el.setAttribute(name, String(num));
}

/** Único caminho de escrita de conteúdo textual: .textContent. */
function setText(el, str) {
  if (el) {
    el.textContent = String(str);
  }
}

/**
 * Quebra o texto em linhas de no máximo `max` caracteres (38 por padrão).
 * Honra quebras de linha explícitas e corta palavras maiores que o limite.
 */
function wrapText(str, max = MAX_LINE_CHARS) {
  const out = [];
  const paragraphs = String(str == null ? '' : str).split('\n');

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter((w) => w !== '');
    if (words.length === 0) {
      out.push('');
      continue;
    }

    let line = '';
    for (const word of words) {
      let rest = word;

      /* palavra maior que o limite: quebra forçada */
      while (rest.length > max) {
        if (line !== '') {
          out.push(line);
          line = '';
        }
        out.push(rest.slice(0, max));
        rest = rest.slice(max);
      }

      if (line === '') {
        line = rest;
      } else if (line.length + 1 + rest.length <= max) {
        line = `${line} ${rest}`;
      } else {
        out.push(line);
        line = rest;
      }
    }
    out.push(line);
  }

  return out;
}

let uidCounter = 0;
function uid() {
  uidCounter += 1;
  return `card-${Date.now().toString(36)}-${uidCounter}`;
}

/* ---------------- persistência (localStorage) ---------------- */

function isValidCard(card) {
  return Boolean(
    card &&
      typeof card === 'object' &&
      typeof card.question === 'string' &&
      card.question.trim() !== '' &&
      typeof card.answer === 'string' &&
      card.answer.trim() !== '' &&
      typeof card.learned === 'boolean'
  );
}

function defaultState() {
  return {
    cards: DEFAULT_CARDS.map((c) => ({ ...c })),
    currentIndex: 0,
    side: 'front'
  };
}

function persistState(snapshot) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        cards: snapshot.cards,
        currentIndex: snapshot.currentIndex,
        side: snapshot.side
      })
    );
  } catch (err) {
    /* armazenamento indisponível/cheio: o app segue em memória */
  }
}

function persist() {
  persistState(state);
}

function loadState() {
  let raw = null;

  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch (err) {
    return defaultState();
  }

  /* primeiro acesso: semeia os 4 cartões padrão e grava a chave */
  if (raw === null) {
    const seeded = defaultState();
    persistState(seeded);
    return seeded;
  }

  /* payload absurdo (storage adulterado): recusado antes do JSON.parse */
  if (raw.length > MAX_STORAGE_CHARS) {
    return defaultState();
  }

  try {
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.cards) || !data.cards.every(isValidCard)) {
      return defaultState();
    }

    const cards = data.cards
      .map((c) => ({
        id: isValidId(c.id) ? c.id : uid(),
        question: sanitizeStored(c.question),
        answer: sanitizeStored(c.answer),
        learned: c.learned
      }))
      /* baralho adulterado com cartões demais: fica com os primeiros */
      .slice(0, MAX_CARDS);

    /* cartão cujo texto era só lixo invisível/espaço -> payload inválido, volta ao padrão */
    if (!cards.every((c) => c.question.trim() !== '' && c.answer.trim() !== '')) {
      return defaultState();
    }

    const total = cards.length;
    let currentIndex = Number.isInteger(data.currentIndex) ? data.currentIndex : 0;
    if (total === 0) {
      currentIndex = -1;
    } else {
      currentIndex = Math.min(Math.max(currentIndex, 0), total - 1);
    }

    return { cards, currentIndex, side: data.side === 'back' ? 'back' : 'front' };
  } catch (err) {
    return defaultState();
  }
}

/* ---------------- operações do baralho ---------------- */

function addCard(question, answer) {
  state.cards.push({ id: uid(), question, answer, learned: false });
  state.currentIndex = state.cards.length - 1;
  state.side = 'front';
}

function deleteCard() {
  if (state.cards.length === 0) {
    return;
  }

  state.cards.splice(state.currentIndex, 1);

  if (state.cards.length === 0) {
    state.currentIndex = -1;
    state.side = 'front';
  } else if (state.currentIndex >= state.cards.length) {
    state.currentIndex = state.cards.length - 1;
  }
}

function shuffleDeck() {
  const cards = state.cards;
  if (cards.length < 2) {
    return;
  }

  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = cards[i];
    cards[i] = cards[j];
    cards[j] = tmp;
  }

  state.currentIndex = 0;
  state.side = 'front';
}

function restoreDefaults() {
  state.cards = DEFAULT_CARDS.map((c) => ({ ...c }));
  state.currentIndex = 0;
  state.side = 'front';
}

/* ---------------- sessão de estudo ---------------- */

function currentCard() {
  if (state.currentIndex < 0 || state.currentIndex >= state.cards.length) {
    return null;
  }
  return state.cards[state.currentIndex];
}

function goTo(delta) {
  const total = state.cards.length;
  if (total === 0) {
    return;
  }
  state.currentIndex = (state.currentIndex + delta + total) % total;
  state.side = 'front';
  persist();
  render();
  playEnter();
}

function flipCard() {
  if (state.cards.length === 0 || flipLocked) {
    return;
  }

  state.side = state.side === 'front' ? 'back' : 'front';
  render();

  flipLocked = true;
  const release = () => {
    flipLocked = false;
    els.scene.removeEventListener('transitionend', onTransitionEnd);
  };
  const onTransitionEnd = (event) => {
    if (event.target === els.scene) {
      release();
    }
  };
  els.scene.addEventListener('transitionend', onTransitionEnd);
  window.setTimeout(release, 700);
}

function toggleLearned() {
  const card = currentCard();
  if (!card) {
    return;
  }

  card.learned = !card.learned;
  const becameLearned = card.learned;

  persist();
  render();

  if (becameLearned) {
    burstParticles();
  }
}

function burstParticles() {
  const layer = els.particleLayer;
  setText(layer, '');

  const COUNT = 14;
  const group = svgEl('g', { class: 'particle-burst' });
  let finished = 0;

  const cleanup = () => {
    if (group.parentNode) {
      group.parentNode.removeChild(group);
    }
  };

  group.addEventListener('animationend', () => {
    finished += 1;
    if (finished >= COUNT) {
      cleanup();
    }
  });

  for (let i = 0; i < COUNT; i += 1) {
    const angle = (Math.PI * 2 * i) / COUNT + Math.random() * 0.35;
    const distance = 60 + Math.random() * 85;
    const circle = svgEl('circle', {
      cx: String(270 + (Math.random() * 16 - 8)),
      cy: String(180 + (Math.random() * 16 - 8)),
      r: (3 + Math.random() * 4).toFixed(1)
    });
    circle.style.setProperty('--tx', `${(Math.cos(angle) * distance).toFixed(1)}px`);
    circle.style.setProperty('--ty', `${(Math.sin(angle) * distance).toFixed(1)}px`);
    circle.style.setProperty('--delay', `${(Math.random() * 0.14).toFixed(2)}s`);
    circle.style.setProperty('--tone', PARTICLE_TONES[Math.floor(Math.random() * PARTICLE_TONES.length)]);
    group.appendChild(circle);
  }

  layer.appendChild(group);
  window.setTimeout(cleanup, 1200);
}

/* ---------------- render ---------------- */

function render() {
  renderCard();
  renderProgress();
  renderControls();
  renderCounter();
}

/**
 * Escreve um bloco de texto no SVG: limpa com .textContent, quebra em
 * linhas de até 38 caracteres e cria cada <tspan> com createElementNS.
 * Reduz a fonte até caber na largura e centraliza o bloco verticalmente.
 */
function renderTextBlock(textEl, rawText) {
  setText(textEl, '');
  if (rawText === '' || rawText == null) {
    return;
  }

  let lines = wrapText(rawText, MAX_LINE_CHARS);

  const tspans = lines.map(() => {
    const tspan = svgEl('tspan', { x: String(TEXT_X) });
    textEl.appendChild(tspan);
    return tspan;
  });

  const writeLines = (list) => {
    list.forEach((line, i) => {
      if (tspans[i]) {
        setText(tspans[i], line);
      }
    });
  };
  writeLines(lines);

  let fontSize = FONT_START;
  setNumAttr(textEl, 'font-size', fontSize);

  /* mede a LINHA mais longa (getComputedTextLength do <text> soma todas) */
  const widestLine = () =>
    tspans.reduce((max, ts) => Math.max(max, ts.getComputedTextLength()), 0);

  while (widestLine() > TEXT_MAX_WIDTH && fontSize > FONT_MIN) {
    fontSize -= 1;
    setNumAttr(textEl, 'font-size', fontSize);
  }

  const lineHeight = 30; // Exatamente a distância entre as linhas azuis do SVG (118, 148, 178...)
  const maxLines = 5;

  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    const last = lines[maxLines - 1];
    const room = MAX_LINE_CHARS - 1;
    lines[maxLines - 1] = `${last.length > room ? last.slice(0, room) : last}…`;
    writeLines(lines);

    while (textEl.childNodes.length > lines.length) {
      textEl.removeChild(textEl.lastChild);
    }
  }

  // Ancora a primeira linha na pauta azul (144px para textos de 3+ linhas, ou 174px para textos curtos)
  const startY = lines.length <= 2 ? 173 : 143;
  tspans.slice(0, lines.length).forEach((tspan, i) => {
    if (i === 0) {
      setNumAttr(tspan, 'y', startY);
      setNumAttr(tspan, 'dy', 0);
    } else {
      tspan.removeAttribute('y');
      setNumAttr(tspan, 'dy', lineHeight);
    }
  });
}

function renderCard() {
  const card = currentCard();
  const hasCard = Boolean(card);

  renderTextBlock(els.cardTextFront, hasCard ? card.question : '');
  renderTextBlock(els.cardTextBack, hasCard ? card.answer : '');

  setText(els.badgeFront, UI.badgeFront);
  setText(els.badgeBack, UI.badgeBack);

  els.emptyFront.classList.toggle('is-hidden', hasCard);
  els.emptyBack.classList.toggle('is-hidden', hasCard);

  /* carimbo DOMINADO visível só quando o cartão atual está aprendido */
  const showStamp = hasCard && card.learned;
  els.stampFront.classList.toggle('is-hidden', !showStamp);
  els.stampBack.classList.toggle('is-hidden', !showStamp);

  els.scene.classList.toggle('is-flipped', state.side === 'back');
}

function renderProgress() {
  const total = state.cards.length;
  const learned = state.cards.filter((c) => c.learned).length;
  const pct = total > 0 ? Math.round((learned / total) * 100) : 0;

  setNumAttr(els.progressFill, 'width', (pct / 100) * TRACK_WIDTH);
  setText(els.progressPct, `${pct}%`);
  setText(els.progressCount, UI.progressCount(learned, total));
  els.progressDone.classList.toggle('is-hidden', pct !== 100);
}

function renderControls() {
  const hasCards = state.cards.length > 0;

  [els.btnPrev, els.btnFlip, els.btnNext, els.btnLearned, els.btnDelete].forEach((btn) => {
    btn.disabled = !hasCards;
  });

  const card = currentCard();
  const learned = Boolean(card && card.learned);

  els.btnLearned.setAttribute('aria-pressed', String(learned));
  /* o rótulo vive em um <span>: setText no botão apagaria o ícone inline */
  setText(els.btnLearnedLabel, learned ? UI.unmark : UI.mark);
}

function renderCounter() {
  const total = state.cards.length;
  setText(
    els.counter,
    total > 0 ? UI.counter(state.currentIndex + 1, total) : UI.counterEmpty
  );
}

/* ---------------- animações ---------------- */

function playEnter() {
  els.stage.classList.remove('is-entering');
  /* reflow forçado para reiniciar a animação a cada cartão */
  void els.stage.offsetWidth;
  els.stage.classList.add('is-entering');
}

/* ---------------- formulário e validação ---------------- */

function clearWarning() {
  setText(els.formWarning, '');
  els.form.classList.remove('shake');
}

function showWarning(message, fieldToFocus) {
  setText(els.formWarning, message);
  els.form.classList.remove('shake');
  /* reflow forçado para reiniciar a animação de shake */
  void els.form.offsetWidth;
  els.form.classList.add('shake');
  if (fieldToFocus) {
    fieldToFocus.focus();
  }
}

function onSubmit(event) {
  event.preventDefault();

  /* entrada sempre sanitizada: sem caracteres invisíveis, no máximo 600 chars */
  const question = sanitizeText(els.inputQuestion.value);
  const answer = sanitizeText(els.inputAnswer.value);

  if (question === '' || answer === '') {
    const message =
      question === '' && answer === ''
        ? UI.warnBoth
        : question === ''
          ? UI.warnQuestion
          : UI.warnAnswer;
    const target = question === '' ? els.inputQuestion : els.inputAnswer;
    showWarning(message, target);
    return;
  }

  /* baralho no limite: avisa sem mutar (nada de payload gigante via formulário) */
  if (state.cards.length >= MAX_CARDS) {
    showWarning(UI.warnFull, null);
    return;
  }

  clearWarning();
  addCard(question, answer);
  els.inputQuestion.value = '';
  els.inputAnswer.value = '';
  persist();
  render();
  playEnter();
}

/* ---------------- teclado ---------------- */

function isEditable(node) {
  if (!node || typeof node.closest !== 'function') {
    return false;
  }
  return Boolean(node.closest('input, textarea, select, [contenteditable]'));
}

function onKeyDown(event) {
  if (isEditable(event.target)) {
    return;
  }

  const key = event.key;

  if (key === ' ' || key === 'Spacebar') {
    /* deixa o botão nativo receber o Espaço (ativação nativa) */
    if (event.target && event.target.closest && event.target.closest('button')) {
      return;
    }
    event.preventDefault();
    flipCard();
    return;
  }

  if (key === 'Enter') {
    return;
  }

  if (key === 'ArrowLeft') {
    event.preventDefault();
    goTo(-1);
  } else if (key === 'ArrowRight') {
    event.preventDefault();
    goTo(1);
  }
}

/* ---------------- infraestrutura ---------------- */

function collectEls() {
  const byId = (id) => document.getElementById(id);
  return {
    stage: byId('cardStage'),
    scene: byId('cardScene'),
    cardTextFront: byId('cardTextFront'),
    cardTextBack: byId('cardTextBack'),
    badgeFront: byId('badgeFront'),
    badgeBack: byId('badgeBack'),
    emptyFront: byId('emptyFront'),
    emptyBack: byId('emptyBack'),
    stampFront: byId('stampFront'),
    stampBack: byId('stampBack'),
    particleLayer: byId('particleLayer'),
    counter: byId('cardCounter'),
    btnPrev: byId('btnPrev'),
    btnFlip: byId('btnFlip'),
    btnNext: byId('btnNext'),
    btnLearned: byId('btnLearned'),
    btnLearnedLabel: byId('btnLearnedLabel'),
    btnShuffle: byId('btnShuffle'),
    btnDelete: byId('btnDelete'),
    btnRestore: byId('btnRestore'),
    form: byId('cardForm'),
    btnAdd: byId('btnAdd'),
    inputQuestion: byId('inputPergunta'),
    inputAnswer: byId('inputResposta'),
    formWarning: byId('formWarning'),
    progressFill: byId('progressFill'),
    progressPct: byId('progressPct'),
    progressCount: byId('progressCount'),
    progressDone: byId('progressDone')
  };
}

function wireEvents() {
  els.form.addEventListener('submit', onSubmit);
  els.inputQuestion.addEventListener('input', clearWarning);
  els.inputAnswer.addEventListener('input', clearWarning);

  els.btnPrev.addEventListener('click', () => goTo(-1));
  els.btnNext.addEventListener('click', () => goTo(1));
  els.btnFlip.addEventListener('click', flipCard);
  els.btnLearned.addEventListener('click', toggleLearned);
  els.btnShuffle.addEventListener('click', () => {
    shuffleDeck();
    persist();
    render();
    playEnter();
  });
  els.btnDelete.addEventListener('click', () => {
    deleteCard();
    persist();
    render();
    playEnter();
  });
  els.btnRestore.addEventListener('click', () => {
    restoreDefaults();
    persist();
    render();
    playEnter();
  });

  els.stage.addEventListener('click', flipCard);

  els.stage.addEventListener('animationend', () => {
    els.stage.classList.remove('is-entering');
  });

  document.addEventListener('keydown', onKeyDown);
}

function init() {
  els = collectEls();
  state = loadState();
  wireEvents();
  render();
  playEnter();
}

init();
