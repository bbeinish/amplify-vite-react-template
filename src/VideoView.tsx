import { useRef, useEffect, useState } from "react";
import videojs from "video.js";
import Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";
import "videojs-youtube";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import "./VideoView.css";
import { uploadData } from "aws-amplify/storage";

const client = generateClient<Schema>();

interface VideoViewProps {
  initialVideo: Schema["Video"]["type"];
  onSave: (video: Schema["Video"]["type"]) => void;
  onCancel: () => void;
}

function VideoView({ initialVideo, onCancel }: VideoViewProps) {
  const [videoSrc, setVideoSrc] = useState<string | null | undefined>(
    initialVideo.url?.includes("youtube.com") ||
      initialVideo.url?.includes("youtu.be")
      ? initialVideo.url
      : null
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
  const [videoDate, setVideoDate] = useState<string | null | undefined>(
    initialVideo.date
  );
  const [tags, setTags] = useState<string[]>(initialVideo.tags ?? []);
  const [newTag, setNewTag] = useState<string>("");
  const [allTags, setAllTags] = useState<string[]>([]);

  const videoNode = useRef<HTMLVideoElement | null>(null);
  const player = useRef<Player | null>(null);
  const [clipReady, setClipReady] = useState<boolean>(false);

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

      if (
        initialVideo.url &&
        !initialVideo.url.includes("youtube.com") &&
        !initialVideo.url.includes("youtu.be")
      ) {
        if (!videoSrc) {
          const fileInput = document.createElement("input");
          fileInput.type = "file";
          fileInput.accept = "video/*";
          fileInput.onchange = (e) => {
            const input = e.target as HTMLInputElement;
            if (input.files?.[0]) {
              handleFileUpload({
                target: input,
              } as React.ChangeEvent<HTMLInputElement>);
            }
          };
          fileInput.click();
        }
      }
    }
  }, []);

  useEffect(() => {
    if (videoSrc) {
      setupPlayer();
    }

    return () => {
      if (player.current) {
        // player.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    const fetchTags = async () => {
      const response = await client.models.Tag.list();
      setAllTags(response.data.map((tag) => tag.name!));
    };
    fetchTags();
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

  const handleAddTag = async () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      if (!allTags.includes(newTag)) {
        // Save new tag to database
        await client.models.Tag.create({ name: newTag });
        setAllTags([...allTags, newTag]);
      }
      setNewTag("");
    }
  };

  const handleSelectExistingTag = (tagName: string) => {
    if (!tags.includes(tagName)) {
      setTags([...tags, tagName]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleClipDownload = async (clip: Schema["Clip"]["type"]) => {
    console.log(clip);
    if (videoSrc?.includes("youtube.com") || videoSrc?.includes("youtu.be")) {
      try {
        const response = await client.queries.downloadClip({
          videoUrl: videoSrc,
          startTime: clip.startTime,
          endTime: clip.endTime,
        });
        console.log(response);
        setClipReady(true);
      } catch (error) {
        console.error(error);
      }
    } else {
      const videoElement = player.current?.tech().el() as HTMLVideoElement;
      const videoBlob = await fetch(videoElement.src).then((r) => r.blob());

      const file = new File([videoBlob], videoName!, {
        type: "video/mp4",
      });
      const result = await uploadData({
        path: "allClips/" + videoName + "/" + clip.name + ".mp4",
        data: file,
      });
      console.log(result);
    }
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
        date: videoDate,
        tags: tags,
      });
    } else {
      client.models.Video.create({
        url: videoSrc,
        name: videoName,
        clips: clips,
        date: videoDate,
        tags: tags,
      });
    }
    onCancel();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create a blob URL for the video file
    const blobUrl = URL.createObjectURL(file);
    setVideoSrc(blobUrl);
    setVideoType(file.type || "video/mp4");
    setVideoName(file.name);
  };

  return (
    <div className="main-container">
      <div className="video-header">
        <input
          type="text"
          placeholder="Video Name"
          value={videoName || ""}
          onChange={(e) => setVideoName(e.target.value)}
          className="video-input"
        />
        <input
          type="date"
          value={videoDate || ""}
          onChange={(e) => setVideoDate(e.target.value)}
          className="video-input"
        />
        {!initialVideo.url && !videoSrc && (
          <div className="video-buttons">
            <button
              onClick={() => {
                const url = prompt("Enter YouTube URL:");
                if (url) handleLink(url);
              }}
              className="video-button"
            >
              Link YouTube Video
            </button>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="video-button"
            />
          </div>
        )}
      </div>
      <div className="video-container">
        <div className="video-content">
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
              {clipStart !== null ? clipStart!.toFixed(2) + "s" : "N/A"} |
              Current Clip End:{" "}
              {clipEnd !== null ? clipEnd!.toFixed(2) + "s" : "N/A"}
            </p>
          </div>
          <div className="tags-section">
            <h3>Tags</h3>
            <div className="tag-inputs">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add new tag"
              />
              <button onClick={handleAddTag}>Add Tag</button>
              <select
                onChange={(e) => handleSelectExistingTag(e.target.value)}
                value=""
              >
                <option value="">Select existing tag</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
            <div className="selected-tags">
              {tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)}>×</button>
                </span>
              ))}
            </div>
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
                        <b>{clip.name}:</b> Start - {clip.startTime!.toFixed(2)}
                        s, End - {clip.endTime!.toFixed(2)}s
                      </span>
                      <button onClick={() => handleDeleteClip(index)}>X</button>
                      <button onClick={() => handleClipDownload(clip)}>
                        Download
                      </button>
                      {clipReady && <button>Export</button>}
                    </li>
                  ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoView;
