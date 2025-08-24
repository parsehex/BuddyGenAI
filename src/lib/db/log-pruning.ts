import { db } from './schema';

export async function pruneOldLogs(daysToKeep: number) {
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

	await db.logs.where('timestamp').below(cutoffDate).delete();
	console.log(`Pruned logs older than ${daysToKeep} days.`);
}

// Example usage: Call this function periodically, e.g., once a day
// setInterval(() => pruneOldLogs(7), 24 * 60 * 60 * 1000);
