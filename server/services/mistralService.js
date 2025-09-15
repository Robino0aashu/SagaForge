import { Mistral } from '@mistralai/mistralai';
import dotenv from 'dotenv';
dotenv.config();

const mistral = new Mistral({
    apiKey: process.env.MISTRAL_API_KEY
});

export const generateStoryPart = async (storyContext, chosenAction) => {
    try {
        const prompt = buildStoryPrompt(storyContext, chosenAction);
        
        const response = await mistral.chat.complete({
            model: 'mistral-small-latest',
            messages: [
                {
                    role: 'system',
                    content: 'You are a creative storyteller for a collaborative interactive fiction game. Generate engaging, immersive story continuations that follow logically from player choices. Keep responses concise (2-3 sentences max) but vivid and engaging.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.8,
            max_tokens: 150
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error generating story with Mistral:', error);
        return `Following your choice to ${chosenAction.toLowerCase()}, the story takes an unexpected turn...`;
    }
};

export const generateChoices = async (storyContext) => {
    try {
        const prompt = buildChoicesPrompt(storyContext);
        
        const response = await mistral.chat.complete({
            model: 'mistral-small-latest',
            messages: [
                {
                    role: 'system',
                    content: 'You are a storyteller creating meaningful choices for an interactive fiction game. Generate exactly 3 distinct, compelling options that advance the story. Format as a simple numbered list: 1. [choice], 2. [choice], 3. [choice]'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 100
        });

        return parseChoices(response.choices[0].message.content);
    } catch (error) {
        console.error('Error generating choices with Mistral:', error);
        return [
            "Investigate further",
            "Proceed with caution",
            "Take a different approach"
        ];
    }
};

const buildStoryPrompt = (storyContext, chosenAction) => {
    const recentStory = storyContext.slice(-5).map(part => part.content).join(' ');
    return `Story so far: ${recentStory}\n\nPlayers chose: ${chosenAction}\n\nContinue this story with what happens next:`;
};

const buildChoicesPrompt = (storyContext) => {
    const recentStory = storyContext.slice(-3).map(part => part.content).join(' ');
    return `Current story: ${recentStory}\n\nGenerate 3 meaningful choices for what the characters should do next:`;
};

const parseChoices = (aiResponse) => {
    try {
        const lines = aiResponse.split('\n').filter(line => line.trim());
        const choices = lines.map(line => {
            // Remove numbering (1., 2., etc.)
            return line.replace(/^\d+\.\s*/, '').trim();
        }).filter(choice => choice.length > 0);

        if (choices.length >= 3) {
            return choices.slice(0, 3);
        }
    } catch (error) {
        console.error('Error parsing AI choices:', error);
    }

    // Fallback if parsing fails
    return [
        "Take decisive action",
        "Gather more information",
        "Try a creative solution"
    ];
};