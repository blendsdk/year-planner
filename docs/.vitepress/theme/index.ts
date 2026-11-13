import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import "./custom.css";
import StoryFrame from "./components/StoryFrame.vue";
import StoryGallery from "./components/StoryGallery.vue";

/**
 * Site theme.
 *
 * The marketing surface extends the VitePress default theme rather than
 * replacing it: the default theme already provides navigation, search, dark
 * mode and accessibility. Only the brand tokens, the story embeds and the
 * gallery are custom.
 */
const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("StoryFrame", StoryFrame);
    app.component("StoryGallery", StoryGallery);
  },
};

export default theme;
