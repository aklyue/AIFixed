"""Pydantic схемы запросов и ответов API."""

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


class ClassifierOut(BaseModel):
    label: str
    confidence: float
    rationale: str
    suggested_actions: list[str]


class SlideStructure(BaseModel):
    slide_id: int = Field(ge=1)
    title: str = ""
    task: str = ""


class SlideItem(BaseModel):
    slide_id: int = Field(ge=1)
    title: str = ""
    content: str = Field(min_length=1)


class StructureOut(BaseModel):
    slides: list[SlideStructure] = Field(
        ..., min_length=1, max_length=15
    )


class MessageRequest(BaseModel):
    text: str = Field(min_length=1)
    file_name: Optional[str] = None


class MessageResponse(BaseModel):
    content: Any


class GeneratePresentationRequest(BaseModel):
    text: str = Field(min_length=1)
    file_name: Optional[str] = None
    model: str = ""


class GeneratePresentationResponse(BaseModel):
    content: str


class EditSlideRequest(BaseModel):
    text: str = ""
    action: str
    slide: SlideItem
    model: str = ""
