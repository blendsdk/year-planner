<script setup lang="ts">
import { computed } from "vue";
import { withBase } from "vitepress";

/**
 * One Storybook story embedded at its production path.
 *
 * The iframe is the isolation boundary between VitePress (Vue) and the React
 * planner. It also keeps the planner's CSS variables out of the docs site.
 */
const props = withDefaults(
  defineProps<{
    /** Storybook story id, for example `demos--context-menu`. */
    story: string;
    /** Accessible iframe title. */
    title?: string;
    /** CSS height of the iframe. */
    height?: string;
  }>(),
  { height: "720px" },
);

const src = computed(() => withBase(`/storybook/iframe.html?id=${props.story}&viewMode=story`));
const manager = computed(() => withBase(`/storybook/?path=/story/${props.story}`));
</script>

<template>
  <div class="story-frame">
    <div class="story-frame__bar">
      <span>{{ title ?? story }}</span>
      <a :href="manager" target="_blank" rel="noreferrer">Open in Storybook ↗</a>
    </div>
    <iframe
      :src="src"
      :title="title ?? story"
      :style="{ height }"
      loading="lazy"
      allow="fullscreen"
    />
  </div>
</template>
