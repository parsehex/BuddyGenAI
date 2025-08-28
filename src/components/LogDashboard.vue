<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { db, type LogEntry } from '@/lib/db/schema';
import { useLogger } from '@/composables/useLogger';
import { isDevMode } from '@/lib/utils';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const searchTerm = ref('');
const selectedLevel = ref('all');
const sortKey = ref<keyof LogEntry>('timestamp');
const sortOrder = ref<'asc' | 'desc'>('desc');
const selectedLogEntry = ref<LogEntry | null>(null);

const { getLogs } = useLogger('LogDashboard');
const inMemoryLogs = getLogs();
const dbLogs = ref<LogEntry[]>([]);
const logs = computed<LogEntry[]>(() => {
	if (isDevMode()) {
		return [...dbLogs.value].reverse();
	}
	return [...inMemoryLogs].reverse();
});

const updateLogs = async () => {
	dbLogs.value = await db.logs.orderBy('timestamp').reverse().toArray();
};

const clear = async () => {
	inMemoryLogs.splice(0, inMemoryLogs.length);
	if (isDevMode()) {
		await db.logs.clear();
		dbLogs.value = [];
	}
};

onMounted(() => {
	if (isDevMode()) {
		updateLogs();
		// Refresh DB logs every 5 seconds in dev mode
		setInterval(updateLogs, 5000);
	}
});

// Watch inMemoryLogs only if not in dev mode, otherwise dbLogs will be updated by interval
watch(inMemoryLogs, () => {
	if (!isDevMode()) {
		// No need to assign to logs.value directly, as 'logs' is a computed property
	}
}, { deep: true });

const filteredLogs = computed(() => {
	let filtered = logs.value;

	if (selectedLevel.value !== 'all') {
		filtered = filtered.filter(log => log.level === selectedLevel.value);
	}

	if (searchTerm.value) {
		const lowerCaseSearchTerm = searchTerm.value.toLowerCase();
		filtered = filtered.filter(
			log =>
				log.message.toLowerCase().includes(lowerCaseSearchTerm) ||
				log.module.toLowerCase().includes(lowerCaseSearchTerm) ||
				log.level.toLowerCase().includes(lowerCaseSearchTerm) ||
				(log.metadata && log.metadata.toLowerCase().includes(lowerCaseSearchTerm))
		);
	}

	if (sortKey.value) {
		filtered.sort((a, b) => {
			const aValue = a[sortKey.value];
			const bValue = b[sortKey.value];

			if (aValue === undefined || aValue === null) return sortOrder.value === 'asc' ? -1 : 1;
			if (bValue === undefined || bValue === null) return sortOrder.value === 'asc' ? 1 : -1;

			if (typeof aValue === 'string' && typeof bValue === 'string') {
				return sortOrder.value === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
			}
			if (typeof aValue === 'number' && typeof bValue === 'number') {
				return sortOrder.value === 'asc' ? aValue - bValue : bValue - aValue;
			}
			if (aValue instanceof Date && bValue instanceof Date) {
				return sortOrder.value === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime();
			}
			return 0;
		});
	}

	return filtered;
});

const sort = (key: keyof LogEntry) => {
	if (sortKey.value === key) {
		sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
	} else {
		sortKey.value = key;
		sortOrder.value = 'asc';
	}
};

const getSortIndicator = (key: keyof LogEntry) => {
	if (sortKey.value === key) {
		return sortOrder.value === 'asc' ? '▲' : '▼';
	}
	return '';
};

const viewMetadata = (log: LogEntry) => {
	selectedLogEntry.value = log;
};

const formatTimestamp = (date: Date) => {
	return new Date(date).toLocaleString();
};

const getLogLevelClass = (level: LogEntry['level']) => {
	switch (level) {
		case 'trace': return 'text-gray-500';
		case 'debug': return 'text-blue-500';
		case 'info': return 'text-green-500';
		case 'warn': return 'text-yellow-500';
		case 'error': return 'text-red-500';
		case 'fatal': return 'text-purple-500';
		default: return '';
	}
};
</script>
<template>
	<div class="p-4">
		<h2 class="text-2xl font-bold mb-4">Application Logs</h2>
		<div class="flex space-x-4 mb-4">
			<Input v-model="searchTerm" placeholder="Search logs..." class="flex-grow" />
			<Select v-model="selectedLevel">
				<SelectTrigger class="w-[180px]">
					<SelectValue placeholder="Filter by Level" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All Levels</SelectItem>
					<SelectItem value="trace">Trace</SelectItem>
					<SelectItem value="debug">Debug</SelectItem>
					<SelectItem value="info">Info</SelectItem>
					<SelectItem value="warn">Warn</SelectItem>
					<SelectItem value="error">Error</SelectItem>
					<SelectItem value="fatal">Fatal</SelectItem>
				</SelectContent>
			</Select>
			<Button @click="updateLogs">Refresh</Button>
			<Button variant="destructive" @click="clear">Clear All</Button>
		</div>
		<ScrollArea class="h-[600px] w-full rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead @click="sort('timestamp')" class="cursor-pointer"> Timestamp {{ getSortIndicator('timestamp') }}
						</TableHead>
						<TableHead @click="sort('level')" class="cursor-pointer"> Level {{ getSortIndicator('level') }} </TableHead>
						<TableHead @click="sort('module')" class="cursor-pointer"> Module {{ getSortIndicator('module') }}
						</TableHead>
						<TableHead>Message</TableHead>
						<TableHead>Metadata</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow v-for="log in filteredLogs" :key="log.id">
						<TableCell>{{ formatTimestamp(log.timestamp) }}</TableCell>
						<TableCell :class="getLogLevelClass(log.level)">{{ log.level.toUpperCase() }}</TableCell>
						<TableCell>{{ log.module }}</TableCell>
						<TableCell class="max-w-xs truncate">{{ log.message }}</TableCell>
						<TableCell class="text-center">
							<Dialog v-if="log.metadata">
								<DialogTrigger as-child>
									<Button variant="outline" size="sm" title="View JSON metadata" @click="viewMetadata(log)">{ . .
										.}</Button>
								</DialogTrigger>
								<DialogContent class="sm:max-w-[800px]">
									<DialogHeader>
										<DialogTitle>Metadata for Log Entry</DialogTitle>
									</DialogHeader>
									<ScrollArea class="h-[400px] w-full rounded-md border p-4 bg-gray-800 text-white font-mono text-sm">
										<pre
											class="whitespace-break-spaces">{{ selectedLogEntry?.metadata ? JSON.parse(selectedLogEntry.metadata) : '{}' }}</pre>
									</ScrollArea>
								</DialogContent>
							</Dialog>
						</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</ScrollArea>
	</div>
</template>
<style scoped>
/* Add any specific styles here if needed */
</style>
