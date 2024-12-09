import { defineStorage } from "@aws-amplify/backend";
import { downloadClip } from "../functions/downloadClip/resource";

export const storage = defineStorage({
  name: "savedClips",
  access: (allow) => ({
    "savedClips/*": [
      allow.resource(downloadClip).to(["read", "write", "delete"]),
    ],
    "allClips/*": [allow.authenticated.to(["read", "write", "delete"])],
  }),
});
