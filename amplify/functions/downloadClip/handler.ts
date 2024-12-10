import { Schema } from "../../data/resource";
import { uploadData } from "@aws-amplify/storage";
// import ytdl from "ytdl-core";
import { createReadStream } from "fs";
// import ffmpegPath from "@ffmpeg-installer/ffmpeg";
// import ffmpeg from "fluent-ffmpeg";
// import { PassThrough } from "stream";
import youtubeDl from "youtube-dl-exec";

export const handler: Schema["downloadClip"]["functionHandler"] = async (
  event
) => {
  // ffmpeg.setFfmpegPath(ffmpegPath.path);
  console.log(event.arguments.videoUrl);
  const { videoUrl } = event.arguments;

  const outputPath = "savedClips/test";
  await youtubeDl(videoUrl!, {
    format: "mp4",
    output: outputPath,
  });

  console.log("Output Path", outputPath);

  // const passThrough = new PassThrough();
  // const streamResult = ffmpeg(videoStream).toFormat("mp4").pipe(passThrough);
  // console.log(streamResult);

  const stream = createReadStream(outputPath);

  console.log("Stream", stream);

  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
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
