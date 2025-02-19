export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // 加载初始资源
    }

    create() {
        // 初始化游戏设置
        this.scene.start('PreloadScene');
    }
}
