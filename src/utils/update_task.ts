import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export async function checkUpdateAvailable(): Promise<boolean> {
  try {
    const update = await check();
    return !!update;
  } catch (error) {
    // Ошибка проверки обновлений не критична, просто логируем и возвращаем false
    console.log('Update check unavailable:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

export async function checkForAppUpdates() {
  const update = await check();
  if (update) {
    console.log(`Найдена новая версія: ${update.version} від ${update.date}`);
    
    let downloaded = 0;
    let contentLength: number | undefined;

    // Скачивание и установка
    await update.downloadAndInstall((event) => {
      switch (event.event) {
        case 'Started':
          contentLength = event.data.contentLength;
          console.log(`Загрузка почалась: ${contentLength} байт`);
          break;
        case 'Progress':
          downloaded += event.data.chunkLength;
          console.log(`Завантажено: ${downloaded} / ${contentLength}`);
          break;
        case 'Finished':
          console.log('Загрузка завершена');
          break;
      }
    });

    console.log('Обновлення встановлено, перезапуск...');
    await relaunch();
  }
}