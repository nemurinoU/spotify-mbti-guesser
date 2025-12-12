import express from 'express';
import hbs from 'hbs';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handlebars setup
app.set('view engine', 'hbs');
app.set('views', './views');

// Static files
app.use(express.static('public'));

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;


const REDIRECT_URI = 'http://127.0.0.1:3000/callback';

const ai = new GoogleGenAI({GEMINI_API_KEY});

// ------------------------------
// ROUTES
// ------------------------------

async function listModels() {
  const response = await ai.models.list();
  console.log(response);
}

//listModels();

// Home page
app.get('/', (req, res) => {
  res.render('index');
});

// Login → redirect to Spotify
app.get('/login', (req, res) => {
  const scope = 'user-top-read';


  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope,
    redirect_uri: REDIRECT_URI
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
});

// Callback → exchange code for tokens
app.get('/callback', async (req, res) => {
  const code = req.query.code;

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    })
  });

  const data = await tokenRes.json();

  console.log("Token scopes:", data.scope);

  // Grab Spotify artists
  const spotify_res = await fetch('https://api.spotify.com/v1/me/top/artists?limit=10&time_range=medium_term', {
      headers: {
        Authorization: `Bearer ${data.access_token}`
      }
    });

  // Give me idea of Spotify Artists
  console.log("Status:", spotify_res.status);

  // List down Spotify Artists for AI consumption
  const artists = await spotify_res.json();
  console.log("Data:", artists);

  let artistNames = "";

  for (const artist of artists.items) {
    artistNames += artist.name + ", ";
  }

  artistNames = artistNames.slice(0, -2); // remove last comma + space

  // AI Reads the Artists
  
  const response = await ai.models.generateContent({
    model: "models/gemini-flash-latest",
    contents:
      "Based on this person's music taste, guess their top 3 MBTI on a percentage on how sure you are, Don't forget to account for extroverted types. Afterwards, Give a small psycho-analysis for the top MBTI that's less than 1 paragraph after. Thank you." +
      artistNames
  });
  
  console.log(response.text);
  /*
  const answer = `
This music taste demonstrates a profound appreciation for emotional depth, atmosphere, and authenticity, often blending highly energetic, soulful expression with deep, introspective, and abstract textures. The balance between classic Japanese psychedelic/post-rock (ジャックス, downy) and direct, heartfelt folk/soul (Ben&Ben, St. Paul) points strongly toward a Feeling-dominant type driven by Intuition.
## Top 3 MBTI Guesses

| Rank | MBTI Type | Confidence Percentage |
| :--- | :--- | :--- |
| **1.** | **INFP** | **45%** |
| **2.** | **ENFP** | **35%** |
| **3.** | **ISFP** | **20%** |

***

### Psycho-Analysis for INFP

The Introverted Feeling (Fi) core of the INFP drives them to seek music that aligns perfectly with their internal values and emotional landscapes. This person’s list is built on authenticity—they appreciate the raw, powerful vocal delivery of St. Paul & The Broken Bones and Ado (Ne-driven external experience), but they temper this with the intense, moody introspection and atmospheric complexity found in artists like downy and ジャックス (Ni/Si appreciation). The overall collection reflects a highly sensitive individual who uses music not just for enjoyment, but as a critical tool for exploring and validating nuanced, often complex emotional states.

***`;*/

  // Pass tokens to the results page
  res.render('callback', { tokenData: JSON.stringify(data), answerData: response.text });
});

// Results page
app.get('/results', (req, res) => {
  res.render('results');
});

// Start server
app.listen(3000, () => {
  console.log('✅ Express + Handlebars running at http://localhost:3000');
});
