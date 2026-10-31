"""Шаблоны промптов для LLM (вынесены из config.py)."""

from textwrap import dedent

JSON_ONLY_PROMPT: str = (
    "Previous reply was not valid JSON. Please REPLY with valid JSON only "
    "(no explanations, no code fences)."
)

PLANNER_PROMPT: str = dedent(
    """
    Ты — генератор структуры презентации (только структура, без содержания).
    Вход: audience (TopManagement | Experts | Investors) и краткий project_context.
    Задача: вернуть строго ТОЛЬКО JSON-массив объектов в формате:
    [{"slide_id":1,"title":"Заголовок","task":"Короткое задание"}, ...]

    Требования:
    - Количество слайдов обязательно 10–15.
    - slide_id — последовательные целые числа, начиная с 1.
    - title — короткий заголовок на русском (не больше 6 слов).
    - task — 1–2 коротких предложения с заданием для генерации контента (на русском).
    - Верни ТОЛЬКО валидный JSON-массив без пояснений и кода.
    AUDIENCE: {audience}
    PROJECT_CONTEXT_SNIPPET: {context_snippet}
    """
)

CLASSIFIER_PROMPT: str = dedent(
    """
    Ты — классификатор аудитории для генерации презентаций. На входе — короткий user_request и (опционально) project_context.
    Верни строго JSON с полями:
    - label: одно из ["TopManagement","Experts","Investors"]
    - confidence: 0.0-1.0
    - rationale: 1-2 предложения почему
    - suggested_actions: список коротких действий

    Return ONLY the JSON object — no extra text.
    USER_QUERY: {user_text}
    """
)

SLIDE_PROMPT_TEMPLATE: str = dedent(
    """
        Ты — ассистент, который создаёт контент для слайда, используя ТОЛЬКО данные ниже.

        ТЕМА: {topic}
        СЛАЙД №{slide_id}: "{slide_title}"
        ЗАДАЧА: {slide_task}

        ИСТОЧНИКОВЫЕ CHUNKS:
        {chunks_text}

        ТРЕБОВАНИЯ:
        1) Используй ТОЛЬКО факты из CHUNKS; не выдумывай числа и источники.
        2) Верни РОВНО один валидный JSON-объект без пояснений, без кода и без ```
        3) Если релевантных данных нет — верни:
        {{ "slide_id": {slide_id}, "title": "{slide_title}", "used_facts": [], "content": "Данные для этого раздела отсутствуют" }}
        4) Структура JSON:
        - "slide_id": число
        - "title": строка
        - "used_facts": массив коротких дословных цитат из CHUNKS (каждая ≤ 80 символов)
        - "content": строка без markdown-заголовков:
            1–2 предложения, пустая строка, затем 3–4 буллета (каждый начинается с "* ", ≤ 70 символов)
    """
)

CHART_GENERATOR_PROMPT: str = dedent(
    """
    You create DATA-DRIVEN charts using ONLY the PROVIDED CHUNKS and SLIDE CONTENT below.

    CONTEXT:
    TOPIC: {topic}
    SLIDE #{slide_id}: "{slide_title}"
    TASK: {slide_task}

    PROVIDED DATA (priority order):
    1. SLIDE_CONTENT: The text of the slide.
    2. CHUNKS: Additional context from the document.

    {chunks_text} # This contains both slide content and retrieved chunks

    CONSTRAINTS:
    - Prioritize data from the SLIDE_CONTENT. Use CHUNKS only if SLIDE_CONTENT lacks sufficient data.
    - Use ONLY numeric facts present in the provided data. Do NOT infer, average, extrapolate, or normalize.
    - If data is insufficient, return charts=[].
    - Keep labels short. Values must be numbers.
    - The chart title and labels must be in the same language as the slide content.
    - Prefer line for time series, bar for categories, pie for share breakdowns (≤6 items).
    - Max 2 charts.

    Return ONLY valid JSON with:
    {{
      "charts": [
        {{
          "type": "bar" | "line" | "pie",
          "title": "<short>",
          "labels": ["<l1>", "<l2>", "..."],
          "values": [n1, n2, ...],
          "reason": "<why this encoding is correct>",
          "used_facts": [{{ "excerpt": "<verbatim or close>", "chunk_id": "<id>" }}]
        }}
      ],
      "explanation": "<1-2 sentences>",
      "errors": []
    }}
    """
)

SINGLE_SLIDE_EDIT_PROMPT: str = dedent(
    """
    Ты — редактор одного слайда презентации. На входе получаешь слайд и действие.

    Доступные действия:
    - replace_chart — заменить диаграмму
    - custom — пользовательский запрос

    Верни РОВНО один JSON-объект без пояснений.
    """
)
