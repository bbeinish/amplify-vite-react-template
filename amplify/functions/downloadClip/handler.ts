import { Schema } from "../../data/resource";
import { uploadData } from "@aws-amplify/storage";
import ytdl from "ytdl-core";
// import ffmpegPath from "@ffmpeg-installer/ffmpeg";
// import ffmpeg from "fluent-ffmpeg";
// import { PassThrough } from "stream";

export const handler: Schema["downloadClip"]["functionHandler"] = async (
  event
) => {
  // ffmpeg.setFfmpegPath(ffmpegPath.path);
  console.log(event.arguments.videoUrl);
  const { videoUrl, startTime, endTime } = event.arguments;
  const videoStream = ytdl(videoUrl!, {
    quality: "highest",
    range: {
      start: startTime!,
      end: endTime!,
    },
  });

  console.log("Video Stream", videoStream);

  // const passThrough = new PassThrough();
  // const streamResult = ffmpeg(videoStream).toFormat("mp4").pipe(passThrough);
  // console.log(streamResult);

  const chunks: Uint8Array[] = [];
  for await (const chunk of videoStream) {
    chunks.push(chunk);
  }
  const ret = Buffer.concat(chunks);

  console.log("Ret", ret);

  uploadData({
    path: "savedClips/test",
    data: ret,
    options: {
      contentType: "video/mp4",
    },
  });

  return true;
};
