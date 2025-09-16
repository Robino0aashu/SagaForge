import { Mistral } from '@mistralai/mistralai';
import dotenv from 'dotenv';
dotenv.config();

const mistral = new Mistral({
    apiKey: process.env.MISTRAL_API_KEY
});

export const generateStoryPart = async (storyContext, chosenAction, currentRound, totalRounds) => {
    try {
        const prompt = buildStoryPrompt(storyContext, chosenAction, currentRound, totalRounds);
        
        const response = await mistral.chat.complete({
            model: 'mistral-small-latest',
            messages: [
                {
                    role: 'system',
                    content: 'You are a creative storyteller for a collaborative interactive fiction game. Generate engaging, immersive story continuations that follow logically from player choices. Adjust pacing based on how many rounds remain - build tension early, develop plot in middle rounds, and move toward resolution in final rounds.'
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

export const generateChoices = async (storyContext, currentRound, totalRounds) => {
    try {
        const prompt = buildChoicesPrompt(storyContext, currentRound, totalRounds);
        
        const response = await mistral.chat.complete({
            model: 'mistral-small-latest',
            messages: [
                {
                    role: 'system',
                    content: 'You are a storyteller creating meaningful choices for an interactive fiction game. Generate exactly 3 distinct, compelling options that advance the story appropriately for the current story phase. Format as a simple numbered list: 1. [choice], 2. [choice], 3. [choice]'
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

const buildStoryPrompt = (storyContext, chosenAction, currentRound, totalRounds) => {
    const recentStory = storyContext.slice(-5).map(part => part.content).join(' ');
    const storyPhase = getStoryPhase(currentRound, totalRounds);
    
    return `Story so far: ${recentStory}

Players chose: ${chosenAction}

Story Phase: ${storyPhase} (Round ${currentRound + 1} of ${totalRounds})
${getPhaseGuidance(storyPhase)}

Continue this story with what happens next:`;
};

const buildChoicesPrompt = (storyContext, currentRound, totalRounds) => {
    const recentStory = storyContext.slice(-3).map(part => part.content).join(' ');
    const storyPhase = getStoryPhase(currentRound, totalRounds);
    
    return `Current story: ${recentStory}

Story Phase: ${storyPhase} (Round ${currentRound + 1} of ${totalRounds})
${getPhaseGuidance(storyPhase)}

Generate 3 meaningful choices for what the characters should do next:`;
};

const getStoryPhase = (currentRound, totalRounds) => {
    const progress = (currentRound + 1) / totalRounds;
    
    if (progress <= 0.3) return 'Beginning';
    if (progress <= 0.7) return 'Development'; 
    if (progress < 1.0) return 'Climax';
    return 'Resolution';
};

const getPhaseGuidance = (phase) => {
    switch (phase) {
        case 'Beginning':
            return 'Focus on world-building, character introduction, and setting up the main conflict or mystery.';
        case 'Development':
            return 'Develop the plot, introduce complications, reveal important information, and build tension.';
        case 'Climax':
            return 'Build toward the major confrontation or decision point. Raise stakes and intensity.';
        case 'Resolution':
            return 'Move toward conclusion. Resolve major plot points and provide satisfying ending.';
        default:
            return '';
    }
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