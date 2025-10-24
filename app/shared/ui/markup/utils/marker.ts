import type {
  EmptyMarkerName,
  RichMarkerName,
  SectionMarkerName,
  SimpleTextName,
  TextMarkerName,
  TextWithMarkerName,
} from '../types';
import {
  EmptyMarker,
  RichMarker,
  SectionMarker,
  SimpleText,
  TextMarker,
} from '../enums';

export function isSimpleText(
  marker: TextWithMarkerName,
): marker is SimpleTextName {
  return marker === SimpleText.Text;
}

export function isEmptyMarker(
  marker: TextWithMarkerName,
): marker is EmptyMarkerName {
  return marker === EmptyMarker.Break;
}

export function isTextMarker(
  marker: TextWithMarkerName,
): marker is TextMarkerName {
  return (
    marker === TextMarker.Bold ||
    marker === TextMarker.Italic ||
    marker === TextMarker.Underline ||
    marker === TextMarker.Strikethrough ||
    marker === TextMarker.Superscript ||
    marker === TextMarker.Subscript ||
    marker === TextMarker.Highlight
  );
}

export function isRichMarker(
  marker: TextWithMarkerName,
): marker is RichMarkerName {
  return marker === RichMarker.Link;
}

export function isFeatureMarker(
  marker: TextWithMarkerName,
): marker is SectionMarkerName {
  return (
    marker === SectionMarker.Class ||
    marker === SectionMarker.Spell ||
    marker === SectionMarker.Feat ||
    marker === SectionMarker.Background ||
    marker === SectionMarker.MagicItem ||
    marker === SectionMarker.Creature ||
    marker === SectionMarker.Item ||
    marker === SectionMarker.Glossary
  );
}
