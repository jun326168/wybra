import { GoogleGenAI } from '@google/genai';
import { query, queryOne } from './postgres';
import { Chat, Message } from './type';
import { z } from 'zod';
import { zodToJsonSchema } from "zod-to-json-schema";

// Type definitions for chat info
interface ChatInfo {
  accepted: boolean;
  user_1_progress: number;
  user_2_progress: number;
  user_1_unlocked: boolean;
  user_2_unlocked: boolean;
}

interface QuizInfo {
  user_1_quiz: QuizQuestion[];
  user_2_quiz: QuizQuestion[];
  last_quiz_level?: number;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

interface User {
  id: string;
  username: string;
  personal_info: Record<string, unknown>;
}


async function getScorePrompt(conversationText: string): Promise<string> {
  return `Analyze this conversation between two people and rate their conversation quality and meaningfulness on a scale of 0-12, where:
- 0-4: Low quality (short messages, no depth, disengaged)
- 5-9: Medium quality (decent engagement, some meaningful exchanges)
- 10-12: High quality (deep conversations, thoughtful responses, strong engagement)

Consider:
- Message depth and thoughtfulness
- Engagement level
- Effort to build connection
- Conversation flow

Conversation:
${conversationText}

Provide scores in this exact JSON format:
{"user1": <score>, "user2": <score>}
`.trim();
}

async function getQuizPrompt(conversationText: string, targetUsername: string): Promise<string> {
  return `Based on this conversation, create exactly 5 multiple-choice questions about ${targetUsername} to test how well the other person knows them.

Conversation:
${conversationText}

Create questions that are:
- Specific to what ${targetUsername} shared in the conversation
- About their interests, goals, preferences, experiences, or personality
- Have exactly 3 options each with only 1 correct answer
- Must be in zh-TW except for special cases that appear in chat

Return the questions as a JSON array. Each question should be an object with:
- question: The question text (string)
- options: Array of exactly 3 possible answers (string[])
- correct: The index (0, 1, or 2) of the correct answer in the options array (number)

Example format:
[
  {
    "question": "What is ${targetUsername}'s favorite hobby?",
    "options": ["Reading", "Swimming", "Cooking"],
    "correct": 0
  },
  ...
]
`.trim();
}

const scoreSchema = z.object({
  user1: z.number(),
  user2: z.number(),
});

const quizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correct: z.number(),
});

const quizArraySchema = z.array(quizQuestionSchema);

const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Initialize Gemini AI client
 */
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  const ai = new GoogleGenAI({
    apiKey: apiKey,
  });
  return ai;
}

/**
 * Calculate progress based on message length and stage
 * Hook stage (1-6 messages): +3 if > 2 chars
 * Passive stage (7+ messages): +0.5 if > 5 chars
 */
export function calculateProgressIncrement(
  messageContent: string,
  messageCount: number
): number {
  if (messageCount <= 6) {
    // Hook stage: if message > 2 chars, add +3
    return messageContent.length > 2 ? 2 : 0;
  } else {
    // Passive stage: if message > 5 chars, add +0.5
    return messageContent.length > 5 ? 0.5 : 0;
  }
}

/**
 * Update user progress in chat
 * Only updates the specific user's progress field in the JSONB, not the entire chat_info
 */
export async function updateUserProgress(
  chatId: string,
  userId: string,
  progressIncrement: number
): Promise<Chat> {
  // Get the current chat to determine which user field to update
  const chat = await queryOne<Chat>(
    'SELECT * FROM chats WHERE id = $1',
    [chatId]
  );

  if (!chat) {
    throw new Error('Chat not found');
  }

  const isUser1 = userId === chat.user_1;
  const progressField = isUser1 ? 'user_1_progress' : 'user_2_progress';

  // Update only the specific progress field using JSONB operators
  const updatedChat = await queryOne<Chat>(
    `UPDATE chats 
     SET chat_info = jsonb_set(
       chat_info,
       '{${progressField}}',
       to_jsonb(
         COALESCE((chat_info->>'${progressField}')::numeric, 0) + $1
       )
     )
     WHERE id = $2 
     RETURNING *`,
    [progressIncrement, chatId]
  );

  return updatedChat!;
}

/**
 * Check if both users have reached a new 100-level milestone
 * Returns the level number if quiz should be generated, 0 otherwise
 * Level = floor(min(user1_progress, user2_progress) / 100)
 * Examples: 90,110 → level 0; 380,320 → level 3
 */
export function shouldGenerateQuiz(chat: Chat): number {
  const chatInfo = chat.chat_info as unknown as ChatInfo;
  const user1Progress = chatInfo.user_1_progress || 0;
  const user2Progress = chatInfo.user_2_progress || 0;

  const quizInfo = chat.quiz_info as unknown as QuizInfo;
  const lastQuizLevel = quizInfo.last_quiz_level || 0;

  // Calculate the current level: floor(min(progress1, progress2) / 100)
  const currentLevel = Math.floor(Math.min(user1Progress, user2Progress) / 100);

  // Generate quiz if we've reached a new level (level >= 1 and greater than last level)
  if (currentLevel >= 1 && currentLevel > lastQuizLevel) {
    return currentLevel;
  }

  return 0;
}

/**
 * Get last N messages from a chat
 */
export async function getLastMessages(
  chatId: string,
  limit: number
): Promise<Message[]> {
  const messages = await query<Message>(
    `SELECT * FROM messages 
     WHERE chat_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2`,
    [chatId, limit]
  );

  return messages.reverse(); // Return in chronological order
}

/**
 * Score users based on conversation using Gemini API
 * Returns scores mapped to chat.user_1 and chat.user_2 positions
 */
export async function scoreConversation(
  messages: Message[],
  chatUser1Id: string,
): Promise<{ user_1_score: number; user_2_score: number }> {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      console.warn('GEMINI_API_KEY not found, returning default scores');
      return { user_1_score: 0, user_2_score: 0 };
    }

    // Prepare conversation for analysis - label by actual chat positions
    const conversationText = messages.map(msg => {
      const role = msg.user_id === chatUser1Id ? 'User1' : 'User2';
      return `${role}: ${msg.content}`;
    }).join('\n');

    const prompt = await getScorePrompt(conversationText);

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [prompt],
      config: {
        responseMimeType: 'application/json',
        // @ts-expect-error - zodToJsonSchema type compatibility
        responseSchema: zodToJsonSchema(scoreSchema),
      },
    });

    const text = response.text ?? '';

    // Parse structured output
    const scores = scoreSchema.parse(JSON.parse(text));

    // Map AI scores to chat positions: User1 -> user_1, User2 -> user_2
    return {
      user_1_score: Math.max(0, Math.min(12, scores.user1)),
      user_2_score: Math.max(0, Math.min(12, scores.user2))
    };
  } catch (error) {
    console.error('Error scoring conversation:', error);
    return { user_1_score: 0, user_2_score: 0 };
  }
}

/**
 * Update user scores in chat
 * Scores are already mapped to user_1 and user_2 positions
 * Optionally includes progress increment for sender to combine updates atomically
 */
export async function updateUserScores(
  chatId: string,
  user_1_score: number,
  user_2_score: number,
  senderId?: string,
  senderProgressIncrement?: number
): Promise<Chat> {
  // Determine if sender is user_1 or user_2
  let senderIsUser1 = false;
  if (senderId) {
    const chat = await queryOne<Chat>(
      'SELECT user_1, user_2 FROM chats WHERE id = $1',
      [chatId]
    );
    if (!chat) {
      throw new Error('Chat not found');
    }
    senderIsUser1 = chat.user_1 === senderId;
  }

  // Calculate total increments for each user
  const user1Increment = user_1_score + (senderIsUser1 && senderProgressIncrement ? senderProgressIncrement : 0);
  const user2Increment = user_2_score + (!senderIsUser1 && senderProgressIncrement ? senderProgressIncrement : 0);

  // Update both progress fields atomically using JSONB operators
  const updatedChat = await queryOne<Chat>(
    `UPDATE chats 
     SET chat_info = jsonb_set(
       jsonb_set(
         chat_info,
         '{user_1_progress}',
         to_jsonb(
           COALESCE((chat_info->>'user_1_progress')::numeric, 0) + $1
         )
       ),
       '{user_2_progress}',
       to_jsonb(
         COALESCE((chat_info->>'user_2_progress')::numeric, 0) + $2
       )
     )
     WHERE id = $3 
     RETURNING *`,
    [user1Increment, user2Increment, chatId]
  );

  if (!updatedChat) {
    throw new Error('Chat not found');
  }

  return updatedChat;
}

/**
 * Generate quiz questions using Gemini API
 */
export async function generateQuizzes(
  chatId: string,
  user1Id: string,
  user2Id: string
): Promise<void> {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      console.warn('GEMINI_API_KEY not found, skipping quiz generation');
      return;
    }

    // Get all messages
    const messages = await query<Message>(
      `SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC`,
      [chatId]
    );

    // Get user info
    const users = await query<User>(
      `SELECT id, username, personal_info FROM users WHERE id = ANY($1)`,
      [[user1Id, user2Id]]
    );

    const user1 = users.find(u => u.id === user1Id);
    const user2 = users.find(u => u.id === user2Id);

    // Prepare conversation
    const conversationText = messages.map(msg => {
      const user = msg.user_id === user1Id ? user1 : user2;
      return `${user?.username}: ${msg.content}`;
    }).join('\n');

    // Generate quizzes for both users
    const [quiz1, quiz2] = await Promise.all([
      generateQuizForUser(conversationText, user2?.username || 'User2', ai),
      generateQuizForUser(conversationText, user1?.username || 'User1', ai)
    ]);

    // Update chat with quizzes
    const chat = await queryOne<Chat>('SELECT * FROM chats WHERE id = $1', [chatId]);
    if (!chat) return;

    const chatInfo = chat.chat_info as unknown as ChatInfo;
    
    // Calculate the current level: floor(min(progress1, progress2) / 100)
    const user1Progress = chatInfo.user_1_progress || 0;
    const user2Progress = chatInfo.user_2_progress || 0;
    const currentLevel = Math.floor(Math.min(user1Progress, user2Progress) / 100);

    const updatedQuizInfo: QuizInfo = {
      user_1_quiz: quiz1, // User 1's quiz is about User 2
      user_2_quiz: quiz2, // User 2's quiz is about User 1
      last_quiz_level: currentLevel
    };

    await queryOne(
      `UPDATE chats SET quiz_info = $1 WHERE id = $2`,
      [JSON.stringify(updatedQuizInfo), chatId]
    );
  } catch (error) {
    console.error('Error generating quizzes:', error);
  }
}

/**
 * Generate quiz questions about a specific user
 */
async function generateQuizForUser(
  conversationText: string,
  targetUsername: string,
  ai: GoogleGenAI
): Promise<QuizQuestion[]> {

  const prompt = await getQuizPrompt(conversationText, targetUsername);

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [prompt],
      config: {
        responseMimeType: 'application/json',
        // @ts-expect-error - zodToJsonSchema type compatibility
        responseSchema: zodToJsonSchema(quizArraySchema),
      },
    });

    const text = response.text ?? '';

    // Parse and validate with Zod schema
    const parsedJson = JSON.parse(text);
    const validatedQuestions = quizArraySchema.parse(parsedJson);

    // Return up to 5 questions (schema already validates structure)
    return validatedQuestions.slice(0, 5);
  } catch (error) {
    console.error('Error generating quiz:', error);
    return [];
  }
}

/**
 * Main audit function to be called after sending a message
 */
export async function auditMessage(
  chatId: string,
  senderId: string,
  messageContent: string,
  messageCount: number
): Promise<Chat> {
  // Calculate progress increment based on message length and stage
  const progressIncrement = calculateProgressIncrement(messageContent, messageCount);

  let updatedChat: Chat;

  // Every 10th message, score the conversation AND update progress in one atomic operation
  if (messageCount > 0 && messageCount % 10 === 0) {
    const lastMessages = await getLastMessages(chatId, 20);

    // Get the chat to determine user positions
    const chat = await queryOne<Chat>(
      'SELECT user_1, user_2 FROM chats WHERE id = $1',
      [chatId]
    );

    if (!chat) {
      throw new Error('Chat not found');
    }

    // Score conversation with correct user mapping
    const { user_1_score, user_2_score } = await scoreConversation(
      lastMessages,
      chat.user_1,
    );

    // Combine both progress increment and AI scores in one DB write
    updatedChat = await updateUserScores(
      chatId,
      user_1_score,
      user_2_score,
      senderId,
      progressIncrement
    );
  } else {
    // Not a scoring message, just update progress
    updatedChat = await updateUserProgress(chatId, senderId, progressIncrement);
  }

  // Check if we should generate quizzes (every 100-level milestone)
  const quizMilestone = shouldGenerateQuiz(updatedChat);
  if (quizMilestone > 0) {
    // Generate quizzes asynchronously (don't block the response)
    generateQuizzes(chatId, updatedChat.user_1, updatedChat.user_2).catch(error => {
      console.error('Error in async quiz generation:', error);
    });
  }

  return updatedChat;
}
