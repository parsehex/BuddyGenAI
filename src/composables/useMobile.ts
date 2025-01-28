import { ref, onMounted, onUnmounted } from 'vue';

export default function useMobile(breakpoint = 760) {
  const isMobile = ref(false);

  const checkMobile = () => {
    isMobile.value = window.innerWidth <= breakpoint;
  };

  onMounted(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile);
  });

  return {
    isMobile
  };
}
