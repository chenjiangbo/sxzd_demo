import { defineConfig } from "eslint/config";
import next from "eslint-config-next";

export default defineConfig([{
    ignores: [".next/**", "node_modules/**", "docs/prototype/zip (1)/**"],
    extends: [...next],
}]);
