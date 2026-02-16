<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';

interface CountUpProps {
  endValue: number;
  startValue?: number;
  duration?: number;
  decimals?: number;
  separator?: string;
  prefix?: string;
  suffix?: string;
  className?: string;
  autoStart?: boolean;
  startOnView?: boolean;
}

const props = withDefaults(defineProps<CountUpProps>(), {
  startValue: 0,
  duration: 2000,
  decimals: 0,
  separator: '',
  prefix: '',
  suffix: '',
  className: '',
  autoStart: true,
  startOnView: true
});

const emit = defineEmits<{
  'animation-complete': [];
}>();

const currentValue = ref(props.startValue);
const elementRef = ref<HTMLElement | null>(null);
const hasStarted = ref(false);
const animationFrame = ref<number | null>(null);

// Easing function - easeOutExpo
const easeOutExpo = (t: number): number => {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
};

// Format number with separator and decimals
const formatNumber = (value: number): string => {
  const fixedValue = value.toFixed(props.decimals);
  const [intPart, decPart] = fixedValue.split('.');

  let formattedInt = intPart;
  if (props.separator && intPart.length > 3) {
    const reversed = intPart.split('').reverse();
    const chunks: string[] = [];
    for (let i = 0; i < reversed.length; i += 3) {
      chunks.push(reversed.slice(i, i + 3).reverse().join(''));
    }
    formattedInt = chunks.reverse().join(props.separator);
  }

  let result = formattedInt;
  if (decPart) {
    result += '.' + decPart;
  }

  return result;
};

const displayValue = computed(() => {
  return `${props.prefix}${formatNumber(currentValue.value)}${props.suffix}`;
});

const animate = () => {
  if (!hasStarted.value) return;

  const startTime = performance.now();
  const startVal = props.startValue;
  const endVal = props.endValue;
  const durationMs = props.duration;

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / durationMs, 1);

    const easedProgress = easeOutExpo(progress);
    currentValue.value = startVal + (endVal - startVal) * easedProgress;

    if (progress < 1) {
      animationFrame.value = requestAnimationFrame(step);
    } else {
      currentValue.value = endVal;
      emit('animation-complete');
    }
  };

  animationFrame.value = requestAnimationFrame(step);
};

const startAnimation = () => {
  if (hasStarted.value) return;
  hasStarted.value = true;
  animate();
};

const resetAnimation = () => {
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value);
  }
  currentValue.value = props.startValue;
  hasStarted.value = false;

  if (props.autoStart && !props.startOnView) {
    startAnimation();
  }
};

// Intersection Observer for viewport detection
let observer: IntersectionObserver | null = null;

onMounted(() => {
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

// Watch for endValue changes
watch(
  () => props.endValue,
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
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value);
  }
  observer?.disconnect();
});

// Expose methods for manual control
defineExpose({
  start: startAnimation,
  reset: resetAnimation
});
</script>

<template>
  <span ref="elementRef" :class="className">{{ displayValue }}</span>
</template>
