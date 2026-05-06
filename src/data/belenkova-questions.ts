// ============================================================
// Belenkova Math Questions — 30 questions across 6 sections
// Course: belenkova_math | Subject: math | Exam: school
// ============================================================

export const belenkovaQuestions: unknown[] = [
  // =========================================================
  // РАЗДЕЛ 1: ФОРМУЛЫ СОКРАЩЁННОГО УМНОЖЕНИЯ (4 вопроса)
  // =========================================================

  // 1. Квадрат суммы — formula_gap
  {
    id: "bel-fsu-f1",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "formula_gap",
    topic: "Формулы сокращённого умножения",
    subtopic: "Квадрат суммы",
    difficulty: "easy",
    prompt: "Заполни пропуск в формуле квадрата суммы:",
    formulaTemplate: {
      parts: [
        { kind: "text", value: "(a + b)² = a² + " },
        { kind: "slot", slotId: "s1", placeholder: "?" },
        { kind: "text", value: " + b²" },
      ],
    },
    options: [
      { id: "a", text: "2ab" },
      { id: "b", text: "ab" },
      { id: "c", text: "2a" },
      { id: "d", text: "2b" },
    ],
    correctAnswer: { type: "slots", value: { s1: "a" } },
    explanation: {
      short: "(a + b)² = a² + 2ab + b²",
      rule: "Квадрат суммы: (a + b)² = a² + 2ab + b²",
    },
    tags: ["formula", "gap"],
  },

  // 2. Разность квадратов — formula_gap
  {
    id: "bel-fsu-f2",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "formula_gap",
    topic: "Формулы сокращённого умножения",
    subtopic: "Разность квадратов",
    difficulty: "easy",
    prompt: "Заполни пропуск в формуле разности квадратов:",
    formulaTemplate: {
      parts: [
        { kind: "text", value: "a² − b² = " },
        { kind: "slot", slotId: "s1", placeholder: "?" },
      ],
    },
    options: [
      { id: "a", text: "(a − b)(a + b)" },
      { id: "b", text: "(a − b)²" },
      { id: "c", text: "(a + b)²" },
      { id: "d", text: "a(a − b)" },
    ],
    correctAnswer: { type: "slots", value: { s1: "a" } },
    explanation: {
      short: "a² − b² = (a − b)(a + b) — разность квадратов.",
      rule: "Разность квадратов: a² − b² = (a − b)(a + b)",
    },
    tags: ["formula", "gap"],
  },

  // 3. Квадрат разности — flashcard_self_check
  {
    id: "bel-fsu-fc1",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "flashcard_self_check",
    topic: "Формулы сокращённого умножения",
    subtopic: "Квадрат разности",
    difficulty: "easy",
    prompt: "Вспомни формулу квадрата разности.",
    correctAnswer: { type: "self_check", value: "known" },
    explanation: {
      short: "(a − b)² = a² − 2ab + b²",
      answer: "(a − b)² = a² − 2ab + b²",
      rule: "Квадрат разности: (a − b)² = a² − 2ab + b²",
    },
    tags: ["formula"],
  },

  // 4. Разность квадратов — single_choice formula
  {
    id: "bel-fsu-sc1",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "single_choice",
    presentation: "formula",
    topic: "Формулы сокращённого умножения",
    subtopic: "Разность квадратов",
    difficulty: "easy",
    prompt: "Какая формула выражает разность квадратов?",
    options: [
      { id: "a", text: "a² − b² = (a − b)(a + b)" },
      { id: "b", text: "a² − b² = (a − b)²" },
      { id: "c", text: "a² − b² = (a + b)²" },
      { id: "d", text: "a² − b² = a(a − b)" },
    ],
    correctAnswer: { type: "single", value: "a" },
    explanation: {
      short: "a² − b² = (a − b)(a + b) — разность квадратов.",
      rule: "Разность квадратов: a² − b² = (a − b)(a + b)",
    },
    tags: ["formula"],
  },

  // =========================================================
  // РАЗДЕЛ 2: СТЕПЕНИ (5 вопросов)
  // =========================================================

  // 5. Умножение степеней — formula_gap
  {
    id: "bel-pow-f1",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "formula_gap",
    topic: "Степени",
    subtopic: "Умножение степеней",
    difficulty: "easy",
    prompt: "Заполни пропуск в правиле умножения степеней:",
    formulaTemplate: {
      parts: [
        { kind: "text", value: "aᵐ · aⁿ = a" },
        { kind: "slot", slotId: "s1", placeholder: "?" },
      ],
    },
    options: [
      { id: "a", text: "ᵐ⁺ⁿ" },
      { id: "b", text: "ᵐⁿ" },
      { id: "c", text: "ᵐ⁻ⁿ" },
      { id: "d", text: "ⁿ⁻ᵐ" },
    ],
    correctAnswer: { type: "slots", value: { s1: "a" } },
    explanation: {
      short: "aᵐ · aⁿ = aᵐ⁺ⁿ — при умножении степеней показатели складываются.",
      rule: "При умножении степеней с одинаковым основанием показатели складываются: aᵐ · aⁿ = aᵐ⁺ⁿ",
    },
    tags: ["formula", "gap"],
  },

  // 6. Деление степеней — formula_gap
  {
    id: "bel-pow-f2",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "formula_gap",
    topic: "Степени",
    subtopic: "Деление степеней",
    difficulty: "easy",
    prompt: "Заполни пропуск в правиле деления степеней:",
    formulaTemplate: {
      parts: [
        { kind: "text", value: "aᵐ : aⁿ = a" },
        { kind: "slot", slotId: "s1", placeholder: "?" },
      ],
    },
    options: [
      { id: "a", text: "ᵐ⁻ⁿ" },
      { id: "b", text: "ᵐ⁺ⁿ" },
      { id: "c", text: "ᵐⁿ" },
      { id: "d", text: "ᵐ/ⁿ" },
    ],
    correctAnswer: { type: "slots", value: { s1: "a" } },
    explanation: {
      short: "aᵐ : aⁿ = aᵐ⁻ⁿ — при делении степеней показатели вычитаются.",
      rule: "При делении степеней с одинаковым основанием показатели вычитаются: aᵐ : aⁿ = aᵐ⁻ⁿ",
    },
    tags: ["formula", "gap"],
  },

  // 7. Умножение степеней — numeric_input
  {
    id: "bel-pow-n1",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "numeric_input",
    topic: "Степени",
    subtopic: "Умножение степеней",
    difficulty: "easy",
    prompt: "Вычислите: 2³ · 2⁴",
    numericConfig: { kind: "mental_formula_problem" },
    correctAnswer: { type: "numeric", value: 128 },
    explanation: {
      short: "2³ · 2⁴ = 2⁷ = 128",
      rule: "При умножении степеней с одинаковым основанием показатели складываются: aᵐ · aⁿ = aᵐ⁺ⁿ",
    },
    tags: ["mental"],
  },

  // 8. Возведение степени в степень — numeric_input
  {
    id: "bel-pow-n2",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "numeric_input",
    topic: "Степени",
    subtopic: "Возведение степени в степень",
    difficulty: "medium",
    prompt: "Вычислите: (3²)³",
    numericConfig: { kind: "mental_formula_problem" },
    correctAnswer: { type: "numeric", value: 729 },
    explanation: {
      short: "(3²)³ = 3⁶ = 729",
      rule: "При возведении степени в степень показатели перемножаются: (aᵐ)ⁿ = aᵐⁿ",
    },
    tags: ["mental"],
  },

  // 9. Свойства степеней — flashcard_self_check
  {
    id: "bel-pow-fc1",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "flashcard_self_check",
    topic: "Степени",
    subtopic: "Возведение степени в степень",
    difficulty: "easy",
    prompt: "Вспомни правило возведения степени в степень.",
    correctAnswer: { type: "self_check", value: "known" },
    explanation: {
      short: "(aᵐ)ⁿ = aᵐⁿ",
      answer: "(aᵐ)ⁿ = aᵐⁿ",
      rule: "При возведении степени в степень показатели перемножаются: (aᵐ)ⁿ = aᵐⁿ",
    },
    tags: ["formula"],
  },

  // =========================================================
  // РАЗДЕЛ 3: КОРНИ (5 вопросов)
  // =========================================================

  // 10. Корень из произведения — formula_gap
  {
    id: "bel-root-f1",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "formula_gap",
    topic: "Корни",
    subtopic: "Корень из произведения",
    difficulty: "easy",
    prompt: "Заполни пропуск в свойстве корня из произведения:",
    formulaTemplate: {
      parts: [
        { kind: "text", value: "√(a · b) = " },
        { kind: "slot", slotId: "s1", placeholder: "?" },
      ],
    },
    options: [
      { id: "a", text: "√a · √b" },
      { id: "b", text: "√a + √b" },
      { id: "c", text: "√(a + b)" },
      { id: "d", text: "√a · b" },
    ],
    correctAnswer: { type: "slots", value: { s1: "a" } },
    explanation: {
      short: "√(a · b) = √a · √b — корень из произведения равен произведению корней.",
      rule: "Корень из произведения: √(a · b) = √a · √b, при a ≥ 0, b ≥ 0",
    },
    tags: ["formula", "gap"],
  },

  // 11. Корень из частного — formula_gap
  {
    id: "bel-root-f2",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "formula_gap",
    topic: "Корни",
    subtopic: "Корень из частного",
    difficulty: "easy",
    prompt: "Заполни пропуск в свойстве корня из частного:",
    formulaTemplate: {
      parts: [
        { kind: "text", value: "√(a / b) = " },
        { kind: "slot", slotId: "s1", placeholder: "?" },
      ],
    },
    options: [
      { id: "a", text: "√a / √b" },
      { id: "b", text: "√a · √b" },
      { id: "c", text: "√(a · b)" },
      { id: "d", text: "√a − √b" },
    ],
    correctAnswer: { type: "slots", value: { s1: "a" } },
    explanation: {
      short: "√(a / b) = √a / √b — корень из частного равен частному корней.",
      rule: "Корень из частного: √(a / b) = √a / √b, при a ≥ 0, b > 0",
    },
    tags: ["formula", "gap"],
  },

  // 12. Вычисление корня — numeric_input
  {
    id: "bel-root-n1",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "numeric_input",
    topic: "Корни",
    subtopic: "Арифметический квадратный корень",
    difficulty: "easy",
    prompt: "Вычислите: √144",
    numericConfig: { kind: "mental_formula_problem" },
    correctAnswer: { type: "numeric", value: 12 },
    explanation: {
      short: "√144 = 12, так как 12² = 144",
      rule: "Арифметический квадратный корень из числа a — это неотрицательное число, квадрат которого равен a.",
    },
    tags: ["mental"],
  },

  // 13. Корень из произведения — numeric_input
  {
    id: "bel-root-n2",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "numeric_input",
    topic: "Корни",
    subtopic: "Корень из произведения",
    difficulty: "medium",
    prompt: "Вычислите: √25 · √49",
    numericConfig: { kind: "mental_formula_problem" },
    correctAnswer: { type: "numeric", value: 35 },
    explanation: {
      short: "√25 · √49 = 5 · 7 = 35",
      rule: "√(a · b) = √a · √b, при a ≥ 0, b ≥ 0",
    },
    tags: ["mental"],
  },

  // 14. Свойство корня из степени — flashcard_self_check
  {
    id: "bel-root-fc1",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "flashcard_self_check",
    topic: "Корни",
    subtopic: "Корень из степени",
    difficulty: "easy",
    prompt: "Вспомни формулу корня из степени.",
    correctAnswer: { type: "self_check", value: "known" },
    explanation: {
      short: "√(a²) = |a|",
      answer: "√(a²) = |a|",
      rule: "Корень из квадрата: √(a²) = |a|. Если a ≥ 0, то √(a²) = a.",
    },
    tags: ["formula"],
  },

  // =========================================================
  // РАЗДЕЛ 4: ЛОГАРИФМЫ (5 вопросов)
  // =========================================================

  // 15. Определение логарифма — formula_gap
  {
    id: "bel-log-f1",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "formula_gap",
    topic: "Логарифмы",
    subtopic: "Определение логарифма",
    difficulty: "easy",
    prompt: "Заполни пропуск в определении логарифма:",
    formulaTemplate: {
      parts: [
        { kind: "text", value: "logₐ(b) = c  ⟺  aᶜ = " },
        { kind: "slot", slotId: "s1", placeholder: "?" },
      ],
    },
    options: [
      { id: "a", text: "b" },
      { id: "b", text: "c" },
      { id: "c", text: "a" },
      { id: "d", text: "aᵇ" },
    ],
    correctAnswer: { type: "slots", value: { s1: "a" } },
    explanation: {
      short: "logₐ(b) = c означает, что aᶜ = b",
      rule: "Логарифм: logₐ(b) = c ⟺ aᶜ = b, где a > 0, a ≠ 1, b > 0",
    },
    tags: ["formula", "gap"],
  },

  // 16. Логарифм произведения — formula_gap
  {
    id: "bel-log-f2",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "formula_gap",
    topic: "Логарифмы",
    subtopic: "Логарифм произведения",
    difficulty: "medium",
    prompt: "Заполни пропуск в свойстве логарифма произведения:",
    formulaTemplate: {
      parts: [
        { kind: "text", value: "logₐ(bc) = " },
        { kind: "slot", slotId: "s1", placeholder: "?" },
      ],
    },
    options: [
      { id: "a", text: "logₐb + logₐc" },
      { id: "b", text: "logₐb · logₐc" },
      { id: "c", text: "logₐ(b + c)" },
      { id: "d", text: "logₐb − logₐc" },
    ],
    correctAnswer: { type: "slots", value: { s1: "a" } },
    explanation: {
      short: "logₐ(bc) = logₐb + logₐc — логарифм произведения равен сумме логарифмов.",
      rule: "Логарифм произведения: logₐ(bc) = logₐb + logₐc, при b > 0, c > 0",
    },
    tags: ["formula", "gap"],
  },

  // 17. Простой логарифм — numeric_input
  {
    id: "bel-log-n1",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "numeric_input",
    topic: "Логарифмы",
    subtopic: "Вычисление логарифма",
    difficulty: "easy",
    prompt: "Вычислите: log₂(8)",
    numericConfig: { kind: "mental_formula_problem" },
    correctAnswer: { type: "numeric", value: 3 },
    explanation: {
      short: "log₂(8) = 3, так как 2³ = 8",
      rule: "logₐ(b) = c ⟺ aᶜ = b. log₂(8) = 3, так как 2³ = 8.",
    },
    tags: ["mental"],
  },

  // 18. Логарифм частного — numeric_input
  {
    id: "bel-log-n2",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "numeric_input",
    topic: "Логарифмы",
    subtopic: "Логарифм частного",
    difficulty: "medium",
    prompt: "Вычислите: log₃(27) − log₃(9)",
    numericConfig: { kind: "mental_formula_problem" },
    correctAnswer: { type: "numeric", value: 1 },
    explanation: {
      short: "log₃(27) − log₃(9) = 3 − 2 = 1",
      rule: "Логарифм частного: logₐ(b/c) = logₐb − logₐc. log₃(27) = 3, log₃(9) = 2.",
    },
    tags: ["mental"],
  },

  // 19. Основное логарифмическое тождество — flashcard_self_check
  {
    id: "bel-log-fc1",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "flashcard_self_check",
    topic: "Логарифмы",
    subtopic: "Основное логарифмическое тождество",
    difficulty: "easy",
    prompt: "Вспомни основное логарифмическое тождество.",
    correctAnswer: { type: "self_check", value: "known" },
    explanation: {
      short: "a^(logₐb) = b",
      answer: "a^(logₐb) = b",
      rule: "Основное логарифмическое тождество: a^(logₐb) = b, при a > 0, a ≠ 1, b > 0",
    },
    tags: ["formula"],
  },

  // =========================================================
  // РАЗДЕЛ 5: ТРИГОНОМЕТРИЯ (5 вопросов)
  // =========================================================

  // 20. Основное тригонометрическое тождество — formula_gap
  {
    id: "bel-trig-f1",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "formula_gap",
    topic: "Тригонометрия",
    subtopic: "Основное тригонометрическое тождество",
    difficulty: "easy",
    prompt: "Заполни пропуск в основном тригонометрическом тождестве:",
    formulaTemplate: {
      parts: [
        { kind: "text", value: "sin²α + " },
        { kind: "slot", slotId: "s1", placeholder: "?" },
        { kind: "text", value: " = 1" },
      ],
    },
    options: [
      { id: "a", text: "cos²α" },
      { id: "b", text: "tg²α" },
      { id: "c", text: "sin²α" },
      { id: "d", text: "ctg²α" },
    ],
    correctAnswer: { type: "slots", value: { s1: "a" } },
    explanation: {
      short: "sin²α + cos²α = 1 — основное тригонометрическое тождество.",
      rule: "Основное тригонометрическое тождество: sin²α + cos²α = 1",
    },
    tags: ["formula", "gap"],
  },

  // 21. Формула тангенса — formula_gap
  {
    id: "bel-trig-f2",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "formula_gap",
    topic: "Тригонометрия",
    subtopic: "Тангенс",
    difficulty: "easy",
    prompt: "Заполни пропуск в формуле тангенса:",
    formulaTemplate: {
      parts: [
        { kind: "text", value: "tg α = " },
        { kind: "slot", slotId: "s1", placeholder: "?" },
      ],
    },
    options: [
      { id: "a", text: "sin α / cos α" },
      { id: "b", text: "cos α / sin α" },
      { id: "c", text: "sin α · cos α" },
      { id: "d", text: "1 / sin α" },
    ],
    correctAnswer: { type: "slots", value: { s1: "a" } },
    explanation: {
      short: "tg α = sin α / cos α",
      rule: "Тангенс: tg α = sin α / cos α, при cos α ≠ 0",
    },
    tags: ["formula", "gap"],
  },

  // 22. Основное тригонометрическое тождество — flashcard_self_check
  {
    id: "bel-trig-fc1",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "flashcard_self_check",
    topic: "Тригонометрия",
    subtopic: "Основное тригонометрическое тождество",
    difficulty: "easy",
    prompt: "Вспомни основное тригонометрическое тождество.",
    correctAnswer: { type: "self_check", value: "known" },
    explanation: {
      short: "sin²α + cos²α = 1",
      answer: "sin²α + cos²α = 1",
      rule: "Основное тригонометрическое тождество: sin²α + cos²α = 1",
    },
    tags: ["formula"],
  },

  // 23. Формула котангенса — single_choice formula
  {
    id: "bel-trig-sc1",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "single_choice",
    presentation: "formula",
    topic: "Тригонометрия",
    subtopic: "Котангенс",
    difficulty: "easy",
    prompt: "Какая формула выражает котангенс угла?",
    options: [
      { id: "a", text: "ctg α = cos α / sin α" },
      { id: "b", text: "ctg α = sin α / cos α" },
      { id: "c", text: "ctg α = 1 / cos α" },
      { id: "d", text: "ctg α = sin α · cos α" },
    ],
    correctAnswer: { type: "single", value: "a" },
    explanation: {
      short: "ctg α = cos α / sin α — котангенс равен отношению косинуса к синусу.",
      rule: "Котангенс: ctg α = cos α / sin α, при sin α ≠ 0",
    },
    tags: ["formula"],
  },

  // 24. Формула синуса двойного угла — formula_gap (extra)
  {
    id: "bel-trig-f3",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "formula_gap",
    topic: "Тригонометрия",
    subtopic: "Синус двойного угла",
    difficulty: "medium",
    prompt: "Заполни пропуск в формуле синуса двойного угла:",
    formulaTemplate: {
      parts: [
        { kind: "text", value: "sin 2α = " },
        { kind: "slot", slotId: "s1", placeholder: "?" },
      ],
    },
    options: [
      { id: "a", text: "2 sin α cos α" },
      { id: "b", text: "sin² α + cos² α" },
      { id: "c", text: "2 cos² α" },
      { id: "d", text: "cos² α − sin² α" },
    ],
    correctAnswer: { type: "slots", value: { s1: "a" } },
    explanation: {
      short: "sin 2α = 2 sin α cos α",
      rule: "Синус двойного угла: sin 2α = 2 sin α cos α",
    },
    tags: ["formula", "gap"],
  },

  // =========================================================
  // РАЗДЕЛ 6: ГЕОМЕТРИЯ (6 вопросов)
  // =========================================================

  // 25. Площадь треугольника — formula_gap
  {
    id: "bel-geo-f1",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "formula_gap",
    topic: "Геометрия",
    subtopic: "Площадь треугольника",
    difficulty: "easy",
    prompt: "Заполни пропуск в формуле площади треугольника:",
    formulaTemplate: {
      parts: [
        { kind: "text", value: "S = " },
        { kind: "slot", slotId: "s1", placeholder: "?" },
      ],
    },
    options: [
      { id: "a", text: "½ah" },
      { id: "b", text: "ah" },
      { id: "c", text: "a + h" },
      { id: "d", text: "2ah" },
    ],
    correctAnswer: { type: "slots", value: { s1: "a" } },
    explanation: {
      short: "S = ½ah — площадь треугольника равна половине произведения основания на высоту.",
      rule: "Площадь треугольника: S = ½ah, где a — основание, h — высота",
    },
    tags: ["formula", "gap"],
  },

  // 26. Теорема Пифагора — formula_gap
  {
    id: "bel-geo-f2",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "formula_gap",
    topic: "Геометрия",
    subtopic: "Теорема Пифагора",
    difficulty: "easy",
    prompt: "Заполни пропуск в теореме Пифагора:",
    formulaTemplate: {
      parts: [
        { kind: "text", value: "c² = " },
        { kind: "slot", slotId: "s1", placeholder: "?" },
      ],
    },
    options: [
      { id: "a", text: "a² + b²" },
      { id: "b", text: "a² − b²" },
      { id: "c", text: "2ab" },
      { id: "d", text: "a² · b²" },
    ],
    correctAnswer: { type: "slots", value: { s1: "a" } },
    explanation: {
      short: "c² = a² + b² — в прямоугольном треугольнике квадрат гипотенузы равен сумме квадратов катетов.",
      rule: "Теорема Пифагора: c² = a² + b², где c — гипотенуза, a и b — катеты",
    },
    tags: ["formula", "gap"],
  },

  // 27. Площадь круга — flashcard_self_check
  {
    id: "bel-geo-fc1",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "flashcard_self_check",
    topic: "Геометрия",
    subtopic: "Площадь круга",
    difficulty: "easy",
    prompt: "Вспомни формулу площади круга.",
    correctAnswer: { type: "self_check", value: "known" },
    explanation: {
      short: "S = πR²",
      answer: "S = πR²",
      rule: "Площадь круга: S = πR², где R — радиус круга",
    },
    tags: ["formula"],
  },

  // 28. Длина окружности — flashcard_self_check
  {
    id: "bel-geo-fc2",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "flashcard_self_check",
    topic: "Геометрия",
    subtopic: "Длина окружности",
    difficulty: "easy",
    prompt: "Вспомни формулу длины окружности.",
    correctAnswer: { type: "self_check", value: "known" },
    explanation: {
      short: "C = 2πR",
      answer: "C = 2πR",
      rule: "Длина окружности: C = 2πR, где R — радиус окружности",
    },
    tags: ["formula"],
  },

  // 29. Площадь параллелограмма — single_choice formula
  {
    id: "bel-geo-sc1",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "single_choice",
    presentation: "formula",
    topic: "Геометрия",
    subtopic: "Площадь параллелограмма",
    difficulty: "easy",
    prompt: "Какая формула выражает площадь параллелограмма?",
    options: [
      { id: "a", text: "S = ah" },
      { id: "b", text: "S = ½ah" },
      { id: "c", text: "S = a²" },
      { id: "d", text: "S = ½(a + b)h" },
    ],
    correctAnswer: { type: "single", value: "a" },
    explanation: {
      short: "S = ah — площадь параллелограмма равна произведению основания на высоту.",
      rule: "Площадь параллелограмма: S = ah, где a — основание, h — высота",
    },
    tags: ["formula"],
  },

  // 30. Площадь трапеции — single_choice formula
  {
    id: "bel-geo-sc2",
    courseId: "belenkova_math",
    subject: "math",
    exam: "school",
    type: "single_choice",
    presentation: "formula",
    topic: "Геометрия",
    subtopic: "Площадь трапеции",
    difficulty: "medium",
    prompt: "Какая формула выражает площадь трапеции?",
    options: [
      { id: "a", text: "S = ½(a + b)h" },
      { id: "b", text: "S = ah" },
      { id: "c", text: "S = ½ah" },
      { id: "d", text: "S = (a + b)h" },
    ],
    correctAnswer: { type: "single", value: "a" },
    explanation: {
      short: "S = ½(a + b)h — площадь трапеции равна полусумме оснований, умноженной на высоту.",
      rule: "Площадь трапеции: S = ½(a + b)h, где a и b — основания, h — высота",
    },
    tags: ["formula"],
  },
];
