import { defineFunction } from "@aws-amplify/backend";

export const downloadClip = defineFunction({
  name: "downloadClip",
  entry: "./handler.ts",
});
