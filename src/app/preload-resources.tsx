'use client';

import ReactDOM from 'react-dom';

export function PreloadResources() {
  ReactDOM.preconnect('https://img.ttg.club', { crossOrigin: 'anonymous' });
  ReactDOM.prefetchDNS('https://img.ttg.club');

  return null;
}
