import { useEffect, useState } from "react";
import VideoView from "./VideoView";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { useAuthenticator } from "@aws-amplify/ui-react";

const client = generateClient<Schema>();

function App() {
  const [selectedVideo, setSelectedVideo] = useState<
    Schema["Video"]["type"] | null
  >(null);
  const [videos, setVideos] = useState<Array<Schema["Video"]["type"]>>([]);
  const { signOut } = useAuthenticator();

  useEffect(() => {
    client.models.Video.observeQuery().subscribe({
      next: ({ items }) => setVideos(items),
    });
  }, []);

  const handleNewVideo = async () => {
    const video: Schema["Video"]["type"] = {
      name: "Sample Video",
      url: null,
      clips: new Array<Schema["Clip"]["type"]>(),
      id: "",
      createdAt: "",
      updatedAt: "",
      date: new Date().toISOString().split("T")[0],
      tags: [],
    };
    setSelectedVideo(video);
  };

  const handleSelectVideo = (video: Schema["Video"]["type"]) => {
    setSelectedVideo(video);
  };

  const handleReturnToList = () => {
    setSelectedVideo(null);
  };

  const handleSaveVideo = (savedVideo: Schema["Video"]["type"]) => {
    client.models.Video.create(savedVideo);
  };

  if (selectedVideo) {
    return (
      <VideoView
        initialVideo={selectedVideo}
        onSave={handleSaveVideo}
        onCancel={handleReturnToList}
      />
    );
  }

  return (
    <div className="video-list-container">
      <h1>My Videos</h1>
      <button onClick={handleNewVideo}>Create New Video</button>
      <div className="video-list">
        {videos
          .sort(
            (a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime()
          )
          .map((video: Schema["Video"]["type"], index: number) => (
            <div key={index} className="video-item">
              <button onClick={() => handleSelectVideo(video)}>
                {video.name}
              </button>
            </div>
          ))}
      </div>
      <button onClick={signOut}>Sign out</button>
    </div>
  );
}

export default App;
