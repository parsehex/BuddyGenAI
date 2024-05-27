import useElectron from '@/composables/useElectron';

const { listDirectory, getDataPath } = useElectron();

export default async function getAllProfilePics(
	buddyId: string,
	thread?: string
) {
	if (!listDirectory) {
		throw new Error('listDirectory is not defined');
	}

	let p = 'images/' + buddyId;
	if (thread) {
		p += '/' + thread;
	}

	const dataPath = await getDataPath(p);
	const files = await listDirectory(dataPath);
	const images = files.filter((f) => f.endsWith('.png'));

	images.sort((a, b) => b.localeCompare(a));

	return images;
}
