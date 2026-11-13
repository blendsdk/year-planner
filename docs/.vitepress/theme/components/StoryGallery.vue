<script setup lang="ts">
import { computed, ref } from "vue";
import { withBase } from "vitepress";
import { data } from "../../data/stories.data";

/**
 * Full Storybook catalogue index.
 *
 * The list is generated from `storybook-static/index.json` at build time, so it
 * cannot drift from the stories that were actually built.
 */
const query = ref("");

const groups = computed(() => {
  const needle = query.value.trim().toLowerCase();
  const filtered = data.stories.filter(
    (story) =>
      needle.length === 0 ||
      story.title.toLowerCase().includes(needle) ||
      story.name.toLowerCase().includes(needle),
  );
  const byTitle = new Map<string, typeof filtered>();
  for (const story of filtered) {
    const group = byTitle.get(story.title) ?? [];
    group.push(story);
    byTitle.set(story.title, group);
  }
  return [...byTitle.entries()].sort(([left], [right]) => left.localeCompare(right));
});

const count = computed(() => data.stories.length);
</script>

<template>
  <div v-if="!data.available" class="hero-note">
    The story index is generated from the built Storybook. Run
    <code>pnpm storybook:build</code> before building the docs site.
  </div>
  <template v-else>
    <input
      v-model="query"
      class="story-gallery__search"
      type="search"
      placeholder="Filter by group or story name…"
      aria-label="Filter stories"
    />
    <p class="story-gallery__count">{{ count }} stories in the catalogue.</p>
    <section v-for="[title, stories] in groups" :key="title" class="story-gallery__group">
      <h2>{{ title }}</h2>
      <div class="story-gallery__grid">
        <a
          v-for="story in stories"
          :key="story.id"
          class="story-gallery__card"
          :href="withBase(`/storybook/?path=/story/${story.id}`)"
          target="_blank"
          rel="noreferrer"
        >
          <strong>{{ story.name }}</strong>
          <span>{{ story.id }}</span>
        </a>
      </div>
    </section>
  </template>
</template>
