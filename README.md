# Vercel-Ready Quiz Solver

This project is a serverless quiz solver designed for the  
**TDS LLM Analysis Quiz**.

## 📌 Features
- Works on **Vercel serverless functions**
- Correct JSON parsing (`await req.json()`)
- Validates secrets
- Returns the correct HTTP codes
- Has a separate solver module for maintainability

---

## 📂 Folder Structure

```
vercel-quiz-solver/
├── api/
│ └── index.js # The main serverless API endpoint
├── llm/
│ └── solver.js # Quiz solving logic
├── .env.example # Add QUIZ_SECRET here
└── README.md
```

---

## 🚀 Deploying to Vercel

1. Upload this folder to a GitHub repo  
2. Import the repo in Vercel  
3. Add environment variable:

```QUIZ_SECRET=your_secret_here```


4. Deploy  
5. Your API endpoint becomes:

```https://your-project-name.vercel.app/api```


---

## 🔧 Testing

Send a POST request:

```json
{
  "email": "your-email",
  "secret": "your_secret_here",
  "url": "https://tds-llm-analysis.s-anand.net/demo"
}
```
Expected:
```json
{
  "accepted": true,
  "solved": true,
  "answerPayload": {
    "answer": "vercel-solver-working"
  }
}
```

🧠 Upgrading the Solver
You can extend llm/solver.js to:

Use Browserless API

Fetch PDFs/CSVs

Execute JS-rendered pages

Analyze data

Handle multi-step quizzes

You're now ready for the quiz!

---

# 🎉 Done!  