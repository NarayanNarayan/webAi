import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to read HTML file
function readHtmlFile() {
  try {
    const htmlPath = join(__dirname, 'index.html');
    const htmlContent = readFileSync(htmlPath, 'utf8');
    return htmlContent;
  } catch (error) {
    console.error('Error reading HTML file:', error);
    return '';
  }
}

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  temperature: 0
});

const systemTemplate = "Summarize the following HTML content and there are code snippets in the html content, add relevent code snippets with explanation";
const promptTemplate = ChatPromptTemplate.fromMessages([
    ["system", systemTemplate],
    ["user", "{html}"],
  ]);

// Read HTML content and pass to PromptTemplate
const htmlContent = readHtmlFile();
const promptValue = await promptTemplate.invoke({
  html: htmlContent,
});

const response = await model.invoke(promptValue);
console.log(`${response.content}`);