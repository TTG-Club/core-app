import {
  RichMarker,
  type RichMarkerName,
  SimpleText,
  type SimpleTextName,
  TextMarker,
  type TextMarkerName,
  type TextWithMarkerName,
} from '../types';

export function isSimpleText(
  marker: TextWithMarkerName,
): marker is SimpleTextName {
  return Object.values(SimpleText).includes(marker as SimpleText);
}

export function isTextMarker(
  marker: TextWithMarkerName,
): marker is TextMarkerName {
  return Object.values(TextMarker).includes(marker as TextMarker);
}

export function isRichMarker(
  marker: TextWithMarkerName,
): marker is RichMarkerName {
  return Object.values(RichMarker).includes(marker as RichMarker);
}
