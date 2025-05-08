import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Format the prompt to get survey question suggestions
    const formattedPrompt = `Generate 5 professional survey questions about: ${prompt}. 
    Format the response as a JSON array of objects with 'type' and 'question' properties.
    Types should be one of: 'text', 'multiple-choice', 'checkbox', 'dropdown', 'scale', 'date'.
    For multiple-choice, checkbox, and dropdown, include an 'options' array with 4-5 possible answers.
    Example: 
    [
      {
        "type": "text",
        "question": "What is your job title?"
      },
      {
        "type": "multiple-choice",
        "question": "How satisfied are you with our service?",
        "options": ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very dissatisfied"]
      }
    ]`;

    // Check for Grok API key
    const xaiApiKey = process.env.XAI_API_KEY;

    if (xaiApiKey) {
      try {
        console.log("Attempting to use Grok API");

        // Use the correct Grok API endpoint
        const grokResponse = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${xaiApiKey}`,
            },
            body: JSON.stringify({
              model: "llama3-70b-8192",
              messages: [
                {
                  role: "system",
                  content:
                    "You are a helpful assistant that specializes in creating survey questions.",
                },
                {
                  role: "user",
                  content: formattedPrompt,
                },
              ],
              temperature: 0.7,
              max_tokens: 1024,
            }),
          }
        );

        if (grokResponse.ok) {
          const data = await grokResponse.json();
          if (
            data &&
            data.choices &&
            data.choices.length > 0 &&
            data.choices[0].message
          ) {
            const content = data.choices[0].message.content;
            const questions = parseQuestionsFromContent(content);
            return NextResponse.json({ questions });
          }
        } else {
          console.error("Grok API error:", await grokResponse.text());
        }
      } catch (error) {
        console.error("Error using Grok API:", error);
      }
    }

    // Fallback to OpenAI if Grok fails
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (openaiApiKey) {
      try {
        console.log("Falling back to OpenAI API");
        const openaiResponse = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "system",
                  content:
                    "You are a helpful assistant that specializes in creating survey questions.",
                },
                {
                  role: "user",
                  content: formattedPrompt,
                },
              ],
              temperature: 0.7,
              max_tokens: 1024,
            }),
          }
        );

        if (openaiResponse.ok) {
          const data = await openaiResponse.json();
          if (
            data &&
            data.choices &&
            data.choices.length > 0 &&
            data.choices[0].message
          ) {
            const content = data.choices[0].message.content;
            const questions = parseQuestionsFromContent(content);
            return NextResponse.json({ questions });
          }
        } else {
          console.error("OpenAI API error:", await openaiResponse.text());
        }
      } catch (error) {
        console.error("Error using OpenAI API:", error);
      }
    }

    // If both APIs fail, generate mock questions
    console.log("Using mock questions as fallback");
    const mockQuestions = generateMockQuestions(prompt);
    return NextResponse.json({ questions: mockQuestions });
  } catch (error) {
    console.error("Error in AI suggestion route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function parseQuestionsFromContent(content: string) {
  try {
    // First try to parse the entire content as JSON
    try {
      const parsed = JSON.parse(content);
      // If it parsed but isn't an array, look for an array in the content
      if (Array.isArray(parsed)) {
        return parsed;
      } else {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    } catch (initialError) {
      // If direct parsing fails, try to extract a JSON array from the content
      console.error("Initial JSON parse failed:", initialError);
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
  } catch (error) {
    console.error("Failed to parse questions:", error);
  }

  // Return mock questions if parsing fails
  return generateMockQuestions();
}

function generateMockQuestions(topic = "") {
  const topicText = topic ? ` about ${topic}` : "";

  return [
    {
      type: "text",
      question: `What are your thoughts${topicText}?`,
    },
    {
      type: "multiple-choice",
      question: `How would you rate your experience${topicText}?`,
      options: ["Excellent", "Good", "Average", "Poor", "Very poor"],
    },
    {
      type: "checkbox",
      question: `Which aspects${topicText} are important to you?`,
      options: [
        "Quality",
        "Price",
        "Customer service",
        "Convenience",
        "Features",
      ],
    },
    {
      type: "scale",
      question: `How likely are you to recommend this${topicText} to others?`,
    },
    {
      type: "dropdown",
      question: `How often do you engage with${topicText}?`,
      options: ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly", "Never"],
    },
  ];
}
