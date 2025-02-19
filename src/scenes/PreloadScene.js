export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // 设置基础路径
        this.load.setBaseURL('assets/');
        
        // 只加载背景图
        this.load.image('preload-bg', 'images/common/preload-bg.png');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 添加背景图
        this.add.image(width/2, height/2, 'preload-bg')
            .setDisplaySize(width, height);

        // 添加开始游戏按钮（使用文字代替图片）
        const startButton = this.add.text(width/2, height - 100, '开始游戏', {
            fontSize: '32px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive();

        // 添加按钮交互效果
        startButton.on('pointerover', () => {
            startButton.setScale(1.1);
        });

        startButton.on('pointerout', () => {
            startButton.setScale(1);
        });

        startButton.on('pointerdown', () => {
            this.scene.start('CharacterSelectScene');
        });
    }
} 