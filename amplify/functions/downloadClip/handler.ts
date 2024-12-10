import { Schema } from "../../data/resource";
import { uploadData } from "@aws-amplify/storage";
import ytdl from "ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";

export const handler: Schema["downloadClip"]["functionHandler"] = async (
  event
) => {
  console.log(event.arguments.videoUrl);
  const { videoUrl, startTime, endTime } = event.arguments;
  const videoStream = ytdl(videoUrl!, {
    quality: "highest",
    range: {
      start: startTime!,
      end: endTime!,
    },
  });

  const passThrough = new PassThrough();
  ffmpeg(videoStream).toFormat("mp4").pipe(passThrough);

  const chunks: Uint8Array[] = [];
  for await (const chunk of passThrough) {
    chunks.push(chunk);
  }
  const ret = Buffer.concat(chunks);

  uploadData({
    path: "savedClips/test",
    data: ret,
    options: {
      contentType: "video/mp4",
    },
  });

  return true;
};
