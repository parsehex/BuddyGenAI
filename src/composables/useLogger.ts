import { db, type LogEntry } from '@/lib/db/schema';
import { v4 as uuidv4 } from 'uuid';
import { isDevMode } from '@/lib/utils';
import { reactive, readonly } from 'vue';

const inMemoryLogs = reactive<LogEntry[]>([]);
const MAX_IN_MEMORY_LOGS = 1000; // Limit the number of logs in memory

let saveLogTimeout: ReturnType<typeof setTimeout> | null = null;
const LOG_DEBOUNCE_TIME = 1000; // milliseconds
const logQueue: LogEntry[] = [];

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogOptions {
	_?: Record<string, any>; // For metadata
}

export function useLogger(moduleName: string) {
	const log = async (
		level: LogLevel,
		message: string | LogOptions,
		...args: any[]
	) => {
		let metadata: Record<string, any> | undefined;
		let actualMessage: string;

		if (typeof message === 'object' && message !== null && '_' in message) {
			metadata = message._;
			actualMessage = args.shift() || ''; // If _ is present, the next arg is the message
		} else {
			actualMessage = message as string;
		}

		const fullMessage = [actualMessage, ...args]
			.map((arg) => {
				if (typeof arg === 'object' && arg !== null) {
					return JSON.stringify(arg);
				}
				return String(arg);
			})
			.join(' ');

		const logEntry: LogEntry = {
			id: uuidv4(),
			timestamp: new Date(),
			level,
			module: moduleName,
			message: fullMessage,
			metadata: metadata ? JSON.stringify(metadata) : undefined,
		};

		// Always add to in-memory logs
		inMemoryLogs.push(logEntry);
		if (inMemoryLogs.length > MAX_IN_MEMORY_LOGS) {
			inMemoryLogs.shift(); // Remove the oldest log
		}

		if (isDevMode()) {
			logQueue.push(logEntry);
			if (saveLogTimeout) {
				clearTimeout(saveLogTimeout);
			}
			saveLogTimeout = setTimeout(async () => {
				const logsToSave = [...logQueue];
				logQueue.length = 0; // Clear the queue
				console.log('saving');
				try {
					await db.logs.bulkAdd(logsToSave);
				} catch (error) {
					console.error('Failed to save logs to DB:', error);
				}
			}, LOG_DEBOUNCE_TIME);
		}

		// @ts-ignore
		const consoleLog = console[level] || console.log;
		consoleLog(
			`[${moduleName}] ${level.toUpperCase()}: ${fullMessage}`,
			metadata || ''
		);
	};

	return {
		trace: (message: string | LogOptions, ...args: any[]) =>
			log('trace', message, ...args),
		debug: (message: string | LogOptions, ...args: any[]) =>
			log('debug', message, ...args),
		info: (message: string | LogOptions, ...args: any[]) =>
			log('info', message, ...args),
		warn: (message: string | LogOptions, ...args: any[]) =>
			log('warn', message, ...args),
		error: (message: string | LogOptions, ...args: any[]) =>
			log('error', message, ...args),
		fatal: (message: string | LogOptions, ...args: any[]) =>
			log('fatal', message, ...args),
		log: (message: string | LogOptions, ...args: any[]) =>
			log('info', message, ...args), // Alias for info
		getLogs: () => readonly(inMemoryLogs),
	};
}
