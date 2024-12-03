import { useEffect, useState } from "react";
import VideoView from "./VideoView";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { useAuthenticator } from "@aws-amplify/ui-react";
import Select from "react-select";
import { MultiValue } from "react-select";

const client = generateClient<Schema>();

function App() {
  const [selectedVideo, setSelectedVideo] = useState<
    Schema["Video"]["type"] | null
  >(null);
  const [videos, setVideos] = useState<Array<Schema["Video"]["type"]>>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const { signOut } = useAuthenticator();

  useEffect(() => {
    client.models.Video.observeQuery().subscribe({
      next: ({ items }) => setVideos(items),
    });
  }, []);

  useEffect(() => {
    const fetchTags = async () => {
      const response = await client.models.Tag.list();
      setAllTags(response.data.map((tag) => tag.name!));
    };
    fetchTags();
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

  const tagOptions = allTags.map((tag) => ({ value: tag, label: tag }));

  const handleTagChange = (
    selectedOptions: MultiValue<{ value: string; label: string }>
  ) => {
    setSelectedTags(
      selectedOptions ? selectedOptions.map((opt) => opt.value) : []
    );
  };

  const filteredVideos = videos.filter(
    (video) =>
      selectedTags.length === 0 ||
      selectedTags.every((tag) => video.tags?.includes(tag))
  );

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
      <div className="tag-selection">
        <Select
          isMulti
          options={tagOptions}
          onChange={handleTagChange}
          placeholder="Filter by tags..."
          className="tag-select"
        />
      </div>
      <div className="video-list">
        {filteredVideos
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
