import React, { useState } from "react";
import Navbar from "./components/Navbar";
import PDFUpload from "./components/PDFUpload";
import InterviewPanel from "./components/InterviewPanel";
import ResultsPallet from "./components/ResultsPallet"; // Assuming you have a ResultsPallet component
import "./App.css";

function App() {
  const [showPDFUpload, setShowPDFUpload] = useState(true); // Control which component to show
  const [interviewResponse, setInterviewResponse] = useState(null); // Store the response from PDFUpload
  const [evaluationData, setEvaluationData] = useState(null); // Store the evaluation data

  // Callback to handle successful upload
  const handleUploadSuccess = (response) => {
    setInterviewResponse(response); // Set the response from PDFUpload
    setShowPDFUpload(false); // Switch to InterviewPanel
  };

  // Callback to trigger evaluation and show ResultsPallet
  const handleEvaluation = (evaluationData) => {
    setEvaluationData(evaluationData); // Store the evaluation data
  };

  return (
    <div className="App">
      <Navbar />
      {showPDFUpload ? (
        <PDFUpload onUploadSuccess={handleUploadSuccess} />
      ) : evaluationData ? ( // Show ResultsPallet only when evaluationData is available
        <ResultsPallet evaluationData={evaluationData} />
      ) : (
        <InterviewPanel
          response={interviewResponse}
          setEvaluation={handleEvaluation} // Pass the handleEvaluation function to InterviewPanel
        />
      )}
      {/* <ResultsPallet/> */}
    </div>
  );
}

export default App;
