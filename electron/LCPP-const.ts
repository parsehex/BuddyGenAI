// by default, llamacpp uses template embedded in gguf if available
// TODO any way to get this from the model?
// https://github.com/ahoylabs/gguf.js
export const chatTemplateMap: { [key: string]: string } = {
	Moistral: 'vicuna',
	'WizardLM-2': 'vicuna',
	'Lexi-': 'llama3',
	'Hermes-2': 'chatml',
	'Llama-3': '',
	'llama-3': '',
};

export const contextLengthMap: { [key: string]: number } = {
	'WizardLM-2': 4096,
	Moistral: 8192,
	'Lexi-': 8192,
	'Llama-3.1': 16384,
	'llama-3.1': 16384,
	'Llama-3': 8192,
	'llama-3': 8192,
};
