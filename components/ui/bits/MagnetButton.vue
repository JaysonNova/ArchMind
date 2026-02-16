<script setup lang="ts">
import { ref, computed } from 'vue';

interface MagnetButtonProps {
  className?: string;
  magnetStrength?: number;
  scaleStrength?: number;
}

const props = withDefaults(defineProps<MagnetButtonProps>(), {
  className: '',
  magnetStrength: 0.3,
  scaleStrength: 0.1
});

const buttonRef = ref<HTMLElement | null>(null);
const isHovered = ref(false);
const transform = ref({ x: 0, y: 0, scale: 1 });

const handleMouseMove = (e: MouseEvent) => {
  if (!buttonRef.value) return;

  const rect = buttonRef.value.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const distX = e.clientX - centerX;
  const distY = e.clientY - centerY;

  // Magnetic effect
  transform.value.x = distX * props.magnetStrength;
  transform.value.y = distY * props.magnetStrength;

  // Scale based on distance from center
  const distance = Math.sqrt(distX * distX + distY * distY);
  const maxDistance = Math.sqrt(rect.width * rect.width + rect.height * rect.height) / 2;
  const scaleValue = 1 + (1 - distance / maxDistance) * props.scaleStrength;
  transform.value.scale = scaleValue;
};

const handleMouseEnter = () => {
  isHovered.value = true;
};

const handleMouseLeave = () => {
  isHovered.value = false;
  transform.value = { x: 0, y: 0, scale: 1 };
};

const buttonStyle = computed(() => ({
  transform: `translate(${transform.value.x}px, ${transform.value.y}px) scale(${transform.value.scale})`,
  transition: isHovered.value ? 'transform 0.15s ease-out' : 'transform 0.4s ease-out'
}));
</script>

<template>
  <span
    ref="buttonRef"
    :class="`magnet-button-wrapper inline-block ${className}`"
    :style="buttonStyle"
    @mousemove="handleMouseMove"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <slot />
  </span>
</template>
