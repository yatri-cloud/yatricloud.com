import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";

const Index = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [provider, setProvider] = useState("aws");
  const [certification, setCertification] = useState("Cloud Practitioner");
  const [domains, setDomains] = useState<string[]>([]);
  const [uploadedGuideKey, setUploadedGuideKey] = useState<string | null>(null);
  const [numQuestions, setNumQuestions] = useState("10");
  const [examDuration, setExamDuration] = useState("180");
  const [model, setModel] = useState("mistral");
  const [message, setMessage] = useState("");

  // Load domains when certification changes (only if no guide is uploaded)
  useEffect(() => {
    // Don't load default domains if we have an uploaded guide
    if (uploadedGuideKey) {
      return;
    }

    const loadDomains = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/providers/${provider}/certifications/${certification}/domains`
        );
        setDomains(response.data.domains || []);
      } catch (error) {
        console.error("Error loading domains:", error);
        setDomains([]);
      }
    };

    if (provider && certification) {
      loadDomains();
    }
  }, [certification, provider, uploadedGuideKey]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setMessage("⚠️  No file selected");
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setMessage("❌ Only PDF files are allowed");
      return;
    }

    setUploading(true);
    setMessage("📤 Uploading and processing PDF...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("provider", provider);
      formData.append("certification", certification);

      console.log(`Uploading file: ${file.name}, Provider: ${provider}, Certification: ${certification}`);

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/exam-guides/upload`,
        formData,
        { 
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 30000 // 30 second timeout
        }
      );

      console.log("Upload response:", response.data);

      // Set uploaded guide key to prevent overwriting with defaults
      const guideKey = `${provider}_${certification}`;
      setUploadedGuideKey(guideKey);
      
      setDomains(response.data.domains || []);
      setMessage(`✅ Success! Extracted ${response.data.domains?.length || 0} domains from your PDF`);

      setTimeout(() => setMessage(""), 4000);
    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMsg = error.response?.data?.error || error.message || "Unknown error";
      setMessage(`❌ Upload failed: ${errorMsg}`);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const downloadCSV = (data: any) => {
    const questions = data.questions;
    
    // Create CSV header matching the structure:
    // Question, Question Type, Answer Option 1, Explanation 1, Answer Option 2, Explanation 2, ..., Correct Answers, Overall Explanation, Domain
    const headers = [
      "Question",
      "Question Type",
      "Answer Option 1",
      "Explanation 1",
      "Answer Option 2",
      "Explanation 2",
      "Answer Option 3",
      "Explanation 3",
      "Answer Option 4",
      "Explanation 4",
      "Answer Option 5",
      "Explanation 5",
      "Answer Option 6",
      "Explanation 6",
      "Correct Answers",
      "Overall Explanation",
      "Domain"
    ];

    const rows = questions.map((q: any) => {
      // Get options and explanations
      const options = q.options || [];
      const explanations = q.option_explanations || options.map((opt: string) => "");
      
      // Correct answer(s) - handle both single and multiple correct answers
      const correctAnswers = q.correct_answers || [q.correct_option || 0];
      const correctAnswersStr = Array.isArray(correctAnswers) 
        ? correctAnswers.map(i => i + 1).join(",")
        : String(correctAnswers + 1);

      // Build row with options and explanations
      const row = [
        q.question || "",
        q.question_type || "multiple-choice",
      ];

      // Add options and explanations (up to 6 options)
      for (let i = 0; i < 6; i++) {
        row.push(options[i] || "");
        row.push(explanations[i] || "");
      }

      // Add correct answers, overall explanation, and domain
      row.push(correctAnswersStr);
      row.push(q.overall_explanation || q.explanation || "");
      row.push(q.domain || selectedDomain || "");

      return row;
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${provider}-${certification}-questions.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleGenerateAsync = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/courses`,
        {
          provider,
          certification,
          num_questions: parseInt(numQuestions),
          exam_duration_minutes: parseInt(examDuration),
          model,
        }
      );

      setMessage("✅ Questions generated! Downloading CSV...");
      downloadCSV(response.data);
      
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      setMessage(`❌ Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Question Generator</h1>
        <p className="text-muted-foreground mb-8">Generate exam questions and download as CSV</p>

        <div className="space-y-6 bg-card border border-border p-6 rounded-lg text-foreground">
          
          {/* Message Display */}
          {message && (
            <div className={`p-3 rounded-md text-sm ${
              message.includes('✅') ? 'bg-green-900/30 text-green-200' :
              message.includes('❌') ? 'bg-red-900/30 text-red-200' :
              'bg-blue-900/30 text-blue-200'
            }`}>
              {message}
            </div>
          )}

          {/* PDF Upload */}
          <div className="border-2 border-dashed border-border p-6 rounded-lg hover:border-primary transition-colors">
            <label className="block text-sm font-medium mb-3 cursor-pointer">
              📄 Upload Exam Guide PDF
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={uploading}
              className="w-full text-sm file:px-4 file:py-2 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground file:cursor-pointer file:disabled:opacity-50"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Upload your AWS exam guide PDF to auto-extract exam domains
            </p>
            {uploading && <p className="text-xs text-blue-400 mt-2">⏳ Processing...</p>}
          </div>

          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Cloud Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
            >
              <option value="aws">AWS</option>
              <option value="azure">Azure</option>
              <option value="gcp">Google Cloud</option>
            </select>
          </div>

          {/* Certification Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Certification</label>
            <input
              type="text"
              value={certification}
              onChange={(e) => setCertification(e.target.value)}
              placeholder="e.g., Cloud Practitioner, Solutions Architect Associate"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
            />
          </div>

          {/* Exam Domain Selection */}
          {/* Domains are auto-assigned by backend from PDF */}

          {/* Number of Questions */}
          <div>
            <label className="block text-sm font-medium mb-2">Number of Questions</label>
            <input
              type="number"
              value={numQuestions}
              onChange={(e) => setNumQuestions(e.target.value)}
              min="1"
              max="100"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
            />
          </div>

          {/* Exam Duration */}
          <div>
            <label className="block text-sm font-medium mb-2">Exam Duration (minutes)</label>
            <input
              type="number"
              value={examDuration}
              onChange={(e) => setExamDuration(e.target.value)}
              min="30"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
            />
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">AI Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
            >
              <option value="mistral">Mistral (Fast)</option>
              <option value="llama2">Llama2</option>
              <option value="neural-chat">Neural Chat</option>
              <option value="gpt-oss">GPT-OSS</option>
            </select>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateAsync}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? "⏳ Generating questions from AI model..." : "Generate & Download CSV"}
          </Button>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-md text-sm border ${
              message.includes("❌") 
                ? "bg-destructive/10 text-destructive border-destructive/30" 
                : "bg-green-500/10 text-green-600 border-green-500/30"
            }`}>
              {message}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Index;
