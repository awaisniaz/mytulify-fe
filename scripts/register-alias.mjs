import { register } from "node:module";

register(new URL("./alias-hook.mjs", import.meta.url).href, import.meta.url);
