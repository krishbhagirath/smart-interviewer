import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request) {
    try {
        // Define the path to the trigger file
        // Assumes the Next.js app is in the root and presage_quickstart is a subdirectory
        const triggerFilePath = path.join(process.cwd(), 'presage_quickstart', 'vitals_trigger.tmp');

        // Create the empty file
        await fs.writeFile(triggerFilePath, '', 'utf8');

        console.log(`Trigger file created at: ${triggerFilePath}`);

        return Response.json({ message: 'Vitals tracking triggered successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error creating trigger file:', error);
        return Response.json({ error: 'Failed to trigger vitals tracking' }, { status: 500 });
    }
}
