import React from "react";

const DebugPage = () => {
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>✅ Frontend is Running!</h1>
      <p>If you can see this page, React is working.</p>
      
      <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#f0f0f0" }}>
        <h2>Debug Info:</h2>
        <p><strong>Frontend URL:</strong> {window.location.href}</p>
        <p><strong>API Base URL:</strong> {import.meta.env.VITE_API_BASE_URL}</p>
        <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h2>Test Backend Connection:</h2>
        <button onClick={testBackend} style={{ padding: "10px 20px", cursor: "pointer" }}>
          Click to Test Backend
        </button>
        <div id="test-result" style={{ marginTop: "10px" }}></div>
      </div>
    </div>
  );
};

const testBackend = async () => {
  const resultDiv = document.getElementById("test-result");
  if (!resultDiv) return;
  
  resultDiv.innerHTML = "Testing...";
  
  try {
    const response = await fetch("http://localhost:8000/health");
    const data = await response.json();
    resultDiv.innerHTML = `<pre style="color: green">✅ Backend Connected!\n${JSON.stringify(data, null, 2)}</pre>`;
  } catch (error) {
    resultDiv.innerHTML = `<pre style="color: red">❌ Backend Error:\n${error}</pre>`;
  }
};

export default DebugPage;
