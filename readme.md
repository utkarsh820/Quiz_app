
## Description: 
The app was created with help of Anti-Gravity for test purpose.
which turn out to be a success.
Can be used by Studends or Anyone.

## Pros:
- No subscription required , works compeletly offline!, just download the zip file and extract it and double click the index.html file
- No ads
- No data collection
- No tracking
- No privacy issues

## Cons:
- No mobile support
- No dark mode
- No score
- No leaderboard

>**but can be always improved or modified to make it better.**

---
# How to use:
- follow the instructions below to create a quiz
- just copy and paste replace the topic with your topic
- No of questions is up to you and model context size my recommendation is 10 questions.
---

```
Create N questions on the topic: "TOPIC"

Output them ONLY in this JSON structure:

{
  "Title": "<TOPIC> Quiz",
  "Type": "quiz",
  "Quiz": [
    {
      "type": "singleSelect",
      "Question": "",
      "Options": ["", "", "", ""],
      "Answer": [],
      "Explanation": ""
    }
  ]
}


RULES:
- Replace N with number of questions required
- All questions must be singleSelect
- Use exactly 4 options
- Answer is the index of correct option inside an array
- Include short Explanation
- No comments
- No text outside JSON
- JSON must be strictly valid
```