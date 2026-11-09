<!--
  Феникс, восстающий из костра, и d20 у огня. Все цвета — токены темы через
  currentColor, поэтому картинка работает в любой теме сайта.
-->
<template>
  <svg
    viewBox="0 0 240 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <ellipse
      cx="120"
      cy="184"
      rx="96"
      ry="8"
      class="fill-current text-muted"
      opacity="0.2"
    />

    <g class="fill-current text-muted">
      <rect
        x="68"
        y="166"
        width="104"
        height="12"
        rx="6"
        transform="rotate(-10 120 172)"
      />

      <rect
        x="68"
        y="166"
        width="104"
        height="12"
        rx="6"
        transform="rotate(10 120 172)"
      />
    </g>

    <path
      d="M120 172C92 164 88 136 102 114C104 128 110 132 115 130C107 110 115 90 131 78C127 98 139 106 145 120C152 138 148 164 120 172Z"
      class="fill-current text-warning"
    />

    <path
      d="M120 170C106 164 104 148 112 136C114 146 120 148 122 142C120 130 126 122 132 116C132 130 140 138 138 152C136 164 130 168 120 170Z"
      class="fill-current text-error"
      opacity="0.85"
    />

    <g class="fill-current text-primary">
      <path
        d="M120 80C100 60 72 54 40 62C62 68 74 74 84 84C64 82 50 88 40 100C64 94 84 96 104 104C110 96 116 90 120 80Z"
        opacity="0.9"
      />

      <path
        d="M120 80C140 60 168 54 200 62C178 68 166 74 156 84C176 82 190 88 200 100C176 94 156 96 136 104C130 96 124 90 120 80Z"
        opacity="0.9"
      />

      <path
        d="M120 42C128 50 130 64 126 80L120 98L114 80C110 64 112 50 120 42Z"
      />

      <circle
        cx="120"
        cy="36"
        r="7"
      />

      <path d="M126 34L135 37L126 40Z" />
    </g>

    <g
      class="stroke-current text-primary"
      stroke-width="2"
      stroke-linecap="round"
    >
      <path d="M117 30C114 22 116 16 121 11" />

      <path d="M120 98C117 110 112 118 106 126" />

      <path d="M120 98C123 110 128 118 134 126" />
    </g>

    <g class="fill-current text-warning motion-safe:animate-pulse">
      <circle
        cx="92"
        cy="104"
        r="2"
      />

      <circle
        cx="152"
        cy="96"
        r="2.5"
      />

      <circle
        cx="146"
        cy="58"
        r="1.5"
      />

      <circle
        cx="96"
        cy="72"
        r="1.5"
      />
    </g>

    <g transform="translate(196 160)">
      <polygon
        points="0,-20 17.3,-10 17.3,10 0,20 -17.3,10 -17.3,-10"
        class="fill-current text-primary"
        opacity="0.15"
      />

      <g
        class="stroke-current text-highlighted"
        stroke-width="1.5"
        stroke-linejoin="round"
      >
        <polygon points="0,-20 17.3,-10 17.3,10 0,20 -17.3,10 -17.3,-10" />

        <polygon points="0,-12 10.4,6 -10.4,6" />

        <path
          d="M0 -20L0 -12M17.3 -10L10.4 6M17.3 10L10.4 6M0 20L10.4 6M0 20L-10.4 6M-17.3 10L-10.4 6M-17.3 -10L-10.4 6M-17.3 -10L0 -12M17.3 -10L0 -12"
        />
      </g>

      <text
        y="3.5"
        text-anchor="middle"
        font-size="8"
        font-weight="700"
        class="fill-current text-highlighted"
      >
        20
      </text>
    </g>
  </svg>
</template>
