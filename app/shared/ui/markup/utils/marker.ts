import {
  EmptyMarker,
  type EmptyMarkerName,
  FeatureMarker,
  type FeatureMarkerName,
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

export function isEmptyMarker(
  marker: TextWithMarkerName,
): marker is EmptyMarkerName {
  return Object.values(EmptyMarker).includes(marker as EmptyMarker);
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

export function isFeatureMarker(
  marker: TextWithMarkerName,
): marker is FeatureMarkerName {
  return Object.values(FeatureMarker).includes(marker as FeatureMarker);
}
