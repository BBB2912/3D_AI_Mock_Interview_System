import React, { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVideo, faVideoSlash, faMicrophone, faUser } from "@fortawesome/free-solid-svg-icons";
import "../MeetingControls.css";

const MeetingControls = ({ refresh,setAnimation,getEvaluation }) => {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [transcription, setTranscription] = useState("");

  const webcamRef = useRef(null);
  const recognitionRef = useRef(null);

  // Toggle Camera
  const toggleCamera = () => {
    setIsCameraOn((prevState) => !prevState);
  };

  // Bot response logic
  const botResponse = async (text) => {
    console.log("user:", text);
    if (!text) {
      alert("Please provide valid input!");
      return;
    }

    const formData = new FormData();
    formData.append("user_message", text);

    try {
      const response = await fetch("http://localhost:8000/user_input", {
        method: "POST",
        body: formData,
      });

      console.log("response:", response);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      
      if (response.ok) {
        console.log("bot:", data.bot_response);

        // Retrieve previous responses from sessionStorage
        let previousResponses = JSON.parse(sessionStorage.getItem("BotResponses")) || [];

        // Append the new bot response to the array
        previousResponses.push({ Interviewer: data.bot_response });

        // Save the updated responses to sessionStorage
        sessionStorage.setItem("BotResponses", JSON.stringify(previousResponses));

        console.log("Bot Response Stored:", previousResponses);
        
        if(data.bot_response.includes("Thank you for your time. I will now evaluate your performance based on our interview.")){
          getEvaluation(true);
        }
        refresh(data.bot_response)
        setAnimation(data.bot_response)

      } else {
        console.error("Error:", data.error);
      }
    } catch (error) {
      console.error("Error uploading resume:", error);
      alert("There was an error uploading your resume. Please try again.");
    }
  };

  // Initialize Speech Recognition
  const initializeRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.continuous = true; // Enable continuous listening

      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        console.log("transcript", text);
        setTranscription(text);

        // Retrieve previous responses from sessionStorage
        let previousResponses = JSON.parse(sessionStorage.getItem("userResponses")) || [];

        // Append the new user response to the array
        previousResponses.push({ You: text });

        // Save the updated responses to sessionStorage
        sessionStorage.setItem("userResponses", JSON.stringify(previousResponses));

       
        refresh(text)
        // Call bot response with the updated transcription
        botResponse(text); 
        
        // Update user input state
         // Update the parent component
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
      };
    } else {
      alert("Your browser does not support speech recognition.");
    }
  }, [botResponse, transcription]);

  // Start Speech Recognition
  const startRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  // Stop Speech Recognition
  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Initialize Speech Recognition on Mount
  useEffect(() => {
    initializeRecognition();
  },[]);

  return (
    <div className="meeting-container">
      {/* Video Feed */}
      <div className="video-container">
        {isCameraOn ? (
          <Webcam audio={false} ref={webcamRef} className="webcam-feed" />
        ) : (
          <FontAwesomeIcon icon={faUser} className="camera-off-icon" />
        )}

        {/* Buttons Overlay */}
        <div className="controls-overlay">
          <button
            onClick={toggleCamera}
            className={`control-button ${isCameraOn ? "camera-off" : "camera-on"}`}
          >
            <FontAwesomeIcon icon={isCameraOn ? faVideoSlash : faVideo} />
          </button>

          {/* Microphone Button */}
          <button
            className="control-button mic-on"
            onMouseDown={startRecognition}
            onMouseUp={stopRecognition}
          >
            <FontAwesomeIcon icon={faMicrophone} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingControls;
