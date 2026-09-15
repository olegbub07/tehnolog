const slides = [...document.querySelectorAll(".slide")];
const dots = document.getElementById("dots");
const progressBar = document.getElementById("progressBar");
const topbar = document.getElementById("topbar");
const preloader = document.getElementById("preloader");
const fsBtn = document.getElementById("fsBtn");
const shareBtn = document.getElementById("shareBtn");
const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");
const counter = document.getElementById("counter");
const toast = document.getElementById("toast");
const tip = document.getElementById("tip");
const drawer = document.getElementById("drawer");
const backdrop = document.getElementById("backdrop");
const quizCard = document.getElementById("quizCard");
const quizResult = document.getElementById("quizResult");

let current = 0;
let toastTimer = 0;

if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.documentElement.classList.add("reduce-motion");
}

if (dots) {
  slides.forEach((slide, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.title = slide.dataset.title || `Слайд ${i + 1}`;
    btn.addEventListener("click", () => go(i));
    dots.appendChild(btn);
  });
}

const dotButtons = [...dots.querySelectorAll("button")];

function isDarkSlide(index) {
  return ["hero", "quote", "day", "pay", "finale"].includes(slides[index]?.id);
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function overlayOpen() {
  return Boolean(
    (menu && !menu.hidden) ||
    (drawer && !drawer.hidden)
  );
}

function go(index) {
  current = Math.max(0, Math.min(slides.length - 1, index));
  slides[current].scrollIntoView({ behavior: "smooth", block: "start" });
  setActive(current, true);
}

function setActive(index, writeHash) {
  current = index;
  const dark = isDarkSlide(index);
  const ratio = slides.length > 1 ? index / (slides.length - 1) : 0;
  if (progressBar) progressBar.style.width = `${ratio * 100}%`;
  topbar.classList.toggle("is-blend", dark);
  if (counter) counter.textContent = `${pad(index + 1)} / ${pad(slides.length)}`;
  dotButtons.forEach((btn, i) => {
    btn.classList.toggle("is-active", i === index);
    btn.classList.toggle("is-light", dark);
  });
  document.querySelectorAll(".topbar__nav a, .menu__nav a").forEach((link) => {
    const id = link.getAttribute("href")?.slice(1);
    link.classList.toggle("is-current", id === slides[index].id);
  });
  if (writeHash) {
    try {
      history.replaceState(null, "", `#${slides[index].id}`);
    } catch (err) {}
  }
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
        const index = slides.indexOf(entry.target);
        if (index >= 0) setActive(index, true);
      }
    });
  },
  { threshold: 0.55 }
);

slides.forEach((slide) => observer.observe(slide));

function indexFromHash() {
  const id = location.hash.replace("#", "");
  if (!id) return 0;
  const index = slides.findIndex((slide) => slide.id === id);
  return index >= 0 ? index : 0;
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.().catch(() => showToast("Полный экран недоступен в этом браузере"));
  } else {
    document.exitFullscreen?.();
  }
}

function showToast(text) {
  if (!toast) return;
  toast.textContent = text;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

async function copyLink(url) {
  const value = url || location.href;
  try {
    await navigator.clipboard.writeText(value);
    showToast("Ссылка скопирована");
  } catch {
    showToast("Не получилось скопировать — скопируйте из адресной строки");
  }
}

function closeOverlays() {
  if (menu) menu.hidden = true;
  menuBtn?.setAttribute("aria-expanded", "false");
  if (drawer) drawer.hidden = true;
  if (backdrop) backdrop.hidden = true;
  if (tip) tip.hidden = true;
}

function openMenu() {
  const open = menu.hidden;
  closeOverlays();
  if (open) {
    menu.hidden = false;
    menuBtn.setAttribute("aria-expanded", "true");
  }
}

fsBtn?.addEventListener("click", toggleFullscreen);
shareBtn?.addEventListener("click", () => copyLink());
menuBtn?.addEventListener("click", openMenu);

document.querySelectorAll(".js-nav").forEach((link) => {
  link.addEventListener("click", (event) => {
    const id = link.getAttribute("href")?.slice(1);
    const index = slides.findIndex((slide) => slide.id === id);
    if (index < 0) return;
    event.preventDefault();
    closeOverlays();
    go(index);
  });
});

window.addEventListener("keydown", (event) => {
  const tag = event.target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || event.target.isContentEditable) return;

  if (event.key === "Escape") {
    closeOverlays();
    return;
  }

  if (overlayOpen()) return;

  if (event.key === "f" || event.key === "F") {
    event.preventDefault();
    toggleFullscreen();
    return;
  }

  const onQuiz = slides[current]?.id === "quiz" && !quizCard.hidden;
  if (onQuiz && (event.key === "1" || event.key === "2")) {
    event.preventDefault();
    answerQuiz(event.key === "1" ? 1 : 0);
    return;
  }

  if (onQuiz && (event.key === " " || event.key === "Enter")) return;

  const nextKeys = ["ArrowRight", "ArrowDown", "PageDown"];
  const prevKeys = ["ArrowLeft", "ArrowUp", "PageUp"];

  if (nextKeys.includes(event.key) || (event.key === " " && !onQuiz)) {
    event.preventDefault();
    go(current + 1);
  } else if (prevKeys.includes(event.key)) {
    event.preventDefault();
    go(current - 1);
  } else if (event.key === "Home") {
    event.preventDefault();
    go(0);
  } else if (event.key === "End") {
    event.preventDefault();
    go(slides.length - 1);
  }
});

let touchY = 0;
window.addEventListener("touchstart", (event) => {
  touchY = event.changedTouches[0].clientY;
}, { passive: true });

window.addEventListener("touchend", (event) => {
  if (overlayOpen()) return;
  if (!window.matchMedia("(min-width: 981px)").matches) return;
  const dy = event.changedTouches[0].clientY - touchY;
  if (Math.abs(dy) < 70) return;
  if (dy < 0) go(current + 1);
  else go(current - 1);
}, { passive: true });

function hideBoot() {
  preloader?.classList.add("is-gone");
  topbar?.classList.add("is-on");
}

document.addEventListener("DOMContentLoaded", hideBoot);
window.addEventListener("load", () => {
  hideBoot();
  const start = indexFromHash();
  if (start > 0) {
    slides[start].scrollIntoView({ behavior: "auto", block: "start" });
    setActive(start, true);
  }
});
setTimeout(hideBoot, 800);

const industries = {
  bread: {
    kicker: "Хлеб и мука",
    title: "Пекарни, хлебозаводы, макароны",
    text: "Технолог следит за закваской, временем расстойки, выпечкой и тем, чтобы батон сегодня был таким же, как вчера. Здесь много живого сырья: мука ведёт себя по-разному в зависимости от урожая.",
    items: ["Хлебозавод", "Пекарня", "Макаронное производство", "Мукомольный комбинат"]
  },
  dairy: {
    kicker: "Молоко",
    title: "Йогурт, сыр, масло, кефир",
    text: "Молоко живое: кислотность, жир, бактерии. Технолог запускает закваски, пастеризацию, ферментацию и решает, каким будет вкус и срок годности.",
    items: ["Молочный комбинат", "Сырзавод", "Производство мороженого", "Лаборатория качества"]
  },
  sweet: {
    kicker: "Сладости",
    title: "Шоколад, конфеты, печенье",
    text: "Темперирование шоколада, карамель, начинки. Градус здесь решает всё: чуть выше — шоколад поседеет, чуть ниже — не застынет. Красивая и точная работа.",
    items: ["Кондитерская фабрика", "Шоколадное производство", "Печенье и вафли"]
  },
  plant: {
    kicker: "Комбинаты",
    title: "Мясо, рыба, напитки, общепит",
    text: "Крупные линии, цеха, смены. Технолог может работать на мясокомбинате, пивзаводе, в консервах или в цехе, который готовит еду для сетей. Есть путь в лабораторию и в разработку новинок.",
    items: ["Мясокомбинат", "Напитки", "Консервы", "Общепит и R&D"]
  }
};

function openDrawer(id) {
  const data = industries[id];
  if (!data) return;
  document.getElementById("drawerKicker").textContent = data.kicker;
  document.getElementById("drawerTitle").textContent = data.title;
  document.getElementById("drawerText").textContent = data.text;
  const list = document.getElementById("drawerList");
  list.innerHTML = "";
  data.items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });
  drawer.hidden = false;
  backdrop.hidden = false;
}

document.querySelectorAll("[data-industry]").forEach((el) => {
  const open = () => openDrawer(el.dataset.industry);
  el.addEventListener("click", open);
  el.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  });
});

document.getElementById("drawerClose")?.addEventListener("click", closeOverlays);
backdrop?.addEventListener("click", closeOverlays);

document.querySelectorAll(".term").forEach((btn) => {
  btn.addEventListener("click", (event) => {
    event.stopPropagation();
    tip.textContent = btn.dataset.tip;
    tip.hidden = false;
    const rect = btn.getBoundingClientRect();
    tip.style.left = `${Math.min(rect.left, window.innerWidth - 280)}px`;
    tip.style.top = `${rect.bottom + 8}px`;
  });
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".term") && !event.target.closest("#tip")) {
    tip.hidden = true;
  }
});

const questions = [
  "Тебе интересно, из чего на самом деле сделаны продукты в магазине?",
  "Нравится химия или биология — не как зубрёжка, а как «как это работает»?",
  "Хочешь придумывать новые вкусы, а не только готовить по рецепту?",
  "Для тебя важно, когда всё точно: граммы, время, порядок?",
  "Нравится идея работы, результат которой можно попробовать?"
];

const quizQ = document.getElementById("quizQ");
const quizStep = document.getElementById("quizStep");
const quizBar = document.getElementById("quizBar");
const quizScore = document.getElementById("quizScore");
const quizTitle = document.getElementById("quizTitle");
const quizText = document.getElementById("quizText");

let qIndex = 0;
let score = 0;
let lastResult = "";

function renderQuestion() {
  quizQ.textContent = questions[qIndex];
  quizStep.textContent = `Вопрос ${qIndex + 1} из ${questions.length}`;
  quizBar.style.width = `${(qIndex / questions.length) * 100}%`;
}

function finishQuiz() {
  quizCard.hidden = true;
  quizResult.hidden = false;
  quizBar.style.width = "100%";
  quizScore.textContent = `${score} из ${questions.length}`;

  if (score >= 4) {
    quizTitle.textContent = "Похоже, это твоё.";
    quizText.textContent = "Тебе близки и точность, и вкус. Стоит сходить на день открытых дверей в колледж или на экскурсию на пищевое производство.";
  } else if (score >= 2) {
    quizTitle.textContent = "Есть пересечение.";
    quizText.textContent = "Профессия может зайти, если рядом интересны химия, биология или еда как процесс. Не обязательно решать сегодня — достаточно запомнить название.";
  } else {
    quizTitle.textContent = "Не твоё — и это нормально.";
    quizText.textContent = "Теперь ты хотя бы знаешь, кто стоит за хлебом и йогуртом. Иногда этого достаточно, чтобы выбрать другую дорогу осознанно.";
  }
  lastResult = `${quizTitle.textContent} (${score}/${questions.length})`;
}

function answerQuiz(value) {
  if (quizCard.hidden) return;
  score += Number(value);
  qIndex += 1;
  if (qIndex >= questions.length) finishQuiz();
  else renderQuestion();
}

document.querySelectorAll(".quiz-actions button").forEach((btn) => {
  btn.addEventListener("click", () => answerQuiz(btn.dataset.val));
});

document.getElementById("quizReset")?.addEventListener("click", () => {
  qIndex = 0;
  score = 0;
  quizResult.hidden = true;
  quizCard.hidden = false;
  renderQuestion();
});

document.getElementById("quizShare")?.addEventListener("click", () => {
  copyLink(`${location.origin}${location.pathname}#quiz — ${lastResult}`);
});

document.getElementById("copyLinkBtn")?.addEventListener("click", () => copyLink(location.href.split("#")[0]));

try {
  renderQuestion();
  setActive(indexFromHash(), false);
} catch (err) {}
