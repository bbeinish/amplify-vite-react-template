import { Schema } from "../../data/resource";
import { uploadData } from "@aws-amplify/storage";

export const handler: Schema["downloadClip"]["functionHandler"] = async (
  event
) => {
  console.log(event.arguments.videoUrl);
  uploadData({
    path: "savedClips/test",
    data: "test",
  });
  return true;
};
