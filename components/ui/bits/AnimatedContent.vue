<script setup lang="ts">
import { ref, onMounted, onUnmounted, useTemplateRef } from 'vue';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface AnimatedContentProps {
  direction?: 'vertical' | 'horizontal';
  distance?: number;
  duration?: number;
  ease?: string;
  initialOpacity?: number;
  animateOpacity?: boolean;
  scale?: number;
  threshold?: number;
  delay?: number;
  reverse?: boolean;
  className?: string;
}

const props = withDefaults(defineProps<AnimatedContentProps>(), {
  direction: 'vertical',
  distance: 100,
  duration: 0.8,
  ease: 'power3.out',
  initialOpacity: 0,
  animateOpacity: true,
  scale: 1,
  threshold: 0.1,
  delay: 0,
  reverse: false,
  className: ''
});

const emit = defineEmits<{
  'complete': [];
}>();

const containerRef = useTemplateRef<HTMLElement>('containerRef');
const hasAnimated = ref(false);
let scrollTrigger: ScrollTrigger | null = null;
let animation: gsap.core.Tween | null = null;

const getTransformValues = () => {
  const distance = props.reverse ? -props.distance : props.distance;

  if (props.direction === 'vertical') {
    return { y: distance };
  }
  return { x: distance };
};

const initAnimation = () => {
  if (!containerRef.value || hasAnimated.value) return;

  const el = containerRef.value;

  // Set initial state
  const initialValues: gsap.TweenVars = {
    ...getTransformValues(),
    scale: props.scale,
  };

  if (props.animateOpacity) {
    initialValues.opacity = props.initialOpacity;
  }

  gsap.set(el, initialValues);

  // Create animation
  const targetValues: gsap.TweenVars = {
    x: 0,
    y: 0,
    scale: 1,
    duration: props.duration,
    ease: props.ease,
    delay: props.delay,
    onComplete: () => {
      hasAnimated.value = true;
      emit('complete');
    }
  };

  if (props.animateOpacity) {
    targetValues.opacity = 1;
  }

  // Create ScrollTrigger
  scrollTrigger = ScrollTrigger.create({
    trigger: el,
    start: `top ${100 - props.threshold * 100}%`,
    onEnter: () => {
      animation = gsap.to(el, targetValues);
    },
    // Only play once
    once: true
  });
};

const cleanup = () => {
  if (animation) {
    animation.kill();
    animation = null;
  }
  if (scrollTrigger) {
    scrollTrigger.kill();
    scrollTrigger = null;
  }
};

onMounted(() => {
  // Small delay to ensure DOM is ready
  requestAnimationFrame(() => {
    initAnimation();
  });
});

onUnmounted(() => {
  cleanup();
});
</script>

<template>
  <div ref="containerRef" :class="className">
    <slot />
  </div>
</template>
