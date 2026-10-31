"""Базовые исключения приложения."""


class AppError(Exception):
    """Базовое исключение приложения."""

    def __init__(self, message: str, code: str = "app_error", status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


class AIError(AppError):
    """Ошибка при работе с языковой моделью."""

    def __init__(self, message: str, code: str = "ai_error", status_code: int = 502):
        super().__init__(message, code, status_code)


class ParsingError(AppError):
    """Ошибка при парсинге документа."""

    def __init__(self, message: str, code: str = "parsing_error", status_code: int = 400):
        super().__init__(message, code, status_code)


class ValidationError(AppError):
    """Ошибка валидации входных данных."""

    def __init__(self, message: str, code: str = "validation_error", status_code: int = 422):
        super().__init__(message, code, status_code)


class RAGError(AppError):
    """Ошибка при работе с векторной базой данных."""

    def __init__(self, message: str, code: str = "rag_error", status_code: int = 500):
        super().__init__(message, code, status_code)
