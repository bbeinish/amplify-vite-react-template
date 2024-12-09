import { Schema } from "../../data/resource";

export const handler: Schema["downloadClip"]["functionHandler"] = async (
  event
) => {
  console.log(event.arguments.videoUrl);
  return true;
};
