import { defineFunction } from "@aws-amplify/backend";

export const downloadClip = defineFunction({
  name: "downloadClip",
  entry: "./handler.ts",
  layers: {
    arn: "arn:aws:lambda:us-east-1:145266761615:layer:ffmpeg:1",
  },
});
