import { defineFunction } from "@aws-amplify/backend";

export const downloadClip = defineFunction({
  name: "downloadClip",
  entry: "./handler.ts",
  layers: {
    youtubeDl: "arn:aws:lambda:us-east-2:277707106912:layer:firstTryLayer:5",
  },
});
