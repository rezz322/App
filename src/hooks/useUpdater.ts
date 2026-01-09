import { check } from '@tauri-apps/plugin-updater';
import { ask } from '@tauri-apps/plugin-dialog';

export async function checkForUpdates() {
    try {
        const update = await check();
        if (update) {
            console.log(`Update to version ${update.version} available! Date: ${update.date}`);

            const yes = await ask(
                `Доступна нова версія: ${update.version}.\nВи хочете оновити додаток зараз?`,
                { title: 'Доступне оновлення', kind: 'info' }
            );

            if (yes) {
                await update.downloadAndInstall();
            }
        } else {
            console.log('No updates available.');
        }
    } catch (error) {
        console.error('Failed to check for updates:', error);
    }
}
