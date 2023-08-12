import { AgentMessage, AgentTask } from '@/types';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { HumanChatMessage } from 'langchain/schema';

export const textCompletionTool = async (
  prompt: string,
  id: string,
  task: AgentTask,
  modelName: string,
  messageCallnback?: (message: AgentMessage) => void,
) => {
  if (prompt.length > 3200) {
    modelName = 'gpt-3.5-turbo-16k-0613';
  }

  const llm = new ChatOpenAI({
    modelName: modelName,
    temperature: 0.2,
    maxTokens: 800,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    streaming: true,
    callbacks: [
      {
        handleLLMNewToken(token: string) {
          messageCallnback?.({
            content: token,
            type: task.skill,
            id: id,
            taskId: task.id.toString(),
            status: 'running',
          });
        },
      },
    ],
  });

  try {
    const response = await llm.call([new HumanChatMessage(prompt)]);
    messageCallnback?.({
      content: response.text,
      type: task.skill,
      id: id,
      taskId: task.id.toString(),
      status: 'complete',
    });

    return response.text;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return null;
    }
    console.log('error: ', error);
    return 'Failed to generate text.';
  }
};
