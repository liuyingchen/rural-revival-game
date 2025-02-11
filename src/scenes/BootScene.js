export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // 直接进入预加载场景，不加载任何资源
        this.scene.start('PreloadScene');
    }
}