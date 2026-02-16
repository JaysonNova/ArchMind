<script setup lang="ts">
import { computed } from 'vue';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

const props = withDefaults(defineProps<ShinyTextProps>(), {
  text: '',
  disabled: false,
  speed: 5,
  className: ''
});

const animationDuration = computed(() => `${props.speed}s`);
</script>

<template>
  <span
    :class="`shiny-text ${props.className} ${!props.disabled ? 'animate-shine' : ''}`"
    :style="{ animationDuration: animationDuration }"
  >
    {{ props.text }}
  </span>
</template>

<style scoped>
.shiny-text {
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  background-image: linear-gradient(
    120deg,
    hsl(var(--foreground)) 0%,
    hsl(var(--foreground)) 35%,
    hsl(var(--foreground) / 0.5) 45%,
    hsl(var(--foreground)) 55%,
    hsl(var(--foreground)) 100%
  );
  background-size: 300% 100%;
  background-position: 100% 0;
}

/* Light mode - subtle lighter shine */
.animate-shine {
  animation: shine 5s ease-in-out infinite;
}

/* Dark mode - more pronounced white shine */
:global(.dark) .shiny-text {
  background-image: linear-gradient(
    120deg,
    hsl(var(--foreground)) 0%,
    hsl(var(--foreground)) 35%,
    rgba(255, 255, 255, 0.6) 45%,
    rgba(255, 255, 255, 0.9) 50%,
    rgba(255, 255, 255, 0.6) 55%,
    hsl(var(--foreground)) 65%,
    hsl(var(--foreground)) 100%
  );
}

@keyframes shine {
  0% {
    background-position: 100% 0;
  }
  50% {
    background-position: 0% 0;
  }
  100% {
    background-position: 100% 0;
  }
}
</style>
