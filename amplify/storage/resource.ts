import { defineStorage } from "@aws-amplify/backend";
// import { downloadClip } from "../functions/downloadClip/resource";

export const storage = defineStorage({
  name: "myReports",
  // access: (allow) => ({
  //   "reports/*": [allow.resource(downloadClip).to(["read", "write", "delete"])],
  // }),
});
