import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
    try {
        const vitalsFilePath = path.join(process.cwd(), 'presage_quickstart', 'latest_vitals.json');

        try {
            const fileContent = await fs.readFile(vitalsFilePath, 'utf8');
            const vitals = JSON.parse(fileContent);
            return Response.json(vitals, { status: 200 });
        } catch (err) {
            if (err.code === 'ENOENT') {
                // File doesn't exist yet (C++ app not started or hasn't written a frame yet)
                return Response.json({ pulse: 0, breathing: 0 }, { status: 200 });
            }
            throw err;
        }
    } catch (error) {
        console.error('Error reading vitals file:', error);
        return Response.json({ error: 'Failed to read vitals' }, { status: 500 });
    }
}
