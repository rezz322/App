import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';


export async function checkForAppUpdates() {
  const update = await check();
  if (update) {
    console.log(`Найдена новая версия: ${update.version} от ${update.date}`);
    
    let downloaded = 0;
    let contentLength: number | undefined;

    // Скачивание и установка
    await update.downloadAndInstall((event) => {
      switch (event.event) {
        case 'Started':
          contentLength = event.data.contentLength;
          console.log(`Загрузка началась: ${contentLength} байт`);
          break;
        case 'Progress':
          downloaded += event.data.chunkLength;
          console.log(`Загружено: ${downloaded} / ${contentLength}`);
          break;
        case 'Finished':
          console.log('Загрузка завершена');
          break;
      }
    });

    console.log('Обновление установлено, перезапуск...');
    await relaunch();
  }
}