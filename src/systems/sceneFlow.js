import { SCENE_GROUP, groupFiles } from '../data/assetList.js';
import { ensureLateTextures } from '../objects/placeholderTextures.js';

// Opens a scene. If the scene needs heavy art that is not loaded yet (a level, the map, the boss),
// the Loading scene shows the loading bar first.   goToScene(this, 'Level2')
export function goToScene(scene, key, data) {
  ensureLateTextures(scene);
  const group = SCENE_GROUP[key];
  const missing = group
    ? groupFiles(group).filter((f) => (f.type === 'image' ? !scene.textures.exists(f.key) : !scene.cache.audio.exists(f.key)))
    : [];
  if (missing.length) scene.scene.start('Loading', { next: key, data, group });
  else scene.scene.start(key, data);
}
