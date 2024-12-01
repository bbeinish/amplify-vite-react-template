import { useRef, useEffect, useState } from "react";
import videojs from "video.js";
import Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";
import "videojs-youtube";
import type { Schema } from "../amplify/data/resource";

interface VideoViewProps {
  initialVideo: Schema["Video"]["type"];
  onSave: (video: Schema["Video"]["type"]) => void;
  onCancel: () => void;
}

function VideoView({ initialVideo, onSave, onCancel }: VideoViewProps) {
  const [videoSrc, setVideoSrc] = useState<string | null | undefined>(
    initialVideo.url
  );
  const [videoType, setVideoType] = useState<string>("");
  const [clipStart, setClipStart] = useState<number | null | undefined>(null);
  const [clipEnd, setClipEnd] = useState<number | null | undefined>(null);
  const [clipName, setClipName] = useState<string>("");
  const [clips, setClips] = useState<Array<Schema["Clip"]["type"]> | null>(
    new Array<Schema["Clip"]["type"]>()
  );
  const [videoName, setVideoName] = useState<string | null | undefined>(
    initialVideo.name
  );
  const videoNode = useRef<HTMLVideoElement | null>(null);
  const player = useRef<Player | null>(null);

  useEffect(() => {
    if (videoNode.current) {
      player.current = videojs(videoNode.current, {}, () => {
        console.log("Player is ready");
      });
    }

    return () => {
      if (player.current) {
        player.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    // Dispose of existing player first
    if (player.current) {
      player.current.dispose();
    }

    // Reinitialize player with new source
    if (videoNode.current) {
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
    }

    return () => {
      if (player.current) {
        player.current.dispose();
      }
    };
  }, [videoSrc, videoType]); // Dependency array includes videoSrc and videoType

  //   const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  //     const files = event.target.files;
  //     if (files && files[0]) {
  //       const url = URL.createObjectURL(files[0]);
  //       setVideoSrc(url);
  //       setVideoType(files[0].type);
  //     }
  //   };

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

    onSave({
      name: videoName,
      url: videoSrc,
      clips: clips,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
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
          <button
            onClick={() => {
              const url = prompt("Enter video URL:");
              if (url) handleLink(url);
            }}
          >
            Link Video
          </button>
        </div>
        {videoSrc && (
          <div data-vjs-player>
            <video
              ref={videoNode}
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
