export default class AgricultureScene extends Phaser.Scene {
    constructor() {
        super({ key: 'AgricultureScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 添加标题
        this.add.text(width/2, 50, '现代化农业（开发中）', {
            fontSize: '32px',
            fill: '#000000'
        }).setOrigin(0.5);

        // 添加返回按钮
        const backButton = this.add.container(100, 50);
        const backBg = this.add.image(0, 0, 'button').setDisplaySize(120, 40);
        const backText = this.add.text(0, 0, '返回', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        backButton.add([backBg, backText]);
        backButton.setSize(120, 40);
        backButton.setInteractive();

        backButton.on('pointerdown', () => {
            this.scene.start('SceneSelectScene');
        });
    }
} 