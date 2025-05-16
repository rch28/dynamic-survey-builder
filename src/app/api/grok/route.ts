import type { NextRequest } from "next/server";
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorType,
  logApiRequest,
} from "@/lib/api-utils";
import { validateRequest, formatValidationErrors } from "@/lib/validation";
import { z } from "zod";
import { requireAuth, checkRateLimit } from "@/lib/auth";

// Simple in-memory cache for AI responses
const responseCache: Record<string, { questions: any[]; expires: number }> = {};
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Validation schema
const promptSchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt is required")
    .max(500, "Prompt is too long"),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (!authResult.success) return authResult.error;

    const user = authResult.user;
    logApiRequest("POST", "/api/grok", user.id);

    // Check rate limit (10 requests per minute)
    if (!checkRateLimit(`grok:${user.id}`, 10, 60 * 1000)) {
      return createErrorResponse(
        ErrorType.RATE_LIMITED,
        "Too many requests. Please try again later."
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = await validateRequest(promptSchema, body);

    if (!validation.success) {
      return createErrorResponse(
        ErrorType.VALIDATION_ERROR,
        "Invalid prompt data",
        formatValidationErrors(validation.error)
      );
    }

    const { prompt } = validation.data;

    // Check cache first
    const cacheKey = `${user.id}:${prompt.toLowerCase().trim()}`;
    if (
      responseCache[cacheKey] &&
      responseCache[cacheKey].expires > Date.now()
    ) {
      return createSuccessResponse({
        questions: responseCache[cacheKey].questions,
        source: "cache",
      });
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
    let questions = null;
    let source = "unknown";

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
            questions = parseQuestionsFromContent(content);
            source = "grok";
          }
        } else {
          console.error("Grok API error:", await grokResponse.text());
        }
      } catch (error) {
        console.error("Error using Grok API:", error);
      }
    }

    // Fallback to OpenAI if Grok fails
    if (!questions) {
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
              questions = parseQuestionsFromContent(content);
              source = "openai";
            }
          } else {
            console.error("OpenAI API error:", await openaiResponse.text());
          }
        } catch (error) {
          console.error("Error using OpenAI API:", error);
        }
      }
    }

    // If both APIs fail, generate mock questions
    if (!questions) {
      console.log("Using mock questions as fallback");
      questions = generateMockQuestions(prompt);
      source = "mock";
    }

    // Cache the result
    responseCache[cacheKey] = {
      questions,
      expires: Date.now() + CACHE_TTL,
    };

    return createSuccessResponse({ questions, source });
  } catch (error) {
    console.error("Error in AI suggestion route:", error);
    return createErrorResponse(
      ErrorType.INTERNAL_ERROR,
      "Failed to generate survey questions"
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
