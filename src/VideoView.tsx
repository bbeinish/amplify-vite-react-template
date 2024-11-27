/* import { useEffect, useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react"; */
// import type { Schema } from "../amplify/data/resource";
// import { generateClient } from "aws-amplify/data";

import React, { useRef, useEffect, useState } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import Player from "video.js/dist/types/player";
import "videojs-youtube";

// const client = generateClient<Schema>();

function App() {
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [videoType, setVideoType] = useState<string>("");
  const [clipStart, setClipStart] = useState<number | null>(null);
  const [clipEnd, setClipEnd] = useState<number | null>(null);
  const [clipName, setClipName] = useState<string>("");
  const [clips, setClips] = useState<
    Array<{ name: string; start: number; end: number }>
  >([]);
  const [videoName, setVideoName] = useState<string>("");
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

  // useEffect(() => {
  //   if (player.current) {
  //     player.current.src({ src: videoSrc, type: videoType });
  //   }
  // }, [videoSrc, videoType]);

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      const url = URL.createObjectURL(files[0]);
      setVideoSrc(url);
      setVideoType(files[0].type);
    }
  };

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
      clipStart < clipEnd &&
      clipName
    ) {
      setClips([...clips, { name: clipName, start: clipStart, end: clipEnd }]);
      setClipStart(null);
      setClipEnd(null);
      setClipName("");
    } else {
      alert(
        "Invalid clip times or name. Please ensure start time is before end time and name is provided."
      );
    }
  };

  const handleClipClick = (clip: {
    name: string;
    start: number;
    end: number;
  }) => {
    if (player.current) {
      player.current.currentTime(clip.start);
    }
  };

  const handleDeleteClip = (index: number) => {
    setClips(clips.filter((_, i) => i !== index));
  };

  return (
    <div className="main-container">
      <div className="video-container">
        <div>
          <input type="file" accept="video/mp4" onChange={handleUpload} />
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
            {clipStart !== null ? clipStart.toFixed(2) + "s" : "N/A"} | Current
            Clip End: {clipEnd !== null ? clipEnd.toFixed(2) + "s" : "N/A"}
          </p>
        </div>
      </div>
      <div className="sidebar">
        <div>
          <input
            type="text"
            placeholder="Video Name"
            value={videoName}
            onChange={(e) => setVideoName(e.target.value)}
          />
        </div>
        <div>
          <h2>Clips</h2>
          <ul>
            {clips
              .sort((a, b) => a.start - b.start)
              .map((clip, index) => (
                <li key={index}>
                  <span onClick={() => handleClipClick(clip)}>
                    <b>{clip.name}:</b> Start - {clip.start.toFixed(2)}s, End -{" "}
                    {clip.end.toFixed(2)}s
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

export default App;
