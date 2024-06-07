import React, {useState, useEffect} from 'react';
import axios from 'axios';
import './App.css';


const videoServerUrl = 'http://localhost:3000';
// const videoServerUrl = 'https://8f38-2601-589-4f81-5540-2595-876a-6880-8cca.ngrok-free.app';

// axios.defaults.withCredentials = true;

const axiosInstance = axios.create({
  baseURL: videoServerUrl
});

function App() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);


  const handleLogin = async () => {
    try {
      const response = await axiosInstance.post(`/videos`, {password});
      setAuthenticated(true);
      setVideos(response.data);
    } catch
      (error)
      {
        console.error('Error during login:', error);
        alert('Authentication failed');
      }
    }
    ;

    const handleVideoClick = (video) => {
      setCurrentVideo(video);
    };

    function generateVideo(video) {
      return (
        <div>
          <h2>Now Playing: {currentVideo}</h2>
          <video width="600" controls key={video}>
            <source src={`${videoServerUrl}/video/${video}`} type="video/mp4"/>
          </video>
        </div>
      );
    }

    return (
      <div className="App">
        {!authenticated ? (
          <div>
            <h2>Website for my baby girl only. What is her name????</h2>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleLogin}>Login</button>
          </div>
        ) : (
          <div>
            <h2>Video List</h2>
            <ul>
              {videos.map((video) => (
                <li key={video} onClick={() => handleVideoClick(video)}>
                  {video}
                </li>
              ))}
            </ul>
            {currentVideo && generateVideo(currentVideo)}
          </div>
        )}
      </div>
    );
  }

  export default App;
