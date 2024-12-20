import { Schema } from "../../data/resource";
import { uploadData } from "@aws-amplify/storage";
// import ytdl from "ytdl-core";
import { createReadStream } from "fs";
// import ffmpegPath from "@ffmpeg-installer/ffmpeg";
// import ffmpeg from "fluent-ffmpeg";
// import { PassThrough } from "stream";
import { exec } from "child_process";

export const handler: Schema["downloadClip"]["functionHandler"] = async (
  event
) => {
  // ffmpeg.setFfmpegPath(ffmpegPath.path);
  console.log(event.arguments.videoUrl);
  const { videoUrl } = event.arguments;

  // I will probably have to output to a specific path like "tmp/"
  const outputPath = "/tmp/savedClips/test";

  await downloadVideo(videoUrl!, outputPath);

  console.log("Output Path", outputPath);

  // const passThrough = new PassThrough();
  // const streamResult = ffmpeg(videoStream).toFormat("mp4").pipe(passThrough);
  // console.log(streamResult);

  const stream = createReadStream(outputPath);

  console.log("Stream", stream); // Will probably come back with object. This is to make sure it's not null

  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  const ret = Buffer.concat(chunks);

  console.log("Ret", ret);

  uploadData({
    path: outputPath,
    data: ret,
    options: {
      contentType: "video/mp4",
    },
  });

  return true;
};

const downloadVideo = (url: string, outputPath: string) => {
  return new Promise((resolve, reject) => {
    exec(`/opt/bin/yt-dlp ${url} -o ${outputPath}`, (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${error.message}`);
      } else if (stderr) {
        reject(`Stderr: ${stderr}`);
      } else {
        resolve(stdout);
      }
    });
  });
};
