export default class SceneSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SceneSelectScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.image(width/2, height/2, 'main-bg')
            .setDisplaySize(width, height);

        const characterType = window.gameState.character || 'male';
        this.player = this.add.image(
            width * 0.2,  // 放在左侧
            height * 0.7,  // 靠下方
            characterType
        ).setScale(0.8);  // 设置合适的大小

        this.player.alpha = 0;
        this.player.x -= 100;  // 从左侧开始

        this.tweens.add({
            targets: this.player,
            x: width * 0.2,
            alpha: 1,
            duration: 800,
            ease: 'Back.out'
        });

        this.add.text(width/2, 50, '选择游戏场景', {
            fontSize: '32px',
            fill: '#000000'
        }).setOrigin(0.5);

        const buttonStyle = {
            fontSize: '24px',
            fill: '#ffffff'
        };


       // 电商场景按钮
const ecommerceButton = this.add.container(width/2, height/2 - 100);
const ecommerceBg = this.add.image(0, 0, 'ecommerce-scene')
    .setDisplaySize(300, 80);
const ecommerceText = this.add.text(0, 0, '农村电商', buttonStyle)
    .setOrigin(0.5)
    .setDepth(1);  // 确保文字在图片上方
ecommerceButton.add([ecommerceBg, ecommerceText]);
ecommerceButton.setSize(300, 80);
ecommerceButton.setInteractive();  // 添加这行

// 文化场景按钮
const cultureButton = this.add.container(width/2, height/2);
const cultureBg = this.add.image(0, 0, 'culture-scene')
    .setDisplaySize(300, 80);
const cultureText = this.add.text(0, 0, '文化乡村', buttonStyle)
    .setOrigin(0.5)
    .setDepth(1);
cultureButton.add([cultureBg, cultureText]);
cultureButton.setSize(300, 80);
cultureButton.setInteractive();  // 添加这行

// 农业场景按钮
const agricultureButton = this.add.container(width/2, height/2 + 100);
const agricultureBg = this.add.image(0, 0, 'agriculture-scene')
    .setDisplaySize(300, 80);
const agricultureText = this.add.text(0, 0, '现代化农业', buttonStyle)
    .setOrigin(0.5)
    .setDepth(1);
agricultureButton.add([agricultureBg, agricultureText]);
agricultureButton.setSize(300, 80);
agricultureButton.setInteractive();  // 添加这行

        const backButton = this.add.container(100, 50);
        const backBg = this.add.image(0, 0, 'button').setDisplaySize(120, 40);
        const backText = this.add.text(0, 0, '返回', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        backButton.add([backBg, backText]);
        backButton.setSize(120, 40);
        backButton.setInteractive();

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

        [ecommerceButton, cultureButton, agricultureButton, backButton].forEach(button => {
            button.on('pointerover', () => {
                button.first.setScale(1.1);
            });

            button.on('pointerout', () => {
                button.first.setScale(1);
            });
        });

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
