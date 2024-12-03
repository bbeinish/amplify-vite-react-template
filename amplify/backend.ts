import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { downloadClip } from "./functions/downloadClip/resource";
import { storage } from "./storage/resource";
defineBackend({
  auth,
  data,
  downloadClip,
  storage,
});
