import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import { pdfjs } from "react-pdf";
import ReactMarkdown from "react-markdown";
import TestRubric from "./TestRubric";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

function App() {
  const [pdfText, setPdfText] = useState("");
  const [disableGenerate, setDisableGenerate] = useState(true);
  const [error, setError] = useState("");
  const [rubric, setRubric] = useState("");
  const [processing, setProcessing] = useState(false);
  const [selectedOption, setSelectedOption] = useState("write");
const [test, setTest] = useState(false);
  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = function (e) {
        const buffer = e.target.result;

        pdfjs
          .getDocument(new Uint8Array(buffer))
          .promise.then((pdfDocument) => {
            let text = "";
            const promises = Array.from(
              new Array(pdfDocument.numPages),
              (el, index) => {
                return pdfDocument.getPage(index + 1).then((page) => {
                  return page.getTextContent().then((textContent) => {
                    return textContent.items.map((item) => item.str).join(" ");
                  });
                });
              }
            );

            Promise.all(promises).then((pageTexts) => {
              text = pageTexts.join("\n");
              setPdfText(text.split(" "));
            });
          });
      };

      reader.readAsArrayBuffer(file);
    }
  };
  useEffect(() => {
    if(selectedOption!== "write"){
    const fetchData = async () => {
      if (pdfText.length > 5000) {
        setError("Content of file is more than 5000 words");
      } else if (pdfText.length > 0) {
        setProcessing(true);
        axios.post("http://localhost:3001/ask-question", {
          model: "v3",
          content:
            "I will provide you some information wait until i say 'DONE' before you do any other thing",
        });
        const batchSize = 800;
        for (let i = 0; i < pdfText.length; i += batchSize) {
          const batch = pdfText.slice(i, i + batchSize).join(" ");

          try {
            await axios.post("http://localhost:3001/ask-question", {
              model: "v3",
              content: batch,
            });
          } catch (error) {
            console.error("Error:", error.message);
          }

          if (Math.floor(pdfText.length / batchSize) === i / batchSize) {
            setDisableGenerate(false);
            setProcessing(false);
          }
        }
      }
    };

    fetchData();}

    else{
      setDisableGenerate(false)
      const fetchData = async () => {
          axios.post("http://localhost:3001/ask-question", {
            model: "gemini",
            content:
              "I will provide you some information wait until i say 'DONE' before you do any other thing",
          });
          const batchSize = 800;
          for (let i = 0; i < pdfText.length; i += batchSize) {
            const batch = pdfText.slice(i, i + batchSize).join(" ");
  
            try {
              await axios.post("http://localhost:3001/ask-question", {
                model: "gemini",
                content: batch,
              });
            } catch (error) {
              console.error("Error:", error.message);
            }
  
            if (Math.floor(pdfText.length / batchSize) === i / batchSize) {
              setDisableGenerate(false);
              setProcessing(false);
            }
          
        }
      };
  
      fetchData();
    }
  }, [pdfText]);

  useEffect(() => {
    if (pdfText.length < 1 && processing === true && error === "")
      setDisableGenerate(true);
  }, [error, pdfText.length, processing]);

  const generateRubric = () => {
    setProcessing(true);
    setDisableGenerate(true);
    axios
      .post("http://localhost:3001/ask-question", {
        model: "v3",
        content:
          "Base on the above,Please create a rubric and criteria for evaluation and also provide maximum points for each criterion in markdown format",
      })
      .then((response) => {
        console.log("response", response.data.reply);
        setRubric(response.data.reply);
        setProcessing(false);
        setDisableGenerate(false);
      });
  };

  const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
  };
  const [text, setText] = useState("");
  const maxWords = 5000;

  const handleTextChange = (event) => {
    const enteredText = event.target.value;
    const words = enteredText.trim().split(/\s+/);
    const wordCount = words.length;

    // Update the state only if the word count is within the limit
    if (wordCount <= maxWords) {
      setText(enteredText);
      setPdfText(enteredText.split(' '));
    }
  };

  return (
    <div className="App">
     {/* {test?<TestRubric generatedRubric={rubric}/>: */}
     <>
     <div style={{ marginTop: 20 }}>
        <label>
          <input
            type="radio"
            value="write"
            checked={selectedOption === "write"}
            onChange={handleOptionChange}
          />
          Write description or topic of interest or
        </label>

        <label>
          <input
            type="radio"
            value="file"
            checked={selectedOption === "file"}
            onChange={handleOptionChange}
          />
          Upload a pdf file
        </label>
      </div>
      {selectedOption === "write" ? (
        <>
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder="Type your text here..."
            style={{ width: "80%", minHeight: "100px" }}
          />

          <p>
            Word Count: {text.trim().split(/\s+/).length}/{maxWords}
          </p>
        </>
      ) : (
        <input type="file" accept=".pdf" onChange={handleFileChange} />
      )}

      <p style={{ color: "red", fontSize: 12 }}>{error}</p>
      {processing && <p>processing...</p>}
      <div style={{display:'flex',flexDirection:'row'}}>
      <button disabled={disableGenerate} onClick={generateRubric} style={{margin:20}}>
        Generate Rubric
      </button>
      {/* <button disabled={disableGenerate} onClick={()=>setTest(true)} style={{margin:20}}>
        Test Rubric
      </button> */}
      </div>
      <ReactMarkdown>{rubric}</ReactMarkdown></>
      {/* } */}
     
    </div>
  );
}

export default App;
