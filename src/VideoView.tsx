import { useRef, useEffect, useState } from "react";
import videojs from "video.js";
import Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";
import "videojs-youtube";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

interface VideoViewProps {
  initialVideo: Schema["Video"]["type"];
  onSave: (video: Schema["Video"]["type"]) => void;
  onCancel: () => void;
}

function VideoView({ initialVideo, onCancel }: VideoViewProps) {
  const [videoSrc, setVideoSrc] = useState<string | null | undefined>(
    initialVideo.url
  );
  const [videoType, setVideoType] = useState<string>(() => {
    if (
      initialVideo.url?.includes("youtube.com") ||
      initialVideo.url?.includes("youtu.be")
    ) {
      return "video/youtube";
    }
    return initialVideo.url ? "video/mp4" : "";
  });
  const [clipStart, setClipStart] = useState<number | null | undefined>(null);
  const [clipEnd, setClipEnd] = useState<number | null | undefined>(null);
  const [clipName, setClipName] = useState<string>("");
  const [clips, setClips] = useState<Schema["Clip"]["type"][]>();
  const [videoName, setVideoName] = useState<string | null | undefined>(
    initialVideo.name
  );
  const videoNode = useRef<HTMLVideoElement | null>(null);
  const player = useRef<Player | null>(null);

  const setupPlayer = () => {
    if (!videoNode.current || !videoSrc) return;

    player.current = videojs(
      videoNode.current,
      {
        techOrder: ["youtube", "html5"],
        sources: [
          {
            src: videoSrc,
            type: videoType,
          },
        ],
      },
      () => {
        console.log("Player is ready");
      }
    );
  };

  useEffect(() => {
    if (initialVideo && initialVideo.clips) {
      const validClips = initialVideo.clips.filter(
        (clip): clip is Schema["Clip"]["type"] =>
          clip !== null && clip !== undefined
      );
      setClips(validClips);
    }

    return () => {
      if (player.current) {
        // player.current.dispose();
      }
    };
  }, []);

  const handleLink = (url: string) => {
    if (url && (url.includes("youtube.com") || url.includes("youtu.be"))) {
      setVideoSrc(url);
      setVideoType("video/youtube");
    } else if (url) {
      setVideoSrc(url);
      setVideoType("video/mp4"); // Assuming the linked video is mp4 for simplicity
    }
  };

  const handleSetClipStart = () => {
    if (player.current) {
      setClipStart(player.current.currentTime());
    }
  };

  const handleSetClipEnd = () => {
    if (player.current) {
      setClipEnd(player.current.currentTime());
    }
  };

  const handleSaveClip = () => {
    if (
      clipStart !== null &&
      clipEnd !== null &&
      clipStart! < clipEnd! &&
      clipName
    ) {
      const newClip: Schema["Clip"]["type"] = {
        name: clipName,
        startTime: clipStart,
        endTime: clipEnd,
      };
      setClips([...clips!, newClip]);
      setClipStart(null);
      setClipEnd(null);
      setClipName("");
    } else {
      alert(
        "Invalid clip times or name. Please ensure start time is before end time and name is provided."
      );
    }
  };

  const handleClipClick = (clip: Schema["Clip"]["type"]) => {
    if (player.current) {
      player.current.currentTime(clip.startTime!);
    }
  };

  const handleDeleteClip = (index: number) => {
    setClips(clips!.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!videoName || !videoSrc) {
      alert("Please provide a video name and load a video first");
      return;
    }

    if (initialVideo.id !== "") {
      client.models.Video.update({
        id: initialVideo.id,
        name: videoName,
        clips: clips,
      });
    } else {
      client.models.Video.create({
        url: videoSrc,
        name: videoName,
        clips: clips,
      });
    }
    onCancel();
  };

  return (
    <div className="main-container">
      <div className="video-container">
        <div>
          <input
            type="text"
            placeholder="Video Name"
            value={videoName || ""}
            onChange={(e) => setVideoName(e.target.value)}
          />
          {!initialVideo.url && !videoSrc && (
            <button
              onClick={() => {
                const url = prompt("Enter video URL:");
                if (url) handleLink(url);
              }}
            >
              Link Video
            </button>
          )}
        </div>
        {videoSrc && (
          <div data-vjs-player>
            <video
              ref={(node) => {
                videoNode.current = node;
                if (node) {
                  setupPlayer();
                }
              }}
              id="video-player"
              className="video-js vjs-default-skin"
              controls
              preload="auto"
              width="720"
              height="420"
            />
          </div>
        )}
        {videoSrc && (
          <div>
            <button onClick={handleSetClipStart}>Set Clip Start</button>
            <button onClick={handleSetClipEnd}>Set Clip End</button>
            <input
              type="text"
              placeholder="Clip Name"
              value={clipName}
              onChange={(e) => setClipName(e.target.value)}
            />
            <button onClick={handleSaveClip}>Save Clip</button>
          </div>
        )}
        <div>
          <p>
            Current Clip Start:{" "}
            {clipStart !== null ? clipStart!.toFixed(2) + "s" : "N/A"} | Current
            Clip End: {clipEnd !== null ? clipEnd!.toFixed(2) + "s" : "N/A"}
          </p>
        </div>
        <div className="action-buttons">
          <button onClick={handleSave}>Save Video and Clips</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
      <div className="sidebar">
        <div>
          <h2>Clips</h2>
          <ul>
            {clips &&
              clips
                .sort((a, b) => a.startTime! - b.startTime!)
                .map((clip, index) => (
                  <li key={index}>
                    <span onClick={() => handleClipClick(clip)}>
                      <b>{clip.name}:</b> Start - {clip.startTime!.toFixed(2)}s,
                      End - {clip.endTime!.toFixed(2)}s
                    </span>
                    <button onClick={() => handleDeleteClip(index)}>X</button>
                  </li>
                ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default VideoView;
