// ============================================================
// OGE Physics questions — 47 questions across 5 sections
// Phase 13: Physics questions data file
// Course: oge_physics | Subject: physics | Exam: oge
// ============================================================

export const physicsQuestions: unknown[] = [
  // =========================================================
  // РАЗДЕЛ 1: МЕХАНИЧЕСКИЕ ЯВЛЕНИЯ (16 вопросов)
  // =========================================================

  // --- formula_gap ---

  // 1. Скорость равномерного движения
  {
    id: "phys-mech-f1",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "formula_gap",
    topic: "Механические явления",
    subtopic: "Скорость, путь, время",
    difficulty: "easy",
    prompt: "Заполни пропуск в формуле скорости равномерного движения:",
    formulaTemplate: {
      parts: [
        { kind: "text", value: "v = " },
        { kind: "slot", slotId: "s1", placeholder: "?" },
      ],
    },
    options: [
      { id: "a", text: "s/t" },
      { id: "b", text: "s·t" },
      { id: "c", text: "t/s" },
      { id: "d", text: "s+t" },
    ],
    correctAnswer: { type: "slots", value: { s1: "a" } },
    explanation: {
      short: "v = s/t — скорость равна пути, делённому на время.",
      rule: "Формула скорости: v = s/t",
    },
    tags: ["formula"],
  },

  // 2. Давление твёрдого тела
  {
    id: "phys-mech-f2",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "formula_gap",
    topic: "Механические явления",
    subtopic: "Давление",
    difficulty: "easy",
    prompt: "Заполни пропуск в формуле давления твёрдого тела:",
    formulaTemplate: {
      parts: [
        { kind: "text", value: "p = " },
        { kind: "slot", slotId: "s1", placeholder: "?" },
      ],
    },
    options: [
      { id: "a", text: "F/S" },
      { id: "b", text: "S/F" },
      { id: "c", text: "F·S" },
      { id: "d", text: "m·g" },
    ],
    correctAnswer: { type: "slots", value: { s1: "a" } },
    explanation: {
      short: "p = F/S — давление равно силе, делённой на площадь.",
      rule: "Давление: p = F/S, где F — сила (Н), S — площадь (м²).",
    },
    tags: ["formula"],
  },

  // 3. Сила тяжести
  {
    id: "phys-mech-f3",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "formula_gap",
    topic: "Механические явления",
    subtopic: "Сила тяжести, вес",
    difficulty: "easy",
    prompt: "Заполни пропуск в формуле силы тяжести:",
    formulaTemplate: {
      parts: [
        { kind: "text", value: "F = " },
        { kind: "slot", slotId: "s1", placeholder: "?" },
      ],
    },
    options: [
      { id: "a", text: "mg" },
      { id: "b", text: "m/g" },
      { id: "c", text: "m+g" },
      { id: "d", text: "m·v" },
    ],
    correctAnswer: { type: "slots", value: { s1: "a" } },
    explanation: {
      short: "F = mg — сила тяжести равна массе, умноженной на ускорение свободного падения.",
      rule: "Сила тяжести: F = mg, где m — масса (кг), g ≈ 9,8 Н/кг.",
    },
    tags: ["formula"],
  },

  // 4. Плотность
  {
    id: "phys-mech-f4",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "formula_gap",
    topic: "Механические явления",
    subtopic: "Плотность",
    difficulty: "easy",
    prompt: "Заполни пропуск в формуле плотности вещества:",
    formulaTemplate: {
      parts: [
        { kind: "text", value: "ρ = " },
        { kind: "slot", slotId: "s1", placeholder: "?" },
      ],
    },
    options: [
      { id: "a", text: "m/V" },
      { id: "b", text: "V/m" },
      { id: "c", text: "m·V" },
      { id: "d", text: "m·g" },
    ],
    correctAnswer: { type: "slots", value: { s1: "a" } },
    explanation: {
      short: "ρ = m/V — плотность равна массе, делённой на объём.",
      rule: "Плотность: ρ = m/V, где m — масса (кг), V — объём (м³).",
    },
    tags: ["formula"],
  },

  // 5. Работа
  {
    id: "phys-mech-f5",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "formula_gap",
    topic: "Механические явления",
    subtopic: "Работа и мощность",
    difficulty: "easy",
    prompt: "Заполни пропуск в формуле механической работы:",
    formulaTemplate: {
      parts: [
        { kind: "text", value: "A = " },
        { kind: "slot", slotId: "s1", placeholder: "?" },
      ],
    },
    options: [
      { id: "a", text: "F·s" },
      { id: "b", text: "F/s" },
      { id: "c", text: "F·t" },
      { id: "d", text: "m·g·h" },
    ],
    correctAnswer: { type: "slots", value: { s1: "a" } },
    explanation: {
      short: "A = F·s — работа равна силе, умноженной на путь.",
      rule: "Механическая работа: A = F·s, где F — сила (Н), s — путь (м). Работа совершается только когда сила и перемещение направлены вдоль одной прямой.",
    },
    tags: ["formula"],
  },

  // --- numeric_input ---

  // 6. Расчёт скорости
  {
    id: "phys-mech-n1",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "numeric_input",
    topic: "Механические явления",
    subtopic: "Скорость, путь, время",
    difficulty: "easy",
    prompt: "Автомобиль проехал 60 км за 2 часа. Найдите среднюю скорость автомобиля в км/ч.",
    numericConfig: { kind: "mental_formula_problem", expectedUnit: "км/ч" },
    correctAnswer: { type: "numeric", value: 30, unit: "км/ч" },
    explanation: {
      short: "v = s/t = 60/2 = 30 км/ч",
      rule: "v = s/t",
    },
    tags: ["mental"],
  },

  // 7. Расчёт давления
  {
    id: "phys-mech-n2",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "numeric_input",
    topic: "Механические явления",
    subtopic: "Давление",
    difficulty: "medium",
    prompt: "Сила, действующая на поверхность, равна 400 Н, а площадь поверхности — 2 м². Найдите давление в Па.",
    numericConfig: { kind: "mental_formula_problem", expectedUnit: "Па" },
    correctAnswer: { type: "numeric", value: 200, unit: "Па" },
    explanation: {
      short: "p = F/S = 400/2 = 200 Па",
      rule: "p = F/S",
    },
    tags: ["mental"],
  },

  // 8. Расчёт силы тяжести
  {
    id: "phys-mech-n3",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "numeric_input",
    topic: "Механические явления",
    subtopic: "Сила тяжести, вес",
    difficulty: "easy",
    prompt: "Масса тела равна 5 кг. Найдите силу тяжести, действующую на тело. Ускорение свободного падения примите равным 10 Н/кг. Ответ дайте в ньютонах.",
    numericConfig: { kind: "mental_formula_problem", expectedUnit: "Н" },
    correctAnswer: { type: "numeric", value: 50, unit: "Н" },
    explanation: {
      short: "F = mg = 5 × 10 = 50 Н",
      rule: "F = mg",
    },
    tags: ["mental"],
  },

  // 9. Расчёт работы
  {
    id: "phys-mech-n4",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "numeric_input",
    topic: "Механические явления",
    subtopic: "Работа и мощность",
    difficulty: "easy",
    prompt: "Под действием силы 50 Н тело переместилось на 4 м в направлении действия силы. Вычислите работу в джоулях.",
    numericConfig: { kind: "mental_formula_problem", expectedUnit: "Дж" },
    correctAnswer: { type: "numeric", value: 200, unit: "Дж" },
    explanation: {
      short: "A = F·s = 50 × 4 = 200 Дж",
      rule: "A = F·s",
    },
    tags: ["mental"],
  },

  // 10. Расчёт мощности
  {
    id: "phys-mech-n5",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "numeric_input",
    topic: "Механические явления",
    subtopic: "Работа и мощность",
    difficulty: "medium",
    prompt: "Механическая работа равна 600 Дж и совершена за 30 с. Найдите мощность в ваттах.",
    numericConfig: { kind: "mental_formula_problem", expectedUnit: "Вт" },
    correctAnswer: { type: "numeric", value: 20, unit: "Вт" },
    explanation: {
      short: "N = A/t = 600/30 = 20 Вт",
      rule: "Мощность: N = A/t, где A — работа (Дж), t — время (с).",
    },
    tags: ["mental"],
  },

  // 11. Расчёт архимедовой силы
  {
    id: "phys-mech-n6",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "numeric_input",
    topic: "Механические явления",
    subtopic: "Архимедова сила",
    difficulty: "medium",
    prompt: "Тело объёмом 0,002 м³ полностью погружено в воду (ρ = 1000 кг/м³). Найдите архимедову силу, действующую на тело. g = 10 Н/кг. Ответ дайте в ньютонах.",
    numericConfig: { kind: "mental_formula_problem", expectedUnit: "Н" },
    correctAnswer: { type: "numeric", value: 20, unit: "Н" },
    explanation: {
      short: "Fₐ = ρgV = 1000 × 10 × 0,002 = 20 Н",
      rule: "Архимедова сила: Fₐ = ρж·g·V, где ρж — плотность жидкости, V — объём погружённой части.",
    },
    tags: ["mental"],
  },

  // --- flashcard_self_check ---

  // 12. Кинетическая энергия
  {
    id: "phys-mech-fc1",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "flashcard_self_check",
    topic: "Механические явления",
    subtopic: "Энергия",
    difficulty: "easy",
    prompt: "Вспомни формулу кинетической энергии тела. Знаешь ли ты её?",
    correctAnswer: { type: "self_check", value: "known" },
    explanation: {
      short: "Кинетическая энергия: Eк = mv²/2",
      answer: "Eк = mv²/2",
      rule: "Кинетическая энергия: Eк = mv²/2, где m — масса (кг), v — скорость (м/с).",
    },
    tags: ["formula"],
  },

  // 13. Потенциальная энергия
  {
    id: "phys-mech-fc2",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "flashcard_self_check",
    topic: "Механические явления",
    subtopic: "Энергия",
    difficulty: "easy",
    prompt: "Вспомни формулу потенциальной энергии тела, поднятого над землёй.",
    correctAnswer: { type: "self_check", value: "known" },
    explanation: {
      short: "Потенциальная энергия: Eп = mgh",
      answer: "Eп = mgh",
      rule: "Потенциальная энергия: Eп = mgh, где m — масса (кг), g ≈ 9,8 Н/кг, h — высота (м).",
    },
    tags: ["formula"],
  },

  // --- single_choice (formula) ---

  // 14. Формула мощности
  {
    id: "phys-mech-sc1",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "single_choice",
    topic: "Механические явления",
    subtopic: "Работа и мощность",
    difficulty: "medium",
    presentation: "formula",
    prompt: "Какая формула выражает механическую мощность?",
    options: [
      { id: "a", text: "N = A/t" },
      { id: "b", text: "N = A·t" },
      { id: "c", text: "N = F·s" },
      { id: "d", text: "N = F/t" },
    ],
    correctAnswer: { type: "single", value: "a" },
    explanation: {
      short: "N = A/t — мощность равна работе, делённой на время.",
      rule: "Мощность: N = A/t, где A — работа (Дж), t — время (с). 1 Вт = 1 Дж/с.",
    },
    tags: ["formula"],
  },

  // --- single_choice (regular) ---

  // 15. Инерция — концептуальный вопрос
  {
    id: "phys-mech-sc2",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "single_choice",
    topic: "Механические явления",
    subtopic: "Инерция",
    difficulty: "easy",
    prompt: "Мяч спокойно лежал на столе. Когда стол резко толкнули вперёд, мяч покатился назад (относительно стола). Какое явление объясняет это движение мяча?",
    options: [
      { id: "a", text: "Инерция" },
      { id: "b", text: "Трение покоя" },
      { id: "c", text: "Сила тяжести" },
      { id: "d", text: "Архимедова сила" },
    ],
    correctAnswer: { type: "single", value: "a" },
    explanation: {
      short: "Мяч продолжает покоиться относительно земли из-за инерции, а стол уходит вперёд.",
      rule: "Инерция — свойство тел сохранять свою скорость неизменной при отсутствии действия на них других тел.",
    },
  },

  // --- multi_choice ---

  // 16. Какие формулы относятся к механике
  {
    id: "phys-mech-mc1",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "multi_choice",
    topic: "Механические явления",
    subtopic: "Формулы",
    difficulty: "medium",
    prompt: "Какие из приведённых формул относятся к механическим явлениям?",
    options: [
      { id: "1", text: "v = s/t" },
      { id: "2", text: "I = U/R" },
      { id: "3", text: "p = F/S" },
      { id: "4", text: "Q = cmΔt" },
      { id: "5", text: "A = Fs" },
    ],
    correctAnswer: { type: "multiple", value: ["1", "3", "5"] },
    explanation: {
      short: "Формулы механики: v = s/t, p = F/S, A = Fs. I = U/R — электричество, Q = cmΔt — теплота.",
      rule: "К механике относятся формулы движения, силы, давления, работы, энергии. К электричеству — закон Ома, к теплоте — формулы теплопередачи.",
    },
    tags: ["formula"],
  },

  // =========================================================
  // РАЗДЕЛ 2: ТЕПЛОВЫЕ ЯВЛЕНИЯ (8 вопросов)
  // =========================================================

  // --- formula_gap ---

  // 17. Количество теплоты при нагревании
  {
    id: "phys-heat-f1",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "formula_gap",
    topic: "Тепловые явления",
    subtopic: "Нагревание и охлаждение",
    difficulty: "easy",
    prompt: "Заполни пропуск в формуле количества теплоты при нагревании тела:",
    formulaTemplate: {
      parts: [
        { kind: "text", value: "Q = " },
        { kind: "slot", slotId: "s1", placeholder: "?" },
        { kind: "text", value: "·Δt" },
      ],
    },
    options: [
      { id: "a", text: "cm" },
      { id: "b", text: "c/m" },
      { id: "c", text: "c+m" },
      { id: "d", text: "m/c" },
    ],
    correctAnswer: { type: "slots", value: { s1: "a" } },
    explanation: {
      short: "Q = cmΔt — количество теплоты при нагревании.",
      rule: "Q = cmΔt, где c — удельная теплоёмкость (Дж/(кг·°С)), m — масса (кг), Δt — изменение температуры (°С).",
    },
    tags: ["formula"],
  },

  // 18. Количество теплоты при плавлении
  {
    id: "phys-heat-f2",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "formula_gap",
    topic: "Тепловые явления",
    subtopic: "Плавление и кристаллизация",
    difficulty: "easy",
    prompt: "Заполни пропуск в формуле количества теплоты при плавлении:",
    formulaTemplate: {
      parts: [
        { kind: "text", value: "Q = " },
        { kind: "slot", slotId: "s1", placeholder: "?" },
      ],
    },
    options: [
      { id: "a", text: "λm" },
      { id: "b", text: "λ/m" },
      { id: "c", text: "cmΔt" },
      { id: "d", text: "qm" },
    ],
    correctAnswer: { type: "slots", value: { s1: "a" } },
    explanation: {
      short: "Q = λm — количество теплоты при плавлении.",
      rule: "Q = λm, где λ — удельная теплота плавления (Дж/кг), m — масса (кг). При кристаллизации Q = −λm.",
    },
    tags: ["formula"],
  },

  // 19. Количество теплоты при сгорании топлива
  {
    id: "phys-heat-f3",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "formula_gap",
    topic: "Тепловые явления",
    subtopic: "Сгорание топлива",
    difficulty: "easy",
    prompt: "Заполни пропуск в формуле количества теплоты при сгорании топлива:",
    formulaTemplate: {
      parts: [
        { kind: "text", value: "Q = " },
        { kind: "slot", slotId: "s1", placeholder: "?" },
      ],
    },
    options: [
      { id: "a", text: "qm" },
      { id: "b", text: "q/m" },
      { id: "c", text: "cmΔt" },
      { id: "d", text: "λm" },
    ],
    correctAnswer: { type: "slots", value: { s1: "a" } },
    explanation: {
      short: "Q = qm — количество теплоты при сгорании топлива.",
      rule: "Q = qm, где q — удельная теплота сгорания (Дж/кг), m — масса топлива (кг).",
    },
    tags: ["formula"],
  },

  // --- numeric_input ---

  // 20. Расчёт количества теплоты при нагревании
  {
    id: "phys-heat-n1",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "numeric_input",
    topic: "Тепловые явления",
    subtopic: "Нагревание и охлаждение",
    difficulty: "medium",
    prompt: "Какое количество теплоты необходимо для нагревания 2 кг воды от 20 °С до 70 °С? Удельная теплоёмкость воды 4200 Дж/(кг·°С). Ответ дайте в кДж.",
    numericConfig: { kind: "mental_formula_problem", expectedUnit: "кДж" },
    correctAnswer: { type: "numeric", value: 420, unit: "кДж", tolerance: 0.01 },
    explanation: {
      short: "Q = cmΔt = 4200 × 2 × 50 = 420 000 Дж = 420 кДж",
      rule: "Q = cmΔt, где Δt = t₂ − t₁ = 70 − 20 = 50 °С.",
    },
    tags: ["mental"],
  },

  // 21. Расчёт количества теплоты при плавлении
  {
    id: "phys-heat-n2",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "numeric_input",
    topic: "Тепловые явления",
    subtopic: "Плавление и кристаллизация",
    difficulty: "medium",
    prompt: "Какое количество теплоты необходимо для плавления 0,5 кг льда при температуре плавления? Удельная теплота плавления льда 330 000 Дж/кг. Ответ дайте в кДж.",
    numericConfig: { kind: "mental_formula_problem", expectedUnit: "кДж" },
    correctAnswer: { type: "numeric", value: 165, unit: "кДж", tolerance: 0.01 },
    explanation: {
      short: "Q = λm = 330 000 × 0,5 = 165 000 Дж = 165 кДж",
      rule: "Q = λm. При плавлении температура не меняется — всё тепло идёт на разрушение кристаллической решётки.",
    },
    tags: ["mental"],
  },

  // 22. КПД теплового двигателя
  {
    id: "phys-heat-n3",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "numeric_input",
    topic: "Тепловые явления",
    subtopic: "КПД теплового двигателя",
    difficulty: "hard",
    prompt: "Тепловой двигатель получает от нагревателя 1000 Дж энергии и отдаёт холодильнику 600 Дж. Найдите КПД двигателя в процентах.",
    numericConfig: { kind: "mental_formula_problem", expectedUnit: "%" },
    correctAnswer: { type: "numeric", value: 40, unit: "%" },
    explanation: {
      short: "η = (Q₁ − Q₂)/Q₁ × 100% = (1000 − 600)/1000 × 100% = 40%",
      rule: "КПД: η = A/Q₁ = (Q₁ − Q₂)/Q₁, где Q₁ — полученная теплота, Q₂ — отданная холодильнику.",
    },
    tags: ["mental"],
  },

  // --- flashcard_self_check ---

  // 23. Формула количества теплоты при парообразовании
  {
    id: "phys-heat-fc1",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "flashcard_self_check",
    topic: "Тепловые явления",
    subtopic: "Парообразование и конденсация",
    difficulty: "easy",
    prompt: "Вспомни формулу количества теплоты при парообразовании (кипении).",
    correctAnswer: { type: "self_check", value: "known" },
    explanation: {
      short: "Количество теплоты при парообразовании: Q = Lm",
      answer: "Q = Lm",
      rule: "Q = Lm, где L — удельная теплота парообразования (Дж/кг), m — масса (кг). При конденсации Q = −Lm.",
    },
    tags: ["formula"],
  },

  // --- single_choice ---

  // 24. Конвекция
  {
    id: "phys-heat-sc1",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "single_choice",
    topic: "Тепловые явления",
    subtopic: "Теплопередача",
    difficulty: "easy",
    prompt: "Каким способом осуществляется передача энергии от батареи отопления к воздуху в комнате?",
    options: [
      { id: "a", text: "В основном конвекцией" },
      { id: "b", text: "В основном излучением" },
      { id: "c", text: "В основном теплопроводностью" },
      { id: "d", text: "Конвекцией и теплопроводностью в равной степени" },
    ],
    correctAnswer: { type: "single", value: "a" },
    explanation: {
      short: "Нагретый батареей воздух поднимается вверх — это конвекция.",
      rule: "Конвекция — перенос энергии струями жидкости или газа. Теплопроводность — в твёрдых телах. Излучение — без непосредственного контакта (через вакуум).",
    },
  },

  // =========================================================
  // РАЗДЕЛ 3: ЭЛЕКТРОМАГНИТНЫЕ ЯВЛЕНИЯ (11 вопросов)
  // =========================================================

  // --- formula_gap ---

  // 25. Закон Ома
  {
    id: "phys-elec-f1",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "formula_gap",
    topic: "Электромагнитные явления",
    subtopic: "Закон Ома",
    difficulty: "easy",
    prompt: "Заполни пропуск в формуле закона Ома для участка цепи:",
    formulaTemplate: {
      parts: [
        { kind: "text", value: "I = " },
        { kind: "slot", slotId: "s1", placeholder: "?" },
      ],
    },
    options: [
      { id: "a", text: "U/R" },
      { id: "b", text: "R/U" },
      { id: "c", text: "U·R" },
      { id: "d", text: "U+R" },
    ],
    correctAnswer: { type: "slots", value: { s1: "a" } },
    explanation: {
      short: "I = U/R — сила тока равна напряжению, делённому на сопротивление.",
      rule: "Закон Ома: I = U/R, где I — сила тока (А), U — напряжение (В), R — сопротивление (Ом).",
    },
    tags: ["formula"],
  },

  // 26. Работа электрического тока
  {
    id: "phys-elec-f2",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "formula_gap",
    topic: "Электромагнитные явления",
    subtopic: "Работа и мощность тока",
    difficulty: "medium",
    prompt: "Заполни пропуск в формуле работы электрического тока:",
    formulaTemplate: {
      parts: [
        { kind: "text", value: "A = " },
        { kind: "slot", slotId: "s1", placeholder: "?" },
      ],
    },
    options: [
      { id: "a", text: "UIt" },
      { id: "b", text: "U/R·t" },
      { id: "c", text: "IRt" },
      { id: "d", text: "U+I+t" },
    ],
    correctAnswer: { type: "slots", value: { s1: "a" } },
    explanation: {
      short: "A = UIt — работа тока равна напряжению × силу тока × время.",
      rule: "Работа электрического тока: A = UIt = I²Rt = U²t/R, где U — напряжение (В), I — сила тока (А), t — время (с).",
    },
    tags: ["formula"],
  },

  // 27. Мощность электрического тока
  {
    id: "phys-elec-f3",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "formula_gap",
    topic: "Электромагнитные явления",
    subtopic: "Работа и мощность тока",
    difficulty: "easy",
    prompt: "Заполни пропуск в формуле мощности электрического тока:",
    formulaTemplate: {
      parts: [
        { kind: "text", value: "P = " },
        { kind: "slot", slotId: "s1", placeholder: "?" },
      ],
    },
    options: [
      { id: "a", text: "UI" },
      { id: "b", text: "U/I" },
      { id: "c", text: "I/U" },
      { id: "d", text: "U+I" },
    ],
    correctAnswer: { type: "slots", value: { s1: "a" } },
    explanation: {
      short: "P = UI — мощность тока равна напряжению × силу тока.",
      rule: "Мощность электрического тока: P = UI = I²R = U²/R, где U — напряжение (В), I — сила тока (А).",
    },
    tags: ["formula"],
  },

  // --- numeric_input ---

  // 28. Расчёт силы тока по закону Ома
  {
    id: "phys-elec-n1",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "numeric_input",
    topic: "Электромагнитные явления",
    subtopic: "Закон Ома",
    difficulty: "easy",
    prompt: "Напряжение на участке цепи равно 12 В, сопротивление — 4 Ом. Найдите силу тока в амперах.",
    numericConfig: { kind: "mental_formula_problem", expectedUnit: "А" },
    correctAnswer: { type: "numeric", value: 3, unit: "А" },
    explanation: {
      short: "I = U/R = 12/4 = 3 А",
      rule: "I = U/R",
    },
    tags: ["mental"],
  },

  // 29. Общее сопротивление при последовательном соединении
  {
    id: "phys-elec-n2",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "numeric_input",
    topic: "Электромагнитные явления",
    subtopic: "Последовательное соединение",
    difficulty: "easy",
    prompt: "Два резистора сопротивлениями 3 Ом и 7 Ом соединены последовательно. Найдите общее сопротивление в омах.",
    numericConfig: { kind: "mental_formula_problem", expectedUnit: "Ом" },
    correctAnswer: { type: "numeric", value: 10, unit: "Ом" },
    explanation: {
      short: "R = R₁ + R₂ = 3 + 7 = 10 Ом",
      rule: "При последовательном соединении: R = R₁ + R₂ + ..., I = const, U = U₁ + U₂ + ...",
    },
    tags: ["mental"],
  },

  // 30. Общее сопротивление при параллельном соединении (два одинаковых)
  {
    id: "phys-elec-n3",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "numeric_input",
    topic: "Электромагнитные явления",
    subtopic: "Параллельное соединение",
    difficulty: "medium",
    prompt: "Два одинаковых резистора сопротивлением 6 Ом каждый соединены параллельно. Найдите общее сопротивление в омах.",
    numericConfig: { kind: "mental_formula_problem", expectedUnit: "Ом" },
    correctAnswer: { type: "numeric", value: 3, unit: "Ом" },
    explanation: {
      short: "1/R = 1/R₁ + 1/R₂ = 1/6 + 1/6 = 2/6 → R = 3 Ом",
      rule: "При параллельном соединении двух одинаковых резисторов R = R₁/2. Общая формула: 1/R = 1/R₁ + 1/R₂ + ...",
    },
    tags: ["mental"],
  },

  // 31. Расчёт мощности тока
  {
    id: "phys-elec-n4",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "numeric_input",
    topic: "Электромагнитные явления",
    subtopic: "Работа и мощность тока",
    difficulty: "medium",
    prompt: "Сила тока в электрической лампе равна 0,5 А, напряжение — 220 В. Найдите мощность лампы в ваттах.",
    numericConfig: { kind: "mental_formula_problem", expectedUnit: "Вт" },
    correctAnswer: { type: "numeric", value: 110, unit: "Вт" },
    explanation: {
      short: "P = UI = 220 × 0,5 = 110 Вт",
      rule: "P = UI",
    },
    tags: ["mental"],
  },

  // --- flashcard_self_check ---

  // 32. Закон Ома (flashcard)
  {
    id: "phys-elec-fc1",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "flashcard_self_check",
    topic: "Электромагнитные явления",
    subtopic: "Закон Ома",
    difficulty: "easy",
    prompt: "Запишите формулу закона Ома для участка цепи.",
    correctAnswer: { type: "self_check", value: "known" },
    explanation: {
      short: "Закон Ома: I = U/R",
      answer: "I = U/R",
      detailed:
        "Закон Ома для участка цепи: сила тока прямо пропорциональна напряжению и обратно пропорциональна сопротивлению.",
      rule: "I = U/R",
    },
    tags: ["formula"],
  },

  // 33. Формула сопротивления проводника (flashcard)
  {
    id: "phys-elec-fc2",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "flashcard_self_check",
    topic: "Электромагнитные явления",
    subtopic: "Сопротивление",
    difficulty: "medium",
    prompt: "Вспомни формулу расчёта электрического сопротивления проводника через его параметры.",
    correctAnswer: { type: "self_check", value: "known" },
    explanation: {
      short: "Сопротивление проводника: R = ρl/S",
      answer: "R = ρl/S",
      detailed:
        "R = ρl/S, где ρ — удельное сопротивление (Ом·мм²/м), l — длина проводника (м), S — площадь поперечного сечения (мм²).",
      rule: "R = ρl/S",
    },
    tags: ["formula"],
  },

  // --- single_choice ---

  // 34. Последовательное vs параллельное — концептуальный вопрос
  {
    id: "phys-elec-sc1",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "single_choice",
    topic: "Электромагнитные явления",
    subtopic: "Соединение проводников",
    difficulty: "medium",
    prompt: "Два резистора соединены последовательно. Какая величина одинакова на обоих резисторах?",
    options: [
      { id: "a", text: "Сила тока" },
      { id: "b", text: "Напряжение" },
      { id: "c", text: "Мощность" },
      { id: "d", text: "Сопротивление" },
    ],
    correctAnswer: { type: "single", value: "a" },
    explanation: {
      short: "При последовательном соединении сила тока одинакова на всех участках.",
      rule: "Последовательное: I = const, U = U₁ + U₂. Параллельное: U = const, I = I₁ + I₂.",
    },
  },

  // --- multi_choice ---

  // 35. Формулы для последовательного соединения
  {
    id: "phys-elec-mc1",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "multi_choice",
    topic: "Электромагнитные явления",
    subtopic: "Соединение проводников",
    difficulty: "medium",
    prompt: "Какие формулы справедливы для последовательного соединения двух проводников?",
    options: [
      { id: "1", text: "I = I₁ = I₂" },
      { id: "2", text: "U = U₁ + U₂" },
      { id: "3", text: "I = I₁ + I₂" },
      { id: "4", text: "R = R₁ + R₂" },
      { id: "5", text: "U = U₁ = U₂" },
    ],
    correctAnswer: { type: "multiple", value: ["1", "2", "4"] },
    explanation: {
      short: "Верно: I = I₁ = I₂, U = U₁ + U₂, R = R₁ + R₂. I = I₁ + I₂ и U = U₁ = U₂ — для параллельного соединения.",
      rule: "Последовательное: I одинаков, U и R складываются. Параллельное: U одинаково, I складывается, 1/R складывается.",
    },
    tags: ["formula"],
  },

  // =========================================================
  // РАЗДЕЛ 4: КВАНТОВЫЕ ЯВЛЕНИЯ / ОПТИКА (6 вопросов)
  // =========================================================

  // --- formula_gap ---

  // 36. Закон отражения света
  {
    id: "phys-opt-f1",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "formula_gap",
    topic: "Квантовые явления / Оптика",
    subtopic: "Отражение света",
    difficulty: "easy",
    prompt: "Заполни пропуск: закон отражения света гласит, что угол падения … углу отражения.",
    formulaTemplate: {
      parts: [
        { kind: "text", value: "α " },
        { kind: "slot", slotId: "s1", placeholder: "?" },
        { kind: "text", value: " γ" },
      ],
    },
    options: [
      { id: "a", text: "=" },
      { id: "b", text: ">" },
      { id: "c", text: "<" },
      { id: "d", text: "∝" },
    ],
    correctAnswer: { type: "slots", value: { s1: "a" } },
    explanation: {
      short: "Угол падения равен углу отражения: α = γ.",
      rule: "Закон отражения: угол падения равен углу отражения. Углы отсчитываются от перпендикуляра к поверхности.",
    },
    tags: ["formula"],
  },

  // --- numeric_input ---

  // 37. Оптическая сила линзы
  {
    id: "phys-opt-n1",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "numeric_input",
    topic: "Квантовые явления / Оптика",
    subtopic: "Линзы",
    difficulty: "easy",
    prompt: "Фокусное расстояние собирающей линзы равно 0,5 м. Найдите оптическую силу линзы в диоптриях.",
    numericConfig: { kind: "mental_formula_problem", expectedUnit: "дптр" },
    correctAnswer: { type: "numeric", value: 2, unit: "дптр" },
    explanation: {
      short: "D = 1/F = 1/0,5 = 2 дптр",
      rule: "Оптическая сила: D = 1/F, где F — фокусное расстояние (м), D — оптическая сила (дптр).",
    },
    tags: ["mental"],
  },

  // 38. Фокусное расстояние по оптической силе
  {
    id: "phys-opt-n2",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "numeric_input",
    topic: "Квантовые явления / Оптика",
    subtopic: "Линзы",
    difficulty: "medium",
    prompt: "Оптическая сила линзы равна −4 дптр. Найдите фокусное расстояние в метрах.",
    numericConfig: { kind: "mental_formula_problem", expectedUnit: "м" },
    correctAnswer: { type: "numeric", value: -0.25, unit: "м", tolerance: 0.01 },
    explanation: {
      short: "F = 1/D = 1/(−4) = −0,25 м. Отрицательное фокусное расстояние — рассеивающая линза.",
      rule: "D = 1/F → F = 1/D. Рассеивающая линза: D < 0, F < 0.",
    },
    tags: ["mental"],
  },

  // --- single_choice ---

  // 39. Преломление света — концептуальный вопрос
  {
    id: "phys-opt-sc1",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "single_choice",
    topic: "Квантовые явления / Оптика",
    subtopic: "Преломление света",
    difficulty: "medium",
    prompt: "Луч света переходит из воздуха в стекло. Как при этом изменяются скорость света и длина волны?",
    options: [
      { id: "a", text: "Скорость уменьшается, длина волны уменьшается" },
      { id: "b", text: "Скорость уменьшается, длина волны не изменяется" },
      { id: "c", text: "Скорость не изменяется, длина волны уменьшается" },
      { id: "d", text: "Скорость увеличивается, длина волны уменьшается" },
    ],
    correctAnswer: { type: "single", value: "a" },
    explanation: {
      short: "При переходе в более плотную оптическую среду скорость и длина волны уменьшаются.",
      rule: "При переходе из менее плотной в более плотную оптическую среду: скорость ↓, длина волны ↓, частота не меняется. n = c/v = λ₀/λ.",
    },
  },

  // --- flashcard_self_check ---

  // 40. Формула оптической силы
  {
    id: "phys-opt-fc1",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "flashcard_self_check",
    topic: "Квантовые явления / Оптика",
    subtopic: "Линзы",
    difficulty: "easy",
    prompt: "Вспомни формулу оптической силы линзы.",
    correctAnswer: { type: "self_check", value: "known" },
    explanation: {
      short: "Оптическая сила: D = 1/F",
      answer: "D = 1/F",
      detailed:
        "D = 1/F, где D — оптическая сила (дптр), F — фокусное расстояние (м). Для собирающей линзы D > 0, для рассеивающей D < 0.",
      rule: "D = 1/F, 1 дптр = 1 м⁻¹",
    },
    tags: ["formula"],
  },

  // --- single_choice (formula) ---

  // 41. Формула оптической силы
  {
    id: "phys-opt-sc2",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "single_choice",
    topic: "Квантовые явления / Оптика",
    subtopic: "Линзы",
    difficulty: "easy",
    presentation: "formula",
    prompt: "Какая формула выражает оптическую силу линзы?",
    options: [
      { id: "a", text: "D = 1/F" },
      { id: "b", text: "D = F" },
      { id: "c", text: "D = F/2" },
      { id: "d", text: "D = 2/F" },
    ],
    correctAnswer: { type: "single", value: "a" },
    explanation: {
      short: "D = 1/F — оптическая сила равна единице, делённой на фокусное расстояние.",
      rule: "D = 1/F, где D — оптическая сила (дптр), F — фокусное расстояние (м).",
    },
    tags: ["formula"],
  },

  // =========================================================
  // РАЗДЕЛ 5: ЕДИНИЦЫ И ПЕРЕВОДЫ (7 вопросов)
  // =========================================================

  // --- numeric_input (unit_conversion) ---

  // 42. мА → А
  {
    id: "phys-unit-n1",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "numeric_input",
    topic: "Единицы и переводы",
    subtopic: "Сила тока",
    difficulty: "easy",
    prompt: "Переведите 250 мА в амперах.",
    numericConfig: { kind: "unit_conversion", expectedUnit: "А" },
    correctAnswer: { type: "numeric", value: 0.25, unit: "А", tolerance: 0.01 },
    explanation: {
      short: "250 мА = 0,25 А (1 мА = 0,001 А)",
      rule: "1 мА = 10⁻³ А = 0,001 А. Для перевода: мА ÷ 1000 = А.",
    },
    tags: ["unit"],
  },

  // 43. кОм → Ом
  {
    id: "phys-unit-n2",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "numeric_input",
    topic: "Единицы и переводы",
    subtopic: "Сопротивление",
    difficulty: "easy",
    prompt: "Переведите 5 кОм в омы.",
    numericConfig: { kind: "unit_conversion", expectedUnit: "Ом" },
    correctAnswer: { type: "numeric", value: 5000, unit: "Ом" },
    explanation: {
      short: "5 кОм = 5000 Ом (1 кОм = 1000 Ом)",
      rule: "1 кОм = 10³ Ом = 1000 Ом.",
    },
    tags: ["unit"],
  },

  // 44. кДж → Дж
  {
    id: "phys-unit-n3",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "numeric_input",
    topic: "Единицы и переводы",
    subtopic: "Энергия и работа",
    difficulty: "easy",
    prompt: "Переведите 3,5 кДж в джоули.",
    numericConfig: { kind: "unit_conversion", expectedUnit: "Дж" },
    correctAnswer: { type: "numeric", value: 3500, unit: "Дж" },
    explanation: {
      short: "3,5 кДж = 3500 Дж (1 кДж = 1000 Дж)",
      rule: "1 кДж = 10³ Дж = 1000 Дж.",
    },
    tags: ["unit"],
  },

  // 45. км/ч → м/с
  {
    id: "phys-unit-n4",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "numeric_input",
    topic: "Единицы и переводы",
    subtopic: "Скорость",
    difficulty: "medium",
    prompt: "Переведите 54 км/ч в м/с.",
    numericConfig: { kind: "unit_conversion", expectedUnit: "м/с" },
    correctAnswer: { type: "numeric", value: 15, unit: "м/с", tolerance: 0.1 },
    explanation: {
      short: "54 км/ч = 54/3,6 = 15 м/с",
      rule: "1 км/ч = 1000 м / 3600 с = 1/3,6 м/с. Для перевода: км/ч ÷ 3,6 = м/с.",
    },
    tags: ["unit"],
  },

  // 46. см² → м²
  {
    id: "phys-unit-n5",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "numeric_input",
    topic: "Единицы и переводы",
    subtopic: "Площадь",
    difficulty: "medium",
    prompt: "Переведите 400 см² в м².",
    numericConfig: { kind: "unit_conversion", expectedUnit: "м²" },
    correctAnswer: { type: "numeric", value: 0.04, unit: "м²", tolerance: 0.001 },
    explanation: {
      short: "400 см² = 0,04 м² (1 см² = 0,0001 м²)",
      rule: "1 см = 0,01 м → 1 см² = (0,01)² м² = 0,0001 м² = 10⁻⁴ м². Для перевода: см² ÷ 10000 = м².",
    },
    tags: ["unit"],
  },

  // 47. г/см³ → кг/м³
  {
    id: "phys-unit-n6",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "numeric_input",
    topic: "Единицы и переводы",
    subtopic: "Плотность",
    difficulty: "hard",
    prompt: "Переведите плотность 2,7 г/см³ в кг/м³.",
    numericConfig: { kind: "unit_conversion", expectedUnit: "кг/м³" },
    correctAnswer: { type: "numeric", value: 2700, unit: "кг/м³" },
    explanation: {
      short: "2,7 г/см³ = 2700 кг/м³ (1 г/см³ = 1000 кг/м³)",
      rule: "1 г/см³ = 1000 кг/м³. Перевод: г/см³ × 1000 = кг/м³. Примеры: вода 1 г/см³ = 1000 кг/м³, алюминий 2,7 г/см³ = 2700 кг/м³.",
    },
    tags: ["unit"],
  },

  // --- single_choice ---

  // 48. Правильный перевод единиц
  {
    id: "phys-unit-sc1",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
    type: "single_choice",
    topic: "Единицы и переводы",
    subtopic: "Общие переводы",
    difficulty: "medium",
    prompt: "Какой перевод единиц выполнен верно?",
    options: [
      { id: "a", text: "1 мА = 0,001 А" },
      { id: "b", text: "1 кОм = 100 Ом" },
      { id: "c", text: "1 кДж = 100 Дж" },
      { id: "d", text: "1 см² = 0,01 м²" },
    ],
    correctAnswer: { type: "single", value: "a" },
    explanation: {
      short: "1 мА = 0,001 А — верно. Остальные: 1 кОм = 1000 Ом, 1 кДж = 1000 Дж, 1 см² = 0,0001 м².",
      rule: "Приставки: милли (м) = 10⁻³, кило (к) = 10³. Для площади: 1 см² = 10⁻⁴ м², а не 10⁻² м².",
    },
    tags: ["unit"],
  },
];
