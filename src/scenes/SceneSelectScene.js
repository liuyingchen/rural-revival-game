export default class SceneSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SceneSelectScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 添加背景
        this.add.image(width/2, height/2, 'main-bg')
            .setDisplaySize(width, height);

        // 添加标题
        this.add.text(width/2, 50, '选择游戏场景', {
            fontSize: '32px',
            fill: '#000000'
        }).setOrigin(0.5);

        // 创建场景选择按钮
        const buttonStyle = {
            fontSize: '24px',
            fill: '#ffffff'
        };

        // 农村电商按钮
        const ecommerceButton = this.add.container(width/2, height/2 - 100);
        const ecommerceBg = this.add.image(0, 0, 'button').setDisplaySize(300, 80);
        const ecommerceText = this.add.text(0, 0, '农村电商', buttonStyle).setOrigin(0.5);
        ecommerceButton.add([ecommerceBg, ecommerceText]);
        ecommerceButton.setSize(300, 80);
        ecommerceButton.setInteractive();

        // 文化乡村按钮
        const cultureButton = this.add.container(width/2, height/2);
        const cultureBg = this.add.image(0, 0, 'button').setDisplaySize(300, 80);
        const cultureText = this.add.text(0, 0, '文化乡村', buttonStyle).setOrigin(0.5);
        cultureButton.add([cultureBg, cultureText]);
        cultureButton.setSize(300, 80);
        cultureButton.setInteractive();

        // 现代化农业按钮
        const agricultureButton = this.add.container(width/2, height/2 + 100);
        const agricultureBg = this.add.image(0, 0, 'button').setDisplaySize(300, 80);
        const agricultureText = this.add.text(0, 0, '现代化农业', buttonStyle).setOrigin(0.5);
        agricultureButton.add([agricultureBg, agricultureText]);
        agricultureButton.setSize(300, 80);
        agricultureButton.setInteractive();

        // 返回按钮
        const backButton = this.add.container(100, 50);
        const backBg = this.add.image(0, 0, 'button').setDisplaySize(120, 40);
        const backText = this.add.text(0, 0, '返回', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        backButton.add([backBg, backText]);
        backButton.setSize(120, 40);
        backButton.setInteractive();

        // 添加点击事件
        ecommerceButton.on('pointerdown', () => {
            this.scene.start('EcommerceScene');
        });

        cultureButton.on('pointerdown', () => {
            this.scene.start('CultureScene');
        });

        agricultureButton.on('pointerdown', () => {
            this.scene.start('AgricultureScene');
        });

        backButton.on('pointerdown', () => {
            this.scene.start('CharacterSelectScene');
        });

        // 添加悬停效果
        [ecommerceButton, cultureButton, agricultureButton, backButton].forEach(button => {
            button.on('pointerover', () => {
                button.first.setScale(1.1);
            });

            button.on('pointerout', () => {
                button.first.setScale(1);
            });
        });

        // 添加场景完成状态标记
        if (window.gameState.medals.ecommerce) {
            this.add.image(width/2 + 170, height/2 - 100, 'medal').setScale(0.5);
        }
        if (window.gameState.medals.culture) {
            this.add.image(width/2 + 170, height/2, 'medal').setScale(0.5);
        }
        if (window.gameState.medals.agriculture) {
            this.add.image(width/2 + 170, height/2 + 100, 'medal').setScale(0.5);
        }
    }
} 