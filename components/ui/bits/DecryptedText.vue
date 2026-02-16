<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  characters?: string;
  revealDirection?: 'start' | 'end' | 'middle';
  className?: string;
  autoStart?: boolean;
  startOnView?: boolean;
  animateOnHover?: boolean;
}

const props = withDefaults(defineProps<DecryptedTextProps>(), {
  speed: 50,
  maxIterations: 8,
  characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*',
  revealDirection: 'start',
  className: '',
  autoStart: true,
  startOnView: true,
  animateOnHover: false
});

const emit = defineEmits<{
  'decryption-complete': [];
}>();

const displayText = ref('');
const elementRef = ref<HTMLElement | null>(null);
const hasStarted = ref(false);
const isComplete = ref(false);
const isHovering = ref(false);

// Original text with each character's state
const originalChars = computed(() => props.text.split(''));
const charStates = ref<Array<{ revealed: boolean; currentChar: string; iterations: number }>>([]);

const updateDisplayText = () => {
  displayText.value = charStates.value.map(state => state.currentChar).join('');
};

// Initialize character states
const initCharStates = () => {
  charStates.value = originalChars.value.map(char => ({
    revealed: char === ' ', // Spaces are immediately revealed
    currentChar: char === ' ' ? ' ' : props.characters[Math.floor(Math.random() * props.characters.length)],
    iterations: 0
  }));
  updateDisplayText();
};

const getRandomChar = () => {
  return props.characters[Math.floor(Math.random() * props.characters.length)];
};

const animate = () => {
  if (!hasStarted.value) return;

  let allRevealed = true;
  let hasChanges = false;

  charStates.value.forEach((state, index) => {
    if (state.revealed) return;

    allRevealed = false;

    // Determine if this character should start revealing based on direction
    let shouldStartRevealing = false;
    const totalChars = charStates.value.length;
    const progress = state.iterations / props.maxIterations;

    switch (props.revealDirection) {
      case 'start':
        shouldStartRevealing = state.iterations >= props.maxIterations;
        break;
      case 'end':
        shouldStartRevealing = state.iterations >= props.maxIterations;
        break;
      case 'middle':
        shouldStartRevealing = state.iterations >= props.maxIterations;
        break;
    }

    if (shouldStartRevealing) {
      state.revealed = true;
      state.currentChar = originalChars.value[index];
    } else {
      state.currentChar = getRandomChar();
      state.iterations++;
      hasChanges = true;
    }
  });

  updateDisplayText();

  if (allRevealed) {
    isComplete.value = true;
    emit('decryption-complete');
  } else if (hasChanges || !allRevealed) {
    setTimeout(animate, props.speed);
  }
};

const startAnimation = () => {
  if (hasStarted.value) return;
  hasStarted.value = true;
  isComplete.value = false;
  initCharStates();
  setTimeout(animate, 100);
};

const resetAnimation = () => {
  hasStarted.value = false;
  isComplete.value = false;
  initCharStates();
};

// Intersection Observer for viewport detection
let observer: IntersectionObserver | null = null;

onMounted(() => {
  initCharStates();

  if (props.startOnView && elementRef.value) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasStarted.value) {
            startAnimation();
            observer?.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(elementRef.value);
  } else if (props.autoStart) {
    startAnimation();
  }
});

// Watch for text changes
watch(
  () => props.text,
  () => {
    resetAnimation();
    if (props.autoStart && !props.startOnView) {
      startAnimation();
    }
  }
);

// Cleanup
import { onUnmounted } from 'vue';
onUnmounted(() => {
  observer?.disconnect();
});

// Hover interaction
const handleMouseEnter = () => {
  if (props.animateOnHover && isComplete.value) {
    isHovering.value = true;
    // Briefly scramble on hover
    charStates.value.forEach((state, index) => {
      if (originalChars.value[index] !== ' ') {
        state.currentChar = getRandomChar();
      }
    });
    updateDisplayText();

    setTimeout(() => {
      charStates.value.forEach((state, index) => {
        state.currentChar = originalChars.value[index];
      });
      updateDisplayText();
      isHovering.value = false;
    }, 200);
  }
};

defineExpose({
  start: startAnimation,
  reset: resetAnimation
});
</script>

<template>
  <span
    ref="elementRef"
    :class="`decrypted-text ${className} ${isHovering ? 'scrambling' : ''}`"
    @mouseenter="handleMouseEnter"
  >
    {{ displayText }}
  </span>
</template>

<style scoped>
.decrypted-text {
  font-variant-ligatures: none;
}

.decrypted-text.scrambling {
  animation: shake 0.1s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-1px); }
  75% { transform: translateX(1px); }
}
</style>
