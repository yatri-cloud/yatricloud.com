const AI_MODEL_KEY = 'yatri_ai_selected_model';
const DEFAULT_MODEL = 'gemma3';

export const getAIModel = (): string => {
    return localStorage.getItem(AI_MODEL_KEY) || DEFAULT_MODEL;
};

export const setAIModel = (model: string): void => {
    localStorage.setItem(AI_MODEL_KEY, model);
};
