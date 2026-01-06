import asyncio
from deep_translator import GoogleTranslator
import langdetect
from typing import Dict, List, Tuple, Optional
import re
import logging


class LanguageProcessor:
    def __init__(self):
        self.supported_languages = [
            "en",
            "zh",
            "es",
            "vi",
            "th",
            "pt",
            "fr",
            "de",
            "ar",
            "sw",
            "id",
            "ja",
            "ko",
            "hi",
            "ru",
            "it",
        ]
        self.wildlife_keywords = self._load_multilingual_keywords()

    async def process_multilanguage_text(self, text: str) -> Dict:
        try:
            detected_lang = langdetect.detect(text)
            english_text = text
            if detected_lang != "en":
                try:
                    english_text = GoogleTranslator(
                        source="auto", target="en"
                    ).translate(text)
                except Exception as e:
                    logging.warning(f"Translation failed: {e}")
                    english_text = text
            original_keywords = self._find_keywords_in_language(text, detected_lang)
            english_keywords = self._find_keywords_in_language(english_text, "en")
            return {
                "original_text": text,
                "detected_language": detected_lang,
                "english_translation": english_text,
                "original_keywords_found": original_keywords,
                "english_keywords_found": english_keywords,
                "total_keyword_matches": len(original_keywords) + len(english_keywords),
                "suspicion_score": self._calculate_language_suspicion_score(
                    original_keywords, english_keywords
                ),
            }
        except Exception as e:
            logging.error(f"Language processing failed: {e}")
            return {
                "original_text": text,
                "detected_language": "unknown",
                "english_translation": text,
                "original_keywords_found": [],
                "english_keywords_found": [],
                "total_keyword_matches": 0,
                "suspicion_score": 0,
                "error": str(e),
            }

    def _load_multilingual_keywords(self) -> Dict[str, List[str]]:
        return {"en": ["ivory", "rhino horn", "tiger bone"]}

    def _find_keywords_in_language(self, text: str, language: str) -> List[str]:
        """
        Search for wildlife keywords in the given text for the specified language.
        Returns a list of found keywords.
        """
        keywords = self.wildlife_keywords.get(language, [])
        found = []
        for kw in keywords:
            # Use word boundaries for whole word match, case-insensitive
            if re.search(rf"\\b{re.escape(kw)}\\b", text, re.IGNORECASE):
                found.append(kw)
        return found

    def _calculate_language_suspicion_score(
        self, original_keywords: List[str], english_keywords: List[str]
    ) -> int:
        """
        Calculate a suspicion score based on the number of unique keywords found in both original and English text.
        """
        unique_keywords = set(original_keywords) | set(english_keywords)
        return len(unique_keywords)
